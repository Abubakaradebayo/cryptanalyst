"use client";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import {
  getCompDefAccOffset,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getClusterAccAddress,
} from "@arcium-hq/client";
import { useArciumProgram } from "./useArciumProgram";
import { encryptGuess, fetchMXEPublicKey, nonceToBnDecimal } from "@/lib/arcium";
import {
  dailyPuzzlePda,
  leaderboardEntryPda,
  playerAttemptPda,
  revealedCodePda,
} from "@/lib/pdas";
import { ARCIUM_CLUSTER_OFFSET, PROGRAM_ID } from "@/lib/constants";

function randomBn8(): BN {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return new BN(Buffer.from(buf), "hex");
}

function arciumAccounts(circuit: "gen_code" | "evaluate_guess" | "reveal_code", offset: BN) {
  return {
    computationAccount: getComputationAccAddress(ARCIUM_CLUSTER_OFFSET, offset),
    clusterAccount: getClusterAccAddress(ARCIUM_CLUSTER_OFFSET),
    mxeAccount: getMXEAccAddress(PROGRAM_ID),
    mempoolAccount: getMempoolAccAddress(ARCIUM_CLUSTER_OFFSET),
    executingPool: getExecutingPoolAccAddress(ARCIUM_CLUSTER_OFFSET),
    compDefAccount: getCompDefAccAddress(
      PROGRAM_ID,
      Buffer.from(getCompDefAccOffset(circuit)).readUInt32LE(),
    ),
  };
}

export function useGameActions(date: number) {
  const { program, provider } = useArciumProgram();
  const { publicKey } = useWallet();
  const [pending, setPending] = useState<"none" | "init" | "guess" | "claim">("none");
  const [error, setError] = useState<string | null>(null);

  async function initPuzzle(): Promise<string | null> {
    if (!publicKey) return null;
    setError(null);
    setPending("init");
    try {
      const offset = randomBn8();
      const sig = await program.methods
        .initDailyPuzzle(offset, date)
        .accountsPartial({
          payer: publicKey,
          puzzle: dailyPuzzlePda(date),
          ...arciumAccounts("gen_code", offset),
        })
        .rpc({ skipPreflight: false, commitment: "confirmed" });
      return sig;
    } catch (e) {
      console.error("[initPuzzle] full error:", e);
      if (e && typeof e === "object") {
        const anyErr = e as Record<string, unknown>;
        if (Array.isArray(anyErr.logs)) console.error("logs:", anyErr.logs);
        if (Array.isArray(anyErr.transactionLogs))
          console.error("transactionLogs:", anyErr.transactionLogs);
      }
      setError(humanizeError(e));
      return null;
    } finally {
      setPending("none");
    }
  }

  async function submitGuess(
    symbols: number[],
    nextAttemptIdx: number,
  ): Promise<string | null> {
    if (!publicKey) return null;
    setError(null);
    setPending("guess");
    try {
      const mxePub = await fetchMXEPublicKey(provider, PROGRAM_ID);
      const enc = encryptGuess(symbols, mxePub);
      const offset = randomBn8();

      const sig = await program.methods
        .submitGuess(
          offset,
          date,
          nextAttemptIdx,
          Array.from(enc.ciphertexts[0]),
          Array.from(enc.ciphertexts[1]),
          Array.from(enc.ciphertexts[2]),
          Array.from(enc.ciphertexts[3]),
          Array.from(enc.publicKey),
          new BN(nonceToBnDecimal(enc.nonce)),
        )
        .accountsPartial({
          player: publicKey,
          puzzle: dailyPuzzlePda(date),
          attempt: playerAttemptPda(date, publicKey, nextAttemptIdx),
          ...arciumAccounts("evaluate_guess", offset),
        })
        .rpc({ skipPreflight: false, commitment: "confirmed" });
      return sig;
    } catch (e) {
      console.error("[submitGuess] full error:", e);
      if (e && typeof e === "object") {
        const anyErr = e as Record<string, unknown>;
        if (Array.isArray(anyErr.logs)) console.error("logs:", anyErr.logs);
      }
      setError(humanizeError(e));
      return null;
    } finally {
      setPending("none");
    }
  }

  async function claimSolve(attemptIdx: number): Promise<string | null> {
    if (!publicKey) return null;
    setError(null);
    setPending("claim");
    try {
      const offset = randomBn8();
      const sig = await program.methods
        .claimSolve(offset, date, attemptIdx)
        .accountsPartial({
          player: publicKey,
          puzzle: dailyPuzzlePda(date),
          attempt: playerAttemptPda(date, publicKey, attemptIdx),
          leaderboardEntry: leaderboardEntryPda(date, publicKey),
          revealedCode: revealedCodePda(date),
          ...arciumAccounts("reveal_code", offset),
        })
        .rpc({ skipPreflight: false, commitment: "confirmed" });
      return sig;
    } catch (e) {
      setError(humanizeError(e));
      return null;
    } finally {
      setPending("none");
    }
  }

  return { initPuzzle, submitGuess, claimSolve, pending, error };
}

function humanizeError(e: unknown): string {
  if (typeof e !== "object" || e === null) return String(e);
  const err = e as {
    name?: string;
    code?: number | string;
    message?: string;
    error?: { code?: number; message?: string };
    logs?: string[];
    transactionLogs?: string[];
  };

  // Wallet-adapter rejections
  const code = err.code ?? err.error?.code;
  if (
    code === 4001 ||
    code === "USER_REJECTED" ||
    err.name === "WalletSignTransactionError" ||
    /user rejected|user denied|rejected the request/i.test(err.message ?? "")
  ) {
    return "Wallet rejected the transaction. Approve in Phantom and try again.";
  }

  // Insufficient funds
  if (/insufficient.*lamports|insufficient.*funds/i.test(err.message ?? "")) {
    return "Wallet doesn't have enough devnet SOL. Top up the connected Phantom wallet.";
  }

  // RPC rate limit
  if (/429|too many requests/i.test(err.message ?? "")) {
    return "RPC is rate-limiting. Wait ~30s and try again.";
  }

  // Anchor / Arcium program errors, pull from logs if present
  const logs = err.logs ?? err.transactionLogs ?? [];
  const anchorLog = logs.find((l) => l.includes("AnchorError"));
  if (anchorLog) {
    const match = anchorLog.match(/Error Message: ([^.]+)\./);
    if (match) return `Program error: ${match[1].trim()}`;
    return anchorLog.replace(/^Program log:\s*/, "").trim();
  }

  // SendTransactionError simulation failures
  if (/simulation failed/i.test(err.message ?? "")) {
    return `Simulation failed. ${err.message}`.slice(0, 240);
  }

  // Generic fallback: at least show name + truncated message
  const msg = err.message ?? JSON.stringify(err).slice(0, 200);
  if (!msg || msg === "undefined" || /unknown action/i.test(msg)) {
    return "Transaction failed (no details surfaced). Check Phantom and the browser console for specifics.";
  }
  return msg;
}
