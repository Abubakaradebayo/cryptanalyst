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
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge variant="accent">Cryptanalyst</StatusBadge>
            <StatusBadge variant="mute">Guide · v1</StatusBadge>
          </div>
          <h1 className="text-[40px] leading-[1.05] tracking-tight font-medium mb-4">
            How to play
          </h1>
          <p className="text-text-mute text-[15px] max-w-[64ch] leading-relaxed mb-12">
            A daily 4-symbol code-breaking puzzle. Same code worldwide, fresh
            every UTC midnight. The answer is generated inside the Arcium MPC
            cluster, nobody knows it until someone solves it. Here&apos;s how to
            play in five steps.
          </p>

          <SectionHeader tag="#0.1" label="The 5 steps" meta="2 min to play" />
          <div className="flex flex-col gap-3 mb-12">
            <Step
              n="01"
              title="Connect a Solana wallet"
              body="Click Connect Wallet (top right). Phantom or Solflare both work. Your wallet is your identity: no email, no password, no server account. Every guess you make is signed with this wallet, and the leaderboard is keyed to your public key."
              note="On devnet you'll need a small amount of devnet SOL to pay transaction fees. Get it free from the Solana faucet."
            />
            <Step
              n="02"
              title="Initialize today's puzzle (if no one has yet)"
              body="If today's puzzle hasn't been started, the main button reads Initialize today's puzzle. Click it. The MPC cluster generates a brand-new 4-symbol code from cryptographic randomness distributed across multiple nodes. The code is stored on Solana as ciphertext that nobody, not you, not us, not the validators, can decrypt."
              note="Anyone in the world can do this. First caller wins; everyone else plays the same code."
            />
            <Step
              n="03"
              title="Pick four symbols"
              body="Tap a slot in the active row, then click a color from the 6-color palette. Repeat until all four slots are filled. You can re-tap a slot to overwrite, or use Clear to start the row over."
              extra={<PaletteRow />}
            />
            <Step
              n="04"
              title="Submit the guess"
              body="The button switches to Submit guess once all four slots are filled. Click it. Behind the scenes your browser does an x25519 Diffie-Hellman handshake with the cluster, encrypts your guess with the Rescue cipher, and your wallet signs a Solana transaction that queues the comparison. The cluster compares your encrypted guess with the encrypted code, without ever decrypting either, and returns just two small public numbers."
              note="Each guess takes a few seconds while the MPC runs. The button shows Computing in MPC… and the active row pulses purple while you wait."
            />
            <Step
              n="05"
              title="Read the feedback, repeat, solve"
              body="Each finalized guess shows pegs to the right. Green = correct symbol in correct slot (exact). Purple = correct symbol in wrong slot (misplaced). Empty = symbol not in the code. You have 10 guesses to reach 4 exact / 0 misplaced. On a solve, the cluster automatically reveals today's code and your score lands on the leaderboard."
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
                body="Stored on Solana as ciphertext. Decryptable only by the MPC cluster as a whole. No single node ever holds plaintext. Even we can't read it."
              />
              <PrivacyPoint
                title="Your guess"
                body="Encrypted in your browser before it leaves. The chain stores ciphertext only. Other players can't see what you guessed."
              />
              <PrivacyPoint
                title="Public (by design)"
                body="The (exact, misplaced) feedback per guess, your wallet, your guess count, your solve time. Same as a physical Mastermind board, nothing more."
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
              a="On devnet, no. Devnet SOL is free from the faucet. On mainnet, each guess costs a tiny network fee (fractions of a cent) plus the cost of running the MPC computation."
            />
            <FAQ
              q="What if my guess transaction fails?"
              a="If the wallet rejects it or the network drops it, no attempt is recorded. You can try again. If the cluster aborts the computation, the program reports an error and the attempt is left unfinalized; you can submit a new guess."
            />
            <FAQ
              q="Can I see other players' guesses?"
              a="No. Other players' guesses are encrypted on chain. The only public information about any attempt is the (exact, misplaced) result."
            />
            <FAQ
              q="What if the puzzle isn't solved by midnight UTC?"
              a="A new puzzle is initialized for the next day. Yesterday's code stays encrypted forever (unless someone solves it later, which the contract still permits)."
            />
            <FAQ
              q="Why six colors and four positions?"
              a="6^4 = 1296 possible codes. With 10 guesses, an optimal solver always wins; a fast human solver wins most days. It's the same difficulty as classic Mastermind for a reason. It's been tuned for human enjoyment for 50 years."
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
