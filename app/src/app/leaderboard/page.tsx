"use client";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SectionHeader } from "@/components/SectionHeader";
import { useArciumProgram } from "@/hooks/useArciumProgram";
import { currentPuzzleDate, formatPuzzleDate } from "@/lib/dates";

interface Row {
  player: string;
  date: number;
  guessesTaken: number;
  timeToSolveSecs: number;
  solvedAt: number;
}

export default function Leaderboard() {
  const today = useMemo(() => currentPuzzleDate(), []);
  const { program } = useArciumProgram();
  const [tab, setTab] = useState<"today" | "all">("today");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      const all = await program.account.leaderboardEntry.all();
      if (!alive) return;
      const mapped: Row[] = all.map((a) => ({
        player: a.account.player.toBase58(),
        date: a.account.date,
        guessesTaken: a.account.guessesTaken,
        timeToSolveSecs: Number(a.account.timeToSolveSecs),
        solvedAt: Number(a.account.solvedAt),
      }));
      setRows(mapped);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [program]);

  const filtered = (
    tab === "today" ? rows.filter((r) => r.date === today) : rows
  ).sort((a, b) => {
    if (a.guessesTaken !== b.guessesTaken)
      return a.guessesTaken - b.guessesTaken;
    return a.timeToSolveSecs - b.timeToSolveSecs;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 page-fade">
        <div className="max-w-[960px] mx-auto px-6 pt-8 pb-12">
          <SectionHeader
            tag="#0.0"
            label="Leaderboard"
            meta={tab === "today" ? `day · ${today}` : "all-time"}
          />
          <div className="flex gap-2 mb-6">
            <Tab active={tab === "today"} onClick={() => setTab("today")}>
              Today
            </Tab>
            <Tab active={tab === "all"} onClick={() => setTab("all")}>
              All-time
            </Tab>
          </div>

          <div className="panel">
            <div className="grid grid-cols-[40px_1fr_120px_120px_120px] section-tag px-4 py-3 hairline-b">
              <span>#</span>
              <span>Player</span>
              <span className="text-right">Guesses</span>
              <span className="text-right">Time</span>
              <span className="text-right">Date</span>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-center text-text-dim font-mono text-[11px] tracking-[0.16em] uppercase shimmer">
                Loading on-chain leaderboard…
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-dim font-mono text-[11px] tracking-[0.16em] uppercase">
                No solvers yet
              </div>
            ) : (
              filtered.map((r, i) => (
                <div
                  key={`${r.player}-${r.date}`}
                  className="grid grid-cols-[40px_1fr_120px_120px_120px] px-4 py-3 hairline-b text-[13px] items-center"
                >
                  <span className="font-mono text-[11px] text-text-dim">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[12px] truncate">
                    {abbrev(r.player)}
                  </span>
                  <span className="font-mono text-right">{r.guessesTaken}</span>
                  <span className="font-mono text-right">
                    {formatDuration(r.timeToSolveSecs)}
                  </span>
                  <span className="font-mono text-right text-text-dim">
                    {formatPuzzleDate(r.date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`chip ${active ? "chip-accent" : ""}`}
      style={{ cursor: "pointer", padding: "6px 12px" }}
    >
      {children}
    </button>
  );
}

function abbrev(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
