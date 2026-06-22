/**
 * Global error-handling middleware.
 *
 * What: Catches thrown errors and returns consistent JSON error bodies.
 * Why: Prevents leaking stack traces in production while aiding debugging in dev.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { config } from '../config';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: ErrorBody = {
      error: {
        code: err.code,
        message: err.message,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  console.error('Unhandled error:', err);

  const body: ErrorBody = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  if (!config.isProduction && err instanceof Error) {
    body.error.details = err.message;
  }

  res.status(500).json(body);
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
}
