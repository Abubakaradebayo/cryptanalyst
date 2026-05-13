import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { WelcomeModal } from "@/components/WelcomeModal";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Cryptanalyst - Daily MPC Cipher",
  description:
    "Wordle, but provably fair via MPC. The daily code is generated inside the Arcium cluster. Nobody knows the answer until someone solves it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceMono.variable}>
      <body className="min-h-screen">
        <WalletProvider>
          {children}
          <WelcomeModal />
        </WalletProvider>
      </body>
    </html>
  );
}
