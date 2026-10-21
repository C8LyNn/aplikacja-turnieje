/**
 * WEB005 / A50 CAS SOURCE ONLY — actual C03 basket business operations on the
 * EXACT pg client supplied by the CAS adapter, NO nested db.transaction().
 * Not connected to routes/app. Frozen C03 stage service is left unchanged.
 * Read authorization must be supplied by an explicitly approved access policy.
 */
import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { createBasketCasPgSourceAdapter } from "../../domain/tournament/basket-cas-pg-source-adapter.mjs";
import { assertBasketCasSourceActivationAllowed } from "./basket-cas-source-activation-gate.mjs";
import * as schema from "@workspace/db/schema";
import { playersTable, tournamentStagesTable, tournamentsTable } from "@workspace/db/schema";
import type { PoolClient } from "pg";
import { revalidateTournamentMutationActor, type TournamentMutationActor } from "../../access-policy";
import { validateStageBasketConfiguration } from "../../domain/tournament/stage-baskets";
import {
  loadStageBasketConfigurationInTransaction,
  replaceStageBasketConfigurationInTransaction,
} from "./stage-basket-cas-graph-operations";

type Tx = Parameters<typeof replaceStageBasketConfigurationInTransaction>[0];
type Graph = Parameters<typeof replaceStageBasketConfigurationInTransaction>[1];

function requireSession(client: PoolClient): Tx {
  if (!client || typeof client.query !== "function" || typeof client.release !== "function")
    throw new Error("WEB005_CAS_CLIENT_NOT_TRANSACTION_SCOPED");
  // Drizzle's node-postgres facade on the SAME PoolClient does not BEGIN or
  // COMMIT; the CAS source adapter owns exactly one outer transaction.
  return drizzle(client, { schema }) as unknown as Tx;
}
async function requiredTournament(tx: Tx, tournamentId: number) {
  const rows = await tx.select().from(tournamentsTable)
    .where(eq(tournamentsTable.id, tournamentId));
  if (rows.length !== 1) throw new Error("WEB005_CAS_TOURNAMENT_NOT_FOUND");
  return rows[0];
}

/**
 * The current read-policy is route-local. A real reader decision port MUST
 * be explicitly provided, and return literal true; default is DENY.
 */
function createStageBasketCasGraphPorts(input: {
  authorizeRead: (tx: Tx, tournament: typeof tournamentsTable.$inferSelect, actor: unknown) => Promise<boolean>;
}) {
  if (!input || typeof input.authorizeRead !== "function")
    throw new Error("WEB005_CAS_READER_ACCESS_POLICY_REQUIRED");
  return Object.freeze({
    async assertOrganizer(client: PoolClient, parent: {id: number}, actor: TournamentMutationActor) {
      const tx = requireSession(client);
      if (!actor || typeof actor !== "object") throw new Error("WEB005_CAS_ORGANIZER_REQUIRED");
      const row = await requiredTournament(tx, parent.id);
      await revalidateTournamentMutationActor(tx, row, actor);
      return true;
    },
    async assertReader(client: PoolClient, parent: {id: number}, actor: unknown) {
      const tx = requireSession(client);
      const row = await requiredTournament(tx, parent.id);
      if (await input.authorizeRead(tx, row, actor) !== true)
        throw new Error("WEB005_CAS_READ_DENIED");
      return true;
    },
    async readGraph(client: PoolClient, tournamentId: number) {
      const tx = requireSession(client);
      const graph = await loadStageBasketConfigurationInTransaction(tx, tournamentId);
      if (!graph.validation.valid) throw new Error("WEB005_CAS_STORED_GRAPH_INVALID");
      return { baskets: graph.baskets, routes: graph.routes };
    },
    async validateGraph(client: PoolClient, tournamentId: number, graph: Pick<Graph, "baskets"|"routes">) {
      const tx = requireSession(client);
      const tournament = await requiredTournament(tx, tournamentId);
      const stages = await tx.select().from(tournamentStagesTable)
        .where(eq(tournamentStagesTable.tournamentId, tournamentId))
        .orderBy(asc(tournamentStagesTable.id)).for("update");
      if (tournament.status !== "draft" || stages.length === 0 ||
          stages.some(stage => stage.status !== "planned"))
        throw new Error("WEB005_CAS_EDIT_IMMUTABLE");
      const players = await tx.select({id: playersTable.id}).from(playersTable)
        .where(eq(playersTable.tournamentId, tournamentId))
        .orderBy(asc(playersTable.id)).for("update");
      const verdict = validateStageBasketConfiguration({
        stages: stages.map(stage=>({id:stage.id,position:stage.position,participantCount:stage.participantCount})),
        playerIds: players.map(player=>player.id),
        baskets: graph.baskets,
        routes: graph.routes,
      }, "explicit");
      if (!verdict.valid) throw new Error("WEB005_CAS_GRAPH_INVALID");
      return true;
    },
    async replaceGraph(client: PoolClient, tournamentId: number,
                       graph: Pick<Graph, "baskets"|"routes">, actor: TournamentMutationActor) {
      const tx = requireSession(client);
      const result = await replaceStageBasketConfigurationInTransaction(tx, {
        tournamentId, baskets: graph.baskets, routes: graph.routes, actor,
      });
      if (!result.validation.valid) throw new Error("WEB005_CAS_REPLACED_GRAPH_INVALID");
      return true;
    },
  });
}

/** Export ONLY the sealed adapter, never mutable raw graph ports. */
export function createStageBasketCasSourcePersistence(input: {
  pool: { connect: (...args: never[]) => Promise<unknown> };
  authorizeRead: (tx: Tx, tournament: typeof tournamentsTable.$inferSelect, actor: unknown) => Promise<boolean>;
}) {
  // Disable real composition until full A20 writer proof + approved T055.
  assertBasketCasSourceActivationAllowed();
  const ports = createStageBasketCasGraphPorts(input);
  return createBasketCasPgSourceAdapter({ pool: input.pool, ports });
}
