"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { StatusBadge } from "./StatusBadge";
import { FlowerMark } from "./FlowerMark";
import { LoadingFlower } from "./LoadingFlower";
import { formatPuzzleDate } from "@/lib/dates";

interface Props {
  date: number;
  state: "Loading" | "NotInitialized" | "Generating" | "Active" | "Solved";
  attemptCount: number;
  solvedCount: number;
  onPrimaryAction?: () => void;
  primaryDisabled?: boolean;
  primaryLabel?: string;
}

export function PuzzleCard({
  date,
  state,
  attemptCount,
  solvedCount,
  onPrimaryAction,
  primaryDisabled,
  primaryLabel,
}: Props) {
  const { connected } = useWallet();

  const stateBadge =
    state === "Solved" ? (
      <StatusBadge variant="solved">Solved</StatusBadge>
    ) : state === "Active" ? (
      <StatusBadge variant="active">Active</StatusBadge>
    ) : state === "Generating" ? (
      <StatusBadge variant="computing">Generating · MPC</StatusBadge>
    ) : state === "NotInitialized" ? (
      <StatusBadge variant="accent">Not initialized</StatusBadge>
    ) : (
      <StatusBadge variant="mute">Loading</StatusBadge>
    );

  const isComputing = state === "Generating" || state === "Loading";

  return (
    <div className="panel p-6 flex flex-col" style={{ minHeight: 580 }}>
      <div className="flex items-center gap-2 mb-4">
        <StatusBadge variant="accent">Cryptanalyst</StatusBadge>
        <StatusBadge variant="mute">Onchain</StatusBadge>
        {stateBadge}
      </div>

      <h2 className="text-[28px] leading-[1.1] font-medium mb-2 tracking-tight">
        Daily Cipher
      </h2>
      <p className="text-text-mute text-[13px] mb-5 max-w-[36ch] leading-relaxed">
        Crack today&apos;s 4-symbol code. Generated inside the Arcium MPC cluster. Nobody knows the answer until someone solves it.
      </p>

      <div className="relative panel-2 dotted-bg flex-1 mb-5 overflow-hidden flex items-center justify-center" style={{ minHeight: 220 }}>
        <CiphertextMosaic />
        {isComputing ? (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]" style={{ background: "rgba(0,0,0,0.55)" }}>
            <LoadingFlower
              size={56}
              mode="bloom"
              label={state === "Generating" ? "MPC cluster generating" : "Reading state"}
              sublabel={state === "Generating" ? "Distributed randomness · ~10-30s" : undefined}
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
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <FlowerMark size={12} />
          <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim">
            encrypted state
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
    </div>
  );
}

function CiphertextMosaic() {
  const cells = Array.from({ length: 64 }, (_, i) => {
    const hue = (i * 37) % 360;
    const op = ((i * 13) % 9) / 60 + 0.05;
    return { hue, op };
  });
  return (
    <div className="grid grid-cols-8 gap-0.5 p-6 w-full">
      {cells.map((c, i) => (
        <div
          key={i}
          style={{
            aspectRatio: "1 / 1",
            background: `hsl(${260 + ((i * 11) % 40)} 70% 60% / ${c.op})`,
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        />
      ))}
    </div>
  );
}
