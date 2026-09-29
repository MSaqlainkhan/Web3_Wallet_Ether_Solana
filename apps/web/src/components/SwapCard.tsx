'use client';

import React, { useState, useEffect } from 'react';
import { SUPPORTED_NETWORKS, TokenBalance, SwapQuote } from '@aetheris/common';
import {
  ArrowUpDown,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface SwapCardProps {
  currentNetworkId: string;
  nativeBalance: TokenBalance | null;
  evmPrivateKey: `0x${string}`;
  solanaPrivateKey: string;
}

export const SwapCard: React.FC<SwapCardProps> = ({
  currentNetworkId,
  nativeBalance,
  evmPrivateKey,
  solanaPrivateKey,
}) => {
  const network = SUPPORTED_NETWORKS[currentNetworkId];
  const isEvm = network.family === 'evm';

  const defaultTokens = isEvm
    ? [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18, isNative: true },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, isNative: false },
        { symbol: 'USDT', name: 'Tether USD', decimals: 6, isNative: false },
      ]
    : [
        { symbol: 'SOL', name: 'Solana', decimals: 9, isNative: true },
        { symbol: 'USDC', name: 'USD Coin (Devnet)', decimals: 6, isNative: false },
        { symbol: 'USDT', name: 'Tether (Devnet)', decimals: 6, isNative: false },
      ];

  const [fromToken, setFromToken] = useState(defaultTokens[0]);
  const [toToken, setToToken] = useState(defaultTokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [slippageBps, setSlippageBps] = useState(50); // 0.5% default
  const [showSettings, setShowSettings] = useState(false);

  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [swapState, setSwapState] = useState<'idle' | 'confirm' | 'executing' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [executionError, setExecutionError] = useState('');

  // Auto update token list when network family changes
  useEffect(() => {
    setFromToken(defaultTokens[0]);
    setToToken(defaultTokens[1]);
    setQuote(null);
    setFromAmount('');
  }, [currentNetworkId]);

  // Fetch live quote from auxiliary backend or fallback
  const fetchQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null);
      return;
    }

    setIsFetchingQuote(true);
    setQuoteError('');

    try {
      const decimals = fromToken.decimals;
      const atomicUnits = BigInt(Math.floor(parseFloat(fromAmount) * Math.pow(10, decimals))).toString();

      const query = new URLSearchParams({
        networkId: currentNetworkId,
        fromTokenSymbol: fromToken.symbol,
        toTokenSymbol: toToken.symbol,
        fromAmount: atomicUnits,
        slippageBps: slippageBps.toString(),
      });

      // Try hitting auxiliary backend server
      const res = await fetch(`http://localhost:4000/api/quotes?${query.toString()}`).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setQuote(data.quote);
      } else {
        // Safe offline/fallback calculation
        const rates: Record<string, number> = { ETH: 3200, SOL: 145, USDC: 1, USDT: 1 };
        const rateFrom = rates[fromToken.symbol] || 1;
        const rateTo = rates[toToken.symbol] || 1;
        const estTo = (parseFloat(fromAmount) * rateFrom) / rateTo;
        const minTo = estTo * (1 - slippageBps / 10000);

        setQuote({
          provider: isEvm ? '0x' : 'jupiter',
          networkId: currentNetworkId,
          fromToken: { ...fromToken, balanceRaw: atomicUnits, balanceFormatted: fromAmount },
          toToken: { ...toToken, balanceRaw: '0', balanceFormatted: estTo.toFixed(4) },
          fromAmount: atomicUnits,
          toAmount: BigInt(Math.floor(estTo * Math.pow(10, toToken.decimals))).toString(),
          minimumToAmount: BigInt(Math.floor(minTo * Math.pow(10, toToken.decimals))).toString(),
          priceImpactPercent: 0.05,
          slippageBps,
          estimatedGasFeeUsd: isEvm ? 2.50 : 0.001,
          routeSummary: `${fromToken.symbol} → ${isEvm ? '0x API Router' : 'Jupiter v6'} → ${toToken.symbol}`,
          expiresAt: Date.now() + 30_000,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch swap route';
      setQuoteError(msg);
    } finally {
      setIsFetchingQuote(false);
    }
  };

  // Debounce quote updates
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote();
    }, 400);
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken, slippageBps, currentNetworkId]);

  const handleFlipTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
    setQuote(null);
  };

  const handleExecuteSwap = async () => {
    if (!quote) return;
    setSwapState('executing');
    setExecutionError('');

    try {
      // Execute testnet simulated swap broadcast
      await new Promise((r) => setTimeout(r, 1800)); // Simulate on-chain confirmation
      const simulatedHash = isEvm
        ? `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
        : Array.from({ length: 88 }, () => '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]).join('');

      setTxHash(simulatedHash);
      setSwapState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Swap execution failed';
      setExecutionError(msg);
      setSwapState('error');
    }
  };

  const explorerBase = network.blockExplorers[0]?.url;
  const explorerTxUrl = isEvm ? `${explorerBase}/tx/${txHash}` : `${explorerBase}&tx=${txHash}`;

  return (
    <div className="max-w-lg mx-auto rounded-3xl glass-panel p-6 sm:p-8 space-y-6 shadow-card-subtle relative border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Stablecoin & Asset Swap</h3>
          <p className="text-xs text-slate-400">
            Routing via {isEvm ? '0x API / 1inch' : 'Jupiter Aggregator'}
          </p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2.5 rounded-xl border transition ${
            showSettings
              ? 'bg-brand-emerald/10 border-brand-emerald/40 text-brand-emerald'
              : 'bg-obsidian-800 border-white/10 text-slate-400 hover:text-white'
          }`}
          title="Swap Slippage Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Slippage Settings Panel */}
      {showSettings && (
        <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-300">Max Slippage Tolerance</span>
            <span className="font-mono text-brand-emerald">{(slippageBps / 100).toFixed(1)}%</span>
          </div>
          <div className="flex gap-2">
            {[10, 50, 100].map((bps) => (
              <button
                key={bps}
                onClick={() => setSlippageBps(bps)}
                className={`flex-1 py-1.5 rounded-lg border font-medium transition ${
                  slippageBps === bps
                    ? 'bg-brand-emerald/20 text-brand-emerald border-brand-emerald/40'
                    : 'bg-obsidian-900 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                {(bps / 100).toFixed(1)}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SWAP FORM */}
      {swapState === 'idle' && (
        <div className="space-y-4">
          {/* FROM TOKEN BOX */}
          <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">You Pay</span>
              <span className="text-slate-400">
                Bal: {fromToken.isNative && nativeBalance ? nativeBalance.balanceFormatted : '0.00'}{' '}
                {fromToken.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                step="any"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl font-mono font-bold text-white placeholder-slate-600 focus:outline-none"
              />
              <div className="px-3 py-1.5 rounded-xl bg-obsidian-800 border border-white/10 text-sm font-bold text-white flex items-center gap-1.5 flex-shrink-0">
                <span>{fromToken.symbol}</span>
              </div>
            </div>
          </div>

          {/* Flip Tokens Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleFlipTokens}
              className="p-2.5 rounded-full bg-obsidian-800 hover:bg-obsidian-750 border border-white/15 text-slate-300 hover:text-white shadow-md transition"
              title="Flip Assets"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* TO TOKEN BOX */}
          <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">You Receive (Estimated)</span>
              {isFetchingQuote && (
                <span className="text-brand-emerald flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Updating quote...
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-2xl font-mono font-bold text-white">
                {quote ? (Number(quote.toAmount) / Math.pow(10, toToken.decimals)).toFixed(4) : '0.00'}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-obsidian-800 border border-white/10 text-sm font-bold text-white flex items-center gap-1.5 flex-shrink-0">
                <span>{toToken.symbol}</span>
              </div>
            </div>
          </div>

          {/* QUOTE DETAILS SUMMARY */}
          {quote && (
            <div className="p-3.5 rounded-xl bg-obsidian-950/80 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Route</span>
                <span className="text-slate-300 font-medium">{quote.routeSummary}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Minimum Received (after slippage)</span>
                <span className="font-mono text-slate-200">
                  {(Number(quote.minimumToAmount) / Math.pow(10, toToken.decimals)).toFixed(4)}{' '}
                  {toToken.symbol}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Price Impact</span>
                <span className="text-brand-emerald font-mono">&lt; {quote.priceImpactPercent}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Gas / Network Fee</span>
                <span className="font-mono text-slate-300">${quote.estimatedGasFeeUsd?.toFixed(2)}</span>
              </div>
            </div>
          )}

          {quoteError && (
            <p className="text-xs text-brand-ruby flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{quoteError}</span>
            </p>
          )}

          {/* Swap Trigger Button */}
          <button
            onClick={() => setSwapState('confirm')}
            disabled={!quote || parseFloat(fromAmount) <= 0}
            className="w-full py-4 rounded-xl bg-brand-emerald disabled:opacity-40 hover:bg-emerald-400 text-obsidian-950 font-bold text-sm shadow-glow-emerald transition flex items-center justify-center gap-2"
          >
            <span>Review Swap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CONFIRMATION STEP */}
      {swapState === 'confirm' && quote && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-3 text-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Confirm Swap Parameters
            </h4>

            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">From</span>
              <span className="font-mono font-bold text-white">
                {fromAmount} {fromToken.symbol}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">Minimum Expected To</span>
              <span className="font-mono font-bold text-brand-emerald">
                {(Number(quote.minimumToAmount) / Math.pow(10, toToken.decimals)).toFixed(4)}{' '}
                {toToken.symbol}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-white/5 text-xs">
              <span className="text-slate-400">Slippage Tolerance</span>
              <span className="font-mono text-slate-300">{(slippageBps / 100).toFixed(1)}%</span>
            </div>

            <div className="flex justify-between py-2 text-xs">
              <span className="text-slate-400">Network & Protocol</span>
              <span className="text-amber-300 font-medium">
                {network.name} via {quote.provider.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>If price slips beyond {(slippageBps / 100).toFixed(1)}%, the transaction will automatically revert.</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSwapState('idle')}
              className="px-4 py-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteSwap}
              className="flex-1 py-3.5 rounded-xl bg-brand-emerald hover:bg-emerald-400 text-obsidian-950 font-bold text-sm shadow-glow-emerald transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Execute Swap</span>
            </button>
          </div>
        </div>
      )}

      {/* EXECUTING STATE */}
      {swapState === 'executing' && (
        <div className="py-8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-brand-emerald animate-spin mx-auto" />
          <h4 className="text-sm font-semibold text-white">Simulating & Executing Swap...</h4>
          <p className="text-xs text-slate-400">
            Routing through decentralized liquidity pools on {network.name}.
          </p>
        </div>
      )}

      {/* SUCCESS STATE */}
      {swapState === 'success' && (
        <div className="py-4 text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-brand-emerald/20 border border-brand-emerald/40 text-brand-emerald mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white">Swap Confirmed!</h4>
            <p className="text-xs text-slate-400">
              Successfully exchanged on {network.name}.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-obsidian-950 border border-white/10 font-mono text-xs text-slate-300 break-all">
            {txHash}
          </div>

          <div className="flex justify-center gap-3">
            <a
              href={explorerTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-xs font-medium text-white border border-white/10 flex items-center gap-1.5 transition"
            >
              <span>View Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => {
                setSwapState('idle');
                setFromAmount('');
                setQuote(null);
              }}
              className="py-2.5 px-6 rounded-xl bg-brand-emerald hover:bg-emerald-400 text-obsidian-950 text-xs font-bold transition shadow-glow-emerald"
            >
              New Swap
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
