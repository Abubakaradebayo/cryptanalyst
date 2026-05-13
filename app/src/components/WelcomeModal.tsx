"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FlowerMark } from "./FlowerMark";

const STORAGE_KEY = "cryptanalyst:welcomed";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {}
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-8"
      style={{
        background: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(4px)",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="board-panel max-w-[500px] w-full p-5 sm:p-6 flex flex-col gap-5 welcome-fade"
        style={{ borderColor: "var(--line-accent)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FlowerMark size={14} />
            <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-accent-soft">
              Cryptanalyst
            </span>
          </div>
          <span className="chip chip-mute">devnet</span>
        </div>

        <h2 className="text-[21px] sm:text-[24px] leading-[1.12] font-normal">
          A quick note before the first move.
        </h2>

        <ul className="flex flex-col gap-3 text-[13px] text-text-mute leading-relaxed">
          <Bullet>
            This runs on <span className="text-text">Solana devnet</span>. No
            real money is at risk.
          </Bullet>
          <Bullet>
            You&apos;ll connect a wallet to play. Cryptanalyst only asks for
            signatures, never your seed phrase.
          </Bullet>
          <Bullet>
            Every move is submitted onchain and evaluated by Arcium MPC.
          </Bullet>
          <Bullet>
            The code is open source on{" "}
            <a
              href="https://github.com/Abubakaradebayo/cryptanalyst"
              target="_blank"
              rel="noreferrer"
              className="text-accent-soft hover:text-accent underline-offset-2 hover:underline"
            >
              GitHub
            </a>
            . Read it before you connect if you want.
          </Bullet>
        </ul>

        <div className="control-strip p-3 flex items-center gap-3 flex-wrap">
          <button onClick={dismiss} className="btn-primary justify-center">
            Start playing <span aria-hidden>→</span>
          </button>
          <Link
            href="/how-to-play"
            onClick={dismiss}
            className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-mute hover:text-accent"
          >
            How to play
          </Link>
        </div>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-[7px] block shrink-0"
        style={{
          width: 5,
          height: 5,
          background: "var(--accent)",
        }}
      />
      <span className="flex-1">{children}</span>
    </li>
  );
}
