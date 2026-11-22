import type { RequestHandler } from "express";

/**
 * RC-6 (security): request bodies reach zod 3 validators, which record one issue object for every failing array
 * element and echo them as one JSON string (GHSA-mrhx-c7xc-m3w5). A 3.8 MB public body with 2 million array elements
 * cost ~2 GB of memory and a 461 MB response. Real requests stay far below this cap: the largest legitimate body, a
 * full tournament backup (≤ 4 MB of mostly objects), holds tens of thousands of array elements.
 */
export const MAX_JSON_ARRAY_ELEMENTS = 200_000;

/** Core Clash (CC-001) validates its own payloads and never reaches zod; its routes keep their exact behaviour. */
const EXEMPT_PREFIXES = ["/api/core-clash/"];

/** Total number of array elements anywhere in a parsed body; stops counting once `limit` is exceeded. */
export function countJsonArrayElements(value: unknown, limit = MAX_JSON_ARRAY_ELEMENTS): number {
  let count = 0;
  const stack: unknown[] = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === null || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      count += current.length;
      if (count > limit) return count;
      for (const item of current) if (item !== null && typeof item === "object") stack.push(item);
    } else {
      for (const item of Object.values(current)) if (item !== null && typeof item === "object") stack.push(item);
    }
  }
  return count;
}

export const rejectOversizedJsonArrays: RequestHandler = (req, res, next) => {
  if (EXEMPT_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
    next();
    return;
  }
  if (req.body !== null && typeof req.body === "object"
    && countJsonArrayElements(req.body) > MAX_JSON_ARRAY_ELEMENTS) {
    res.status(413).type("application/json").json({
      error: "Treść żądania zawiera zbyt wiele elementów.",
      code: "REQUEST_TOO_COMPLEX",
    });
    return;
  }
  next();
};

/** At most this many validation issues are echoed back to the client. */
export const MAX_ECHOED_VALIDATION_ISSUES = 20;

/**
 * The validation message sent to the client. Identical to `error.message` for up to 20 issues (every real form
 * mistake); longer lists are cut so one request cannot make the server build and send a huge string.
 */
export function validationErrorText(error: { readonly issues: readonly unknown[]; readonly message: string }): string {
  if (error.issues.length <= MAX_ECHOED_VALIDATION_ISSUES) return error.message;
  const shown = JSON.stringify(error.issues.slice(0, MAX_ECHOED_VALIDATION_ISSUES), null, 2);
  return `${shown}\n(+${error.issues.length - MAX_ECHOED_VALIDATION_ISSUES} more validation issues)`;
}
