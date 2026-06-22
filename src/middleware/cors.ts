/**
 * Lightweight CORS middleware for browser clients that call the API directly.
 * Not required when the frontend proxies via Next.js rewrites on Vercel.
 */

import { Request, Response, NextFunction } from 'express';

function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? process.env.FRONTEND_URL ?? '';
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin;

  if (origin) {
    const isAllowed =
      allowedOrigins.length === 0 ||
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin);

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}
