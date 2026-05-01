"use client";
import { useEffect, useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { dailyPuzzlePda } from "@/lib/pdas";
import { useArciumProgram } from "./useArciumProgram";

export type PuzzleState =
  | "Loading"
  | "NotInitialized"
  | "Generating"
  | "Active"
  | "Solved";

export interface PuzzleData {
  state: PuzzleState;
  date: number;
  attemptCount: number;
  solvedCount: number;
  createdAt: number;
}

export function usePuzzle(date: number) {
  const { connection } = useConnection();
  const { program } = useArciumProgram();
  const [data, setData] = useState<PuzzleData>({
    state: "Loading",
    date,
    attemptCount: 0,
    solvedCount: 0,
    createdAt: 0,
  });

  const refetch = useCallback(async () => {
    try {
      const pda = dailyPuzzlePda(date);
      const acc = await program.account.dailyPuzzle.fetchNullable(pda);
      if (!acc) {
        setData({ state: "NotInitialized", date, attemptCount: 0, solvedCount: 0, createdAt: 0 });
        return;
      }
      const stateKey = Object.keys(acc.state)[0] as string;
      const norm =
        stateKey === "active"
          ? "Active"
          : stateKey === "solved"
            ? "Solved"
            : "Generating";
      setData({
        state: norm as PuzzleState,
        date: acc.date,
        attemptCount: acc.attemptCount,
        solvedCount: acc.solvedCount,
        createdAt: Number(acc.createdAt),
      });
    } catch {
      setData((d) => ({ ...d, state: "NotInitialized" }));
    }
  }, [date, program]);

  useEffect(() => {
    refetch();
    const pda = dailyPuzzlePda(date);
    const id = connection.onAccountChange(pda, () => refetch(), "confirmed");
    return () => {
      void connection.removeAccountChangeListener(id);
    };
  }, [connection, date, refetch]);

  return { data, refetch };
}
