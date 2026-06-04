import type { CSSProperties } from "react";

const nodePositions = [
  [12, 24],
  [24, 62],
  [38, 36],
  [52, 68],
  [66, 28],
  [78, 56],
  [88, 34],
];

const packets = Array.from({ length: 14 }, (_, index) => index);

export function CryptoBackground() {
  return (
    <div className="crypto-bg" aria-hidden="true">
      <div className="crypto-bg__glow crypto-bg__glow--violet" />
      <div className="crypto-bg__glow crypto-bg__glow--soft" />
      <div className="crypto-bg__grid" />
      <div className="crypto-bg__rings" />

      <div className="crypto-bg__scan crypto-bg__scan--one" />
      <div className="crypto-bg__scan crypto-bg__scan--two" />

      <div className="crypto-bg__circuit">
        {packets.map((packet) => (
          <span
            key={packet}
            style={
              {
                "--i": packet,
                "--y": `${12 + (packet % 7) * 11}%`,
                "--y-alt": `${18 + (packet % 6) * 12}%`,
              } as CSSProperties
            }
          >
            <i />
          </span>
        ))}
      </div>

      <svg className="crypto-bg__nodes" viewBox="0 0 100 80" preserveAspectRatio="none">
        <path
          className="crypto-bg__node-path crypto-bg__node-path--slow"
          d="M4 48 C18 25 30 74 44 42 S70 16 96 34"
          pathLength="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="crypto-bg__node-path crypto-bg__node-path--fast"
          d="M8 18 C28 12 30 52 49 50 S72 70 92 54"
          pathLength="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={nodePositions.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {nodePositions.map(([cx, cy], index) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index % 2 === 0 ? 0.75 : 0.55} />
        ))}
      </svg>
    </div>
  );
}
