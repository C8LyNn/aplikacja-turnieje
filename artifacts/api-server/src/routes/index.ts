import steamGameCatalogRouter from "./steam-game-catalog";
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import coreClashMultiplayerRouter from "./core-clash-multiplayer";
import tournamentsRouter from "./tournaments";
import tournamentSeCorrectionPreflightRouter from "./tournament-se-correction-preflight";
import tournamentSeCorrectionReadinessRouter from "./tournament-se-correction-readiness";
import controlledCorrectionRevertRouter from "./tournament-controlled-correction-revert";
import correctionOperationStatusRouter from "./tournament-correction-operation-status";
import atomicCorrectionRouter from "./tournament-atomic-correction";
import qualificationRoutingPreviewRouter from "./tournament-qualification-routing-preview";
import resultCorrectionPreviewRouter from "./tournament-result-correction-preview";
import tournamentPlanPreviewRouter from "./tournament-plan-preview";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(coreClashMultiplayerRouter);
router.use(authRouter);
router.use(tournamentPlanPreviewRouter);
router.use(qualificationRoutingPreviewRouter);
router.use(resultCorrectionPreviewRouter);
router.use(tournamentSeCorrectionPreflightRouter);
router.use(tournamentSeCorrectionReadinessRouter);
router.use(tournamentsRouter);
router.use(controlledCorrectionRevertRouter);
router.use(correctionOperationStatusRouter);
router.use(atomicCorrectionRouter);
router.use(steamGameCatalogRouter);

export default router;
