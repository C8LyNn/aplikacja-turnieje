/**
 * #324-L05 · Discord notifier: settings, the comparison worker and delivery.
 *
 * One small worker (every 5 s) compares each enabled, public tournament with the snapshot it saw last time and queues the
 * events in tournament_discord_outbox (unique per event key — a retry, a second instance or a restart never queues twice).
 * Delivery takes due rows with a short lease, sends them to the webhook and records the result. Delivery is at-least-once:
 * a crash between Discord accepting a message and the row being marked sent can repeat that one message.
 * Limits: at most 20 messages a minute per tournament and 2 per pass; Discord's 429 retry_after is honoured; network and
 * 5xx errors retry with backoff (6 attempts); a deleted webhook (401/403/404) stops sending until it is reconnected.
 * A tournament that is not public sends nothing, and what happened while it was hidden is never sent later.
 */
import { and, asc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import {
  db,
  matchesTable,
  playersTable,
  tournamentDiscordIntegrationsTable,
  tournamentDiscordOutboxTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import { logger } from "../../lib/logger";
import {
  DISCORD_EVENT_KINDS,
  discordEvents,
  discordMessage,
  eventSetting,
  parseDiscordWebhook,
  webhookHint,
  type DiscordEventKind,
  type DiscordMessage,
  type DiscordSnapshot,
} from "../../domain/tournament/discord-notifications";
import { registrationSettingsFromStorage } from "../../domain/tournament/registration";
import { DiscordKeyUnavailableError, decryptWebhook, discordKeyProblem, encryptWebhook } from "./discord-secret";

type TournamentRow = typeof tournamentsTable.$inferSelect;
type IntegrationRow = typeof tournamentDiscordIntegrationsTable.$inferSelect;

export class DiscordIntegrationError extends Error {
  constructor(readonly code: "INVALID_WEBHOOK" | "NOT_CONFIGURED" | "INVALID_EVENTS" | "NOT_PUBLIC" | "DISABLED" | "TOO_MANY_TESTS" | "INVALID_REQUEST", message: string) {
    super(message);
  }
}

export const DISCORD_LIMITS = Object.freeze({ perMinute: 20, perPass: 2, maxAttempts: 6, leaseMs: 30_000, testEveryMs: 15_000, timeoutMs: 10_000 });

// ── reading the tournament as Discord may see it ──────────────────────────────

async function loadSnapshot(tournament: TournamentRow): Promise<DiscordSnapshot> {
  const [stages, matches] = await Promise.all([
    db.select({ id: tournamentStagesTable.id, name: tournamentStagesTable.name, position: tournamentStagesTable.position, status: tournamentStagesTable.status, format: tournamentStagesTable.format })
      .from(tournamentStagesTable).where(eq(tournamentStagesTable.tournamentId, tournament.id)).orderBy(asc(tournamentStagesTable.position)),
    db.select().from(matchesTable).where(eq(matchesTable.tournamentId, tournament.id)),
  ]);
  const ids = [...new Set(matches.flatMap((m) => [m.player1Id, m.player2Id]).filter((id): id is number => id != null))];
  const players = ids.length ? await db.select({ id: playersTable.id, name: playersTable.name }).from(playersTable).where(inArray(playersTable.id, ids)) : [];
  const name = new Map(players.map((p) => [p.id, p.name]));
  return {
    version: 1,
    name: tournament.name,
    status: tournament.status,
    winnerId: tournament.winnerId ?? null,
    stages: stages.map((s) => ({ ...s, status: String(s.status), format: String(s.format) })),
    matches: matches.map((m) => ({
      id: m.id, stageId: m.stageId ?? 0, round: m.round, matchNumber: m.matchNumber, status: String(m.status), resultType: m.resultType ?? null,
      score1: m.score1 ?? null, score2: m.score2 ?? null, winnerId: m.winnerId ?? null, p1: m.player1Id ?? null, p2: m.player2Id ?? null,
      n1: m.player1Id != null ? name.get(m.player1Id) ?? null : null, n2: m.player2Id != null ? name.get(m.player2Id) ?? null : null, revision: m.revision,
    })),
  };
}

const isPublic = (tournament: Pick<TournamentRow, "visibility">) => (tournament.visibility ?? "public_online") === "public_online";
const tournamentLink = (integration: Pick<IntegrationRow, "linkBase">, tournamentId: number) => (integration.linkBase ? `${integration.linkBase}/tournaments/${tournamentId}` : null);

// ── settings (organizer only — the routes check that) ─────────────────────────

/** A link base taken from the organizer's own page address: http(s) origin only. */
export function cleanLinkBase(origin: unknown): string | null {
  if (typeof origin !== "string") return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function getDiscordStatus(tournament: TournamentRow) {
  const [integration] = await db.select().from(tournamentDiscordIntegrationsTable).where(eq(tournamentDiscordIntegrationsTable.tournamentId, tournament.id));
  if (!integration) return { configured: false as const, enabled: false, events: [...DISCORD_EVENT_KINDS], public: isPublic(tournament) };
  const recent = await db.select({ kind: tournamentDiscordOutboxTable.kind, status: tournamentDiscordOutboxTable.status, attempts: tournamentDiscordOutboxTable.attempts,
    lastError: tournamentDiscordOutboxTable.lastError, createdAt: tournamentDiscordOutboxTable.createdAt, sentAt: tournamentDiscordOutboxTable.sentAt, payload: tournamentDiscordOutboxTable.payload })
    .from(tournamentDiscordOutboxTable).where(eq(tournamentDiscordOutboxTable.tournamentId, tournament.id)).orderBy(sql`${tournamentDiscordOutboxTable.id} desc`).limit(10);
  const [counts] = await db.select({
    pending: sql<number>`count(*) filter (where ${tournamentDiscordOutboxTable.status} = 'pending')::int`,
    failed: sql<number>`count(*) filter (where ${tournamentDiscordOutboxTable.status} = 'failed')::int`,
    sent: sql<number>`count(*) filter (where ${tournamentDiscordOutboxTable.status} = 'sent')::int`,
  }).from(tournamentDiscordOutboxTable).where(eq(tournamentDiscordOutboxTable.tournamentId, tournament.id));
  return {
    configured: true as const,
    enabled: integration.enabled,
    events: integration.events,
    hint: integration.webhookHint,
    status: integration.status,
    lastError: integration.lastError,
    lastDeliveryAt: integration.lastDeliveryAt?.toISOString() ?? null,
    public: isPublic(tournament),
    counts: counts ?? { pending: 0, failed: 0, sent: 0 },
    recent: recent.map((r) => ({ kind: r.kind, status: r.status, attempts: r.attempts, lastError: r.lastError, createdAt: r.createdAt.toISOString(), sentAt: r.sentAt?.toISOString() ?? null,
      title: ((r.payload as DiscordMessage).embeds?.[0]?.title ?? "").slice(0, 120) })),
  };
}

export async function saveDiscordConfig(input: { tournament: TournamentRow; body: Record<string, unknown>; origin: unknown }) {
  const { tournament, body } = input;
  const allowed = new Set(["webhookUrl", "enabled", "events"]);
  const unknown = Object.keys(body).filter((k) => !allowed.has(k));
  if (unknown.length) throw new DiscordIntegrationError("INVALID_REQUEST", `Nieznane pola: ${unknown.map((k) => k.slice(0, 30)).join(", ")}.`);
  let events: DiscordEventKind[] | undefined;
  if (body.events !== undefined) {
    if (!Array.isArray(body.events) || body.events.some((e) => !DISCORD_EVENT_KINDS.includes(e as DiscordEventKind))) {
      throw new DiscordIntegrationError("INVALID_EVENTS", "Nieznany rodzaj powiadomienia.");
    }
    events = [...new Set(body.events as DiscordEventKind[])];
  }
  if (body.enabled !== undefined && typeof body.enabled !== "boolean") throw new DiscordIntegrationError("INVALID_REQUEST", "enabled: true albo false.");
  const webhook = body.webhookUrl === undefined ? undefined : parseDiscordWebhook(body.webhookUrl);
  if (body.webhookUrl !== undefined && !webhook) {
    throw new DiscordIntegrationError("INVALID_WEBHOOK", "To nie jest adres webhooka Discord (https://discord.com/api/webhooks/…).");
  }
  const linkBase = cleanLinkBase(input.origin);
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(tournamentDiscordIntegrationsTable).where(eq(tournamentDiscordIntegrationsTable.tournamentId, tournament.id)).for("update");
    if (!existing && !webhook) throw new DiscordIntegrationError("NOT_CONFIGURED", "Najpierw wklej adres webhooka kanału.");
    const enabling = body.enabled === true && !existing?.enabled;
    const values = {
      ...(webhook ? { webhookCiphertext: encryptWebhook(webhook.url), webhookHint: webhookHint(webhook.id), status: "ok", lastError: null } : {}),
      ...(events ? { events } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled as boolean } : {}),
      // switching on (or a new channel) starts from what is true now: nothing from before is sent later
      ...(enabling || webhook ? { snapshot: null, snapshotAt: null } : {}),
      ...(linkBase ? { linkBase } : {}),
      updatedAt: sql`now()`,
    };
    if (!existing) {
      await tx.insert(tournamentDiscordIntegrationsTable).values({ tournamentId: tournament.id, webhookCiphertext: values.webhookCiphertext!, webhookHint: values.webhookHint!,
        enabled: values.enabled ?? false, events: values.events ?? [...DISCORD_EVENT_KINDS], linkBase: values.linkBase ?? null });
    } else {
      await tx.update(tournamentDiscordIntegrationsTable).set(values).where(eq(tournamentDiscordIntegrationsTable.tournamentId, tournament.id));
    }
  });
}

/** Forget the webhook and every queued or sent notification of this tournament. */
export async function disconnectDiscord(tournamentId: number) {
  await db.transaction(async (tx) => {
    await tx.delete(tournamentDiscordOutboxTable).where(eq(tournamentDiscordOutboxTable.tournamentId, tournamentId));
    await tx.delete(tournamentDiscordIntegrationsTable).where(eq(tournamentDiscordIntegrationsTable.tournamentId, tournamentId));
  });
}

/** Example messages for the panel (the tournament's own name and link, example participants). */
export function discordPreview(tournament: TournamentRow, origin: unknown) {
  const base = cleanLinkBase(origin);
  const ctx = { tournamentName: tournament.name, link: base ? `${base}/tournaments/${tournament.id}` : null, signupLink: null };
  const examples = [
    { kind: "invite" as const, event: { kind: "invite" as const } },
    { kind: "start" as const, event: { kind: "start" as const, key: "x" } },
    { kind: "pairings" as const, event: { kind: "pairings" as const, key: "x", stageId: 1, round: 1, pairs: [["Zawodnik A", "Zawodnik B"], ["Zawodnik C", "Zawodnik D"]] as [string, string][] } },
    { kind: "results" as const, event: { kind: "results" as const, type: "result" as const, key: "x", matchId: 1, side1: "Zawodnik A", side2: "Zawodnik B", score: "2:1", winner: "Zawodnik A", draw: false, context: "Półfinał" } },
    { kind: "results" as const, event: { kind: "results" as const, type: "corrected" as const, key: "x", matchId: 1, side1: "Zawodnik A", side2: "Zawodnik B", score: "1:2", winner: "Zawodnik B", context: "Półfinał" } },
    { kind: "results" as const, event: { kind: "results" as const, type: "reverted" as const, key: "x", matchId: 1, side1: "Zawodnik A", side2: "Zawodnik B", context: "Półfinał" } },
    { kind: "advance" as const, event: { kind: "advance" as const, key: "x", name: "Zawodnik A", where: "Finał" } },
    { kind: "finish" as const, event: { kind: "finish" as const, key: "x", winner: "Zawodnik A" } },
  ];
  return examples.map(({ kind, event }) => ({ kind, message: discordMessage(event, ctx) }));
}

// ── sending ───────────────────────────────────────────────────────────────────

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{ status: number; headers: { get(name: string): string | null }; json(): Promise<unknown> }>;

/** Test servers only: a local stand-in for discord.com (never honoured for any other host). */
function deliveryUrl(webhook: string): string {
  const override = process.env.DISCORD_API_BASE_FOR_TESTS;
  if (!override) return webhook;
  try {
    const base = new URL(override);
    if (!["127.0.0.1", "localhost"].includes(base.hostname)) return webhook;
    return webhook.replace("https://discord.com", base.origin);
  } catch {
    return webhook;
  }
}

type SendResult = { ok: true; messageId: string | null } | { ok: false; kind: "rate"; retryMs: number } | { ok: false; kind: "gone" | "bad" | "temporary"; status: number };

async function send(webhook: string, message: DiscordMessage, fetchImpl: FetchLike): Promise<SendResult> {
  let response;
  try {
    response = await fetchImpl(`${deliveryUrl(webhook)}?wait=true`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(message), signal: AbortSignal.timeout(DISCORD_LIMITS.timeoutMs),
    });
  } catch {
    return { ok: false, kind: "temporary", status: 0 };
  }
  if (response.status >= 200 && response.status < 300) {
    const body = await response.json().catch(() => null) as { id?: unknown } | null;
    return { ok: true, messageId: typeof body?.id === "string" ? body.id.slice(0, 40) : null };
  }
  if (response.status === 429) {
    const body = await response.json().catch(() => null) as { retry_after?: unknown } | null;
    const seconds = typeof body?.retry_after === "number" ? body.retry_after : Number(response.headers.get("retry-after") ?? "5");
    return { ok: false, kind: "rate", retryMs: Math.min(600_000, Math.max(500, Math.ceil((Number.isFinite(seconds) ? seconds : 5) * 1000) + 250)) };
  }
  if ([401, 403, 404].includes(response.status)) return { ok: false, kind: "gone", status: response.status };
  if (response.status >= 400 && response.status < 500) return { ok: false, kind: "bad", status: response.status };
  return { ok: false, kind: "temporary", status: response.status };
}

const GONE_MESSAGE = (status: number) => `Discord odrzuca webhook (HTTP ${status}) — został usunięty albo zmieniony. Wklej nowy adres.`;
const lastTest = new Map<number, number>();

/** "Test połączenia": one message straight away (not queued), at most every 15 s per tournament. */
export async function sendDiscordTest(tournament: TournamentRow, fetchImpl: FetchLike = fetch as unknown as FetchLike) {
  const now = Date.now();
  if (now - (lastTest.get(tournament.id) ?? 0) < DISCORD_LIMITS.testEveryMs) throw new DiscordIntegrationError("TOO_MANY_TESTS", "Odczekaj chwilę przed kolejnym testem.");
  lastTest.set(tournament.id, now);
  const [integration] = await db.select().from(tournamentDiscordIntegrationsTable).where(eq(tournamentDiscordIntegrationsTable.tournamentId, tournament.id));
  if (!integration) throw new DiscordIntegrationError("NOT_CONFIGURED", "Najpierw wklej adres webhooka kanału.");
  let webhook: string;
  try {
    webhook = decryptWebhook(integration.webhookCiphertext);
  } catch (error) {
    if (error instanceof DiscordKeyUnavailableError) {
      await db.update(tournamentDiscordIntegrationsTable).set({ status: "key_unavailable", lastError: "Nie można odczytać zapisanego webhooka (zmienił się klucz serwera). Wklej adres ponownie." }).where(eq(tournamentDiscordIntegrationsTable.tournamentId, tournament.id));
      return { ok: false as const, message: "Nie można odczytać zapisanego webhooka — wklej adres ponownie." };
    }
    throw error;
  }
  const result = await send(webhook, discordMessage({ kind: "test" }, { tournamentName: tournament.name, link: tournamentLink(integration, tournament.id) }), fetchImpl);
  if (result.ok) {
    await db.update(tournamentDiscordIntegrationsTable).set({ status: "ok", lastError: null, lastDeliveryAt: sql`now()` }).where(eq(tournamentDiscordIntegrationsTable.tournamentId, tournament.id));
    return { ok: true as const, message: "Wiadomość testowa wysłana — sprawdź kanał." };
  }
  if (result.kind === "gone") {
    await db.update(tournamentDiscordIntegrationsTable).set({ status: "broken", lastError: GONE_MESSAGE(result.status) }).where(eq(tournamentDiscordIntegrationsTable.tournamentId, tournament.id));
    return { ok: false as const, message: GONE_MESSAGE(result.status) };
  }
  return { ok: false as const, message: result.kind === "rate" ? "Discord chwilowo ogranicza wysyłkę — spróbuj za chwilę." : `Discord nie przyjął wiadomości (${result.kind === "bad" ? `HTTP ${result.status}` : "brak połączenia lub błąd serwera"}).` };
}

/** "Wyślij zaproszenie": queued like any event; the client's request id makes a repeated click harmless. */
export async function queueDiscordInvite(tournament: TournamentRow, requestId: unknown) {
  if (typeof requestId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(requestId)) throw new DiscordIntegrationError("INVALID_REQUEST", "Brak identyfikatora żądania.");
  if (!isPublic(tournament)) throw new DiscordIntegrationError("NOT_PUBLIC", "Turniej nie jest publiczny — zaproszenie nie zostanie wysłane.");
  const [integration] = await db.select().from(tournamentDiscordIntegrationsTable).where(eq(tournamentDiscordIntegrationsTable.tournamentId, tournament.id));
  if (!integration) throw new DiscordIntegrationError("NOT_CONFIGURED", "Najpierw wklej adres webhooka kanału.");
  if (!integration.enabled || !integration.events.includes("invite")) throw new DiscordIntegrationError("DISABLED", "Włącz powiadomienia i rodzaj „Zaproszenie”.");
  const registration = registrationSettingsFromStorage(tournament.registrationSettings);
  const link = tournamentLink(integration, tournament.id);
  const signupLink = registration.enabled && registration.open && link ? `${link}/zapisy` : null;
  const payload = discordMessage({ kind: "invite" }, { tournamentName: tournament.name, link, signupLink });
  const inserted = await db.insert(tournamentDiscordOutboxTable).values({ tournamentId: tournament.id, eventKey: `invite:${requestId}`, kind: "invite", payload })
    .onConflictDoNothing().returning({ id: tournamentDiscordOutboxTable.id });
  return { queued: inserted.length > 0 };
}

// ── the worker ────────────────────────────────────────────────────────────────

/** Compare every enabled tournament with its last snapshot and queue what happened. Safe to run from several instances. */
export async function detectDiscordEvents(): Promise<number> {
  const enabled = await db.select({ tournamentId: tournamentDiscordIntegrationsTable.tournamentId }).from(tournamentDiscordIntegrationsTable)
    .where(and(eq(tournamentDiscordIntegrationsTable.enabled, true), eq(tournamentDiscordIntegrationsTable.status, "ok"))).limit(200);
  let queued = 0;
  for (const { tournamentId } of enabled) {
    queued += await db.transaction(async (tx) => {
      const [integration] = await tx.select().from(tournamentDiscordIntegrationsTable)
        .where(eq(tournamentDiscordIntegrationsTable.tournamentId, tournamentId)).for("update", { skipLocked: true });
      if (!integration || !integration.enabled) return 0;
      const [tournament] = await tx.select().from(tournamentsTable).where(eq(tournamentsTable.id, tournamentId));
      if (!tournament) return 0;
      const snapshot = await loadSnapshot(tournament);
      const previous = (integration.snapshot as DiscordSnapshot | null)?.version === 1 ? integration.snapshot as DiscordSnapshot : null;
      // not public: keep the baseline current, send nothing — the hidden period is never told later
      const events = isPublic(tournament) ? discordEvents(previous, snapshot).filter((event) => integration.events.includes(eventSetting(event))) : [];
      const link = tournamentLink(integration, tournament.id);
      let count = 0;
      for (const event of events) {
        const rows = await tx.insert(tournamentDiscordOutboxTable).values({
          tournamentId, eventKey: event.key, kind: event.kind, payload: discordMessage(event, { tournamentName: tournament.name, link }),
        }).onConflictDoNothing().returning({ id: tournamentDiscordOutboxTable.id });
        count += rows.length;
      }
      await tx.update(tournamentDiscordIntegrationsTable).set({ snapshot, snapshotAt: sql`now()` }).where(eq(tournamentDiscordIntegrationsTable.tournamentId, tournamentId));
      return count;
    });
  }
  return queued;
}

/** Send what is due: a lease per row, per-tournament limits, retry rules as described at the top. */
// All queue times use the database clock (the columns are "timestamp" filled by now()), never the API's clock.
const dbNow = sql`now()`;
const dbIn = (ms: number) => sql`now() + make_interval(secs => ${ms / 1000})`;

export async function deliverDiscordNotifications(fetchImpl: FetchLike = fetch as unknown as FetchLike): Promise<{ sent: number; failed: number; retried: number }> {
  const leased = await db.transaction(async (tx) => {
    const due = await tx.select().from(tournamentDiscordOutboxTable)
      .where(and(eq(tournamentDiscordOutboxTable.status, "pending"), lte(tournamentDiscordOutboxTable.nextAttemptAt, dbNow),
        or(isNull(tournamentDiscordOutboxTable.leaseUntil), lte(tournamentDiscordOutboxTable.leaseUntil, dbNow))))
      .orderBy(asc(tournamentDiscordOutboxTable.id)).limit(40).for("update", { skipLocked: true });
    if (!due.length) return [];
    const tournamentIds = [...new Set(due.map((row) => row.tournamentId))];
    const integrations = await tx.select().from(tournamentDiscordIntegrationsTable).where(inArray(tournamentDiscordIntegrationsTable.tournamentId, tournamentIds));
    const tournaments = await tx.select({ id: tournamentsTable.id, visibility: tournamentsTable.visibility }).from(tournamentsTable).where(inArray(tournamentsTable.id, tournamentIds));
    const recent = await tx.select({ tournamentId: tournamentDiscordOutboxTable.tournamentId, n: sql<number>`count(*)::int` }).from(tournamentDiscordOutboxTable)
      .where(and(inArray(tournamentDiscordOutboxTable.tournamentId, tournamentIds), gte(tournamentDiscordOutboxTable.sentAt, sql`now() - interval '60 seconds'`)))
      .groupBy(tournamentDiscordOutboxTable.tournamentId);
    const sentLastMinute = new Map(recent.map((r) => [r.tournamentId, r.n]));
    const perPass = new Map<number, number>();
    const take: { row: typeof due[number]; integration: IntegrationRow }[] = [];
    for (const row of due) {
      const integration = integrations.find((i) => i.tournamentId === row.tournamentId);
      const tournament = tournaments.find((t) => t.id === row.tournamentId);
      if (!integration?.enabled || integration.status !== "ok" || !tournament || !isPublic(tournament)) continue;
      const used = (sentLastMinute.get(row.tournamentId) ?? 0) + (perPass.get(row.tournamentId) ?? 0);
      if (used >= DISCORD_LIMITS.perMinute || (perPass.get(row.tournamentId) ?? 0) >= DISCORD_LIMITS.perPass) continue;
      perPass.set(row.tournamentId, (perPass.get(row.tournamentId) ?? 0) + 1);
      take.push({ row, integration });
    }
    if (take.length) {
      await tx.update(tournamentDiscordOutboxTable).set({ leaseUntil: dbIn(DISCORD_LIMITS.leaseMs) })
        .where(inArray(tournamentDiscordOutboxTable.id, take.map((t) => t.row.id)));
    }
    return take;
  });
  const result = { sent: 0, failed: 0, retried: 0 };
  for (const { row, integration } of leased) {
    let webhook: string;
    try {
      webhook = decryptWebhook(integration.webhookCiphertext);
    } catch {
      await db.update(tournamentDiscordIntegrationsTable).set({ status: "key_unavailable", lastError: "Nie można odczytać zapisanego webhooka (zmienił się klucz serwera). Wklej adres ponownie." })
        .where(eq(tournamentDiscordIntegrationsTable.tournamentId, integration.tournamentId));
      await db.update(tournamentDiscordOutboxTable).set({ leaseUntil: null }).where(eq(tournamentDiscordOutboxTable.id, row.id));
      continue;
    }
    const outcome = await send(webhook, row.payload as DiscordMessage, fetchImpl);
    const attempts = row.attempts + 1;
    if (outcome.ok) {
      result.sent += 1;
      await db.update(tournamentDiscordOutboxTable).set({ status: "sent", attempts, sentAt: dbNow, leaseUntil: null, lastError: null, discordMessageId: outcome.messageId })
        .where(eq(tournamentDiscordOutboxTable.id, row.id));
      await db.update(tournamentDiscordIntegrationsTable).set({ lastDeliveryAt: dbNow, lastError: null }).where(eq(tournamentDiscordIntegrationsTable.tournamentId, integration.tournamentId));
    } else if (outcome.kind === "rate") {
      result.retried += 1;
      await db.update(tournamentDiscordOutboxTable).set({ attempts, leaseUntil: null, nextAttemptAt: dbIn(outcome.retryMs), lastError: "Discord ograniczył tempo (429)" })
        .where(eq(tournamentDiscordOutboxTable.id, row.id));
    } else if (outcome.kind === "gone") {
      await db.update(tournamentDiscordOutboxTable).set({ leaseUntil: null, lastError: GONE_MESSAGE(outcome.status) }).where(eq(tournamentDiscordOutboxTable.id, row.id));
      await db.update(tournamentDiscordIntegrationsTable).set({ status: "broken", lastError: GONE_MESSAGE(outcome.status) }).where(eq(tournamentDiscordIntegrationsTable.tournamentId, integration.tournamentId));
    } else if (outcome.kind === "bad" || attempts >= DISCORD_LIMITS.maxAttempts) {
      result.failed += 1;
      await db.update(tournamentDiscordOutboxTable).set({ status: "failed", attempts, leaseUntil: null, lastError: outcome.status ? `HTTP ${outcome.status}` : "brak połączenia" })
        .where(eq(tournamentDiscordOutboxTable.id, row.id));
    } else {
      result.retried += 1;
      const backoff = Math.min(600_000, 5_000 * 2 ** (attempts - 1));
      await db.update(tournamentDiscordOutboxTable).set({ attempts, leaseUntil: null, nextAttemptAt: dbIn(backoff), lastError: outcome.status ? `HTTP ${outcome.status}` : "brak połączenia" })
        .where(eq(tournamentDiscordOutboxTable.id, row.id));
    }
  }
  return result;
}

export async function discordTick(fetchImpl?: FetchLike) {
  if (discordKeyProblem()) return { queued: 0, sent: 0, failed: 0, retried: 0, paused: "DISCORD_KEY_MISCONFIGURED" as const };
  const queued = await detectDiscordEvents();
  const delivered = await deliverDiscordNotifications(fetchImpl);
  return { queued, ...delivered };
}

let worker: ReturnType<typeof setInterval> | null = null;
/** Started with the API; DISCORD_NOTIFIER_ENABLED=false switches it off. Errors are logged without addresses. */
export function startDiscordWorker(intervalMs = 5_000) {
  if (worker || process.env.NODE_ENV === "test" || process.env.DISCORD_NOTIFIER_ENABLED === "false") return;
  const keyProblem = discordKeyProblem();
  if (keyProblem) logger.error({ code: "DISCORD_KEY_MISCONFIGURED" }, `Discord notifications paused: ${keyProblem}`);
  let running = false;
  worker = setInterval(() => {
    if (running) return;
    running = true;
    discordTick().catch((error: unknown) => logger.warn({ error: error instanceof Error ? error.name : "Error" }, "Discord notifier pass failed"))
      .finally(() => { running = false; });
  }, intervalMs);
  worker.unref?.();
}
