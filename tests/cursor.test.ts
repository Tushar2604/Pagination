/**
 * Unit tests for cursor encoding/decoding.
 */

import { describe, expect, it } from 'vitest';
import { cursorFromParts, decodeCursor, encodeCursor, InvalidCursorError } from '../src/utils/cursor';

describe('cursor utils', () => {
  it('round-trips createdAt and id', () => {
    const createdAt = new Date('2024-06-01T12:00:00.000Z');
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const token = encodeCursor({ createdAt, id });
    const decoded = decodeCursor(token);
    expect(decoded.id).toBe(id);
    expect(decoded.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it('rejects malformed tokens', () => {
    expect(() => decodeCursor('%%%')).toThrow(InvalidCursorError);
    expect(() => decodeCursor(cursorFromParts(new Date(), 'not-a-uuid'))).toThrow();
  });
});
