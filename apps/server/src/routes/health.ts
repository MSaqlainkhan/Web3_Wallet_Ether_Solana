import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'aetheris-auxiliary-backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '0.1.0',
    auditNotice: 'Auxiliary routing service. Does not custody private keys or execute raw signing.',
  });
});
