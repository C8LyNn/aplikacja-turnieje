import steamGameCatalogRouter from "./steam-game-catalog";
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tournamentsRouter from "./tournaments";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tournamentsRouter);
router.use(steamGameCatalogRouter);

export default router;
