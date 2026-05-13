"use client";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ColorSymbol } from "@/components/ColorSymbol";
import { FeedbackPegs } from "@/components/FeedbackPegs";
import { StatusBadge } from "@/components/StatusBadge";
import { FlowerMark } from "@/components/FlowerMark";

export default function HowToPlay() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 page-fade">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <StatusBadge variant="accent">Cryptanalyst</StatusBadge>
            <StatusBadge variant="mute">Powered by Arcium</StatusBadge>
          </div>
          <h1 className="text-[40px] leading-[1.05] tracking-tight font-medium mb-4">
            How to play
          </h1>
          <p className="text-text-mute text-[17px] leading-relaxed mb-12">
            Guess the 4-color code in 10 tries.
            <br />
            You get hints after each guess.
          </p>

          <h2 className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent-soft mb-3">
            Example
          </h2>
          <div className="panel p-5 sm:p-6 mb-12">
            <Infographic />
          </div>

          <h2 className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent-soft mb-3">
            Rules
          </h2>
          <div className="panel p-5 mb-12 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                className="peg-exact"
                style={{ width: 12, height: 12, borderRadius: "50%", display: "inline-block" }}
              />
              <span className="text-[15px]">
                <span className="font-medium">Exact</span>{" "}
                <span className="text-text-dim">→</span>{" "}
                <span className="text-text-mute">right color, right spot</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="peg-misplaced"
                style={{ width: 12, height: 12, borderRadius: "50%", display: "inline-block" }}
              />
              <span className="text-[15px]">
                <span className="font-medium">Misplaced</span>{" "}
                <span className="text-text-dim">→</span>{" "}
                <span className="text-text-mute">right color, wrong spot</span>
              </span>
            </div>
          </div>

          <h2 className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent-soft mb-3">
            Fair play
          </h2>
          <div className="panel p-5 mb-12">
            <p className="text-[15px] text-text-mute leading-relaxed">
              The code is hidden and only revealed when solved.
            </p>
          </div>

          <div className="panel p-6 flex items-center gap-4 flex-wrap glow-purple">
            <FlowerMark size={20} />
            <div className="flex-1 min-w-[200px]">
              <div className="text-[16px] font-medium">Ready?</div>
              <div className="text-[13px] text-text-mute">
                Today&apos;s code is waiting.
              </div>
            </div>
            <Link href="/" className="btn-primary">
              Try today&apos;s puzzle <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Infographic() {
  return (
    <div className="flex flex-col gap-4">
      <Row label="Code">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-center font-mono text-[16px] text-accent-soft"
              style={{
                width: 36,
                height: 36,
                border: "1px dashed var(--line-accent)",
                background: "rgba(167,139,250,0.04)",
              }}
            >
              ?
            </div>
          ))}
        </div>
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim">
          hidden
        </span>
      </Row>

      <div className="hairline-t" />

      <Row label="Guess">
        <div className="flex gap-2">
          <ColorSymbol index={0} size={36} />
          <ColorSymbol index={4} size={36} />
          <ColorSymbol index={2} size={36} />
          <ColorSymbol index={3} size={36} />
        </div>
      </Row>

      <Row label="Result">
        <div className="flex items-center gap-3 flex-wrap">
          <FeedbackPegs exact={2} misplaced={1} />
          <span className="text-[14px] text-text-mute">
            <span className="text-text font-medium">2 exact</span>,{" "}
            <span className="text-text font-medium">1 misplaced</span>
          </span>
        </div>
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <span
        className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim shrink-0"
        style={{ minWidth: 72 }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
