import type { Express, Request } from "express";
import { isIP } from "node:net";

const SAFE_PROXY_NAME = "loopback";

// Deliberately conservative: trust the specific reverse proxy rather than a
// large provider/cloud network. Operators should split broad ranges into the
// smallest subnet(s) containing only their controlled reverse proxy peers.
const MIN_IPV4_PREFIX = 8;
const MIN_IPV6_PREFIX = 16;
const MIN_MAPPED_IPV6_PREFIX = 96 + MIN_IPV4_PREFIX;

/** IPv4-mapped IPv6 has multiple valid textual spellings; URL canonicalizes them. */
function isIpv4MappedAddress(address: string): boolean {
  try {
    return new URL(`http://[${address}]/`).hostname
      .toLowerCase()
      .startsWith("[::ffff:");
  } catch {
    // Unparseable IPv6, including scoped zone identifiers, is not a trusted peer.
    return false;
  }
}

function isExplicitProxyEntry(entry: string): boolean {
  if (entry === SAFE_PROXY_NAME) return true;

  const parts = entry.split("/");
  if (parts.length > 2) return false;

  const [address, prefix] = parts;
  const version = isIP(address);
  if (version === 0) return false;
  if (version === 6 && !isIpv6AddressParsable(address)) return false;
  if (prefix === undefined) return true;
  if (!/^\d+$/.test(prefix)) return false;

  const length = Number(prefix);
  if (!Number.isSafeInteger(length)) return false;
  if (version === 4) {
    return length >= MIN_IPV4_PREFIX && length <= 32;
  }
  return (
    length >= (isIpv4MappedAddress(address) ? MIN_MAPPED_IPV6_PREFIX : MIN_IPV6_PREFIX) &&
    length <= 128
  );
}

function isIpv6AddressParsable(address: string): boolean {
  try {
    new URL(`http://[${address}]/`);
    return true;
  } catch {
    return false;
  }
}

export function configureTrustProxy(
  app: Express,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const configured = env.TRUSTED_PROXY_CIDRS?.trim();
  if (!configured) {
    app.set("trust proxy", false);
    return;
  }

  const entries = configured.split(",").map((entry) => entry.trim());
  if (entries.some((entry) => !entry || !isExplicitProxyEntry(entry))) {
    throw new Error(
      "TRUSTED_PROXY_CIDRS requires narrow IP/CIDR entries (IPv4 /8+, IPv6 /16+, mapped IPv6 /104+) or 'loopback'; wide/empty/invalid entries are forbidden.",
    );
  }
  app.set("trust proxy", entries);
}

export function getRequestSource(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}
