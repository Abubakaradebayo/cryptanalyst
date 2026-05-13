"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PuzzleCard } from "@/components/PuzzleCard";
import { GuessBoard, BoardAttempt } from "@/components/GuessBoard";
import { ColorPicker } from "@/components/ColorPicker";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { currentPuzzleDate } from "@/lib/dates";
import { NUM_POSITIONS, SYMBOL_PALETTE } from "@/lib/constants";
import { usePuzzle } from "@/hooks/usePuzzle";
import { useAttempts } from "@/hooks/useAttempts";
import { useGameActions } from "@/hooks/useGameActions";
import { usePlayerWins } from "@/hooks/usePlayerWins";

const MAX_ATTEMPTS = 10;
const EXPLORER_BASE = "https://explorer.solana.com";
const EXPLORER_CLUSTER = "?cluster=devnet";

type LogKind = "init" | "submit" | "feedback" | "solved" | "error";
interface LogEntry {
  ts: number;
  kind: LogKind;
  message: string;
  sig?: string;
}

type LocalMemory = Record<number, number[]>;

function storageKey(date: number, owner: string) {
  return `cryptanalyst:${owner}:${date}`;
}
function loadLocalGuesses(date: number, owner: string): LocalMemory {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(date, owner));
    return raw ? (JSON.parse(raw) as LocalMemory) : {};
  } catch {
    return {};
  }
}
function persistOneGuess(
  date: number,
  owner: string,
  idx: number,
  symbols: number[],
) {
  if (typeof window === "undefined") return;
  try {
    const key = storageKey(date, owner);
    const raw = window.localStorage.getItem(key);
    const existing: LocalMemory = raw ? JSON.parse(raw) : {};
    existing[idx] = symbols;
    window.localStorage.setItem(key, JSON.stringify(existing));
  } catch {}
}

export default function Page() {
  const date = useMemo(() => currentPuzzleDate(), []);
  const { publicKey } = useWallet();
  const { data: puzzle, refetch: refetchPuzzle } = usePuzzle(date);
  const { attempts, refetch: refetchAttempts } = useAttempts(date, publicKey);
  const { initPuzzle, submitGuess, claimSolve, pending, error } =
    useGameActions(date);
  const { data: wins, refetch: refetchWins } = usePlayerWins(publicKey, date);

  const [pendingSymbols, setPendingSymbols] = useState<(number | null)[]>(
    Array.from({ length: NUM_POSITIONS }, () => null),
  );
  const [activeSlot, setActiveSlot] = useState(0);
  const [computingTx, setComputingTx] = useState(false);

  const ownerKey = publicKey?.toBase58() ?? "anon";
  const [localMem, setLocalMem] = useState<LocalMemory>(() =>
    loadLocalGuesses(date, ownerKey),
  );

  const [log, setLog] = useState<LogEntry[]>([]);
  const loggedFinalizedRef = useRef<Set<number>>(new Set());
  const prevPuzzleStateRef = useRef(puzzle.state);
  const lastErrorRef = useRef<string | null>(null);

  function pushLog(entry: Omit<LogEntry, "ts">) {
    setLog((prev) => [{ ...entry, ts: Date.now() }, ...prev].slice(0, 50));
  }

  useEffect(() => {
    setLocalMem(loadLocalGuesses(date, ownerKey));
    setLog([]);
    loggedFinalizedRef.current = new Set();
  }, [date, ownerKey]);

  useEffect(() => {
    const fromDisk = loadLocalGuesses(date, ownerKey);
    setLocalMem((prev) => ({ ...prev, ...fromDisk }));
  }, [attempts.length, date, ownerKey]);

  useEffect(() => {
    attempts.forEach((a, i) => {
      if (a.finalized && !loggedFinalizedRef.current.has(a.attemptIdx)) {
        loggedFinalizedRef.current.add(a.attemptIdx);
        pushLog({
          kind: "feedback",
          message: `Guess #${i + 1} feedback received: ${a.exact}E · ${a.misplaced}M`,
        });
      }
    });
  }, [attempts]);

  useEffect(() => {
    if (prevPuzzleStateRef.current !== "Solved" && puzzle.state === "Solved") {
      pushLog({
        kind: "solved",
        message: "Cracked. Today's code is revealed. New puzzle at midnight UTC.",
      });
    }
    prevPuzzleStateRef.current = puzzle.state;
  }, [puzzle.state]);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      lastErrorRef.current = error;
      pushLog({ kind: "error", message: error });
    }
    if (!error) lastErrorRef.current = null;
  }, [error]);

  useEffect(() => {
    const last = attempts[attempts.length - 1];
    if (
      last &&
      last.finalized &&
      last.exact === NUM_POSITIONS &&
      last.misplaced === 0 &&
      puzzle.state === "Active" &&
      pending === "none"
    ) {
      void (async () => {
        const sig = await claimSolve(last.attemptIdx);
        if (sig) pushLog({ kind: "solved", message: "Claim solve submitted", sig });
        await refetchPuzzle();
        await refetchAttempts();
        await refetchWins();
      })();
    }
  }, [attempts, puzzle.state, claimSolve, pending, refetchPuzzle, refetchAttempts, refetchWins]);

  useEffect(() => {
    setPendingSymbols(Array.from({ length: NUM_POSITIONS }, () => null));
    setActiveSlot(0);
    setComputingTx(false);
  }, [attempts.length]);

  const boardAttempts: BoardAttempt[] = attempts.map((a) => ({
    symbols:
      a.guessSymbols ??
      localMem[a.attemptIdx] ??
      Array.from({ length: NUM_POSITIONS }, () => null),
    exact: a.exact,
    misplaced: a.misplaced,
    finalized: a.finalized,
  }));

  function chooseSymbol(idx: number) {
    if (computingTx || pending !== "none") return;
    const next = [...pendingSymbols];
    next[activeSlot] = idx;
    setPendingSymbols(next);
    if (activeSlot < NUM_POSITIONS - 1) setActiveSlot(activeSlot + 1);
  }

  const generatingStuck =
    puzzle.state === "Generating" &&
    puzzle.createdAt > 0 &&
    Date.now() / 1000 - puzzle.createdAt > 120;

  async function onPrimary() {
    if (puzzle.state === "NotInitialized" || generatingStuck) {
      const sig = await initPuzzle();
      if (sig) {
        pushLog({
          kind: "init",
          message: "Initialize puzzle submitted. Cluster generating today's code.",
          sig,
        });
      }
      await refetchPuzzle();
      return;
    }
    if (
      puzzle.state === "Active" &&
      pendingSymbols.every((s) => s !== null) &&
      attempts.length < MAX_ATTEMPTS
    ) {
      const symbols = pendingSymbols.map((s) => s as number);
      const pdaIdx = puzzle.attemptCount;
      persistOneGuess(date, ownerKey, pdaIdx, symbols);
      setLocalMem((prev) => ({ ...prev, [pdaIdx]: symbols }));
      setComputingTx(true);
      const result = await submitGuess(symbols, pdaIdx);
      if (result) {
        const { sig, onChainAttemptIdx } = result;
        if (onChainAttemptIdx !== pdaIdx) {
          persistOneGuess(date, ownerKey, onChainAttemptIdx, symbols);
          setLocalMem((prev) => ({ ...prev, [onChainAttemptIdx]: symbols }));
        }
        pushLog({
          kind: "submit",
          message: `Guess #${attempts.length + 1} submitted. Encrypted to the MPC cluster.`,
          sig,
        });
      }
      await refetchPuzzle();
      await refetchAttempts();
    }
  }

  const allSlotsFilled = pendingSymbols.every((s) => s !== null);
  const exhausted = attempts.length >= MAX_ATTEMPTS && puzzle.state !== "Solved";
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts.length);

  const best = attempts
    .filter((a) => a.finalized)
    .reduce<{ exact: number; misplaced: number } | null>((acc, a) => {
      if (!acc) return { exact: a.exact, misplaced: a.misplaced };
      if (a.exact > acc.exact || (a.exact === acc.exact && a.misplaced > acc.misplaced)) {
        return { exact: a.exact, misplaced: a.misplaced };
      }
      return acc;
    }, null);

  const lastAttempt = attempts[attempts.length - 1];
  const waitingForCallback = !!lastAttempt && !lastAttempt.finalized;

  const primaryDisabled =
    pending !== "none" ||
    computingTx ||
    exhausted ||
    puzzle.state === "Loading" ||
    waitingForCallback ||
    (puzzle.state === "Active" && !allSlotsFilled);

  const primaryLabel =
    puzzle.state === "Loading"
      ? "Loading puzzle…"
      : puzzle.state === "NotInitialized"
        ? "Initialize today's puzzle"
        : generatingStuck
          ? "Retry generation"
          : puzzle.state === "Generating"
            ? "Generating in cluster…"
            : puzzle.state === "Solved"
              ? "Already solved"
              : exhausted
                ? "Out of guesses · try tomorrow"
                : waitingForCallback
                  ? "Waiting for cluster feedback…"
                  : computingTx || pending === "guess"
                    ? "Computing in MPC…"
                    : "Submit guess";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key >= "1" && event.key <= "6") {
        if (puzzle.state !== "Active" || computingTx || pending !== "none") return;
        event.preventDefault();
        const symbol = Number(event.key) - 1;
        setPendingSymbols((prev) => {
          const next = [...prev];
          next[activeSlot] = symbol;
          return next;
        });
        setActiveSlot((slot) => Math.min(NUM_POSITIONS - 1, slot + 1));
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setActiveSlot((slot) =>
          event.key === "ArrowLeft"
            ? Math.max(0, slot - 1)
            : Math.min(NUM_POSITIONS - 1, slot + 1),
        );
        return;
      }

      if (event.key === "Backspace") {
        if (computingTx || pending !== "none") return;
        event.preventDefault();
        setPendingSymbols((prev) => {
          const next = [...prev];
          const slot =
            next[activeSlot] === null ? Math.max(0, activeSlot - 1) : activeSlot;
          next[slot] = null;
          setActiveSlot(slot);
          return next;
        });
        return;
      }

      if (event.key === "Enter" && !primaryDisabled) {
        event.preventDefault();
        void onPrimary();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSlot, computingTx, onPrimary, pending, primaryDisabled, puzzle.state]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 page-fade game-shell">
        <div className="game-stage max-w-[1280px] mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-12 grid grid-cols-1 lg:grid-cols-[430px_minmax(0,1fr)] gap-5 lg:gap-6 items-start">
          <PuzzleCard
            date={date}
            state={puzzle.state}
            attemptCount={puzzle.attemptCount}
            solvedCount={puzzle.solvedCount}
            best={best}
            revealedSymbols={null}
            exhausted={exhausted}
            attemptsLeft={attemptsLeft}
            onPrimaryAction={onPrimary}
            primaryDisabled={primaryDisabled}
            primaryLabel={primaryLabel}
          />

          <div className="flex flex-col gap-5">
            {publicKey && wins.totalSolves > 0 ? (
              <div className="control-strip p-3 sm:p-4 flex items-center gap-4 flex-wrap">
                {wins.streak > 0 ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center"
                      style={{
                        width: 22,
                        height: 22,
                        background: "rgba(167,139,250,0.14)",
                        border: "1px solid var(--line-accent)",
                        color: "var(--accent)",
                        fontSize: 12,
                      }}
                      aria-hidden
                    >
                      ★
                    </span>
                    <span className="font-mono text-[12px] tracking-[0.08em]">
                      <span className="text-accent">{wins.streak}-day</span>{" "}
                      <span className="text-text-mute">streak</span>
                    </span>
                  </div>
                ) : null}
                <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-dim">
                  · {wins.totalSolves} total solve{wins.totalSolves === 1 ? "" : "s"}
                </div>
                <div className="flex-1" />
                <a
                  href="/wins"
                  className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent-soft hover:text-accent"
                >
                  View all →
                </a>
              </div>
            ) : null}

            <Section
              tag="play"
              label="Code board"
              meta={`${attempts.length} / ${MAX_ATTEMPTS} guesses`}
            >
              {attempts.length === 0 && puzzle.state === "Active" ? (
                <p className="text-[13px] text-text-mute mb-3">
                  Pick four symbols and submit. Each guess takes about 10-30s while the MPC cluster computes your clues.
                </p>
              ) : null}
              <div className="board-panel overflow-hidden">
                <GuessBoard
                  attempts={boardAttempts}
                  pendingSymbols={pendingSymbols}
                  pendingComputing={computingTx || pending === "guess"}
                  activeSlot={activeSlot}
                  onSlotClick={(s) => setActiveSlot(s)}
                  maxRows={MAX_ATTEMPTS}
                />
              </div>
              <div className="mt-4 control-strip p-4 flex items-center gap-4 flex-wrap">
                <div className="flex flex-col gap-1 mr-1">
                  <span className="section-tag">Symbols</span>
                  <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-text-dim">
                    slot {activeSlot + 1} selected
                  </span>
                </div>
                <ColorPicker
                  selectedIndex={pendingSymbols[activeSlot] ?? null}
                  onSelect={chooseSymbol}
                  disabled={
                    puzzle.state !== "Active" ||
                    computingTx ||
                    pending !== "none"
                  }
                />
                <div className="flex-1" />
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setPendingSymbols(
                      Array.from({ length: NUM_POSITIONS }, () => null),
                    );
                    setActiveSlot(0);
                  }}
                  disabled={computingTx || pending !== "none"}
                >
                  Clear row
                </button>
              </div>
            </Section>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
              <ClueLegend />
              <ProofStrip />
            </div>

            <Section tag="palette" label="Available colors" meta="pick from these">
              <div className="board-panel p-4 flex flex-wrap gap-3 items-center">
                {SYMBOL_PALETTE.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        background: p.hex,
                        display: "inline-block",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    />
                    <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-mute">
                      {String(i).padStart(2, "0")} · {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              tag="chain"
              label="Chain log"
              meta={log.length > 0 ? `${log.length} event${log.length === 1 ? "" : "s"}` : "devnet"}
            >
              <div className="board-panel p-0 overflow-hidden">
                {log.length === 0 ? (
                  <div className="p-4 font-mono text-[11px] tracking-[0.16em] uppercase text-text-dim">
                    No moves submitted yet.
                  </div>
                ) : (
                  <div className="max-h-[280px] overflow-y-auto">
                    <ul className="divide-y divide-[var(--line)]">
                      {log.map((entry, idx) => (
                        <LogRow key={`${entry.ts}-${idx}`} entry={entry} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>

            {error ? (
              <div className="control-strip p-4">
                <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-rose mb-2">
                  Error
                </div>
                <code className="text-[12px] text-text-mute break-all">
                  {error}
                </code>
              </div>
            ) : null}

            {puzzle.state === "Solved" ? (
              <div className="board-panel p-5 flex items-center gap-4 flex-wrap">
                <StatusBadge variant="solved">Cracked</StatusBadge>
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[14px] mb-1">
                    {wins.wins.some((w) => w.date === date)
                      ? "You cracked today's code."
                      : "Today's code has been cracked."}
                  </div>
                  <div className="text-[12px] text-text-mute">
                    A new puzzle drops at midnight UTC. Come back to race for it.
                  </div>
                </div>
                {wins.wins.some((w) => w.date === date) ? (
                  <ShareWinButton
                    guesses={wins.wins.find((w) => w.date === date)!.guessesTaken}
                    timeSecs={wins.wins.find((w) => w.date === date)!.timeToSolveSecs}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ShareWinButton({
  guesses,
  timeSecs,
}: {
  guesses: number;
  timeSecs: number;
}) {
  const m = Math.floor(timeSecs / 60);
  const s = timeSecs % 60;
  const time = m > 0 ? `${m}m ${s}s` : `${s}s`;
  const text = `I cracked today's Cryptanalyst in ${guesses} guess${guesses === 1 ? "" : "es"} (${time}). The answer is encrypted by @Arcium MPC, nobody can read it until someone solves it.\n\nTry it: https://cryptanalyst.vercel.app`;
  const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="btn-primary"
      style={{ fontSize: 12 }}
    >
      Share your win <span aria-hidden>↗</span>
    </a>
  );
}

function Section({
  tag,
  label,
  meta,
  children,
}: {
  tag: string;
  label: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <SectionHeader tag={tag} label={label} meta={meta} />
      {children}
    </section>
  );
}

function ClueLegend() {
  return (
    <section>
      <SectionHeader tag="clues" label="How to read" meta="Mastermind" />
      <div className="control-strip p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ClueItem className="peg-exact" label="Exact" body="right symbol, right slot" />
        <ClueItem className="peg-misplaced" label="Misplaced" body="right symbol, wrong slot" />
      </div>
    </section>
  );
}

function ClueItem({
  className,
  label,
  body,
}: {
  className: string;
  label: string;
  body: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={className} style={{ width: 10, height: 10, borderRadius: "50%" }} />
      <div>
        <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text">
          {label}
        </div>
        <div className="text-[12px] text-text-dim leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

function ProofStrip() {
  return (
    <section>
      <SectionHeader tag="proof" label="Why fair" meta="MPC" />
      <div className="control-strip p-4">
        <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-accent-soft mb-2">
          The answer never leaves encrypted state
        </div>
        <p className="text-[12.5px] text-text-mute leading-relaxed">
          Arcium computes the clues over encrypted values. Only the clue counts
          are public until the cipher is cracked.
        </p>
      </div>
    </section>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.ts).toLocaleTimeString("en-US", { hour12: false });
  const tag =
    entry.kind === "init"
      ? { label: "INIT", color: "text-accent-soft" }
      : entry.kind === "submit"
        ? { label: "SUBMIT", color: "text-accent-soft" }
        : entry.kind === "feedback"
          ? { label: "FEEDBACK", color: "text-green" }
          : entry.kind === "solved"
            ? { label: "SOLVED", color: "text-green" }
            : { label: "ERROR", color: "text-rose" };
  return (
    <li className="px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-text-dim">
          {time}
        </span>
        <span className={`font-mono text-[10.5px] tracking-[0.16em] uppercase ${tag.color}`}>
          {tag.label}
        </span>
        <span className="text-[12.5px] text-text leading-snug flex-1">
          {entry.message}
        </span>
      </div>
      {entry.sig ? (
        <a
          href={`${EXPLORER_BASE}/tx/${entry.sig}${EXPLORER_CLUSTER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10.5px] tracking-[0.08em] text-accent-soft hover:text-accent break-all underline-offset-2 hover:underline"
        >
          tx · {entry.sig.slice(0, 10)}…{entry.sig.slice(-10)} ↗
        </a>
      ) : null}
    </li>
  );
}
