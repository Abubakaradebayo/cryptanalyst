import { FlowerMark } from "./FlowerMark";

export function Footer() {
  return (
    <footer className="hairline-t mt-16">
      <div className="max-w-[1240px] mx-auto px-6 py-6 flex items-center gap-3 text-[12px] text-text-dim">
        <FlowerMark size={11} />
        <span className="font-mono tracking-[0.14em] uppercase">
          Powered by Arcium MPC · Solana
        </span>
        <div className="flex-1" />
        <span className="font-mono tracking-[0.14em] uppercase">
          Submission · RTG / Hidden-Information Games
        </span>
      </div>
    </footer>
  );
}
