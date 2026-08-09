import crypto from "crypto";

export const DEVELOPMENT_SESSION_SECRET = "dev-secret-change-in-prod";
export const MINIMUM_PRODUCTION_SESSION_SECRET_LENGTH = 32;

export function resolveSessionSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.SESSION_SECRET;
  if (env.NODE_ENV !== "production") {
    return secret || DEVELOPMENT_SESSION_SECRET;
  }
  if (!secret) {
    throw new Error("SESSION_SECRET is required when NODE_ENV=production.");
  }
  if (secret === DEVELOPMENT_SESSION_SECRET) {
    throw new Error("The development SESSION_SECRET cannot be used in production.");
  }
  if (secret.length < MINIMUM_PRODUCTION_SESSION_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET must contain at least ${MINIMUM_PRODUCTION_SESSION_SECRET_LENGTH} characters in production.`,
    );
  }
  return secret;
}

const SECRET = resolveSessionSecret();

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(`${salt}:${derived.toString("hex")}`);
    });
  });
}

export function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const parts = stored.split(":");
    if (parts.length !== 2) { resolve(false); return; }
    const [salt, hash] = parts;
    if (!/^[0-9a-f]{32}$/i.test(salt) || !/^[0-9a-f]{128}$/i.test(hash)) {
      resolve(false);
      return;
    }
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(crypto.timingSafeEqual(derived, Buffer.from(hash, "hex")));
    });
  });
}

function organizerCredentialFingerprint(
  tournamentId: number,
  passwordHash: string | null,
): string {
  const credential = passwordHash ?? `passwordless-owner-v1:${tournamentId}`;
  return crypto
    .createHmac("sha256", SECRET)
    .update(`organizer-credential:${credential}`)
    .digest("base64url");
}

export function fingerprintRequestSource(source: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`request-source:${source}`)
    .digest("base64url");
}

export function signVersionedOrganizerToken(
  tournamentId: number,
  organizerPasswordHash: string | null,
): string {
  const payload = JSON.stringify({
    tid: tournamentId,
    role: "organizer",
    ver: organizerCredentialFingerprint(tournamentId, organizerPasswordHash),
    iat: Date.now(),
  });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

function verifySignedToken(
  token: string,
): Record<string, unknown> | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(b64).digest("hex");
  const signature = Buffer.from(sig);
  const expectedSignature = Buffer.from(expected);
  if (signature.length !== expectedSignature.length) return null;
  try {
    if (!crypto.timingSafeEqual(signature, expectedSignature)) return null;
    const payload: unknown = JSON.parse(
      Buffer.from(b64, "base64url").toString("utf8"),
    );
    return payload != null && typeof payload === "object" && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export function verifyOrganizerToken(
  token: string,
  tournamentId: number,
  organizerPasswordHash?: string | null,
): boolean {
  const payload = verifySignedToken(token);
  if (payload?.tid !== tournamentId || payload.role !== "organizer") return false;
  // New passwordless tournaments receive this signed, tournament-scoped token
  // only in the create response. The login endpoint never issues one for an
  // empty password, so losing it still requires setting/recovering credentials.
  return payload.ver === organizerCredentialFingerprint(tournamentId, organizerPasswordHash ?? null);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function signViewerToken(tournamentId: number, passwordVersion = 1): string {
  const payload = JSON.stringify({
    tid: tournamentId,
    role: "viewer",
    ver: passwordVersion,
    iat: Date.now(),
  });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

export function verifyViewerToken(
  token: string,
  tournamentId: number,
  expectedPasswordVersion?: number,
): boolean {
  const payload = verifySignedToken(token);
  if (payload?.tid !== tournamentId || payload.role !== "viewer") return false;
  return expectedPasswordVersion == null || payload.ver === expectedPasswordVersion;
}
