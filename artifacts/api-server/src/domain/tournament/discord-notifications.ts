/**
 * #324-L05 · Discord notifications (one-way webhooks) — the pure part: which events happened between two stored public
 * snapshots of a tournament, how a message looks, and which webhook addresses are accepted.
 *
 * Events are taken only from real state changes the engine stored (no invented point-by-point events). Each event has a
 * stable key built from the match revision, so a retry, a second worker or an API restart never queues it twice. A result
 * that is corrected or undone gets its own message, so Discord never keeps a result without saying it changed.
 * Messages carry only public data (tournament, stage and participant names, scores, a link) and never ping anyone.
 */

export const DISCORD_EVENT_KINDS = ["invite", "start", "pairings", "results", "advance", "finish"] as const;
export type DiscordEventKind = (typeof DISCORD_EVENT_KINDS)[number];

export const DISCORD_EVENT_LABELS: Record<DiscordEventKind, string> = {
  invite: "Zaproszenie / udostępnienie turnieju (wysyłane przyciskiem)",
  start: "Start turnieju",
  pairings: "Nowe pary (start etapu, nowa runda)",
  results: "Wyniki meczów (z korektami i cofnięciami)",
  advance: "Awans do kolejnej rundy",
  finish: "Koniec turnieju i zwycięzca",
};

export interface SnapshotMatch {
  id: number;
  stageId: number;
  round: number;
  matchNumber: number;
  status: string;
  resultType: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  p1: number | null;
  p2: number | null;
  n1: string | null;
  n2: string | null;
  revision: number;
}

export interface DiscordSnapshot {
  version: 1;
  name: string;
  status: string;
  winnerId: number | null;
  stages: { id: number; name: string; position: number; status: string; format: string }[];
  matches: SnapshotMatch[];
}

export type DiscordEvent =
  | { kind: "start"; key: string }
  | { kind: "pairings"; key: string; stageId: number; round: number; pairs: [string, string][] }
  | { kind: "results"; key: string; type: "result"; matchId: number; side1: string; side2: string; score: string; winner: string | null; draw: boolean; context: string }
  | { kind: "results"; key: string; type: "corrected"; matchId: number; side1: string; side2: string; score: string; winner: string | null; context: string }
  | { kind: "results"; key: string; type: "reverted"; matchId: number; side1: string; side2: string; context: string }
  | { kind: "advance"; key: string; name: string; where: string }
  | { kind: "finish"; key: string; winner: string }
  | { kind: "summary"; key: string; count: number };

/** At most this many messages come out of one comparison; the rest become one summary (no burst of spam). */
export const MAX_EVENTS_PER_DIFF = 8;

const nameOf = (m: SnapshotMatch, id: number | null) => (id == null ? null : id === m.p1 ? m.n1 : id === m.p2 ? m.n2 : null);
const scoreText = (m: SnapshotMatch) => (m.resultType === "walkover" ? "walkower" : `${m.score1 ?? 0}:${m.score2 ?? 0}`);
const sameResult = (a: SnapshotMatch, b: SnapshotMatch) =>
  a.score1 === b.score1 && a.score2 === b.score2 && a.winnerId === b.winnerId && a.resultType === b.resultType;

function roundName(snapshot: DiscordSnapshot, match: Pick<SnapshotMatch, "stageId" | "round">): string {
  const stage = snapshot.stages.find((s) => s.id === match.stageId);
  if (stage?.format === "single_elimination") {
    const total = Math.max(...snapshot.matches.filter((m) => m.stageId === match.stageId).map((m) => m.round));
    const fromEnd = total - match.round;
    const label = fromEnd === 0 ? "Finał" : fromEnd === 1 ? "Półfinał" : fromEnd === 2 ? "Ćwierćfinał" : `Runda ${match.round}`;
    return snapshot.stages.length > 1 && stage ? `${stage.name} · ${label}` : label;
  }
  return `${stage && snapshot.stages.length > 1 ? `${stage.name} · ` : ""}Runda ${match.round}`;
}

const ready = (m: SnapshotMatch) => m.status !== "completed" && m.resultType !== "bye" && m.p1 != null && m.p2 != null && !!m.n1 && !!m.n2;

/** What happened between two snapshots. `prev` null (first look after connecting) only sets the baseline. */
export function discordEvents(prev: DiscordSnapshot | null, next: DiscordSnapshot): DiscordEvent[] {
  if (!prev) return [];
  const before = new Map(prev.matches.map((m) => [m.id, m]));
  const events: DiscordEvent[] = [];

  if (prev.status === "draft" && next.status === "active") events.push({ kind: "start", key: "start" });

  // New pairs: matches of a round that became playable (both sides known) since the last look — at a stage start or a
  // new Swiss round. A single slot filled by an advance is announced as an advance, not as new pairs.
  const advancedInto = new Set<number>();
  const winnersNow = new Map<number, SnapshotMatch>();
  const results: DiscordEvent[] = [];
  for (const m of next.matches) {
    const old = before.get(m.id);
    if (m.resultType === "bye") continue;
    const context = roundName(next, m);
    // a match created and finished between two looks (a quick first result) still counts as a result
    const wasDone = old?.status === "completed";
    const isDone = m.status === "completed";
    if (!wasDone && isDone) {
      if (m.resultType === "no_contest") continue;
      const draw = m.winnerId == null && m.score1 != null && m.score1 === m.score2;
      results.push({ kind: "results", type: "result", key: `result:${m.id}:${m.revision}`, matchId: m.id, side1: m.n1 ?? "?", side2: m.n2 ?? "?",
        score: scoreText(m), winner: nameOf(m, m.winnerId), draw, context });
      if (m.winnerId != null) winnersNow.set(m.winnerId, m);
    } else if (old && wasDone && isDone && !sameResult(old, m)) {
      results.push({ kind: "results", type: "corrected", key: `corrected:${m.id}:${m.revision}`, matchId: m.id, side1: m.n1 ?? "?", side2: m.n2 ?? "?",
        score: scoreText(m), winner: nameOf(m, m.winnerId), context });
    } else if (wasDone && !isDone) {
      results.push({ kind: "results", type: "reverted", key: `reverted:${m.id}:${m.revision}`, matchId: m.id, side1: m.n1 ?? old?.n1 ?? "?", side2: m.n2 ?? old?.n2 ?? "?", context });
    }
  }
  const advances: DiscordEvent[] = [];
  for (const m of next.matches) {
    const old = before.get(m.id);
    if (m.status === "completed") continue;
    for (const [id, name, oldId] of [[m.p1, m.n1, old?.p1 ?? null], [m.p2, m.n2, old?.p2 ?? null]] as const) {
      if (id == null || oldId === id || !name) continue;
      const source = winnersNow.get(id);
      if (source && source.stageId === m.stageId && m.round > source.round) {
        advances.push({ kind: "advance", key: `advance:${m.id}:${id}:${source.revision}`, name, where: roundName(next, m) });
        advancedInto.add(m.id);
      }
    }
  }
  const newlyReady = next.matches.filter((m) => ready(m) && !advancedInto.has(m.id) && !(before.get(m.id) && ready(before.get(m.id)!)));
  const byRound = new Map<string, SnapshotMatch[]>();
  for (const m of newlyReady) {
    const k = `${m.stageId}:${m.round}`;
    byRound.set(k, [...(byRound.get(k) ?? []), m]);
  }
  for (const [k, list] of byRound) {
    // only a whole new set of pairs is "new pairs" (a stage start or a new round), not one slot filled later
    if (list.length < 2 && prev.matches.some((m) => `${m.stageId}:${m.round}` === k)) continue;
    const sorted = [...list].sort((a, b) => a.matchNumber - b.matchNumber);
    events.push({ kind: "pairings", key: `pairings:${k}:${sorted.map((m) => `${m.id}-${m.p1}-${m.p2}`).join(",")}`.slice(0, 200),
      stageId: sorted[0].stageId, round: sorted[0].round, pairs: sorted.map((m) => [m.n1!, m.n2!] as [string, string]) });
  }
  events.push(...results, ...advances);
  if (prev.status !== "completed" && next.status === "completed" && next.winnerId != null) {
    const winner = next.matches.map((m) => nameOf(m, next.winnerId)).find(Boolean);
    if (winner) events.push({ kind: "finish", key: `finish:${next.winnerId}`, winner });
  }
  if (events.length <= MAX_EVENTS_PER_DIFF) return events;
  const kept = events.slice(0, MAX_EVENTS_PER_DIFF - 1);
  return [...kept, { kind: "summary", key: `summary:${events.slice(MAX_EVENTS_PER_DIFF - 1).map((e) => e.key).join("|")}`.slice(0, 200), count: events.length - kept.length }];
}

// ── messages ────────────────────────────────────────────────────────────────

/** Names are plain text on Discord: no mentions, no links, no markdown tricks, bounded length. */
export function discordSafe(text: string, max = 100): string {
  const clean = text
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/@/g, "@​")
    .replace(/https?:\/\//gi, (m) => m.replace(":", "​:"))
    .replace(/([\\*_`~|>#\[\]()-])/g, "\\$1")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export interface DiscordMessage {
  username: string;
  content?: string;
  embeds: { title: string; description?: string; url?: string; color: number; fields?: { name: string; value: string; inline?: boolean }[]; footer?: { text: string } }[];
  allowed_mentions: { parse: never[] };
}

const COLORS = { invite: 0x5865f2, start: 0x22c55e, pairings: 0x0ea5e9, result: 0xf59e0b, corrected: 0xfb923c, reverted: 0x94a3b8, advance: 0xa855f7, finish: 0xfacc15, summary: 0x64748b, test: 0x64748b };

export interface MessageContext { tournamentName: string; link: string | null; signupLink?: string | null }

export function discordMessage(event: DiscordEvent | { kind: "invite" } | { kind: "test" }, ctx: MessageContext): DiscordMessage {
  const t = discordSafe(ctx.tournamentName, 120);
  const base = { username: "SWARM-006", allowed_mentions: { parse: [] as never[] } };
  const url = ctx.link ?? undefined;
  const footer = { text: t };
  switch (event.kind) {
    case "test":
      return { ...base, embeds: [{ title: "Test połączenia", description: `Webhook działa. Tu pojawią się wiadomości turnieju ${t}.`, color: COLORS.test, url, footer }] };
    case "invite":
      return { ...base, embeds: [{ title: `Turniej: ${t}`, description: ctx.signupLink ? "Zapraszamy! Zapisy są otwarte." : "Śledź turniej na żywo.", url, color: COLORS.invite,
        fields: [...(ctx.link ? [{ name: "Turniej", value: ctx.link }] : []), ...(ctx.signupLink ? [{ name: "Zapisy", value: ctx.signupLink }] : [])], footer }] };
    case "start":
      return { ...base, embeds: [{ title: "Turniej wystartował", description: `${t} — powodzenia!`, url, color: COLORS.start, footer }] };
    case "pairings": {
      const lines = event.pairs.slice(0, 16).map(([a, b]) => `${discordSafe(a, 40)} vs ${discordSafe(b, 40)}`);
      if (event.pairs.length > 16) lines.push(`… i ${event.pairs.length - 16} więcej`);
      return { ...base, embeds: [{ title: `Nowe pary — Runda ${event.round}`, description: lines.join("\n"), url, color: COLORS.pairings, footer }] };
    }
    case "results":
      if (event.type === "result") {
        return { ...base, embeds: [{ title: event.draw ? "Remis" : `Wygrywa ${discordSafe(event.winner ?? "?", 60)}`,
          description: `${discordSafe(event.side1, 60)} **${event.score}** ${discordSafe(event.side2, 60)}`, url, color: COLORS.result, footer: { text: `${t} · ${discordSafe(event.context, 60)}` } }] };
      }
      if (event.type === "corrected") {
        return { ...base, embeds: [{ title: "Korekta wyniku", description: `Poprawny wynik: ${discordSafe(event.side1, 60)} **${event.score}** ${discordSafe(event.side2, 60)}${event.winner ? ` — wygrywa ${discordSafe(event.winner, 60)}` : ""}. Wcześniejsza wiadomość o tym meczu jest nieaktualna.`,
          url, color: COLORS.corrected, footer: { text: `${t} · ${discordSafe(event.context, 60)}` } }] };
      }
      return { ...base, embeds: [{ title: "Wynik cofnięty", description: `Wynik meczu ${discordSafe(event.side1, 60)} – ${discordSafe(event.side2, 60)} został cofnięty przez organizatora; mecz zostanie rozegrany lub wpisany ponownie. Wcześniejsza wiadomość o tym meczu jest nieaktualna.`,
        url, color: COLORS.reverted, footer: { text: `${t} · ${discordSafe(event.context, 60)}` } }] };
    case "advance":
      return { ...base, embeds: [{ title: "Awans", description: `${discordSafe(event.name, 60)} → ${discordSafe(event.where, 60)}`, url, color: COLORS.advance, footer }] };
    case "finish":
      return { ...base, embeds: [{ title: "Koniec turnieju", description: `Zwycięzca: **${discordSafe(event.winner, 60)}** 🏆`, url, color: COLORS.finish, footer }] };
    case "summary":
      return { ...base, embeds: [{ title: "Więcej zmian w turnieju", description: `Jeszcze ${event.count} zmian naraz — pełny stan w turnieju.`, url, color: COLORS.summary, footer }] };
  }
}

/** Which setting an event belongs to (a summary follows results). */
export function eventSetting(event: DiscordEvent): DiscordEventKind {
  return event.kind === "summary" ? "results" : event.kind;
}

// ── webhook addresses ─────────────────────────────────────────────────────────

const WEBHOOK = /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api(?:\/v\d{1,2})?\/webhooks\/(\d{5,25})\/([A-Za-z0-9._-]{20,120})$/;

/** Only a real Discord channel webhook is accepted (no other host, no query, no credentials) — no server requests elsewhere. */
export function parseDiscordWebhook(input: unknown): { id: string; token: string; url: string } | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (value.length > 300) return null;
  const match = WEBHOOK.exec(value);
  if (!match) return null;
  return { id: match[1], token: match[2], url: `https://discord.com/api/webhooks/${match[1]}/${match[2]}` };
}

/** A label for the panel: never the token. */
export function webhookHint(id: string): string {
  return `discord.com/api/webhooks/${id.slice(0, 4)}…${id.slice(-4)}/••••`;
}
