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

function arciumAccounts(circuit: "gen_code_v2" | "evaluate_guess_v2" | "reveal_code", offset: BN) {
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
          ...arciumAccounts("gen_code_v2", offset),
        })
        .rpc({ skipPreflight: false, commitment: "confirmed" });
      return sig;
    } catch (e) {
      if (!isBenignError(e)) {
        console.error("[initPuzzle]", e);
        const logs = extractLogs(e);
        if (logs.length) console.error("logs:", logs);
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
  ): Promise<{ sig: string; onChainAttemptIdx: number } | null> {
    if (!publicKey) return null;
    setError(null);
    setPending("guess");
    try {
      const mxePub = await fetchMXEPublicKey(provider, PROGRAM_ID);
      const enc = encryptGuess(symbols, mxePub);
      const offset = randomBn8();
      const attemptPda = playerAttemptPda(date, publicKey, nextAttemptIdx);

      const sig = await program.methods
        .submitGuess(
          offset,
          date,
          nextAttemptIdx,
          symbols,
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
          attempt: attemptPda,
          ...arciumAccounts("evaluate_guess_v2", offset),
        })
        .rpc({ skipPreflight: false, commitment: "confirmed" });

      // Read the actual on-chain attempt_idx the program stored. It's set to
      // puzzle.attempt_count at submit time, which can race with our local
      // read. Trusting the chain here removes the entire class of "saved
      // localMem at the wrong key" bugs. Best-effort: fall back to nextAttemptIdx
      // if the read fails (rare — the tx just confirmed).
      let onChainAttemptIdx = nextAttemptIdx;
      try {
        const acc = await program.account.playerAttempt.fetch(attemptPda);
        onChainAttemptIdx = acc.attemptIdx;
      } catch {}
      return { sig, onChainAttemptIdx };
    } catch (e) {
      if (!isBenignError(e)) {
        console.error("[submitGuess]", e);
        const logs = extractLogs(e);
        if (logs.length) console.error("logs:", logs);
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

// Errors we deliberately don't dump to console.error: wallet rejections (the
// user chose to cancel) and duplicate-tx retries (the original landed).
function isBenignError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const err = e as {
    name?: string;
    code?: number | string;
    message?: string;
    error?: { code?: number; message?: string };
  };
  const code = err.code ?? err.error?.code;
  if (
    code === 4001 ||
    code === "USER_REJECTED" ||
    err.name === "WalletSignTransactionError" ||
    /user rejected|user denied|rejected the request/i.test(err.message ?? "")
  ) {
    return true;
  }
  if (/already.*been.*processed|already.*processed/i.test(err.message ?? "")) {
    return true;
  }
  return false;
}

function extractLogs(e: unknown): string[] {
  if (typeof e !== "object" || e === null) return [];
  const err = e as { logs?: string[]; transactionLogs?: string[] };
  return err.logs ?? err.transactionLogs ?? [];
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

  // Solana RPC re-sends the same signed tx as a retry while waiting for
  // confirmation. Once the original lands, the retry is rejected with this
  // message. Returning empty string suppresses it from the UI.
  if (/already.*been.*processed|already.*processed/i.test(err.message ?? "")) {
    return "";
  }

  // SystemProgram::AccountAlreadyInUse surfaces as "custom program error: 0x0"
  // when init-ing a PDA whose address was already taken. In our flow this
  // means the previous callback hasn't finalized yet so the next attempt PDA
  // collides. Tell the user to wait, don't show the raw hex.
  const allLogs = (err.logs ?? err.transactionLogs ?? []).join(" ");
  if (
    /custom program error: 0x0/i.test(err.message ?? "") ||
    /custom program error: 0x0/i.test(allLogs)
  ) {
    return "Previous guess is still being computed by the cluster. Wait for the feedback row to land, then submit again.";
  }

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
