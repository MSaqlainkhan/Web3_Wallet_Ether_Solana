import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SwapQuote } from '@aetheris/common';
import { appCache } from '../services/cache.js';

export const quotesRouter = Router();

const quoteRequestSchema = z.object({
  networkId: z.string().min(1),
  fromTokenSymbol: z.string().min(1),
  toTokenSymbol: z.string().min(1),
  fromAmount: z.string().min(1), // Atomic units
  slippageBps: z.coerce.number().min(5).max(5000).default(50), // 50 bps = 0.5%
  userAddress: z.string().optional(),
});

quotesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const parseResult = quoteRequestSchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid swap quote parameters', details: parseResult.error.format() });
      return;
    }

    const { networkId, fromTokenSymbol, toTokenSymbol, fromAmount, slippageBps } = parseResult.data;

    // Cache key for identical requests within 10s
    const cacheKey = `quote:${networkId}:${fromTokenSymbol}:${toTokenSymbol}:${fromAmount}:${slippageBps}`;
    const cached = appCache.get<SwapQuote>(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.json({ quote: cached, source: 'cache' });
      return;
    }

    // Determine exchange rates (simulated/real)
    const rates: Record<string, number> = {
      ETH: 3200,
      SOL: 145,
      USDC: 1,
      USDT: 1,
    };

    const fromRate = rates[fromTokenSymbol.toUpperCase()] || 1;
    const toRate = rates[toTokenSymbol.toUpperCase()] || 1;
    const exchangeRate = fromRate / toRate;

    // Calculate atomic units conversion
    // Standard decimals: ETH 18, SOL 9, USDC 6, USDT 6
    const decimalsMap: Record<string, number> = {
      ETH: 18,
      SOL: 9,
      USDC: 6,
      USDT: 6,
    };

    const fromDecimals = decimalsMap[fromTokenSymbol.toUpperCase()] || 18;
    const toDecimals = decimalsMap[toTokenSymbol.toUpperCase()] || 18;

    const fromAmountNumeric = Number(fromAmount) / Math.pow(10, fromDecimals);
    const estimatedToAmountNumeric = fromAmountNumeric * exchangeRate;
    const minimumToAmountNumeric = estimatedToAmountNumeric * (1 - slippageBps / 10000);

    const toAmountAtomic = BigInt(Math.floor(estimatedToAmountNumeric * Math.pow(10, toDecimals))).toString();
    const minToAmountAtomic = BigInt(Math.floor(minimumToAmountNumeric * Math.pow(10, toDecimals))).toString();

    const provider = networkId.startsWith('solana') ? 'jupiter' : '0x';

    const quote: SwapQuote = {
      provider: provider as '0x' | 'jupiter',
      networkId,
      fromToken: {
        symbol: fromTokenSymbol,
        name: fromTokenSymbol,
        decimals: fromDecimals,
        isNative: fromTokenSymbol === 'ETH' || fromTokenSymbol === 'SOL',
        balanceRaw: fromAmount,
        balanceFormatted: fromAmountNumeric.toFixed(4),
      },
      toToken: {
        symbol: toTokenSymbol,
        name: toTokenSymbol,
        decimals: toDecimals,
        isNative: toTokenSymbol === 'ETH' || toTokenSymbol === 'SOL',
        balanceRaw: '0',
        balanceFormatted: estimatedToAmountNumeric.toFixed(4),
      },
      fromAmount,
      toAmount: toAmountAtomic,
      minimumToAmount: minToAmountAtomic,
      priceImpactPercent: 0.05,
      slippageBps,
      estimatedGasFeeUsd: networkId.startsWith('solana') ? 0.001 : 1.85,
      routeSummary: `${fromTokenSymbol} → ${provider.toUpperCase()} Route → ${toTokenSymbol}`,
      expiresAt: Date.now() + 30_000, // 30 seconds expiry
    };

    appCache.set(cacheKey, quote, 15);
    res.json({ quote, source: 'live' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generating swap quote';
    res.status(500).json({ error: message });
  }
});
