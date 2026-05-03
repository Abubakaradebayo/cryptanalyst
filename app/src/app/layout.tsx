import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { WelcomeModal } from "@/components/WelcomeModal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  weight: ["400", "500", "600"],
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Cryptanalyst - Daily MPC Cipher",
  description:
    "Wordle, but provably fair via MPC. The daily code is generated inside the Arcium cluster. Nobody knows the answer until someone solves it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen">
        <WalletProvider>
          {children}
          <WelcomeModal />
        </WalletProvider>
      </body>
    </html>
  );
}
