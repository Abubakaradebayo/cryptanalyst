import { SYMBOL_PALETTE } from "@/lib/constants";

interface Props {
  index: number | null;
  size?: number;
  selected?: boolean;
  onClick?: () => void;
  pulse?: boolean;
}

export function ColorSymbol({ index, size = 36, selected, onClick, pulse }: Props) {
  const color = index !== null ? SYMBOL_PALETTE[index] : null;
  const interactive = !!onClick;
  const sz = `${size}px`;

  if (!color) {
    return (
      <div
        onClick={onClick}
        role={interactive ? "button" : undefined}
        className={`symbol-token symbol-token-empty relative inline-flex items-center justify-center select-none ${interactive ? "cursor-pointer" : ""}`}
        style={{
          width: sz,
          height: sz,
          border: `1px dashed ${selected ? "rgba(167,139,250,0.72)" : "rgba(255,255,255,0.16)"}`,
          boxShadow: selected ? "0 0 0 1px rgba(167,139,250,0.42)" : undefined,
        }}
      >
        <span className="font-mono text-[12px] text-text-dim">+</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      title={color.name}
      className={`symbol-token relative inline-flex items-center justify-center select-none ${interactive ? "cursor-pointer hover:brightness-110" : ""} ${pulse ? "computing" : ""}`}
      style={{
        width: sz,
        height: sz,
        background: color.hex,
        border: selected
          ? "2px solid #fff"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: selected
          ? `0 0 0 1px ${color.hex}88, 0 0 18px ${color.hex}36`
          : `0 0 10px ${color.hex}20`,
      }}
    >
      <span
        className="font-mono text-[10px] font-semibold"
        style={{ color: "rgba(255,255,255,0.88)", textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
      >
        {color.name[0]}
      </span>
    </div>
  );
}
