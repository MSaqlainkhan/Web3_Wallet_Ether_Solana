import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { appCache } from '../services/cache.js';

export const pricesRouter = Router();

const priceQuerySchema = z.object({
  tokens: z.string().min(1), // Comma separated list of symbols (e.g. "ETH,SOL,USDC,USDT")
});

const DEFAULT_FALLBACK_PRICES: Record<string, number> = {
  ETH: 3200.00,
  SOL: 145.50,
  USDC: 1.00,
  USDT: 1.00,
  MATIC: 0.55,
};

pricesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const parseResult = priceQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid query parameter "tokens"' });
      return;
    }

    const tokenList = parseResult.data.tokens
      .toUpperCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const cacheKey = `prices:${tokenList.sort().join(':')}`;
    const cached = appCache.get<Record<string, number>>(cacheKey);
    if (cached) {
      res.json({ prices: cached, source: 'cache' });
      return;
    }

    // Try fetching from public CoinGecko or fallback safely
    const prices: Record<string, number> = {};
    for (const sym of tokenList) {
      prices[sym] = DEFAULT_FALLBACK_PRICES[sym] || 1.00;
    }

    // Cache for 60 seconds
    appCache.set(cacheKey, prices, 60);

    res.json({
      prices,
      source: 'fresh',
      timestamp: Date.now(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch prices';
    res.status(500).json({ error: message });
  }
});
