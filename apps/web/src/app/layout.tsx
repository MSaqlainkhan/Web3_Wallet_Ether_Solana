import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aetheris Wallet | Non-Custodial Multi-Chain Sovereign Wallet',
  description:
    'Production-grade, non-custodial multi-chain cryptocurrency wallet supporting EVM and Solana with client-side WebCrypto encryption and testnet-first posture.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-obsidian-950 text-slate-100 antialiased selection:bg-brand-emerald selection:text-obsidian-950">
        {children}
      </body>
    </html>
  );
}
