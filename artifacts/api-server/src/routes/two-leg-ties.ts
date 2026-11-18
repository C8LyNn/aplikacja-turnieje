/**
 * V5.10 — two-legged ties: record / revert one leg, set a leg's date, decide a tie (level aggregate).
 * The organizer (or support) writes; everyone who may read the tournament sees the legs in the match view.
 */
import { Router, type IRouter, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, matchesTable } from "@workspace/db";
import { getTournamentMutationActor, requireTournamentWrite } from "../access-policy";
import { CompleteMatchError } from "../application/matches/complete-match";
import { RevertMatchError } from "../application/matches/revert-match";
import {
  decideTie,
  recordLegResult,
  revertLegResult,
  scheduleLeg,
  TwoLegTieError,
} from "../application/matches/two-leg-ties";
import { enrichMatches, sendRevertMatchError } from "./tournaments";

const router: IRouter = Router();

function readIds(params: Record<string, string>): { matchId: number; leg: number | null } | null {
  const matchId = Number(params.id);
  if (!Number.isSafeInteger(matchId) || matchId < 1) return null;
  if (params.leg === undefined) return { matchId, leg: null };
  const leg = Number(params.leg);
  return leg === 1 || leg === 2 ? { matchId, leg } : null;
}

function body(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
}

function sendError(res: Response, error: unknown): boolean {
  if (error instanceof TwoLegTieError) {
    res.status(error.status).json({ error: error.message, code: error.code });
    return true;
  }
  if (error instanceof CompleteMatchError) {
    const status = error.code === "MATCH_ALREADY_FINALIZED" || error.code === "CONCURRENT_MODIFICATION" ? 409 : error.code === "MATCH_NOT_FOUND" ? 404 : 422;
    res.status(status).json({ error: error.message, code: error.code });
    return true;
  }
  if (error instanceof RevertMatchError) {
    sendRevertMatchError(error, res);
    return true;
  }
  return false;
}

async function writeAccess(req: Parameters<typeof requireTournamentWrite>[0], res: Response, matchId: number) {
  const [reference] = await db.select({ tournamentId: matchesTable.tournamentId }).from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!reference) {
    res.status(404).json({ error: "Mecz nie istnieje.", code: "MATCH_NOT_FOUND" });
    return null;
  }
  const access = await requireTournamentWrite(req, res, reference.tournamentId);
  return access ? getTournamentMutationActor(access) : null;
}

router.post("/matches/:id/legs/:leg/result", async (req, res): Promise<void> => {
  const ids = readIds(req.params);
  if (!ids || ids.leg == null) { res.status(400).json({ error: "Nieprawidłowy mecz lub numer spotkania (1 albo 2).", code: "INVALID_LEG" }); return; }
  const actor = await writeAccess(req, res, ids.matchId);
  if (!actor) return;
  const input = body(req.body);
  try {
    const result = await recordLegResult({ matchId: ids.matchId, leg: ids.leg, score1: input.score1, score2: input.score2, expectedRevision: input.expectedRevision, actor });
    const [view] = await enrichMatches([result.match], "organizer");
    res.json(result.alreadyRecorded ? { ...view, message: "Ten wynik był już zapisany." } : view);
  } catch (error) {
    if (!sendError(res, error)) throw error;
  }
});

router.post("/matches/:id/legs/:leg/revert", async (req, res): Promise<void> => {
  const ids = readIds(req.params);
  if (!ids || ids.leg == null) { res.status(400).json({ error: "Nieprawidłowy mecz lub numer spotkania (1 albo 2).", code: "INVALID_LEG" }); return; }
  const actor = await writeAccess(req, res, ids.matchId);
  if (!actor) return;
  try {
    const result = await revertLegResult({ matchId: ids.matchId, leg: ids.leg, expectedRevision: body(req.body).expectedRevision, actor });
    const [view] = await enrichMatches([result.match], "organizer");
    res.json(result.alreadyReverted ? { ...view, message: "Ten wynik był już cofnięty." } : view);
  } catch (error) {
    if (!sendError(res, error)) throw error;
  }
});

router.put("/matches/:id/legs/:leg/schedule", async (req, res): Promise<void> => {
  const ids = readIds(req.params);
  if (!ids || ids.leg == null) { res.status(400).json({ error: "Nieprawidłowy mecz lub numer spotkania (1 albo 2).", code: "INVALID_LEG" }); return; }
  const actor = await writeAccess(req, res, ids.matchId);
  if (!actor) return;
  const input = body(req.body);
  if (!("scheduledAt" in input) || !("expectedScheduledAt" in input)) {
    res.status(422).json({ error: "Podaj termin (scheduledAt) i termin, który widziałeś (expectedScheduledAt).", code: "SCHEDULE_INVALID" });
    return;
  }
  try {
    const match = await scheduleLeg({ matchId: ids.matchId, leg: ids.leg, scheduledAt: input.scheduledAt, expectedScheduledAt: input.expectedScheduledAt, actor });
    const [view] = await enrichMatches([match], "organizer");
    res.json(view);
  } catch (error) {
    if (!sendError(res, error)) throw error;
  }
});

router.post("/matches/:id/tie-decision", async (req, res): Promise<void> => {
  const ids = readIds(req.params);
  if (!ids) { res.status(400).json({ error: "Nieprawidłowy mecz.", code: "INVALID_MATCH" }); return; }
  const actor = await writeAccess(req, res, ids.matchId);
  if (!actor) return;
  const input = body(req.body);
  try {
    const match = await decideTie({ matchId: ids.matchId, winnerId: input.winnerId, reason: input.reason, expectedRevision: input.expectedRevision, actor });
    const [view] = await enrichMatches([match], "organizer");
    res.json(view);
  } catch (error) {
    if (!sendError(res, error)) throw error;
  }
});

export default router;
