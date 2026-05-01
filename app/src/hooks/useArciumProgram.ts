"use client";
import { AnchorProvider } from "@coral-xyz/anchor";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { makeProgram, makeReadOnlyProvider } from "@/lib/anchor";

export function useArciumProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    const provider = wallet
      ? new AnchorProvider(connection, wallet, { commitment: "confirmed" })
      : makeReadOnlyProvider(connection);
    return { program: makeProgram(provider), provider };
  }, [connection, wallet]);
}
