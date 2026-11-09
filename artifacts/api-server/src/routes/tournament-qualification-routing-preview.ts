/** Read-only organizer/support view of stage qualification and basket routing. */
import { Router, type IRouter } from "express";
import { requireTournamentWrite } from "../access-policy";
import { listTournamentStages } from "../application/stages/stage-queries";
import { getStageBasketConfiguration } from "../application/stages/stage-basket-configuration";
import { getQualificationProposal } from "../application/stages/stage-basket-qualification";
import { getBasketRouteStatus } from "../application/stages/stage-basket-route-execution";
import { deriveQualificationRoutingPreview } from "../application/operations/tournament-qualification-routing-preflight";

const router: IRouter = Router();

router.get("/tournaments/:id/operations/qualification-routing-preview", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ code: "INVALID_TOURNAMENT_ID", error: "Invalid tournament ID" });
    return;
  }
  // This contains organizer-only operational information; public viewers must
  // not be able to inspect unpublished proposal and routing states.
  const access = await requireTournamentWrite(req, res, id);
  if (!access) return;

  const [stages, configuration] = await Promise.all([
    listTournamentStages(id), getStageBasketConfiguration(id),
  ]);
  if (configuration.flowAuthority !== "basket_v1" || !configuration.validation.valid) {
    res.json(deriveQualificationRoutingPreview({
      tournamentId: id,
      flowAuthority: configuration.flowAuthority,
      validConfiguration: configuration.validation.valid,
      configurationProblems: configuration.validation.problems,
      stages, baskets: configuration.baskets, routes: configuration.routes,
      proposals: [], routeStatuses: [],
    }));
    return;
  }
  const basketById = new Map(configuration.baskets.map(basket => [basket.id, basket]));
  const sourceStageIds = [...new Set(configuration.baskets
    .filter(basket => basket.type === "output" && (basket.qualifierCount ?? 0) > 0)
    .map(basket => basket.stageId))];
  const [proposals, routeStatuses] = await Promise.all([
    Promise.all(sourceStageIds.map(stageId => getQualificationProposal(id, stageId))),
    Promise.all(configuration.routes.map(route => {
      const source = basketById.get(route.sourceBasketId);
      if (!source || source.type !== "output") return Promise.resolve(null);
      return getBasketRouteStatus(id, source.stageId, route.sourceBasketId);
    })),
  ]);
  res.json(deriveQualificationRoutingPreview({
    tournamentId: id,
    flowAuthority: configuration.flowAuthority,
    validConfiguration: configuration.validation.valid,
    configurationProblems: configuration.validation.problems,
    stages, baskets: configuration.baskets, routes: configuration.routes,
    proposals: proposals.filter((proposal): proposal is NonNullable<typeof proposal> => proposal !== null),
    routeStatuses: routeStatuses.filter((status): status is NonNullable<typeof status> => status !== null),
  }));
});

export default router;
