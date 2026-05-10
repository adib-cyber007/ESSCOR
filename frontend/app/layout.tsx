import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ESSCOR — Ecosystem Intelligence Platform",
  description:
    "ESSCOR provides real-time liquidity analytics, whale-risk monitoring, and reward-efficiency insights for the Bags.fm creator economy on Solana.",
  keywords: ["Bags.fm", "Solana", "DeFi", "creator economy", "liquidity", "analytics"],
  openGraph: {
    title: "ESSCOR — Ecosystem Intelligence Platform",
    description: "Real-time intelligence for the Bags.fm creator economy.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
