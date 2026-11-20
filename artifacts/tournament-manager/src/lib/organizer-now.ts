/**
 * QW-04 · "Co teraz?" for the organizer: the one action that moves the tournament on, plus one-tap access to the
 * matches being played and the ones ready next. Everything comes from data the host already has:
 * - the lifecycle step is the existing `deriveOrganizerNextStep` model (draft, entrants, stage start, Swiss round,
 *   stage completion, next stage, finished) with its capability-gated action;
 * - "live" = matches the organizer marked in progress; "ready" = pending matches with both participants, in the
 *   host's own queue order. No order is forced: any listed match can be opened.
 */
import type { Match } from "@workspace/api-client-react";
import type { OrganizerNextStepModel } from "./organizer-next-step";

type NowMatch = Pick<Match, "id" | "status" | "player1Id" | "player2Id" | "player1Name" | "player2Name" | "round" | "matchNumber">;

export type OrganizerNowPrimary<M extends NowMatch> =
  | { type: "result"; match: M; label: string }
  | { type: "step"; label: string; href?: string; onAction: boolean }
  | null;

export interface OrganizerNow<M extends NowMatch> {
  title: string;
  description: string;
  primary: OrganizerNowPrimary<M>;
  live: M[];
  ready: M[];
}

export const pairText = (m: NowMatch) => `${m.player1Name ?? "?"} – ${m.player2Name ?? "?"}`;

export function deriveOrganizerNow<M extends NowMatch>(input: {
  step: OrganizerNextStepModel | null | undefined;
  /** The host's queue (actionable matches of the active stage, already in queue order). */
  queue: readonly M[];
  canWriteResults: boolean;
  /** Swiss round generation is run in place by the host (existing handler). */
  stepRunsInPlace?: boolean;
  limit?: number;
}): OrganizerNow<M> | null {
  const { step, queue, canWriteResults, limit = 4 } = input;
  if (!step) return null;
  const playable = (m: M) => m.player1Id != null && m.player2Id != null;
  const live = queue.filter((m) => m.status === "in_progress" && playable(m));
  const ready = queue.filter((m) => m.status === "pending" && playable(m));

  if (step.kind === "active_matches") {
    const target = canWriteResults ? live[0] ?? ready[0] : undefined;
    return {
      title: target ? (target.status === "in_progress" ? "Wpisz wynik meczu w toku" : "Rozegraj następny mecz") : step.title,
      description: step.description,
      primary: target ? { type: "result", match: target, label: `Wpisz wynik: ${pairText(target)}` } : null,
      live: live.slice(0, limit),
      ready: ready.filter((m) => m.id !== target?.id).slice(0, limit - 1),
    };
  }

  const primary: OrganizerNowPrimary<M> = step.actionLabel && (step.actionHref || input.stepRunsInPlace)
    ? { type: "step", label: step.actionLabel, href: input.stepRunsInPlace ? undefined : step.actionHref, onAction: !!input.stepRunsInPlace }
    : null;
  return { title: step.title, description: step.description, primary, live: live.slice(0, limit), ready: [] };
}

export type ViewerShare =
  | { kind: "public"; note: string }
  | { kind: "password"; note: string }
  | { kind: "closed"; note: string };

/** What the organizer may tell viewers, following the tournament's visibility (the sharing panel's rules). */
export function viewerShareFor(visibility: string | null | undefined): ViewerShare {
  if (visibility === "private_offline") {
    return { kind: "closed", note: "Turniej jest ukryty: widzowie nie mają dostępu, także pod znanym linkiem. Opublikuj go, gdy będzie gotowy." };
  }
  if (visibility === "private_online") {
    return { kind: "password", note: "Kibice otworzą link po podaniu hasła widza." };
  }
  return { kind: "public", note: "Każdy z tym linkiem może śledzić turniej (tylko odczyt)." };
}
