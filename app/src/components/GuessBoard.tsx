"use client";
import { GuessRow } from "./GuessRow";
import { NUM_POSITIONS } from "@/lib/constants";

export interface BoardAttempt {
  symbols: (number | null)[];
  exact: number;
  misplaced: number;
  finalized: boolean;
}

interface Props {
  attempts: BoardAttempt[];
  pendingSymbols: (number | null)[];
  pendingComputing: boolean;
  activeSlot: number | null;
  onSlotClick?: (slot: number) => void;
  maxRows?: number;
}

export function GuessBoard({
  attempts,
  pendingSymbols,
  pendingComputing,
  activeSlot,
  onSlotClick,
  maxRows = 10,
}: Props) {
  const rows: React.ReactNode[] = [];

  attempts.forEach((a, i) => {
    rows.push(
      <GuessRow
        key={`a-${i}`}
        index={i}
        symbols={a.symbols}
        exact={a.exact}
        misplaced={a.misplaced}
        finalized={true}
      />,
    );
  });

  // active row (the one being composed or computing)
  const activeIdx = attempts.length;
  if (activeIdx < maxRows) {
    rows.push(
      <GuessRow
        key="active"
        index={activeIdx}
        symbols={pendingSymbols}
        finalized={false}
        active={!pendingComputing}
        computing={pendingComputing}
        onSlotClick={pendingComputing ? undefined : onSlotClick ?? undefined}
        activeSlot={activeSlot ?? undefined}
      />,
    );
  }

  // empty placeholder rows
  for (let i = activeIdx + 1; i < maxRows; i++) {
    rows.push(
      <GuessRow
        key={`e-${i}`}
        index={i}
        symbols={Array.from({ length: NUM_POSITIONS }, () => null)}
        finalized={false}
      />,
    );
  }

  return <div>{rows}</div>;
}
