// #324-L05 · the pure Discord part: events only from real changes (with stable keys), honest corrections and undo,
// no pings, only real webhook addresses, encrypted storage.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_EVENTS_PER_DIFF, discordEvents, discordMessage, discordSafe, parseDiscordWebhook, webhookHint,
  type DiscordSnapshot, type SnapshotMatch,
} from "../src/domain/tournament/discord-notifications";
import { DiscordKeyUnavailableError, decryptWebhook, encryptWebhook } from "../src/application/integrations/discord-secret";

const m = (over: Partial<SnapshotMatch>): SnapshotMatch => ({ id: 1, stageId: 1, round: 1, matchNumber: 1, status: "pending", resultType: null, score1: null, score2: null,
  winnerId: null, p1: 1, p2: 2, n1: "Ada", n2: "Bartek", revision: 1, ...over });
const snap = (matches: SnapshotMatch[], over: Partial<DiscordSnapshot> = {}): DiscordSnapshot =>
  ({ version: 1, name: "Puchar", status: "active", winnerId: null, stages: [{ id: 1, name: "Puchar", position: 1, status: "active", format: "single_elimination" }], matches, ...over });

test("L05 events: first look is only a baseline; start, pairings, result, advance and finish when they happen", () => {
  const draft = snap([], { status: "draft" });
  assert.deepEqual(discordEvents(null, draft), []);
  const sf1 = m({ id: 1 }), sf2 = m({ id: 2, matchNumber: 2, p1: 3, p2: 4, n1: "Cela", n2: "Daro" }), final = m({ id: 3, round: 2, p1: null, p2: null, n1: null, n2: null });
  const started = snap([sf1, sf2, final]);
  const e1 = discordEvents(draft, started);
  assert.deepEqual(e1.map((e) => e.kind), ["start", "pairings"]);
  assert.deepEqual((e1[1] as { pairs: string[][] }).pairs, [["Ada", "Bartek"], ["Cela", "Daro"]]);
  const done = snap([{ ...sf1, status: "completed", score1: 2, score2: 0, winnerId: 1, revision: 2 }, sf2, { ...final, p1: 1, n1: "Ada" }]);
  const e2 = discordEvents(started, done);
  assert.deepEqual(e2.map((e) => `${e.kind}:${e.key}`), ["results:result:1:2", "advance:advance:3:1:2"], "an advance is not 'new pairs'");
  assert.deepEqual(discordEvents(done, done), [], "nothing twice");
  const finished = snap(done.matches, { status: "completed", winnerId: 1 });
  assert.deepEqual(discordEvents(done, finished), [{ kind: "finish", key: "finish:1", winner: "Ada" }]);
});

test("L05 events: correction and undo get their own message with new keys; byes and no contest are not announced", () => {
  const done = snap([m({ status: "completed", score1: 2, score2: 1, winnerId: 1, revision: 2 })]);
  const corrected = snap([m({ status: "completed", score1: 1, score2: 2, winnerId: 2, revision: 3 })]);
  const reverted = snap([m({ status: "pending", revision: 4 })]);
  const again = snap([m({ status: "completed", score1: 2, score2: 1, winnerId: 1, revision: 5 })]);
  assert.deepEqual(discordEvents(done, corrected).map((e) => e.key), ["corrected:1:3"]);
  assert.deepEqual(discordEvents(corrected, reverted).map((e) => e.key), ["reverted:1:4"]);
  assert.deepEqual(discordEvents(reverted, again).map((e) => e.key), ["result:1:5"], "the same score entered again is a new message (new revision)");
  const before = snap([m({ id: 5 }), m({ id: 6, matchNumber: 2 })]);
  const after = snap([m({ id: 5, status: "completed", resultType: "bye", winnerId: 1, revision: 2 }), m({ id: 6, matchNumber: 2, status: "completed", resultType: "no_contest", revision: 2 })]);
  assert.deepEqual(discordEvents(before, after), []);
});

test("L05 events: a match created and finished between two looks is still a result (and its advance is told)", () => {
  const draft = snap([], { status: "draft" });
  const quick = snap([
    m({ id: 1, status: "completed", score1: 1, score2: 0, winnerId: 1, revision: 2 }),
    m({ id: 2, matchNumber: 2, p1: 3, p2: 4, n1: "Cela", n2: "Daro" }),
    m({ id: 3, round: 2, p1: 1, p2: null, n1: "Ada", n2: null }),
  ]);
  assert.deepEqual(discordEvents(draft, quick).map((e) => e.kind), ["start", "pairings", "results", "advance"]);
});

test("L05 events: a burst becomes at most 8 messages, the rest one summary", () => {
  const many = Array.from({ length: 20 }, (_, i) => m({ id: i + 1, matchNumber: i + 1, p1: 100 + i * 2, p2: 101 + i * 2 }));
  const before = snap(many);
  const after = snap(many.map((x) => ({ ...x, status: "completed", score1: 1, score2: 0, winnerId: x.p1, revision: 2 })));
  const events = discordEvents(before, after);
  assert.equal(events.length, MAX_EVENTS_PER_DIFF);
  assert.equal(events.at(-1)!.kind, "summary");
  assert.equal((events.at(-1) as { count: number }).count, 20 - (MAX_EVENTS_PER_DIFF - 1));
});

test("L05 messages: never ping, names are plain text, corrections say the earlier message is outdated", () => {
  assert.equal(discordSafe("@everyone <@&123> **pogrubienie** https://x.y"), "@\u200beveryone <@\u200b&123\\> \\*\\*pogrubienie\\*\\* https\u200b://x.y");
  const message = discordMessage({ kind: "results", type: "result", key: "k", matchId: 1, side1: "@here", side2: "Bartek", score: "2:0", winner: "@here", draw: false, context: "Półfinał" },
    { tournamentName: "Puchar @everyone", link: "https://t.example/tournaments/1" });
  assert.deepEqual(message.allowed_mentions, { parse: [] });
  assert.doesNotMatch(JSON.stringify(message), /@everyone|@here/, "no raw mention text at all");
  const corrected = discordMessage({ kind: "results", type: "corrected", key: "k", matchId: 1, side1: "Ada", side2: "Bartek", score: "1:2", winner: "Bartek", context: "Finał" }, { tournamentName: "Puchar", link: null });
  assert.match(corrected.embeds[0].description!, /Wcześniejsza wiadomość o tym meczu jest nieaktualna/);
  const reverted = discordMessage({ kind: "results", type: "reverted", key: "k", matchId: 1, side1: "Ada", side2: "Bartek", context: "Finał" }, { tournamentName: "Puchar", link: null });
  assert.match(reverted.embeds[0].title, /Wynik cofnięty/);
});

test("L05 webhooks: only real Discord channel webhooks; the panel never sees the token", () => {
  const token = "A".repeat(68);
  for (const ok of [`https://discord.com/api/webhooks/123456789012345678/${token}`, `https://discordapp.com/api/webhooks/123456789012345678/${token}`, `https://canary.discord.com/api/v10/webhooks/123456789012345678/${token}`]) {
    assert.equal(parseDiscordWebhook(ok)?.url, `https://discord.com/api/webhooks/123456789012345678/${token}`, ok);
  }
  for (const bad of [`http://discord.com/api/webhooks/123456789012345678/${token}`, `https://discord.com.evil.example/api/webhooks/123456789012345678/${token}`,
    `https://evil.example/api/webhooks/123456789012345678/${token}`, `https://discord.com/api/webhooks/123456789012345678/${token}?wait=true`,
    `https://user:pass@discord.com/api/webhooks/123456789012345678/${token}`, `https://discord.com/api/users/@me`, "https://127.0.0.1/api/webhooks/1/x", 42, null]) {
    assert.equal(parseDiscordWebhook(bad), null, String(bad));
  }
  assert.equal(webhookHint("123456789012345678"), "discord.com/api/webhooks/1234…5678/••••");
});

test("L05 secret: stored only as AES-GCM ciphertext; another key cannot read it", () => {
  const url = `https://discord.com/api/webhooks/123456789012345678/${"B".repeat(68)}`;
  process.env.DISCORD_WEBHOOK_KEY = Buffer.alloc(32, 7).toString("base64");
  const stored = encryptWebhook(url);
  assert.match(stored, /^v1:/);
  assert.ok(!stored.includes("BBBB") && !stored.includes("discord.com"));
  assert.notEqual(encryptWebhook(url), stored, "a fresh IV every time");
  assert.equal(decryptWebhook(stored), url);
  process.env.DISCORD_WEBHOOK_KEY = Buffer.alloc(32, 8).toString("base64");
  assert.throws(() => decryptWebhook(stored), DiscordKeyUnavailableError);
  delete process.env.DISCORD_WEBHOOK_KEY;
  process.env.SESSION_SECRET = "unit-test-session-secret";
  assert.equal(decryptWebhook(encryptWebhook(url)), url, "derived from SESSION_SECRET when no dedicated key is set");
});
