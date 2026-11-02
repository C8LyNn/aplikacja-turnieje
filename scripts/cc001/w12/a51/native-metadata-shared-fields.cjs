#!/usr/bin/env node
'use strict';
/**
 * A51 W12 — compare only fields emitted by BOTH native trace producers.
 * The selected W11 QA-freeze candidate emits A41 W10 host fields with
 * `chunks`, but its A41 W10 client marker does NOT emit `chunks`.
 * A31 F1 TX/RX markers both emit chunks. Missing-unobservable != mismatch.
 * This is metadata comparison, NOT full state parity or G3 certification.
 */
const COMMON = Object.freeze(['actionSerial', 'turn', 'phase']);
const OPTIONAL = Object.freeze(['chunks', 'balls']);
function sharedFieldMismatches(host, client) {
  if (!host || !client || !Number.isSafeInteger(host.revision) ||
      !Number.isSafeInteger(client.revision) || host.revision !== client.revision)
    throw new TypeError('Expected paired rows with matching integer revisions');
  const problems = [];
  for (const key of [...COMMON, ...OPTIONAL]) {
    const h = host[key], c = client[key];
    // The upstream A51 trace parser validates mandatory fields before pairing.
    // Optional fields absent on one side cannot be asserted equal or unequal.
    if (OPTIONAL.includes(key) && (h === null || h === undefined || c === null || c === undefined))
      continue;
    if (h !== c) problems.push({field:key,host:h,client:c});
  }
  return problems;
}
module.exports = {sharedFieldMismatches};
