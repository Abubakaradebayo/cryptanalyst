import { ColorSymbol } from "./ColorSymbol";
import { FeedbackPegs } from "./FeedbackPegs";
import { LoadingPill } from "./LoadingFlower";
import { NUM_POSITIONS } from "@/lib/constants";

interface Props {
  index: number;
  symbols: (number | null)[];
  exact?: number;
  misplaced?: number;
  finalized: boolean;
  active?: boolean;
  computing?: boolean;
  onSlotClick?: (slot: number) => void;
  activeSlot?: number;
}

export function GuessRow({
  index,
  symbols,
  exact,
  misplaced,
  finalized,
  active,
  computing,
  onSlotClick,
  activeSlot,
}: Props) {
  const padded = [...symbols];
  while (padded.length < NUM_POSITIONS) padded.push(null);

  return (
    <div
      className={`flex items-center gap-3 py-2 px-3 hairline-b ${active ? "bg-white/[0.015]" : ""}`}
    >
      <span className="section-tag w-6 text-right">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex gap-2">
        {padded.map((sym, i) => (
          <ColorSymbol
            key={i}
            index={sym}
            size={32}
            selected={active && activeSlot === i}
            onClick={onSlotClick ? () => onSlotClick(i) : undefined}
            pulse={computing}
          />
        ))}
      </div>
      <div className="flex-1" />
      {finalized && exact !== undefined && misplaced !== undefined ? (
        <div className="flex items-center gap-3">
          <FeedbackPegs exact={exact} misplaced={misplaced} />
          <span className="font-mono text-[11px] text-text-dim min-w-[64px] text-right">
            {exact}E · {misplaced}M
          </span>
        </div>
      ) : computing ? (
        <LoadingPill label="MPC computing" sublabel="encrypted compare" />
      ) : active ? (
        <span className="section-tag">awaiting input</span>
      ) : null}
    </div>
  );
}
