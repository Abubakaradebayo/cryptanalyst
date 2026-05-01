"use client";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { FlowerMark } from "./FlowerMark";
import { LoadingFlower } from "./LoadingFlower";
import { ClientOnly } from "./ClientOnly";

export function Header() {
  const { connecting, disconnecting } = useWallet();
  const walletBusy = connecting || disconnecting;

  return (
    <header className="hairline-b">
      <div className="max-w-[1240px] mx-auto px-6 py-4 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="group-hover:[&>svg]:animate-[flower-spin_1.4s_linear_infinite]">
            <FlowerMark size={16} />
          </span>
          <span className="font-mono text-[12px] tracking-[0.18em] uppercase">
            Cryptanalyst
          </span>
        </Link>
        <nav className="flex items-center gap-5">
          <NavLink href="/">Today</NavLink>
          <NavLink href="/how-to-play">How to play</NavLink>
          <NavLink href="/leaderboard">Leaderboard</NavLink>
          <a
            href="https://docs.arcium.com/"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-mute hover:text-text"
          >
            Arcium
          </a>
        </nav>
        <div className="flex-1" />
        {walletBusy ? (
          <div className="flex items-center gap-3">
            <LoadingFlower
              size={18}
              mode="spin"
              label={connecting ? "Connecting" : "Disconnecting"}
            />
          </div>
        ) : null}
        <ClientOnly
          fallback={
            <button
              className="btn-primary"
              disabled
              style={{ width: 160, justifyContent: "center" }}
            >
              ...
            </button>
          }
        >
          <WalletMultiButton />
        </ClientOnly>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      prefetch
      className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-mute hover:text-text transition-colors"
    >
      {children}
    </Link>
  );
}
