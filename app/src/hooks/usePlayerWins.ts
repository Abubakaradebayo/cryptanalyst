"use client";
import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useArciumProgram } from "./useArciumProgram";

export interface Win {
  date: number;
  guessesTaken: number;
  timeToSolveSecs: number;
  solvedAt: number;
}

export interface PlayerWinsData {
  wins: Win[];
  streak: number;
  totalSolves: number;
  bestGuesses: number | null;
  bestTime: number | null;
}

function computeStreak(wins: Win[], today: number): number {
  if (wins.length === 0) return 0;
  const dates = new Set(wins.map((w) => w.date));
  let streak = 0;
  // Start from today, walk backward as long as each day was solved.
  // If today wasn't solved, start from yesterday so an in-progress day
  // doesn't reset the streak.
  let cursor = dates.has(today) ? today : today - 1;
  while (dates.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

export function usePlayerWins(player: PublicKey | null, today: number) {
  const { program } = useArciumProgram();
  const [data, setData] = useState<PlayerWinsData>({
    wins: [],
    streak: 0,
    totalSolves: 0,
    bestGuesses: null,
    bestTime: null,
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!player) {
      setData({ wins: [], streak: 0, totalSolves: 0, bestGuesses: null, bestTime: null });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const all = await program.account.leaderboardEntry.all([
        { memcmp: { offset: 8 + 1 + 4, bytes: player.toBase58() } },
      ]);
      const wins: Win[] = all
        .map((a) => ({
          date: a.account.date,
          guessesTaken: a.account.guessesTaken,
          timeToSolveSecs: Number(a.account.timeToSolveSecs),
          solvedAt: Number(a.account.solvedAt),
        }))
        .sort((a, b) => b.date - a.date);

      const streak = computeStreak(wins, today);
      const totalSolves = wins.length;
      const bestGuesses = wins.length
        ? Math.min(...wins.map((w) => w.guessesTaken))
        : null;
      const bestTime = wins.length
        ? Math.min(...wins.map((w) => w.timeToSolveSecs))
        : null;

      setData({ wins, streak, totalSolves, bestGuesses, bestTime });
    } catch {
      setData({ wins: [], streak: 0, totalSolves: 0, bestGuesses: null, bestTime: null });
    }
    setLoading(false);
  }, [player, program, today]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, refetch };
}
