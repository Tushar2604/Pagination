/**
 * Cursor encode/decode for keyset pagination.
 *
 * What: Serializes (createdAt, id) into an opaque base64url token for clients.
 * Why: Hides internal tuple structure while remaining deterministic server-side.
 * How it helps: Clients pass back an exact position in the sort order without OFFSET.
 */

import { randomUUID } from 'node:crypto';

export interface PaginationCursor {
  createdAt: Date;
  id: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class InvalidCursorError extends Error {
  constructor(message = 'Invalid cursor') {
    super(message);
    this.name = 'InvalidCursorError';
  }
}

export function encodeCursor(cursor: PaginationCursor): string {
  const payload = JSON.stringify({
    c: cursor.createdAt.toISOString(),
    i: cursor.id,
  });
  return Buffer.from(payload, 'utf8').toString('base64url');
}

export function decodeCursor(raw: string): PaginationCursor {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new InvalidCursorError('Cursor is not valid base64url');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new InvalidCursorError('Cursor payload is not valid JSON');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('c' in parsed) ||
    !('i' in parsed) ||
    typeof (parsed as { c: unknown }).c !== 'string' ||
    typeof (parsed as { i: unknown }).i !== 'string'
  ) {
    throw new InvalidCursorError('Cursor payload has an unexpected shape');
  }

  const { c, i } = parsed as { c: string; i: string };

  if (!UUID_REGEX.test(i)) {
    throw new InvalidCursorError('Cursor id is not a valid UUID');
  }

  const createdAt = new Date(c);
  if (Number.isNaN(createdAt.getTime())) {
    throw new InvalidCursorError('Cursor createdAt is not a valid timestamp');
  }

  return { createdAt, id: i };
}

/** Test helper: build a cursor without going through encode/decode round-trip. */
export function cursorFromParts(createdAt: Date, id: string = randomUUID()): string {
  return encodeCursor({ createdAt, id });
}
