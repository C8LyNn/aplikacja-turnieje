/**
 * WEB-005 T055 / R23C — isolated, inactive Basket CAS transport contract.
 *
 * This module is NOT imported by the current StageBasketsPanel. Callers must
 * explicitly confirm both feature approval and deployed SERVER capability.
 * No ETag is ever generated client-side, inferred from graph JSON or stored
 * independently of its originating tournament + authentication epoch.
 */
export interface BasketCasScope {
  readonly tournamentId: number;
  /** Non-secret, locally generated auth/role epoch; rotate on logout or account switch. */
  readonly authContextId: string;
}

export interface BasketCasBasket {
  readonly id: string;
  readonly stageId: number;
  readonly type: "input" | "output";
  readonly ordinal: number;
  readonly order: number;
  readonly colorId: string | null;
  readonly participantIds: readonly number[];
  readonly qualifierCount: number | null;
}

export interface BasketCasRoute {
  readonly id: string;
  readonly sourceBasketId: string;
  readonly targetBasketId: string;
}

export interface BasketCasGraph {
  readonly baskets: readonly BasketCasBasket[];
  readonly routes: readonly BasketCasRoute[];
}

declare const serverEtagBrand: unique symbol;
export type ServerBasketEtag = string & { readonly [serverEtagBrand]: true };

export interface BasketCasCanonical {
  readonly scope: Readonly<BasketCasScope>;
  readonly etag: ServerBasketEtag;
  readonly graph: BasketCasGraph;
}

export interface BasketCasResponse {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Pick<Headers, "get">;
  json(): Promise<unknown>;
}

export type BasketCasTransport = (
  url: string,
  init: RequestInit,
) => Promise<BasketCasResponse>;

export interface BasketCasClientOptions {
  /** Explicitly OFF in the current production UI. */
  readonly featureEnabled?: boolean;
  /** Independently verified backend ETag/If-Match/412/428 deployment. */
  readonly serverCasVerified?: boolean;
  readonly transport: BasketCasTransport;
  /** Inject current authorization headers on EVERY request, never capture secrets. */
  readonly authHeaders: () => Record<string, string>;
}

export type BasketCasSaveOutcome =
  | { readonly kind: "saved"; readonly canonical: BasketCasCanonical }
  | { readonly kind: "stale"; readonly code: "STAGE_BASKET_CONFIGURATION_STALE" }
  | { readonly kind: "precondition-required" };

export interface BasketCasClient {
  load(scope: BasketCasScope): Promise<BasketCasCanonical>;
  save(
    scope: BasketCasScope,
    basedOn: BasketCasCanonical,
    localDraft: BasketCasGraph,
  ): Promise<BasketCasSaveOutcome>;
}

export class BasketCasError extends Error {
  constructor(
    public readonly code:
      | "FEATURE_DISABLED"
      | "MISSING_ETAG"
      | "INVALID_ETAG"
      | "PROTOCOL_ERROR"
      | "WRONG_SCOPE"
      | "HTTP_FAILURE",
    message: string,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "BasketCasError";
  }
}

/** Only an HTTP ETag *response header* may produce this branded value. */
function parseServerStrongEtag(raw: string | null): ServerBasketEtag {
  if (raw === null || raw.trim() === "") {
    throw new BasketCasError("MISSING_ETAG", "Server has not provided an ETag; CAS is unavailable.");
  }
  const tag = raw.trim();
  // Strong, RFC-style quoted entity tag. Weak validators and lists are unsafe.
  if (!/^"[\x21\x23-\x7e]+"$/.test(tag)) {
    throw new BasketCasError("INVALID_ETAG", "A single strong server ETag is required.");
  }
  return tag as ServerBasketEtag;
}

export function cloneBasketCasGraph(graph: BasketCasGraph): BasketCasGraph {
  return {
    baskets: graph.baskets.map((b) => ({ ...b, participantIds: [...b.participantIds] })),
    routes: graph.routes.map((route) => ({ ...route })),
  };
}

function parseGraph(value: unknown): BasketCasGraph {
  if (typeof value !== "object" || value === null) {
    throw new BasketCasError("PROTOCOL_ERROR", "Basket response is not an object.");
  }
  const data = value as Partial<BasketCasGraph>;
  if (!Array.isArray(data.baskets) || !Array.isArray(data.routes) ||
      !data.baskets.every((b) =>
        b && typeof b.id === "string" && Number.isInteger(b.stageId) &&
        (b.type === "input" || b.type === "output") &&
        Number.isInteger(b.ordinal) && Number.isInteger(b.order) &&
        (b.colorId === null || typeof b.colorId === "string") &&
        Array.isArray(b.participantIds) && b.participantIds.every(Number.isInteger) &&
        (b.qualifierCount === null || Number.isInteger(b.qualifierCount)),
      ) ||
      !data.routes.every((route) =>
        route && typeof route.id === "string" &&
        typeof route.sourceBasketId === "string" &&
        typeof route.targetBasketId === "string",
      )) {
    throw new BasketCasError("PROTOCOL_ERROR", "Invalid basket graph payload.");
  }
  return cloneBasketCasGraph(data as BasketCasGraph);
}

function validScope(scope: BasketCasScope) {
  if (!Number.isSafeInteger(scope.tournamentId) || scope.tournamentId <= 0 ||
      typeof scope.authContextId !== "string" || scope.authContextId.length === 0) {
    throw new BasketCasError("WRONG_SCOPE", "Invalid tournament or authorization epoch.");
  }
}

function isSameScope(a: BasketCasScope, b: BasketCasScope) {
  return a.tournamentId === b.tournamentId && a.authContextId === b.authContextId;
}

function getUrl(tournamentId: number) {
  return `/api/tournaments/${tournamentId}/stage-baskets`;
}

export function createBasketCasClient(options: BasketCasClientOptions): BasketCasClient {
  // A snapshot is accepted only by the very same client instance which issued
  // its authenticated GET. Even a valid tag from another client is not portable.
  const issued = new WeakSet<BasketCasCanonical>();

  function ensureGate() {
    if (options.featureEnabled !== true || options.serverCasVerified !== true) {
      throw new BasketCasError("FEATURE_DISABLED", "Basket CAS frontend is not activated.");
    }
  }

  function issue(scope: BasketCasScope, tag: ServerBasketEtag, graph: BasketCasGraph) {
    const canonical: BasketCasCanonical = Object.freeze({
      scope: Object.freeze({ ...scope }),
      etag: tag,
      graph: cloneBasketCasGraph(graph),
    });
    issued.add(canonical);
    return canonical;
  }

  async function load(scope: BasketCasScope): Promise<BasketCasCanonical> {
    ensureGate();
    validScope(scope);
    const response = await options.transport(getUrl(scope.tournamentId), {
      method: "GET",
      headers: options.authHeaders(),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new BasketCasError("HTTP_FAILURE", "Basket GET failed.", response.status);
    }
    // Require BOTH valid header and graph. Generic Express weak auto-ETag
    // (W/...) does not qualify and must never enable client writes.
    const tag = parseServerStrongEtag(response.headers.get("etag"));
    const graph = parseGraph(await response.json());
    return issue(scope, tag, graph);
  }

  async function save(
    scope: BasketCasScope,
    basedOn: BasketCasCanonical,
    localDraft: BasketCasGraph,
  ): Promise<BasketCasSaveOutcome> {
    ensureGate();
    validScope(scope);
    if (!issued.has(basedOn) || !isSameScope(scope, basedOn.scope)) {
      throw new BasketCasError("WRONG_SCOPE", "ETag belongs to another client, tournament or auth epoch.");
    }
    const graph = parseGraph(localDraft);
    const response = await options.transport(getUrl(scope.tournamentId), {
      method: "PUT",
      headers: {
        ...options.authHeaders(),
        "Content-Type": "application/json",
        "If-Match": basedOn.etag,
      },
      body: JSON.stringify(graph),
      cache: "no-store",
    });

    if (response.status === 412) {
      // No implicit refresh+retry. Only the user's explicit reconciliation
      // can provide a fresh base token for a later independent save.
      return { kind: "stale", code: "STAGE_BASKET_CONFIGURATION_STALE" };
    }
    if (response.status === 428) {
      return { kind: "precondition-required" };
    }
    if (!response.ok) {
      throw new BasketCasError("HTTP_FAILURE", "Basket PUT failed.", response.status);
    }
    if (response.status !== 200) {
      throw new BasketCasError("PROTOCOL_ERROR", "CAS write response must contain canonical graph.", response.status);
    }
    const tag = parseServerStrongEtag(response.headers.get("etag"));
    if (tag === basedOn.etag) {
      // A successful write MUST move the monotonic server revision.
      throw new BasketCasError("PROTOCOL_ERROR", "CAS write did not advance server revision.");
    }
    const updated = parseGraph(await response.json());
    return { kind: "saved", canonical: issue(scope, tag, updated) };
  }

  return { load, save };
}
