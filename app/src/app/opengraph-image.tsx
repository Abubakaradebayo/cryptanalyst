import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Cryptanalyst - Crack today's sealed code";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, rgba(86, 211, 194, 0.16), transparent 40%), linear-gradient(225deg, rgba(247, 185, 85, 0.10), transparent 38%), linear-gradient(180deg, rgba(108, 182, 255, 0.18), transparent 50%), #10141d",
          color: "#f8fbff",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(248, 251, 255, 0.68)",
          }}
        >
          <svg width="38" height="38" viewBox="-12 -12 24 24" fill="#56d3c2">
            <ellipse cx="0" cy="-6" rx="2.4" ry="5" transform="rotate(0)" />
            <ellipse cx="0" cy="-6" rx="2.4" ry="5" transform="rotate(60)" />
            <ellipse cx="0" cy="-6" rx="2.4" ry="5" transform="rotate(120)" />
            <ellipse cx="0" cy="-6" rx="2.4" ry="5" transform="rotate(180)" />
            <ellipse cx="0" cy="-6" rx="2.4" ry="5" transform="rotate(240)" />
            <ellipse cx="0" cy="-6" rx="2.4" ry="5" transform="rotate(300)" />
            <circle cx="0" cy="0" r="2.2" />
          </svg>
          <span>Cryptanalyst</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 86,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1,
              color: "#f8fbff",
              fontFamily: "monospace",
            }}
          >
            Crack the sealed code.
          </div>
          <div
            style={{
              fontSize: 30,
              color: "rgba(248, 251, 255, 0.72)",
              maxWidth: 880,
              lineHeight: 1.35,
            }}
          >
            Guess the 4-color code in 10 tries. The answer is sealed inside Arcium MPC. Nobody can read it until someone solves it.
          </div>

          <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
            {[
              "#ef4444",
              "#f59e0b",
              "#eab308",
              "#22c55e",
              "#3b82f6",
              "#a78bfa",
            ].map((c) => (
              <div
                key={c}
                style={{
                  width: 56,
                  height: 56,
                  background: c,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(248, 251, 255, 0.5)",
          }}
        >
          <span>Powered by Arcium · Solana devnet</span>
          <span>cryptanalyst.vercel.app</span>
        </div>
      </div>
    ),
    size,
  );
}
