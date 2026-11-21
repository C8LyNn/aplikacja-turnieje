import { t } from "@/i18n";
/**
 * #324-L05 · Discord notifications — client side. The webhook address goes to the server once (when pasted) and never
 * comes back: the panel only sees a masked hint. Requests use `customFetch`, so the organizer token is attached.
 */
import { customFetch } from "@workspace/api-client-react";

export type DiscordKind = "invite" | "start" | "pairings" | "results" | "advance" | "finish";

export interface DiscordStatus {
  configured: boolean;
  enabled: boolean;
  events: DiscordKind[];
  public: boolean;
  hint?: string;
  status?: "ok" | "broken" | "key_unavailable";
  lastError?: string | null;
  lastDeliveryAt?: string | null;
  counts?: { pending: number; failed: number; sent: number };
  recent?: { kind: string; status: string; attempts: number; lastError: string | null; createdAt: string; sentAt: string | null; title: string }[];
  kinds?: { kind: DiscordKind; label: string }[];
}

export interface DiscordEmbed { title: string; description?: string; url?: string; color: number; fields?: { name: string; value: string }[]; footer?: { text: string } }
export interface DiscordExample { kind: DiscordKind; message: { username: string; embeds: DiscordEmbed[] } }

const json = (method: string, body?: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

export const fetchDiscordStatus = (id: number) => customFetch<DiscordStatus>(`/api/tournaments/${id}/discord`, { cache: "no-store" });
export const fetchDiscordPreview = (id: number) => customFetch<{ examples: DiscordExample[] }>(`/api/tournaments/${id}/discord/preview`, { cache: "no-store" });
export const saveDiscord = (id: number, body: { webhookUrl?: string; enabled?: boolean; events?: DiscordKind[] }) => customFetch<DiscordStatus>(`/api/tournaments/${id}/discord`, json("PUT", body));
export const disconnectDiscord = (id: number) => customFetch<void>(`/api/tournaments/${id}/discord`, { method: "DELETE" });
export const testDiscord = (id: number) => customFetch<{ ok: boolean; message: string }>(`/api/tournaments/${id}/discord/test`, json("POST", {}));
export const inviteDiscord = (id: number, requestId: string) => customFetch<{ queued: boolean }>(`/api/tournaments/${id}/discord/invite`, json("POST", { requestId }));

/** Quick check before sending: the server validates again (only real Discord channel webhooks). */
export function looksLikeDiscordWebhook(value: string): boolean {
  return /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api(?:\/v\d{1,2})?\/webhooks\/\d{5,25}\/[A-Za-z0-9._-]{20,120}$/.test(value.trim());
}

export function discordErrorMessage(error: unknown, fallback = t("discordIntegration.nie_udalo_sie_sprobuj_ponownie")): string {
  return (error as { data?: { error?: string } } | null)?.data?.error ?? fallback;
}

export const KIND_TITLE: Record<DiscordKind, string> = {
  get invite() { return t("discordIntegration.zaproszenie"); }, get start() { return t("discordIntegration.start_turnieju"); }, get pairings() { return t("discordIntegration.nowe_pary"); }, get results() { return t("discordIntegration.wyniki_z_korektami"); }, get advance() { return t("discordIntegration.awans"); }, get finish() { return t("discordIntegration.zwyciezca"); },
};
