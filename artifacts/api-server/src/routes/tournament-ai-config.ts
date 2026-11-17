import { Router, type IRouter } from "express";
import {
  AI_CONFIG_SCHEMA_VERSION,
  buildAiConfigJsonSchema,
  buildAiSpecification,
  buildAiSpecificationMarkdown,
  validateAiTournamentConfigText,
} from "../domain/tournament/ai-tournament-config";

/**
 * V5 · Stage B — AI specification download and validate-only import.
 * Public, credential-free and side-effect-free: nothing is stored; the user still
 * names the tournament, sets passwords and confirms creation in the UI.
 */
const router: IRouter = Router();

router.get("/tournaments/ai-spec", (_req, res): void => {
  res.json(buildAiSpecification());
});

router.get("/tournaments/ai-spec.md", (_req, res): void => {
  res
    .status(200)
    .type("text/markdown; charset=utf-8")
    .setHeader("Content-Disposition", `attachment; filename="swarm006-specyfikacja-ai-v${AI_CONFIG_SCHEMA_VERSION}.md"`);
  res.send(buildAiSpecificationMarkdown());
});

router.get("/tournaments/ai-spec/schema.json", (_req, res): void => {
  res
    .status(200)
    .type("application/schema+json; charset=utf-8")
    .setHeader("Content-Disposition", `attachment; filename="swarm006-tournament-config-v${AI_CONFIG_SCHEMA_VERSION}.schema.json"`);
  res.send(JSON.stringify(buildAiConfigJsonSchema(), null, 2));
});

router.post("/tournaments/ai-config/validate", (req, res): void => {
  const body = req.body as unknown;
  const keys = body && typeof body === "object" && !Array.isArray(body) ? Object.keys(body) : null;
  if (!keys || keys.length !== 1 || keys[0] !== "text") {
    res.status(400).json({ valid: false, problems: [{ path: "", code: "INVALID_JSON", message: "Wyślij { \"text\": \"<treść pliku JSON>\" }." }] });
    return;
  }
  const result = validateAiTournamentConfigText((body as { text: unknown }).text);
  res.status(result.valid ? 200 : 422).json(result);
});

export default router;
