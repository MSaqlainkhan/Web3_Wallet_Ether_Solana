'use client';

import { useEffect, useState } from 'react';
import { SUPPORTED_NETWORKS, TokenBalance } from '@aetheris/common';
import { ShieldAlert } from 'lucide-react';
import { TestnetBanner } from '@/components/TestnetBanner';
import { BalanceCard } from '@/components/BalanceCard';
import { SecurityChecklistCard } from '@/components/SecurityChecklistCard';

const MAINNET = 'ethereum-mainnet';
const ADDRESS = '0x' + '2'.repeat(40);
const EMPTY_BALANCE: TokenBalance | null = null;

const noop = () => {};

export default function Preview() {
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    const out: string[] = [];
    const check = (label: string, cond: boolean) => out.push(`${label}: ${cond}`);

    const titles = Array.from(document.querySelectorAll<HTMLElement>('[class~="leading-snug"]'));
    titles.forEach((el) => {
      const rect = el.getBoundingClientRect();
      check(`title width>${el.textContent?.slice(0, 12)} >15px`, rect.width > 15);
      check(`title ${el.textContent?.slice(0, 16)} break-normal`, el.classList.contains('break-normal'));
      check(`title ${el.textContent?.slice(0, 16)} not break-all`, !el.classList.contains('break-all'));
      check(`title ${el.textContent?.slice(0, 16)} not break-words`, !el.classList.contains('break-words'));
    });

    const titles2 = Array.from(document.querySelectorAll<HTMLElement>('[class~="leading-snug"]'));
    const badges = Array.from(document.querySelectorAll<HTMLElement>('[class~="text-[10px]"][class~="uppercase"]'));
    badges.forEach((badge) => {
      const br = badge.getBoundingClientRect();
      const overlap = titles2.some((t) => {
        const tr = t.getBoundingClientRect();
        return !(br.right < tr.left || br.left > tr.right || br.bottom < tr.top || br.top > tr.bottom);
      });
      const below = titles2.every((t) => {
        const tr = t.getBoundingClientRect();
        return br.top >= tr.bottom - 2;
      });
      check(`badge ${badge.textContent?.slice(0, 12)} no title overlap`, !overlap);
      check(`badge ${badge.textContent?.slice(0, 12)} on its own line`, below);
    });

    check('no horizontal scroll', document.documentElement.scrollWidth <= window.innerWidth + 8);

    const cards = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[class~="h-full"][class~="min-w-0"][class~="overflow-hidden"][class~="rounded-2xl"][class~="border"][class~="p-4"]'
      )
    );
    if (cards.length) {
      const heights = cards.map((c) => c.offsetHeight);
      check('equal card heights', Math.max(...heights) - Math.min(...heights) <= 2);
      check('card count', cards.length === 4);
    }

    const banner = document.querySelector('[class~="bg-gradient-to-r"]');
    check('mainnet banner present', !!banner && banner?.textContent.includes('UNAUDITED'));
    check(
      'banner has en dash',
      !!banner && /UNAUDITED – use testnets only/.test(banner?.textContent ?? '')
    );

    const chip = document.querySelector('[class~="font-mono"][class~="uppercase"]:not([class~="bg-gradient"])');
    check('UNAUDITED chip present', !!chip && /UNAUDITED/.test(chip?.textContent ?? ''));
    check('chip text exact', !!chip && chip?.textContent === 'UNAUDITED');

    const swapBanner = document.querySelector('.swap-banner');
    check('swap tab banner present', !!swapBanner);
    check(
      'swap banner exact message',
      !!swapBanner && swapBanner.textContent.includes('Mainnet transactions are disabled until the external security audit is completed.')
    );

    setResults(out);
  }, []);

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <TestnetBanner currentNetworkId={MAINNET} />
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <BalanceCard
              currentNetworkId={MAINNET}
              address={ADDRESS}
              nativeBalance={EMPTY_BALANCE}
              isLoadingBalance={false}
              onRefreshBalance={noop}
              onOpenSend={noop}
              onOpenReceive={noop}
              onOpenSwap={noop}
              onOpenDepositWithdraw={noop}
            />
          </div>
          <div className="min-w-0 space-y-6">
            <SecurityChecklistCard />
          </div>
        </div>
        <div className="swap-banner mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>UNAUDITED – Mainnet transactions are disabled until the external security audit is completed.</span>
        </div>
        <pre id="audit-results" className="text-xs mt-4 text-slate-300">
          {results.join('\n')}
        </pre>
      </div>
    </div>
  );
}
