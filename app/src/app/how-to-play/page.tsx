"use client";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SectionHeader } from "@/components/SectionHeader";
import { ColorSymbol } from "@/components/ColorSymbol";
import { FeedbackPegs } from "@/components/FeedbackPegs";
import { StatusBadge } from "@/components/StatusBadge";
import { FlowerMark } from "@/components/FlowerMark";
import { SYMBOL_PALETTE } from "@/lib/constants";

export default function HowToPlay() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 page-fade">
        <div className="max-w-[920px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <StatusBadge variant="accent">Cryptanalyst</StatusBadge>
            <StatusBadge variant="mute">Powered by Arcium</StatusBadge>
            <StatusBadge variant="mute">Guide</StatusBadge>
          </div>
          <h1 className="text-[40px] leading-[1.05] tracking-tight font-medium mb-4">
            How to play
          </h1>
          <p className="text-text-mute text-[16px] max-w-[60ch] leading-relaxed mb-10">
            Guess the 4-color code in 10 tries. You get hints after each guess.
            First to crack it wins today.
          </p>

          <SectionHeader tag="#0.1" label="See it in action" meta="example" />
          <div className="panel p-5 sm:p-6 mb-10">
            <Infographic />
          </div>

          <SectionHeader tag="#0.2" label="The hints" meta="exact vs misplaced" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
            <Rule
              kind="exact"
              title="Exact"
              body="Right color, right position. You nailed that slot."
            />
            <Rule
              kind="misplaced"
              title="Misplaced"
              body="Right color, wrong position. The color is in the answer, just not where you put it."
            />
          </div>

          <SectionHeader tag="#0.3" label="Quick steps" meta="2 min to play" />
          <div className="flex flex-col gap-3 mb-10">
            <Step
              n="01"
              title="Connect a Solana wallet"
              body="Click Connect Wallet. Phantom or Solflare both work. We never ask for your seed phrase."
            />
            <Step
              n="02"
              title="Pick four colors"
              body="Tap a slot in the active row, then click a color. Fill all four slots."
              extra={<PaletteRow />}
            />
            <Step
              n="03"
              title="Submit and read the hints"
              body="Hit Submit. After about 10-30 seconds, you'll see your score: how many colors are exact, how many are misplaced. Repeat until you crack it."
            />
          </div>

          <SectionHeader tag="#0.4" label="Tips" meta="strategy" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
            <Tip
              title="Start with variety"
              body="Use four different colors on your first guess. You'll learn which colors are in the code."
            />
            <Tip
              title="Use the hints together"
              body="3 exact + 0 misplaced means three slots are perfect and the fourth is a color not in the code at all."
            />
            <Tip
              title="The code can repeat colors"
              body="A code like RED-RED-BLUE-BLUE is allowed. If you see lots of misplaced for one color, expect repeats."
            />
            <Tip
              title="Speed matters for ties"
              body="Fewer guesses always wins. If two players tie on guesses, the faster one wins."
            />
          </div>

          <SectionHeader tag="#0.5" label="Why this is fair" meta="under the hood" />
          <div className="panel p-5 mb-10">
            <p className="text-[14px] text-text-mute leading-relaxed mb-4">
              The answer is hidden using Arcium, an encrypted compute network on
              Solana. Here&apos;s what that actually means for you:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <PrivacyPoint
                title="The answer is hidden"
                body="Nobody can see today's code. Not the developers, not anyone. It stays hidden until someone solves it."
              />
              <PrivacyPoint
                title="Your guesses are private"
                body="Other players can't see what colors you picked. Only your score is public."
              />
              <PrivacyPoint
                title="The score is the only reveal"
                body="After each guess, you only see how close you got. The full code is revealed only when someone solves it."
              />
            </div>
          </div>

          <SectionHeader tag="#0.6" label="FAQ" />
          <div className="flex flex-col gap-3 mb-10">
            <FAQ
              q="Do I need to download anything?"
              a="No. Just a Solana wallet browser extension (Phantom or Solflare). Everything else runs in the browser."
            />
            <FAQ
              q="Does it cost money?"
              a="On devnet, basically no. You'll spend a few cents worth of devnet SOL on transaction fees, and devnet SOL is free from the Solana faucet."
            />
            <FAQ
              q="What happens when someone solves it?"
              a="The puzzle is over for the day. The answer is revealed, the winner goes on the leaderboard, and a new puzzle starts at midnight UTC."
            />
            <FAQ
              q="Can I see other players' guesses?"
              a="No. Only their score per guess is public, same as you."
            />
            <FAQ
              q="Why six colors and four positions?"
              a="6 colors and 4 slots gives 1,296 possible codes. With 10 guesses you'll usually win. Same setup as the Mastermind board game."
            />
          </div>

          <div className="panel p-6 flex items-center gap-4 flex-wrap">
            <FlowerMark size={20} />
            <div className="flex-1 min-w-[240px]">
              <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim mb-1">
                Ready
              </div>
              <div className="text-[15px]">
                Today&apos;s code is waiting. Connect your wallet and crack it.
              </div>
            </div>
            <Link href="/" className="btn-primary">
              Start playing <span aria-hidden>→</span>
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
    <div className="flex flex-col gap-5">
      {/* Secret code row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim shrink-0"
          style={{ minWidth: 96 }}
        >
          Secret code
        </span>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-center font-mono text-[16px] text-accent-soft"
              style={{
                width: 38,
                height: 38,
                border: "1px dashed var(--line-accent)",
                background: "rgba(167,139,250,0.04)",
              }}
            >
              ?
            </div>
          ))}
        </div>
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim flex-1 min-w-[120px]">
          (hidden)
        </span>
      </div>

      <div className="hairline-t" />

      {/* Player guess rows */}
      <div className="flex flex-col gap-3">
        <ExampleGuess
          symbols={[0, 3, 1, 4]}
          exact={1}
          misplaced={1}
          note="1 color in right spot, 1 in wrong spot, 2 not in code"
        />
        <ExampleGuess
          symbols={[5, 3, 2, 4]}
          exact={2}
          misplaced={0}
          note="2 colors in right spot, 2 not in code"
        />
        <ExampleGuess
          symbols={[5, 3, 2, 1]}
          exact={4}
          misplaced={0}
          note="All 4 right. Solved!"
          solved
        />
      </div>

      <div className="hairline-t" />

      {/* Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
        <div className="flex items-center gap-2">
          <span
            className="peg-exact"
            style={{ width: 11, height: 11, borderRadius: "50%", display: "inline-block" }}
          />
          <span className="text-text-mute">
            <span className="text-text font-medium">Green peg</span> = right color, right position
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="peg-misplaced"
            style={{ width: 11, height: 11, borderRadius: "50%", display: "inline-block" }}
          />
          <span className="text-text-mute">
            <span className="text-text font-medium">Purple peg</span> = right color, wrong position
          </span>
        </div>
      </div>
    </div>
  );
}

function ExampleGuess({
  symbols,
  exact,
  misplaced,
  note,
  solved,
}: {
  symbols: number[];
  exact: number;
  misplaced: number;
  note: string;
  solved?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span
        className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim shrink-0"
        style={{ minWidth: 96 }}
      >
        Your guess
      </span>
      <div className="flex gap-2">
        {symbols.map((s, i) => (
          <ColorSymbol key={i} index={s} size={38} />
        ))}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <FeedbackPegs exact={exact} misplaced={misplaced} />
        <span
          className={`font-mono text-[11px] ${solved ? "text-green" : "text-text-mute"}`}
        >
          {exact}E · {misplaced}M
        </span>
      </div>
      <span className="text-[11.5px] text-text-mute flex-1 min-w-[140px] leading-snug">
        {note}
      </span>
    </div>
  );
}

function Rule({
  kind,
  title,
  body,
}: {
  kind: "exact" | "misplaced";
  title: string;
  body: string;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={kind === "exact" ? "peg-exact" : "peg-misplaced"}
          style={{ width: 12, height: 12, borderRadius: "50%", display: "inline-block" }}
        />
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-mute">
          {title}
        </span>
      </div>
      <p className="text-[13px] text-text-mute leading-relaxed">{body}</p>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  extra,
}: {
  n: string;
  title: string;
  body: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="panel p-5 grid grid-cols-[auto_1fr] gap-5">
      <div className="flex flex-col items-start">
        <span
          className="font-mono text-[12px] tracking-[0.16em] uppercase text-accent-soft px-2 py-1"
          style={{ border: "1px solid var(--line-accent)" }}
        >
          {n}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-[18px] tracking-tight font-medium">{title}</h3>
        <p className="text-[14px] text-text-mute leading-relaxed">{body}</p>
        {extra ? <div className="mt-1">{extra}</div> : null}
      </div>
    </div>
  );
}

function PaletteRow() {
  return (
    <div className="flex flex-wrap items-center gap-3 panel-2 p-3">
      {SYMBOL_PALETTE.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <ColorSymbol index={i} size={26} />
          <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-mute">
            {p.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function Tip({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel p-4">
      <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-accent-soft mb-2">
        Tip
      </div>
      <h4 className="text-[14px] font-medium tracking-tight mb-1">{title}</h4>
      <p className="text-[13px] text-text-mute leading-relaxed">{body}</p>
    </div>
  );
}

function PrivacyPoint({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-accent-soft mb-2">
        {title}
      </div>
      <p className="text-[13px] text-text-mute leading-relaxed">{body}</p>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="panel p-4 group">
      <summary className="cursor-pointer flex items-center gap-3 list-none">
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim group-open:text-accent">
          Q
        </span>
        <span className="text-[14px] font-medium flex-1">{q}</span>
        <span
          className="font-mono text-[12px] text-text-dim group-open:text-accent transition-transform"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div className="mt-3 pl-7 text-[13px] text-text-mute leading-relaxed">
        {a}
      </div>
    </details>
  );
}
