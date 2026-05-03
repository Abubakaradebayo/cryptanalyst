"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { FlowerMark } from "@/components/FlowerMark";
import { ClientOnly } from "@/components/ClientOnly";
import { currentPuzzleDate, formatPuzzleDate } from "@/lib/dates";
import { usePlayerWins } from "@/hooks/usePlayerWins";

export default function WinsPage() {
  const today = useMemo(() => currentPuzzleDate(), []);
  const { publicKey } = useWallet();
  const { data, loading } = usePlayerWins(publicKey, today);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 page-fade">
        <div className="max-w-[920px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <StatusBadge variant="accent">Cryptanalyst</StatusBadge>
            <StatusBadge variant="mute">Powered by Arcium</StatusBadge>
            <StatusBadge variant="mute">Your wins</StatusBadge>
          </div>
          <h1 className="text-[40px] leading-[1.05] tracking-tight font-medium mb-3">
            Your wins
          </h1>
          <p className="text-text-mute text-[14px] max-w-[60ch] leading-relaxed mb-10">
            Every day you cracked the cipher, recorded permanently on Solana.
            Streaks, fastest solves, fewest guesses, all on chain.
          </p>

          <ClientOnly
            fallback={
              <div className="panel p-8 text-center text-text-dim font-mono text-[11px] tracking-[0.16em] uppercase">
                Loading…
              </div>
            }
          >
            {!publicKey ? (
              <div className="panel p-8 flex flex-col items-center gap-4 text-center">
                <FlowerMark size={28} />
                <p className="text-[14px] text-text-mute max-w-[40ch]">
                  Connect your wallet to see your solve history.
                </p>
                <WalletMultiButton />
              </div>
            ) : loading ? (
              <div className="panel p-8 text-center text-text-dim font-mono text-[11px] tracking-[0.16em] uppercase shimmer">
                Loading from chain…
              </div>
            ) : data.wins.length === 0 ? (
              <div className="panel p-8 flex flex-col items-center gap-4 text-center">
                <FlowerMark size={28} />
                <p className="text-[14px] text-text-mute max-w-[40ch]">
                  No solves yet. Crack today&apos;s cipher to start your wins
                  collection.
                </p>
                <Link href="/" className="btn-primary">
                  Try today&apos;s puzzle <span aria-hidden>→</span>
                </Link>
              </div>
            ) : (
              <>
                <SectionHeader tag="#0.1" label="Stats" meta="all-time" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                  <StatCard
                    label="Current streak"
                    value={data.streak === 0 ? "0" : `${data.streak}d`}
                    accent={data.streak >= 3}
                  />
                  <StatCard
                    label="Total solves"
                    value={String(data.totalSolves)}
                  />
                  <StatCard
                    label="Fewest guesses"
                    value={
                      data.bestGuesses !== null ? String(data.bestGuesses) : "—"
                    }
                  />
                  <StatCard
                    label="Fastest solve"
                    value={
                      data.bestTime !== null
                        ? formatDuration(data.bestTime)
                        : "—"
                    }
                  />
                </div>

                <SectionHeader
                  tag="#0.2"
                  label="Wins"
                  meta={`${data.wins.length} day${data.wins.length === 1 ? "" : "s"}`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.wins.map((w) => (
                    <TrophyCard
                      key={w.date}
                      date={w.date}
                      guessesTaken={w.guessesTaken}
                      timeToSolveSecs={w.timeToSolveSecs}
                      isToday={w.date === today}
                    />
                  ))}
                </div>
              </>
            )}
          </ClientOnly>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="panel p-4 flex flex-col gap-1"
      style={accent ? { borderColor: "var(--line-accent)" } : undefined}
    >
      <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim">
        {label}
      </span>
      <span
        className="font-mono text-[22px] tracking-tight"
        style={accent ? { color: "var(--accent)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function TrophyCard({
  date,
  guessesTaken,
  timeToSolveSecs,
  isToday,
}: {
  date: number;
  guessesTaken: number;
  timeToSolveSecs: number;
  isToday: boolean;
}) {
  return (
    <div
      className="panel p-5 flex flex-col gap-3"
      style={
        isToday
          ? { borderColor: "var(--line-accent)", background: "rgba(167,139,250,0.04)" }
          : undefined
      }
    >
      <div className="flex items-center gap-2 flex-wrap">
        <FlowerMark size={14} />
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-accent-soft">
          Cracked
        </span>
        {isToday ? (
          <StatusBadge variant="active">Today</StatusBadge>
        ) : null}
      </div>
      <div className="text-[20px] tracking-tight font-medium">
        {formatPuzzleDate(date)}
      </div>
      <div className="hairline-t pt-3 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-text-dim">
            Guesses
          </span>
          <span className="font-mono text-[16px]">{guessesTaken}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-text-dim">
            Time
          </span>
          <span className="font-mono text-[16px]">
            {formatDuration(timeToSolveSecs)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
