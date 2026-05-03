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
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-8">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="group-hover:[&>svg]:animate-[flower-spin_1.4s_linear_infinite]">
            <FlowerMark size={16} />
          </span>
          <span className="font-mono text-[12px] tracking-[0.18em] uppercase">
            Cryptanalyst
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-5">
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
          <div className="hidden sm:flex items-center gap-3">
            <LoadingFlower
              size={18}
              mode="spin"
              label={connecting ? "Connecting" : "Disconnecting"}
            />
          </div>
        ) : null}
        <div className="shrink-0">
          <ClientOnly
            fallback={
              <button
                className="btn-primary"
                disabled
                style={{ minWidth: 120, justifyContent: "center" }}
              >
                ...
              </button>
            }
          >
            <WalletMultiButton />
          </ClientOnly>
        </div>
      </div>
      <nav className="md:hidden hairline-t flex items-center gap-4 px-4 py-2 overflow-x-auto">
        <NavLink href="/">Today</NavLink>
        <NavLink href="/how-to-play">How to play</NavLink>
        <NavLink href="/leaderboard">Leaderboard</NavLink>
        <a
          href="https://docs.arcium.com/"
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-mute hover:text-text whitespace-nowrap"
        >
          Arcium
        </a>
      </nav>
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
