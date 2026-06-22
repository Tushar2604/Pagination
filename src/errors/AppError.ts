/**
 * Application error types and HTTP mapping.
 *
 * What: Typed errors with status codes for consistent API responses.
 * Why: Separates expected client errors (400) from server faults (500).
 * How it helps: Middleware can format errors uniformly without try/catch in every route.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
