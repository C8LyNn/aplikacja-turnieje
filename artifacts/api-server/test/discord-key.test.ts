// Release rehearsal (rc-2): DISCORD_WEBHOOK_KEY handling. A valid key (hex or base64) round-trips; a changed key means
// "paste the address again"; a malformed key is a server misconfiguration — reported as such, saved webhooks untouched.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { afterEach, test } from "node:test";
import { DiscordKeyMisconfiguredError, DiscordKeyUnavailableError, decryptWebhook, discordKeyProblem, encryptWebhook } from "../src/application/integrations/discord-secret";

const URL = "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz";
const saved = { key: process.env.DISCORD_WEBHOOK_KEY, session: process.env.SESSION_SECRET };
afterEach(() => {
  if (saved.key === undefined) delete process.env.DISCORD_WEBHOOK_KEY; else process.env.DISCORD_WEBHOOK_KEY = saved.key;
  if (saved.session === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = saved.session;
});

test("a 32-byte key in hex or base64 encrypts and decrypts; the address is never stored in clear", () => {
  for (const value of [randomBytes(32).toString("hex"), randomBytes(32).toString("base64")]) {
    process.env.DISCORD_WEBHOOK_KEY = value;
    assert.equal(discordKeyProblem(), null);
    const stored = encryptWebhook(URL);
    assert.ok(!stored.includes("discord.com") && !stored.includes("abcdefghij"));
    assert.equal(decryptWebhook(stored), URL);
  }
});

test("without DISCORD_WEBHOOK_KEY the key comes from SESSION_SECRET, so rotating SESSION_SECRET loses saved webhooks", () => {
  delete process.env.DISCORD_WEBHOOK_KEY;
  process.env.SESSION_SECRET = "a".repeat(48);
  const stored = encryptWebhook(URL);
  process.env.SESSION_SECRET = "b".repeat(48);
  assert.throws(() => decryptWebhook(stored), DiscordKeyUnavailableError);
});

test("with DISCORD_WEBHOOK_KEY set, rotating SESSION_SECRET keeps saved webhooks readable", () => {
  process.env.DISCORD_WEBHOOK_KEY = randomBytes(32).toString("base64");
  process.env.SESSION_SECRET = "a".repeat(48);
  const stored = encryptWebhook(URL);
  process.env.SESSION_SECRET = "c".repeat(48);
  assert.equal(decryptWebhook(stored), URL);
});

test("a malformed key is a misconfiguration: reported, never mistaken for a changed key", () => {
  process.env.DISCORD_WEBHOOK_KEY = randomBytes(32).toString("hex");
  const stored = encryptWebhook(URL);
  process.env.DISCORD_WEBHOOK_KEY = "rehearsal-key-that-is-not-32-bytes";
  assert.match(discordKeyProblem() ?? "", /32 bytes/);
  assert.throws(() => encryptWebhook(URL), DiscordKeyMisconfiguredError);
  assert.throws(() => decryptWebhook(stored), DiscordKeyMisconfiguredError, "not DiscordKeyUnavailableError, which would mark the webhook as lost");
});
