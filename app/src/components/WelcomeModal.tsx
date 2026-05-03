"use client";
import { useEffect, useState } from "react";
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
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-8 dotted-bg"
      style={{
        background: "rgba(8, 8, 12, 0.85)",
        backdropFilter: "blur(6px)",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="panel max-w-[480px] w-full p-6 sm:p-7 flex flex-col gap-5 welcome-fade"
        style={{ borderColor: "var(--line-accent)" }}
      >
        <div className="flex items-center gap-2">
          <FlowerMark size={14} />
          <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-accent-soft">
            Welcome to Cryptanalyst
          </span>
        </div>

        <h2 className="text-[22px] leading-[1.15] font-medium tracking-tight">
          Before you play, a quick heads up.
        </h2>

        <ul className="flex flex-col gap-3 text-[13.5px] text-text-mute leading-relaxed">
          <Bullet>
            This runs on <span className="text-text">Solana devnet</span>, a
            free testing network. No real money is at risk.
          </Bullet>
          <Bullet>
            You&apos;ll connect a Solana wallet (Phantom or Solflare) to play.
            We never ask for your seed phrase, only signatures for your
            guesses.
          </Bullet>
          <Bullet>
            Each guess costs a fraction of a cent in devnet SOL for fees.
            Devnet SOL is free from the Solana faucet.
          </Bullet>
          <Bullet>
            Code is open source on{" "}
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

        <div className="hairline-t pt-4 flex items-center gap-3 flex-wrap">
          <button onClick={dismiss} className="btn-primary justify-center">
            Got it, let me play <span aria-hidden>→</span>
          </button>
          <a
            href="/how-to-play"
            className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-mute hover:text-text"
          >
            How to play
          </a>
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
          borderRadius: "50%",
          background: "var(--accent)",
        }}
      />
      <span className="flex-1">{children}</span>
    </li>
  );
}
