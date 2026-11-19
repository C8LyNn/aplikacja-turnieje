/**
 * V5.4-006 · which views a viewer gets, decided by the real kind of the stage being shown
 * (never by the tournament's name or its compatibility `format` column).
 */
import type { TournamentStage } from "@workspace/api-client-react";

export type AudienceSectionId = "live" | "table" | "bracket" | "matches" | "players" | "stats" | "stages";

export interface AudienceSectionDef {
  id: AudienceSectionId;
  label: string;
}

type StageLike = Pick<TournamentStage, "id" | "format" | "status" | "position" | "name">;

const TABLE_LABELS: Record<string, string> = { group_stage: "Grupy", round_robin: "Tabela", swiss: "Ranking" };
const MATCHES_LABELS: Record<string, string> = { group_stage: "Mecze grup", round_robin: "Terminarz", swiss: "Rundy" };
const BRACKET_FORMATS = new Set(["single_elimination", "double_elimination"]);

export function stageHasTable(format: string | undefined): boolean {
  return format != null && format in TABLE_LABELS;
}

export function stageHasBracket(format: string | undefined): boolean {
  return format != null && BRACKET_FORMATS.has(format);
}

/** Tabs for the shown stage: its primary view first after "Na żywo", aggregate statistics last. */
export function audienceSectionsFor(stage: Pick<StageLike, "format"> | undefined): AudienceSectionDef[] {
  const sections: AudienceSectionDef[] = [{ id: "live", label: "Na żywo" }];
  if (stage && stageHasTable(stage.format)) sections.push({ id: "table", label: TABLE_LABELS[stage.format] });
  if (stage && stageHasBracket(stage.format)) sections.push({ id: "bracket", label: "Drabinka" });
  sections.push({ id: "matches", label: (stage && MATCHES_LABELS[stage.format]) ?? "Mecze" });
  sections.push({ id: "players", label: "Uczestnicy" });
  sections.push({ id: "stats", label: "Statystyki" });
  return sections;
}

/**
 * The view a public link opens. QW-05 (#323): always the "Na żywo" summary — NOW → NEXT → RECENT, with the table's
 * top and a link to the full bracket/table — so a viewer first learns what is happening; the full structure is one
 * tap away. Links that name a section (?section=bracket|table|…) keep opening it.
 */
export function primarySectionFor(_stage: Pick<StageLike, "format"> | undefined, _hasLiveMatch: boolean): AudienceSectionId {
  return "live";
}

/** Old links (?section=standings / bracket / stages) keep working and land on the nearest current view. */
export function resolveAudienceSection(
  requested: string | null,
  stage: Pick<StageLike, "format"> | undefined,
  hasLiveMatch: boolean,
): AudienceSectionId {
  const sections = audienceSectionsFor(stage).map((section) => section.id);
  if (requested === "stages") return "stages";
  if (requested === "standings") return "stats";
  // Stage not known yet (loading or a failed read): keep the requested view, never guess from the
  // tournament's compatibility format.
  if (!stage) return requested && (["live", "table", "bracket", "matches", "players", "stats"] as string[]).includes(requested) ? requested as AudienceSectionId : "live";
  if (requested === "bracket" && stage && stageHasTable(stage.format)) return "table";
  if (requested === "table" && stage && stageHasBracket(stage.format)) return "bracket";
  if (requested && (sections as string[]).includes(requested)) return requested as AudienceSectionId;
  return primarySectionFor(stage, hasLiveMatch);
}

/** The stage to show: the one in the URL, else the active one, else the last finished, else the first planned. */
export function chooseViewStage<T extends StageLike>(stages: readonly T[] | undefined, requestedId: number | null, activeStageId?: number | null): T | undefined {
  if (!stages || stages.length === 0) return undefined;
  const ordered = [...stages].sort((a, b) => a.position - b.position);
  return ordered.find((stage) => stage.id === requestedId)
    ?? ordered.find((stage) => stage.id === activeStageId && stage.status === "active")
    ?? ordered.find((stage) => stage.status === "active")
    ?? [...ordered].reverse().find((stage) => stage.status === "completed")
    ?? ordered[0];
}

export const STAGE_STATE_LABELS: Record<string, string> = {
  planned: "Planowany",
  active: "Trwa",
  completed: "Zakończony",
};

/** Heading used for match groups: "Kolejka 3" in a league, "Runda 3" elsewhere. */
export function roundHeading(format: string | undefined, round: number): string {
  return format === "round_robin" ? `Kolejka ${round}` : `Runda ${round}`;
}
