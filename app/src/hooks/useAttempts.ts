"use client";
import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useArciumProgram } from "./useArciumProgram";

export interface AttemptData {
  attemptIdx: number;
  exact: number;
  misplaced: number;
  finalized: boolean;
  submittedAt: number;
}

export function useAttempts(date: number, player: PublicKey | null) {
  const { program } = useArciumProgram();
  const [attempts, setAttempts] = useState<AttemptData[]>([]);

  const refetch = useCallback(async () => {
    if (!player) {
      setAttempts([]);
      return;
    }
    const all = await program.account.playerAttempt.all([
      {
        memcmp: {
          offset: 8 + 1, // disc + bump
          bytes: player.toBase58(),
        },
      },
    ]);
    const filtered = all
      .filter((a) => a.account.date === date)
      .map((a) => ({
        attemptIdx: a.account.attemptIdx,
        exact: a.account.exact,
        misplaced: a.account.misplaced,
        finalized: a.account.finalized,
        submittedAt: Number(a.account.submittedAt),
      }))
      .sort((a, b) => a.attemptIdx - b.attemptIdx);
    setAttempts(filtered);
  }, [date, player, program]);

  useEffect(() => {
    void refetch();
    const interval = setInterval(refetch, 2500);
    return () => clearInterval(interval);
  }, [refetch]);

  return { attempts, refetch };
}
