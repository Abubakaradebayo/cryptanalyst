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
  guessSymbols: number[] | null;
}

export function useAttempts(date: number, player: PublicKey | null) {
  const { program } = useArciumProgram();
  const [attempts, setAttempts] = useState<AttemptData[]>([]);

  const refetch = useCallback(async () => {
    if (!player) {
      setAttempts([]);
      return;
    }
    // Filter at the RPC level by dataSize so legacy 68-byte PDAs (pre
    // guess_symbols upgrade) never reach the decoder. New layout is 72 bytes:
    // 8 disc + 1 bump + 32 player + 4 date + 4 idx + 8 offset + 1 exact +
    // 1 misplaced + 1 finalized + 8 submitted_at + 4 guess_symbols.
    const NEW_LAYOUT_SIZE = 72;
    let all: Awaited<ReturnType<typeof program.account.playerAttempt.all>> = [];
    try {
      all = await program.account.playerAttempt.all([
        { dataSize: NEW_LAYOUT_SIZE },
        { memcmp: { offset: 8 + 1, bytes: player.toBase58() } },
      ]);
    } catch {
      all = [];
    }
    const filtered = all
      .filter((a) => a.account.date === date)
      .map((a) => ({
        attemptIdx: a.account.attemptIdx,
        exact: a.account.exact,
        misplaced: a.account.misplaced,
        finalized: a.account.finalized,
        submittedAt: Number(a.account.submittedAt),
        guessSymbols: Array.isArray(a.account.guessSymbols)
          ? Array.from(a.account.guessSymbols as number[])
          : null,
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
