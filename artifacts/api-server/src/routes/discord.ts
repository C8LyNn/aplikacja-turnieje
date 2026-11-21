// #324-L05 · Discord notifications: settings for the tournament owner only (like visibility and sharing). Nothing here
// returns the webhook address — only a masked hint — and nothing is public.
import { Router, type IRouter, type Response } from "express";
import { requireOrganizer } from "../access-policy";
import {
  DiscordIntegrationError,
  disconnectDiscord,
  discordPreview,
  getDiscordStatus,
  queueDiscordInvite,
  saveDiscordConfig,
  sendDiscordTest,
} from "../application/integrations/discord-notifier";
import { DISCORD_EVENT_KINDS, DISCORD_EVENT_LABELS } from "../domain/tournament/discord-notifications";

const router: IRouter = Router();

function tournamentId(raw: unknown): number | null {
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
function sendError(res: Response, error: unknown): boolean {
  if (!(error instanceof DiscordIntegrationError)) return false;
  const status = error.code === "NOT_CONFIGURED" ? 404 : error.code === "TOO_MANY_TESTS" ? 429 : error.code === "NOT_PUBLIC" || error.code === "DISABLED" ? 409 : 422;
  res.status(status).json({ error: error.message, code: error.code });
  return true;
}
const body = (value: unknown) => (typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {});

router.get("/tournaments/:id/discord", async (req, res): Promise<void> => {
  const id = tournamentId(req.params.id);
  if (!id) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  const access = await requireOrganizer(req, res, id);
  if (!access) return;
  res.setHeader("Cache-Control", "no-store");
  res.json({ ...await getDiscordStatus(access.tournament), kinds: DISCORD_EVENT_KINDS.map((kind) => ({ kind, label: DISCORD_EVENT_LABELS[kind] })) });
});

router.get("/tournaments/:id/discord/preview", async (req, res): Promise<void> => {
  const id = tournamentId(req.params.id);
  if (!id) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  const access = await requireOrganizer(req, res, id);
  if (!access) return;
  res.setHeader("Cache-Control", "no-store");
  res.json({ examples: discordPreview(access.tournament, req.get("origin")) });
});

router.put("/tournaments/:id/discord", async (req, res): Promise<void> => {
  const id = tournamentId(req.params.id);
  if (!id) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  const access = await requireOrganizer(req, res, id);
  if (!access) return;
  try {
    await saveDiscordConfig({ tournament: access.tournament, body: body(req.body), origin: req.get("origin") });
    res.json(await getDiscordStatus(access.tournament));
  } catch (error) {
    if (sendError(res, error)) return;
    throw error;
  }
});

router.delete("/tournaments/:id/discord", async (req, res): Promise<void> => {
  const id = tournamentId(req.params.id);
  if (!id) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  const access = await requireOrganizer(req, res, id);
  if (!access) return;
  await disconnectDiscord(id);
  res.status(204).end();
});

router.post("/tournaments/:id/discord/test", async (req, res): Promise<void> => {
  const id = tournamentId(req.params.id);
  if (!id) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  const access = await requireOrganizer(req, res, id);
  if (!access) return;
  try {
    res.json(await sendDiscordTest(access.tournament));
  } catch (error) {
    if (sendError(res, error)) return;
    throw error;
  }
});

router.post("/tournaments/:id/discord/invite", async (req, res): Promise<void> => {
  const id = tournamentId(req.params.id);
  if (!id) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  const access = await requireOrganizer(req, res, id);
  if (!access) return;
  try {
    res.json(await queueDiscordInvite(access.tournament, body(req.body).requestId));
  } catch (error) {
    if (sendError(res, error)) return;
    throw error;
  }
});

export default router;
