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
      className={`guess-row flex items-center gap-2 sm:gap-3 py-2.5 px-3 sm:px-4 hairline-b ${active ? "bg-white/[0.035]" : ""}`}
    >
      <span className="section-tag w-6 text-right shrink-0">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex gap-2 shrink-0">
        {padded.map((sym, i) => (
          <ColorSymbol
            key={i}
            index={sym}
            size={34}
            selected={active && activeSlot === i}
            onClick={onSlotClick ? () => onSlotClick(i) : undefined}
            pulse={computing}
          />
        ))}
      </div>
      <div className="flex-1" />
      {finalized && exact !== undefined && misplaced !== undefined ? (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <FeedbackPegs exact={exact} misplaced={misplaced} />
          <span className="hidden sm:inline font-mono text-[11px] text-text-dim min-w-[64px] text-right">
            {exact}E · {misplaced}M
          </span>
        </div>
      ) : computing ? (
        <>
          <span className="sm:hidden section-tag text-accent-soft">MPC</span>
          <span className="hidden sm:inline-flex">
            <LoadingPill label="MPC computing" sublabel="encrypted compare" />
          </span>
        </>
      ) : active ? (
        <span className="hidden sm:inline section-tag">awaiting input</span>
      ) : null}
    </div>
  );
}
