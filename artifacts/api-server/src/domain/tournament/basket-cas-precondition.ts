/**
 * WEB-005 W6H / A50 — isolated source-only Basket CAS precondition primitive.
 * NOT wired to routes, no database or durable revision. The caller MUST recheck
 * authorization and derive the current server ETag within one serialized DB
 * transaction before invoking this primitive. ETag is never authorization.
 */
import { timingSafeEqual } from 'node:crypto';

export class BasketCasPreconditionError extends Error {
  readonly status: 400 | 412 | 428;
  readonly code: string;
  constructor(status: 400 | 412 | 428, code: string) {
    super(code);
    this.name = 'BasketCasPreconditionError';
    this.status = status;
    this.code = code;
  }
}

// Narrow opaque base64url-style strong token until A00 approves CAS-DEC-02.
// Reject weak validators, wildcards, lists and malformed input; no fallback.
const STRONG_ETAG = /^"[A-Za-z0-9_-]{16,128}"$/;

export function parseBasketIfMatch(value: unknown): string {
  if (value === undefined || value === null) {
    throw new BasketCasPreconditionError(428, 'STAGE_BASKET_IF_MATCH_REQUIRED');
  }
  if (typeof value !== 'string' || !STRONG_ETAG.test(value)) {
    throw new BasketCasPreconditionError(400, 'INVALID_STAGE_BASKET_IF_MATCH');
  }
  return value;
}

export function requireMatchingBasketEtag(ifMatch: unknown, serverEtag: unknown): void {
  const candidate = parseBasketIfMatch(ifMatch);
  // A malformed server-generated validator is an internal invariant failure,
  // not a client stale response and not permission to write.
  if (typeof serverEtag !== 'string' || !STRONG_ETAG.test(serverEtag)) {
    throw new Error('WEB005_BASKET_CAS_SERVER_ETAG_INVALID');
  }
  const received = Buffer.from(candidate);
  const expected = Buffer.from(serverEtag);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new BasketCasPreconditionError(412, 'STAGE_BASKET_CONFIGURATION_STALE');
  }
}
