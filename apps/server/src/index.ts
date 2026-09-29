import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health.js';
import { pricesRouter } from './routes/prices.js';
import { quotesRouter } from './routes/quotes.js';
import { zkRouter } from './routes/zk.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Strict rate limiter: max 120 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

app.use('/api', apiLimiter);

// Route registrations
app.use('/api/health', healthRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/zk', zkRouter);

// Start server if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Aetheris Backend] Auxiliary service listening on http://localhost:${PORT}`);
  });
}

export default app;
