/** Days since 1970-01-01 UTC (matches the on-chain `date: u32` semantics). */
export function currentPuzzleDate(): number {
  const now = new Date();
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor(utc / 86_400_000);
}

export function puzzleDateToDate(d: number): Date {
  return new Date(d * 86_400_000);
}

export function formatPuzzleDate(d: number): string {
  return puzzleDateToDate(d).toISOString().slice(0, 10);
}

export function timeUntilNextUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return next - now.getTime();
}
