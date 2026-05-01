export function FlowerMark({ size = 14 }: { size?: number }) {
  const petals = Array.from({ length: 6 }, (_, i) => (i * 60));
  return (
    <svg
      width={size}
      height={size}
      viewBox="-12 -12 24 24"
      className="flower-mark"
      aria-hidden
    >
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx="0"
          cy="-6"
          rx="2.4"
          ry="5"
          fill="currentColor"
          opacity="0.85"
          transform={`rotate(${deg})`}
        />
      ))}
      <circle cx="0" cy="0" r="2.2" fill="currentColor" />
    </svg>
  );
}
