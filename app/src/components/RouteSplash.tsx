"use client";
import { useEffect, useState } from "react";

const PETAL_COUNT = 6;
const PETAL_STAGGER_MS = 90;
const PETAL_DUR_MS = 600;
const SPLASH_HOLD_MS = PETAL_STAGGER_MS * PETAL_COUNT + PETAL_DUR_MS - 250; // ~890ms
const FADE_MS = 280;

export function RouteSplash({
  children,
  label = "Cryptanalyst",
  sublabel,
}: {
  children: React.ReactNode;
  label?: string;
  sublabel?: string;
}) {
  const [phase, setPhase] = useState<"showing" | "fading" | "done">("showing");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("fading"), SPLASH_HOLD_MS);
    const t2 = window.setTimeout(() => setPhase("done"), SPLASH_HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <>
      {phase !== "done" ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 dotted-bg"
          style={{
            background: "var(--bg)",
            animation:
              phase === "fading"
                ? `splash-fade-out ${FADE_MS}ms ease-out forwards`
                : undefined,
            pointerEvents: phase === "fading" ? "none" : "auto",
          }}
          aria-hidden={phase === "fading"}
        >
          <BloomingFlower size={84} />
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[12px] tracking-[0.22em] uppercase text-text">
              {label}
            </span>
            <span className="font-mono text-[10.5px] tracking-[0.1em] text-text-dim">
              {sublabel ?? "Encrypted state · Solana"}
            </span>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}

function BloomingFlower({ size = 84 }: { size?: number }) {
  const petals = Array.from({ length: PETAL_COUNT }, (_, i) => i);
  return (
    <svg
      width={size}
      height={size}
      viewBox="-12 -12 24 24"
      style={{ color: "var(--accent)" }}
      aria-hidden
    >
      {petals.map((i) => (
        <ellipse
          key={i}
          cx="0"
          cy="-6"
          rx="2.4"
          ry="5"
          fill="currentColor"
          opacity="0"
          transform={`rotate(${i * 60})`}
          style={{
            transformOrigin: "0 0",
            animation: `petal-open ${PETAL_DUR_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * PETAL_STAGGER_MS}ms forwards`,
          }}
        />
      ))}
      <circle
        cx="0"
        cy="0"
        r="2.2"
        fill="currentColor"
        opacity="0"
        style={{
          transformOrigin: "center",
          animation: `core-arrive 320ms ease-out ${PETAL_COUNT * PETAL_STAGGER_MS}ms forwards`,
        }}
      />
    </svg>
  );
}
