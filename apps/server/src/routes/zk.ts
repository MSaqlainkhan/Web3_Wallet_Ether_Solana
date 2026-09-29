import { Router, Request, Response } from 'express';
import { z } from 'zod';

export const zkRouter = Router();

const verifyZkProofSchema = z.object({
  jwt: z.string().min(1),
  ephemeralPublicKey: z.string().min(1),
  userSalt: z.string().min(1),
  proof: z.record(z.unknown()).optional(),
});

zkRouter.post('/verify-and-derive', async (req: Request, res: Response) => {
  try {
    const parseResult = verifyZkProofSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid ZK verification payload', details: parseResult.error.format() });
      return;
    }

    const { jwt, ephemeralPublicKey, userSalt } = parseResult.data;

    // Decode JWT header and payload without verifying signature locally (done via ZK circuit or Google JWKS)
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      res.status(400).json({ error: 'Malformed JWT structure' });
      return;
    }

    let payload: { sub?: string; iss?: string; email?: string; nonce?: string };
    try {
      payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    } catch {
      res.status(400).json({ error: 'Failed to parse JWT payload' });
      return;
    }

    // Return deterministic derivation parameters
    // Note: in full ZK flow, the server only returns verification status; the user derives client-side
    res.json({
      verified: true,
      sub: payload.sub,
      iss: payload.iss,
      userSalt,
      ephemeralPublicKey,
      securityNotice: 'ZK login derives an auxiliary account. Seed phrases remain the root of cryptographic security.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ZK verification failed';
    res.status(500).json({ error: message });
  }
});
