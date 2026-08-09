import type { Express, Request } from "express";
import { isIP } from "node:net";

const SAFE_PROXY_NAME = "loopback";

function isExplicitProxyEntry(entry: string): boolean {
  if (entry === SAFE_PROXY_NAME) {
    return true;
  }

  const parts = entry.split("/");
  if (parts.length > 2) {
    return false;
  }

  const [address, prefix] = parts;
  const version = isIP(address);
  if (version === 0) {
    return false;
  }
  if (prefix === undefined) {
    return true;
  }
  if (!/^\d+$/.test(prefix)) {
    return false;
  }

  const numericPrefix = Number(prefix);
  return version === 4 ? numericPrefix <= 32 : numericPrefix <= 128;
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

  const entries = configured
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (
    entries.length === 0 ||
    entries.some((entry) => !isExplicitProxyEntry(entry))
  ) {
    throw new Error(
      "TRUSTED_PROXY_CIDRS accepts only explicit IP/CIDR entries or 'loopback'.",
    );
  }
  app.set("trust proxy", entries);
}

export function getRequestSource(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}
