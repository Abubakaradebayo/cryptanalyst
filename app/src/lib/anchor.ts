import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { Cryptanalyst } from "../types/cryptanalyst";
import idl from "./idl.json";

export type CryptanalystProgram = Program<Cryptanalyst>;

export function makeProgram(provider: AnchorProvider): CryptanalystProgram {
  return new Program<Cryptanalyst>(idl as Cryptanalyst, provider);
}

export function makeReadOnlyProvider(connection: Connection): AnchorProvider {
  const dummy = {
    publicKey: PublicKey.default,
    signTransaction: async <T>(tx: T) => tx,
    signAllTransactions: async <T>(txs: T[]) => txs,
  };
  return new AnchorProvider(connection, dummy as never, {
    commitment: "confirmed",
  });
}
