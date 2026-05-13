"use client";
import { NUM_SYMBOLS } from "@/lib/constants";
import { ColorSymbol } from "./ColorSymbol";

interface Props {
  selectedIndex?: number | null;
  onSelect: (idx: number) => void;
  disabled?: boolean;
}

export function ColorPicker({ selectedIndex, onSelect, disabled }: Props) {
  return (
    <div className={`flex flex-wrap gap-2.5 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      {Array.from({ length: NUM_SYMBOLS }, (_, i) => (
        <ColorSymbol
          key={i}
          index={i}
          selected={selectedIndex === i}
          onClick={() => onSelect(i)}
          size={42}
        />
      ))}
    </div>
  );
}
