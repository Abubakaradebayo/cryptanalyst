"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { StatusBadge } from "./StatusBadge";
import { FlowerMark } from "./FlowerMark";
import { LoadingFlower } from "./LoadingFlower";
import { ColorSymbol } from "./ColorSymbol";
import { ClientOnly } from "./ClientOnly";
import { formatPuzzleDate } from "@/lib/dates";
import { NUM_POSITIONS } from "@/lib/constants";

interface Props {
  date: number;
  state: "Loading" | "NotInitialized" | "Generating" | "Active" | "Solved";
  attemptCount: number;
  solvedCount: number;
  best: { exact: number; misplaced: number } | null;
  revealedSymbols: number[] | null;
  exhausted: boolean;
  attemptsLeft: number;
  onPrimaryAction?: () => void;
  primaryDisabled?: boolean;
  primaryLabel?: string;
}

export function PuzzleCard({
  date,
  state,
  attemptCount,
  solvedCount,
  best,
  revealedSymbols,
  exhausted,
  attemptsLeft,
  onPrimaryAction,
  primaryDisabled,
  primaryLabel,
}: Props) {
  const { connected } = useWallet();

  const stateBadge =
    state === "Solved" ? (
      <StatusBadge variant="solved">Cracked</StatusBadge>
    ) : state === "Active" ? (
      exhausted ? (
        <StatusBadge variant="mute">Out of guesses</StatusBadge>
      ) : (
        <StatusBadge variant="active">Up for grabs</StatusBadge>
      )
    ) : state === "Generating" ? (
      <StatusBadge variant="computing">Generating · MPC</StatusBadge>
    ) : state === "NotInitialized" ? (
      <StatusBadge variant="accent">Not initialized</StatusBadge>
    ) : (
      <StatusBadge variant="mute">Loading</StatusBadge>
    );

  const isComputing = state === "Generating" || state === "Loading";

  // Determine what to show in the 4 code slots:
  //   - Solved -> revealed answer colors
  //   - otherwise -> "?" placeholders (the code is encrypted on chain)
  const slots: (number | null)[] =
    revealedSymbols && revealedSymbols.length === NUM_POSITIONS
      ? revealedSymbols
      : Array.from({ length: NUM_POSITIONS }, () => null);

  return (
    <div className="panel p-6 flex flex-col" style={{ minHeight: 580 }}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <StatusBadge variant="accent">Cryptanalyst</StatusBadge>
        <StatusBadge variant="mute">Powered by Arcium</StatusBadge>
        {stateBadge}
      </div>

      <h2 className="text-[28px] leading-[1.1] font-medium mb-2 tracking-tight">
        Daily Cipher
      </h2>
      <p className="text-text-mute text-[13px] mb-3 max-w-[36ch] leading-relaxed">
        Be the first to crack today&apos;s 4-color code. The answer is encrypted
        by Arcium, nobody can read it until someone solves it.
      </p>
      {state === "Active" && !exhausted ? (
        <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-accent mb-5 flex items-center gap-2">
          <span
            className="inline-block"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
              animation: "pulse-accent 1.4s ease-in-out infinite",
            }}
          />
          First wallet to crack it wins the day
        </div>
      ) : (
        <div className="mb-5" />
      )}

      <div
        className="relative panel-2 dotted-bg flex-1 mb-5 overflow-hidden flex flex-col items-center justify-center gap-5"
        style={{ minHeight: 220 }}
      >
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <FlowerMark size={12} />
          <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim">
            today&apos;s code
          </span>
        </div>

        <div className="flex gap-3 mt-4">
          {slots.map((sym, i) =>
            sym !== null ? (
              <ColorSymbol key={i} index={sym} size={48} />
            ) : (
              <div
                key={i}
                className="flex items-center justify-center font-mono text-[20px] text-accent-soft"
                style={{
                  width: 48,
                  height: 48,
                  border: "1px dashed var(--line-accent)",
                  background: "rgba(167,139,250,0.04)",
                }}
              >
                ?
              </div>
            ),
          )}
        </div>

        {state === "Solved" ? (
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-green text-center">
            Cracked
            <span className="block text-text-dim mt-1">
              Resets at midnight UTC
            </span>
          </div>
        ) : exhausted ? (
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-mute text-center">
            Out of guesses
            {best ? (
              <span className="block text-text-dim mt-1">
                closest: {best.exact}E · {best.misplaced}M
              </span>
            ) : null}
          </div>
        ) : best ? (
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent-soft">
            best: {best.exact}E · {best.misplaced}M
            <span className="text-text-dim ml-2">
              · {attemptsLeft} left
            </span>
          </div>
        ) : (
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-dim">
            sealed in the MPC cluster
          </div>
        )}

        {isComputing ? (
          <div
            className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]"
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            <LoadingFlower
              size={56}
              mode="bloom"
              label={
                state === "Generating" ? "MPC cluster generating" : "Reading state"
              }
              sublabel={
                state === "Generating"
                  ? "Distributed randomness · ~10-30s"
                  : undefined
              }
            />
          </div>
        ) : null}

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim">
            day · {date}
          </span>
          <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim">
            {formatPuzzleDate(date)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px mb-5 hairline-t hairline-b">
        <div className="panel p-3 flex flex-col gap-1">
          <span className="section-tag">attempts</span>
          <span className="font-mono text-[18px]">{attemptCount}</span>
        </div>
        <div className="panel p-3 flex flex-col gap-1">
          <span className="section-tag">solvers</span>
          <span className="font-mono text-[18px]">{solvedCount}</span>
        </div>
      </div>

      <ClientOnly
        fallback={
          <button
            className="btn-primary w-full justify-center"
            disabled
          >
            Loading… <span aria-hidden>→</span>
          </button>
        }
      >
        {connected ? (
          <button
            className="btn-primary w-full justify-center"
            onClick={onPrimaryAction}
            disabled={primaryDisabled}
          >
            {primaryLabel ?? "Submit guess"} <span aria-hidden>→</span>
          </button>
        ) : (
          <div className="w-full">
            <WalletMultiButton style={{ width: "100%", justifyContent: "center" }} />
          </div>
        )}
      </ClientOnly>
    </div>
  );
}
