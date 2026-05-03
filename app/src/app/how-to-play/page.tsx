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
        <div className="max-w-[920px] mx-auto px-6 pt-10 pb-16">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <StatusBadge variant="accent">Cryptanalyst</StatusBadge>
            <StatusBadge variant="mute">Powered by Arcium</StatusBadge>
            <StatusBadge variant="mute">Guide · v1</StatusBadge>
          </div>
          <h1 className="text-[40px] leading-[1.05] tracking-tight font-medium mb-4">
            How to play
          </h1>
          <p className="text-text-mute text-[15px] max-w-[64ch] leading-relaxed mb-12">
            Crack a daily 4-color code in 10 tries. Same puzzle for everyone,
            fresh every midnight UTC. The catch: Arcium&apos;s encrypted compute
            network generates the answer and locks it away. Nobody, not us, not
            the validators, not even Arcium itself, can read it until someone
            cracks it. Here&apos;s how to play in five steps.
          </p>

          <SectionHeader tag="#0.1" label="The 5 steps" meta="2 min to play" />
          <div className="flex flex-col gap-3 mb-12">
            <Step
              n="01"
              title="Connect a Solana wallet"
              body="Click Connect Wallet, top right. Phantom or Solflare both work. Your wallet is your identity here, no email or password needed. Every guess is signed by it, and the leaderboard tracks your wallet address."
              note="You'll need a tiny bit of devnet SOL for transaction fees. Free from the Solana faucet."
            />
            <Step
              n="02"
              title="Start today's puzzle"
              body="If today's puzzle hasn't been started yet, the button reads Initialize today's puzzle. Click it. Arcium generates a fresh 4-color code that nobody, you, us, anyone, can read. Once it's running, everyone in the world is playing the same one until midnight."
              note="Anyone can start it. The first to click triggers the generation; everyone else just plays."
            />
            <Step
              n="03"
              title="Pick four colors"
              body="Tap a slot in the active row, then click a color from the palette. Fill all four slots. Hit Clear to redo the row, or just tap a slot to overwrite it."
              extra={<PaletteRow />}
            />
            <Step
              n="04"
              title="Submit the guess"
              body="Once all four slots are filled, the button changes to Submit guess. Click it and your wallet signs the transaction. Your guess is encrypted before it leaves your browser. Arcium compares it to the answer without ever seeing either side in plain text, then sends back a score."
              note="Takes about 10-30 seconds. The button shows Computing in MPC… while you wait."
            />
            <Step
              n="05"
              title="Read the score, repeat, solve"
              body="Each finalized guess shows pegs on the right. Green = right color, right spot. Purple = right color, wrong spot. No peg = that color isn't in the code. You have 10 guesses to get 4 greens. When you solve it, Arcium reveals the code and your score lands on the leaderboard."
              extra={<FeedbackExample />}
            />
          </div>

          <SectionHeader tag="#0.2" label="Reading the feedback" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12">
            <FeedbackLegend
              kind="exact"
              title="Exact"
              body="Right symbol, right slot. Lock it in. These don't move."
            />
            <FeedbackLegend
              kind="misplaced"
              title="Misplaced"
              body="Right symbol, wrong slot. The color exists somewhere in the code, just not where you put it."
            />
            <FeedbackLegend
              kind="empty"
              title="No peg"
              body="Symbol isn't in the code at all. Cross that color off your list."
            />
          </div>

          <SectionHeader tag="#0.3" label="Tips" meta="strategy" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
            <Tip
              title="Open with information, not intuition"
              body="Your first guess can't win, use it to learn. Try four different colors to find out which two or three are in the code. Knuth's classic Mastermind opener is to start with two pairs of distinct colors."
            />
            <Tip
              title="Track exacts vs. misplaced separately"
              body="If you swap two slots in your next guess and exact + misplaced stays the same, you learned which slot a color belongs to. Small swaps reveal a lot."
            />
            <Tip
              title="The code can repeat colors"
              body="Codes are 4 symbols drawn (with replacement) from 6 colors. RED-RED-BLUE-BLUE is a valid code. If you see a high misplaced count with only one color, you might be looking at a repeat."
            />
            <Tip
              title="Time is the tiebreaker"
              body="On the leaderboard, fewer guesses wins first. If two players are tied on guesses, the faster solve wins. Don't rush the first guess. The information matters more than the seconds."
            />
          </div>

          <SectionHeader tag="#0.4" label="What stays secret" meta="privacy" />
          <div className="panel p-5 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <PrivacyPoint
                title="The daily code"
                body="On Solana as encrypted bytes. Only the network as a whole can read it, and only when someone solves it. Not even we can peek."
              />
              <PrivacyPoint
                title="Your guess"
                body="Encrypted in your browser before it goes anywhere. The chain just stores scrambled bytes. Other players can't see what you picked."
              />
              <PrivacyPoint
                title="Public (by design)"
                body="Your wallet, your score per guess, your time to solve. Same as a Mastermind board where everyone sees the pegs but not your secret."
              />
            </div>
          </div>

          <SectionHeader tag="#0.5" label="FAQ" />
          <div className="flex flex-col gap-3 mb-12">
            <FAQ
              q="Do I need to download anything?"
              a="No. Just a Solana wallet browser extension (Phantom or Solflare). Everything else runs in the browser."
            />
            <FAQ
              q="Does it cost money?"
              a="On devnet, basically no. You'll spend a few cents worth of devnet SOL on transaction fees, and devnet SOL is free from the faucet. On mainnet, each guess would cost fractions of a cent."
            />
            <FAQ
              q="What if my guess transaction fails?"
              a="If your wallet rejects it or the network drops it, nothing is recorded. Just try again. The only edge case: if the cluster aborts mid-computation, your attempt sits unfinalized and you can submit a new one."
            />
            <FAQ
              q="Can I see other players' guesses?"
              a="No. Their guesses are scrambled too. All you can see is their score per guess, same as you."
            />
            <FAQ
              q="What if the puzzle isn't solved by midnight UTC?"
              a="A new one starts. The old code stays encrypted forever, unless someone goes back and solves it later (the contract still allows it)."
            />
            <FAQ
              q="Why six colors and four positions?"
              a="6 colors and 4 slots gives you 1,296 possible codes. With 10 guesses you'll usually win. Same setup as the Mastermind board game, and that's been tuned for fun for 50 years."
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

function Step({
  n,
  title,
  body,
  note,
  extra,
}: {
  n: string;
  title: string;
  body: string;
  note?: string;
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
        {note ? (
          <div className="font-mono text-[11px] tracking-[0.05em] text-text-dim flex items-start gap-2 mt-1">
            <span className="text-accent">↳</span>
            <span>{note}</span>
          </div>
        ) : null}
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

function FeedbackExample() {
  return (
    <div className="panel-2 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="section-tag w-6 text-right">01</span>
        <div className="flex gap-2">
          <ColorSymbol index={0} size={28} />
          <ColorSymbol index={3} size={28} />
          <ColorSymbol index={1} size={28} />
          <ColorSymbol index={4} size={28} />
        </div>
        <div className="flex-1" />
        <FeedbackPegs exact={1} misplaced={2} />
        <span className="font-mono text-[11px] text-text-dim min-w-[64px] text-right">
          1E · 2M
        </span>
      </div>
      <div className="font-mono text-[10.5px] tracking-[0.05em] text-text-dim">
        ↳ Read this as: one symbol is exact, two more are right colors but in
        the wrong slots, and one is not in the code at all.
      </div>
    </div>
  );
}

function FeedbackLegend({
  kind,
  title,
  body,
}: {
  kind: "exact" | "misplaced" | "empty";
  title: string;
  body: string;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={
            kind === "exact"
              ? "peg-exact"
              : kind === "misplaced"
                ? "peg-misplaced"
                : "peg-empty"
          }
          style={{ width: 11, height: 11, borderRadius: "50%", display: "inline-block" }}
        />
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-mute">
          {title}
        </span>
      </div>
      <p className="text-[13px] text-text-mute leading-relaxed">{body}</p>
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
