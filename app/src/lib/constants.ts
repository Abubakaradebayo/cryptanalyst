import { PublicKey } from "@solana/web3.js";
import idl from "./idl.json";

export const PROGRAM_ID = new PublicKey((idl as { address: string }).address);

export const NUM_POSITIONS = 4;
export const NUM_SYMBOLS = 6;

export const SYMBOL_PALETTE: { hex: string; name: string }[] = [
  { hex: "#ef4444", name: "RED" },
  { hex: "#f59e0b", name: "AMBER" },
  { hex: "#eab308", name: "YELLOW" },
  { hex: "#22c55e", name: "GREEN" },
  { hex: "#3b82f6", name: "BLUE" },
  { hex: "#a78bfa", name: "VIOLET" },
];

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? "https://api.devnet.solana.com";

// Arcium MPC cluster offset on devnet (chosen at deploy time; see Arcium.toml).
export const ARCIUM_CLUSTER_OFFSET = Number(
  process.env.NEXT_PUBLIC_ARCIUM_CLUSTER_OFFSET ?? "456",
);
