import { Router, type IRouter } from "express";
import { PlanTemplateError, previewTournamentTemplate } from "../domain/tournament/tournament-plan-templates";

/** Public read-only plan preview; does not accept credentials or save anything. */
const router: IRouter = Router();
router.post("/tournaments/plan-preview", (req, res): void => {
  try {
    res.status(200).json(previewTournamentTemplate(req.body));
  } catch (error) {
    if (error instanceof PlanTemplateError) {
      res.status(422).json({ code: error.code, error: error.message });
      return;
    }
    throw error;
  }
});
export default router;
