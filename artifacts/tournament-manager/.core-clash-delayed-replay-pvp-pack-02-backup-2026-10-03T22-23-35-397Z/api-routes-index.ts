import steamGameCatalogRouter from "./steam-game-catalog";
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import coreClashMultiplayerRouter from "./core-clash-multiplayer";
import tournamentsRouter from "./tournaments";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(coreClashMultiplayerRouter);
router.use(authRouter);
router.use(tournamentsRouter);
router.use(steamGameCatalogRouter);

export default router;
