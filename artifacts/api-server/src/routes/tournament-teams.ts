import { Router, type IRouter, type Request, type Response } from "express";
import { requireOrganizer, requireTournamentRead, requireTournamentWrite } from "../access-policy";
import {
  TeamRosterError,
  addTeamMember,
  changeTeamMemberRole,
  getTeamHistory,
  getTeamsOverview,
  removeTeamMember,
  updateTeamDetails,
  updateTeamSettings,
} from "../application/teams/team-rosters";

/** V5 · Stage D — team rosters. Teams are keyed by their engine entry id. */
const router: IRouter = Router();

function ids(req: Request, res: Response, keys: string[]): number[] | null {
  const values = keys.map((key) => Number(req.params[key]));
  if (values.some((value) => !Number.isInteger(value) || value <= 0)) {
    res.status(400).json({ error: "Invalid id" });
    return null;
  }
  return values;
}

function fail(error: unknown, res: Response): void {
  if (error instanceof TeamRosterError) {
    res.status(error.status).json({ error: error.message, code: error.code, ...(error.details ? { details: error.details } : {}) });
    return;
  }
  throw error;
}

router.get("/tournaments/:id/teams", async (req, res): Promise<void> => {
  const parsed = ids(req, res, ["id"]);
  if (!parsed) return;
  if (!await requireTournamentRead(req, res, parsed[0])) return;
  try { res.json(await getTeamsOverview(parsed[0])); } catch (error) { fail(error, res); }
});

router.get("/tournaments/:id/teams/:entryId/history", async (req, res): Promise<void> => {
  const parsed = ids(req, res, ["id", "entryId"]);
  if (!parsed) return;
  if (!await requireTournamentRead(req, res, parsed[0])) return;
  try { res.json(await getTeamHistory(parsed[0], parsed[1])); } catch (error) { fail(error, res); }
});

router.put("/tournaments/:id/team-settings", async (req, res): Promise<void> => {
  const parsed = ids(req, res, ["id"]);
  if (!parsed) return;
  if (!await requireOrganizer(req, res, parsed[0])) return;
  try { res.json(await updateTeamSettings(parsed[0], req.body)); } catch (error) { fail(error, res); }
});

router.patch("/tournaments/:id/teams/:entryId", async (req, res): Promise<void> => {
  const parsed = ids(req, res, ["id", "entryId"]);
  if (!parsed) return;
  if (!await requireTournamentWrite(req, res, parsed[0])) return;
  try { res.json(await updateTeamDetails(parsed[0], parsed[1], req.body)); } catch (error) { fail(error, res); }
});

router.post("/tournaments/:id/teams/:entryId/members", async (req, res): Promise<void> => {
  const parsed = ids(req, res, ["id", "entryId"]);
  if (!parsed) return;
  if (!await requireTournamentWrite(req, res, parsed[0])) return;
  try { res.status(201).json(await addTeamMember(parsed[0], parsed[1], req.body)); } catch (error) { fail(error, res); }
});

router.patch("/tournaments/:id/teams/:entryId/members/:memberId", async (req, res): Promise<void> => {
  const parsed = ids(req, res, ["id", "entryId", "memberId"]);
  if (!parsed) return;
  if (!await requireTournamentWrite(req, res, parsed[0])) return;
  try { res.json(await changeTeamMemberRole(parsed[0], parsed[1], parsed[2], req.body)); } catch (error) { fail(error, res); }
});

router.delete("/tournaments/:id/teams/:entryId/members/:memberId", async (req, res): Promise<void> => {
  const parsed = ids(req, res, ["id", "entryId", "memberId"]);
  if (!parsed) return;
  if (!await requireTournamentWrite(req, res, parsed[0])) return;
  try { res.json(await removeTeamMember(parsed[0], parsed[1], parsed[2])); } catch (error) { fail(error, res); }
});

export default router;
