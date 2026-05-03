"use client";
import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_ID } from "@/lib/constants";
import { useArciumProgram } from "./useArciumProgram";

export interface AttemptData {
  attemptIdx: number;
  exact: number;
  misplaced: number;
  finalized: boolean;
  submittedAt: number;
  guessSymbols: number[] | null;
}

export function useAttempts(date: number, player: PublicKey | null) {
  const { connection } = useConnection();
  const { program } = useArciumProgram();
  const [attempts, setAttempts] = useState<AttemptData[]>([]);

  const refetch = useCallback(async () => {
    if (!player) {
      setAttempts([]);
      return;
    }
    // Use raw getProgramAccounts so we can decode each result individually.
    // Pre-upgrade PDAs are 4 bytes shorter (no guess_symbols field) and will
    // throw on decode. Skip them rather than letting one bad legacy account
    // wipe the whole list.
    const raw = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        { memcmp: { offset: 8 + 1, bytes: player.toBase58() } },
      ],
    });
    const decoded: AttemptData[] = [];
    for (const { account } of raw) {
      try {
        const acc = program.coder.accounts.decode(
          "playerAttempt",
          account.data,
        );
        if (acc.date !== date) continue;
        decoded.push({
          attemptIdx: acc.attemptIdx,
          exact: acc.exact,
          misplaced: acc.misplaced,
          finalized: acc.finalized,
          submittedAt: Number(acc.submittedAt),
          guessSymbols: Array.isArray(acc.guessSymbols)
            ? Array.from(acc.guessSymbols as number[])
            : null,
        });
      } catch {
        // Legacy PDA without guess_symbols. Silently skip.
      }
    }
    decoded.sort((a, b) => a.attemptIdx - b.attemptIdx);
    setAttempts(decoded);
  }, [connection, date, player, program]);

  useEffect(() => {
    void refetch();
    const interval = setInterval(refetch, 2500);
    return () => clearInterval(interval);
  }, [refetch]);

  return { attempts, refetch };
}
