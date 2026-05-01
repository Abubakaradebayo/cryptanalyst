"use client";
import { useEffect, useMemo, useState } from "react";
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

const MAX_ATTEMPTS = 10;

type LocalMemory = Record<number, number[]>;

function loadLocalGuesses(date: number, owner: string): LocalMemory {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`cryptanalyst:${owner}:${date}`);
    return raw ? (JSON.parse(raw) as LocalMemory) : {};
  } catch {
    return {};
  }
}
function saveLocalGuesses(date: number, owner: string, mem: LocalMemory) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `cryptanalyst:${owner}:${date}`,
      JSON.stringify(mem),
    );
  } catch {}
}

export default function Page() {
  const date = useMemo(() => currentPuzzleDate(), []);
  const { publicKey } = useWallet();
  const { data: puzzle, refetch: refetchPuzzle } = usePuzzle(date);
  const { attempts, refetch: refetchAttempts } = useAttempts(date, publicKey);
  const { initPuzzle, submitGuess, claimSolve, pending, error } =
    useGameActions(date);

  const [pendingSymbols, setPendingSymbols] = useState<(number | null)[]>(
    Array.from({ length: NUM_POSITIONS }, () => null),
  );
  const [activeSlot, setActiveSlot] = useState(0);
  const [computingTx, setComputingTx] = useState(false);

  const ownerKey = publicKey?.toBase58() ?? "anon";
  const [localMem, setLocalMem] = useState<LocalMemory>(() =>
    loadLocalGuesses(date, ownerKey),
  );

  useEffect(() => {
    setLocalMem(loadLocalGuesses(date, ownerKey));
  }, [date, ownerKey]);

  // Auto-claim when last attempt is (4,0) and puzzle still Active.
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
        await claimSolve(last.attemptIdx);
        await refetchPuzzle();
        await refetchAttempts();
      })();
    }
  }, [attempts, puzzle.state, claimSolve, pending, refetchPuzzle, refetchAttempts]);

  useEffect(() => {
    setPendingSymbols(Array.from({ length: NUM_POSITIONS }, () => null));
    setActiveSlot(0);
    setComputingTx(false);
  }, [attempts.length]);

  const boardAttempts: BoardAttempt[] = attempts.map((a) => ({
    symbols:
      localMem[a.attemptIdx] ??
      Array.from({ length: NUM_POSITIONS }, () => 0),
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

  // If the puzzle has been stuck in Generating for >2 min, allow retry.
  const generatingStuck =
    puzzle.state === "Generating" &&
    puzzle.createdAt > 0 &&
    Date.now() / 1000 - puzzle.createdAt > 120;

  async function onPrimary() {
    if (puzzle.state === "NotInitialized" || generatingStuck) {
      await initPuzzle();
      await refetchPuzzle();
      return;
    }
    if (
      puzzle.state === "Active" &&
      pendingSymbols.every((s) => s !== null) &&
      attempts.length < MAX_ATTEMPTS
    ) {
      const symbols = pendingSymbols.map((s) => s as number);
      const nextIdx = puzzle.attemptCount;
      const updated: LocalMemory = { ...localMem, [nextIdx]: symbols };
      setLocalMem(updated);
      saveLocalGuesses(date, ownerKey, updated);
      setComputingTx(true);
      await submitGuess(symbols, nextIdx);
      await refetchPuzzle();
      await refetchAttempts();
    }
  }

  const allSlotsFilled = pendingSymbols.every((s) => s !== null);
  const primaryDisabled =
    pending !== "none" ||
    computingTx ||
    (puzzle.state === "Active" && !allSlotsFilled);

  const primaryLabel =
    puzzle.state === "NotInitialized"
      ? "Initialize today's puzzle"
      : generatingStuck
        ? "Retry generation"
        : puzzle.state === "Generating"
          ? "Generating in cluster…"
          : puzzle.state === "Solved"
            ? "Already solved"
            : computingTx || pending === "guess"
              ? "Computing in MPC…"
              : "Submit guess";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 page-fade">
        <div className="max-w-[1240px] mx-auto px-6 pt-8 pb-12 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
          <PuzzleCard
            date={date}
            state={puzzle.state}
            attemptCount={puzzle.attemptCount}
            solvedCount={puzzle.solvedCount}
            onPrimaryAction={onPrimary}
            primaryDisabled={primaryDisabled}
            primaryLabel={primaryLabel}
          />

          <div className="flex flex-col gap-6">
            <Section tag="#0.1" label="Objective" meta="onchain · solana">
              <p className="text-[14px] text-text-mute leading-relaxed">
                Crack the daily 4-symbol code in {MAX_ATTEMPTS} guesses or fewer.
                After each guess, the cluster returns{" "}
                <span className="text-text">exact</span> matches (correct symbol,
                correct position) and{" "}
                <span className="text-text">misplaced</span> matches (correct
                symbol, wrong position). The code itself never leaves the
                encrypted state until you solve it.
              </p>
            </Section>

            <Section
              tag="#0.2"
              label="Guesses"
              meta={`${attempts.length} / ${MAX_ATTEMPTS}`}
            >
              <div className="panel">
                <GuessBoard
                  attempts={boardAttempts}
                  pendingSymbols={pendingSymbols}
                  pendingComputing={computingTx || pending === "guess"}
                  activeSlot={activeSlot}
                  onSlotClick={(s) => setActiveSlot(s)}
                  maxRows={MAX_ATTEMPTS}
                />
              </div>
              <div className="mt-4 panel p-4 flex items-center gap-4 flex-wrap">
                <span className="section-tag">Palette</span>
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
                  Clear
                </button>
              </div>
            </Section>

            <Section tag="#0.3" label="Privacy" meta="MPC · Arcium">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <PrivacyCard
                  title="Encrypted code"
                  body="Today's secret was generated inside the MPC cluster from cryptographically distributed shares. No party, not the developers, not validators, not the cluster operators, has the plaintext."
                />
                <PrivacyCard
                  title="Encrypted guess"
                  body="Your guess is encrypted to the cluster via x25519 + Rescue cipher before it leaves your browser. The chain stores ciphertext only."
                />
                <PrivacyCard
                  title="Public reveal, only on solve"
                  body="Each guess returns just (exact, misplaced). The full code is revealed by the MPC cluster only after a (4, 0) result triggers claim_solve."
                />
              </div>
            </Section>

            <Section tag="#0.4" label="Symbols" meta="6 colors · 1296 codes">
              <div className="panel p-4 flex flex-wrap gap-3 items-center">
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

            {error ? (
              <div className="panel p-4">
                <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-rose mb-2">
                  Error
                </div>
                <code className="text-[12px] text-text-mute break-all">
                  {error}
                </code>
              </div>
            ) : null}

            {puzzle.state === "Solved" ? (
              <div className="panel p-5 flex items-center gap-4 glow-purple">
                <StatusBadge variant="solved">SOLVED</StatusBadge>
                <span className="text-[14px]">
                  The cluster has revealed today&apos;s code.
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
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

function PrivacyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel p-4">
      <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-accent-soft mb-2">
        {title}
      </div>
      <p className="text-[12.5px] text-text-mute leading-relaxed">{body}</p>
    </div>
  );
}
