import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

function u32Le(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n, 0);
  return b;
}

export function dailyPuzzlePda(date: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("puzzle"), u32Le(date)],
    PROGRAM_ID,
  )[0];
}

export function playerAttemptPda(
  date: number,
  player: PublicKey,
  attemptIdx: number,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("attempt"), u32Le(date), player.toBuffer(), u32Le(attemptIdx)],
    PROGRAM_ID,
  )[0];
}

export function leaderboardEntryPda(
  date: number,
  player: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("lb"), u32Le(date), player.toBuffer()],
    PROGRAM_ID,
  )[0];
}

export function revealedCodePda(date: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("reveal"), u32Le(date)],
    PROGRAM_ID,
  )[0];
}
