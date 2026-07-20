import {
  getStageSeedingCeremony,
  prepareStageSeedingCeremony,
  resetStageSeedingCeremony,
  revealAllStageSeedingDraws,
  revealNextStageSeedingDraw,
  type SeedingCeremony as GeneratedSeedingCeremony,
  type SeedingCeremonyDraw as GeneratedSeedingCeremonyDraw,
  type SeedingCeremonyPlacement as GeneratedSeedingCeremonyPlacement,
} from "@workspace/api-client-react";

export type SeedingCeremonyState = GeneratedSeedingCeremony;
export type SeedingCeremonyDraw = GeneratedSeedingCeremonyDraw;
export type SeedingCeremonyPlacement = GeneratedSeedingCeremonyPlacement;

export async function fetchSeedingCeremony(
  tournamentId: number,
  stageId: number,
): Promise<SeedingCeremonyState | null> {
  const response = await getStageSeedingCeremony(tournamentId, stageId);
  return response.ceremony;
}

async function mutateCeremony(
  tournamentId: number,
  stageId: number,
  request: (tournamentId: number, stageId: number) => Promise<{ ceremony: GeneratedSeedingCeremony | null }>,
): Promise<SeedingCeremonyState> {
  const response = await request(tournamentId, stageId);
  if (!response.ceremony) throw new Error("Serwer nie zwrócił stanu losowania.");
  return response.ceremony;
}

export function prepareSeedingCeremony(tournamentId: number, stageId: number) {
  return mutateCeremony(tournamentId, stageId, prepareStageSeedingCeremony);
}

export function revealNextSeedingDraw(tournamentId: number, stageId: number) {
  return mutateCeremony(tournamentId, stageId, revealNextStageSeedingDraw);
}

export function revealAllSeedingDraws(tournamentId: number, stageId: number) {
  return mutateCeremony(tournamentId, stageId, revealAllStageSeedingDraws);
}

export async function resetSeedingCeremony(tournamentId: number, stageId: number): Promise<void> {
  await resetStageSeedingCeremony(tournamentId, stageId);
}
