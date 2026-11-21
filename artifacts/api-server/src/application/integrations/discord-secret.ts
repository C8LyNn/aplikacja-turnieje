/**
 * #324-L05 · the webhook address is a secret (anyone holding it can post to the channel), so it is stored only encrypted
 * with AES-256-GCM. The key never reaches the database: DISCORD_WEBHOOK_KEY (32 bytes, base64 or hex) when set, otherwise
 * derived from SESSION_SECRET with HKDF (a separate purpose label, so the session key itself is never used directly).
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

export class DiscordKeyUnavailableError extends Error {
  constructor() { super("Brak klucza do odczytu zapisanego webhooka."); }
}

/**
 * Release rehearsal (rc-2): DISCORD_WEBHOOK_KEY is set but is not 32 bytes. This is a server configuration error, not a
 * changed key — saved webhooks stay untouched (no "paste it again" for every organizer) and Discord simply pauses until
 * an administrator fixes the variable. The value itself is never logged.
 */
export class DiscordKeyMisconfiguredError extends Error {
  readonly code = "DISCORD_KEY_MISCONFIGURED";
  constructor() { super("DISCORD_WEBHOOK_KEY must be 32 bytes (base64 or 64 hex characters)."); }
}

/** Null when Discord can encrypt and decrypt; otherwise why not (for the startup log). */
export function discordKeyProblem(): string | null {
  try { key(); return null; } catch (error) { return error instanceof DiscordKeyMisconfiguredError ? error.message : null; }
}

function key(): Buffer {
  const explicit = process.env.DISCORD_WEBHOOK_KEY?.trim();
  if (explicit) {
    const decoded = /^[0-9a-f]{64}$/i.test(explicit) ? Buffer.from(explicit, "hex") : Buffer.from(explicit, "base64");
    if (decoded.length !== 32) throw new DiscordKeyMisconfiguredError();
    return decoded;
  }
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new DiscordKeyUnavailableError();
  return Buffer.from(hkdfSync("sha256", secret, "swarm006", "discord-webhook-v1", 32));
}

export function encryptWebhook(url: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(url, "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${ciphertext.toString("base64")}`;
}

/** Throws DiscordKeyUnavailableError when the key changed (the organizer has to paste the address again). */
export function decryptWebhook(stored: string): string {
  const [version, iv, tag, data] = stored.split(":");
  if (version !== "v1" || !iv || !tag || !data) throw new DiscordKeyUnavailableError();
  const secretKey = key(); // a misconfigured key is reported as such, not as "the key changed"
  try {
    const decipher = createDecipheriv("aes-256-gcm", secretKey, Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
  } catch {
    throw new DiscordKeyUnavailableError();
  }
}
