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
        className={`relative inline-flex items-center justify-center select-none ${interactive ? "cursor-pointer" : ""}`}
        style={{
          width: sz,
          height: sz,
          border: `1px dashed ${selected ? "rgba(167,139,250,0.6)" : "rgba(255,255,255,0.16)"}`,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <span className="font-mono text-[10px] text-text-dim">-</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      title={color.name}
      className={`relative inline-flex items-center justify-center select-none ${interactive ? "cursor-pointer hover:brightness-110" : ""} ${pulse ? "computing" : ""}`}
      style={{
        width: sz,
        height: sz,
        background: color.hex,
        border: selected
          ? "2px solid #fff"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: selected
          ? `0 0 0 2px ${color.hex}55, 0 0 14px ${color.hex}44`
          : `0 0 10px ${color.hex}28`,
      }}
    >
      <span
        className="font-mono text-[11px] font-semibold mix-blend-overlay"
        style={{ color: "#fff", textShadow: "0 1px 0 rgba(0,0,0,0.4)" }}
      >
        {color.name[0]}
      </span>
    </div>
  );
}
