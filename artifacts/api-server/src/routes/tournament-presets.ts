import { Router, type IRouter } from "express";
import {
  PLANNED_PRESETS,
  PRESET_CATALOG_VERSION,
  PRESET_DEFINITIONS,
  PRESET_IDS,
  PresetError,
  parsePresetPreviewRequest,
  parseWizardAnswers,
  previewPreset,
  recommendPresets,
} from "../domain/tournament/tournament-presets";

/**
 * V5 preset catalog. Public and read-only: accepts no credentials, stores nothing.
 * The created tournament is still validated again by POST /tournaments.
 */
const router: IRouter = Router();

function sendPresetError(error: unknown, res: import("express").Response): void {
  if (error instanceof PresetError) {
    res.status(422).json({ code: error.code, error: error.message, ...(error.param ? { param: error.param } : {}) });
    return;
  }
  throw error;
}

router.get("/tournaments/presets", (_req, res): void => {
  res.json({
    version: PRESET_CATALOG_VERSION,
    presets: PRESET_IDS.map((id) => ({ ...PRESET_DEFINITIONS[id], available: true })),
    planned: PLANNED_PRESETS.map((item) => ({ ...item, available: false })),
  });
});

router.post("/tournaments/presets/recommend", (req, res): void => {
  try {
    res.json(recommendPresets(parseWizardAnswers(req.body)));
  } catch (error) {
    sendPresetError(error, res);
  }
});

router.post("/tournaments/presets/preview", (req, res): void => {
  try {
    res.json(previewPreset(parsePresetPreviewRequest(req.body)));
  } catch (error) {
    sendPresetError(error, res);
  }
});

export default router;
