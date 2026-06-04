import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { WelcomeModal } from "@/components/WelcomeModal";
import { CryptoBackground } from "@/components/CryptoBackground";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

const siteUrl = "https://cryptanalyst.vercel.app";
const siteTitle = "Cryptanalyst - Crack today's sealed code";
const siteDescription =
  "Guess the 4-color code in 10 tries. The answer is sealed inside Arcium's MPC network. Nobody can read it until someone solves it.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: "Cryptanalyst",
  authors: [{ name: "Abdulsalam Abubakar" }],
  keywords: [
    "Arcium",
    "MPC",
    "Solana",
    "Mastermind",
    "encrypted",
    "puzzle",
    "code-breaking",
    "onchain game",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName: "Cryptanalyst",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    creator: "@Arcium",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceMono.variable}>
      <body className="min-h-screen">
        <CryptoBackground />
        <div className="relative z-10 min-h-screen">
          <WalletProvider>
            {children}
            <WelcomeModal />
          </WalletProvider>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
