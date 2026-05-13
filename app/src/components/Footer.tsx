import Link from "next/link";
import { FlowerMark } from "./FlowerMark";

export function Footer() {
  return (
    <footer className="hairline-t mt-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 flex items-center gap-3 text-[12px] text-text-dim flex-wrap">
        <FlowerMark size={11} />
        <span className="font-mono tracking-[0.14em] uppercase">
          Powered by Arcium MPC · Solana
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-4 font-mono tracking-[0.14em] uppercase">
          <a
            href="https://github.com/Abubakaradebayo/cryptanalyst"
            target="_blank"
            rel="noreferrer"
            className="hover:text-text"
          >
            GitHub
          </a>
          <a
            href="https://x.com/Arcium"
            target="_blank"
            rel="noreferrer"
            className="hover:text-text"
          >
            Arcium
          </a>
          <Link href="/how-to-play" className="hover:text-text">
            How to play
          </Link>
        </div>
      </div>
    </footer>
  );
}
