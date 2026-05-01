interface Props {
  size?: number;
  mode?: "spin" | "bloom" | "pulse";
  label?: string;
  sublabel?: string;
}

export function LoadingFlower({
  size = 36,
  mode = "spin",
  label,
  sublabel,
}: Props) {
  const petals = Array.from({ length: 6 }, (_, i) => i * 60);

  const containerCls =
    mode === "pulse"
      ? "loading-flower-container loading-flower-pulse"
      : "loading-flower-container";
  const svgCls =
    mode === "spin"
      ? "loading-flower-svg loading-flower-spin"
      : mode === "bloom"
        ? "loading-flower-svg"
        : "loading-flower-svg";

  return (
    <div className={containerCls} role="status" aria-live="polite">
      <svg
        width={size}
        height={size}
        viewBox="-12 -12 24 24"
        className={svgCls}
        style={{ color: "var(--accent)" }}
        aria-hidden
      >
        {petals.map((deg, i) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-6"
            rx="2.4"
            ry="5"
            fill="currentColor"
            opacity="0.85"
            transform={`rotate(${deg})`}
            style={
              mode === "bloom"
                ? {
                    transformOrigin: "center",
                    animation: `petal-bloom 1.5s ease-in-out ${i * 0.12}s infinite`,
                  }
                : undefined
            }
          />
        ))}
        <circle cx="0" cy="0" r="2.2" fill="currentColor" />
      </svg>
      {label ? (
        <div className="loading-flower-label">
          <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-accent-soft">
            {label}
          </span>
          {sublabel ? (
            <span className="font-mono text-[10.5px] tracking-[0.05em] text-text-dim mt-0.5">
              {sublabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function LoadingSplash({
  label = "Loading",
  sublabel,
}: {
  label?: string;
  sublabel?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 dotted-bg">
      <LoadingFlower size={72} mode="bloom" />
      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-[12px] tracking-[0.18em] uppercase text-accent-soft">
          {label}
        </span>
        {sublabel ? (
          <span className="font-mono text-[10.5px] tracking-[0.08em] text-text-dim">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function LoadingPill({
  label,
  sublabel,
}: {
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="loading-pill">
      <LoadingFlower size={20} mode="spin" />
      <div className="flex flex-col">
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-accent-soft leading-tight">
          {label}
        </span>
        {sublabel ? (
          <span className="font-mono text-[10px] tracking-[0.05em] text-text-dim leading-tight">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
