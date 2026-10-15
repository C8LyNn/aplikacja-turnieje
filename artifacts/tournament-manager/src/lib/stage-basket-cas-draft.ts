/**
 * WEB-005 T055 R23C / D6=B.
 *
 * Pure, UI-independent draft session for a future opt-in organizer screen.
 * NO wiring to StageBasketsPanel, query cache, current non-CAS endpoint,
 * localStorage, sessionStorage or globally shared draft data.
 */
import {
  BasketCasError,
  cloneBasketCasGraph,
  type BasketCasCanonical,
  type BasketCasClient,
  type BasketCasGraph,
  type BasketCasScope,
  type BasketCasBasket,
  type BasketCasRoute,
} from "./stage-basket-cas-client";

export type BasketCasDraftPhase =
  | "uninitialized"
  | "editing"
  | "conflict"
  | "reviewing";

export type BasketCasDiffEntry = {
  readonly type: "basket" | "route";
  readonly id: string;
  readonly change: "added-remote" | "removed-remote" | "modified";
};

export interface BasketCasDraftView {
  readonly scope: BasketCasScope;
  readonly phase: BasketCasDraftPhase;
  /** This copy is owned by this session and never replaced by a background GET. */
  readonly localDraft: BasketCasGraph | null;
  readonly remoteCanonical: BasketCasGraph | null;
  readonly changes: readonly BasketCasDiffEntry[];
  readonly dependencyMayHaveChanged: boolean;
  readonly saving: boolean;
}

export interface BasketCasDraftSession {
  view(): BasketCasDraftView;
  initialize(): Promise<void>;
  edit(mutator: (draft: { baskets: BasketCasBasket[]; routes: BasketCasRoute[] }) => void): void;
  /** Same-tournament stage navigation and roster changes must not drop edits. */
  markStageOrRosterChanged(): void;
  /** Explicit fetch: keeps local draft intact, exposes remote for comparison. */
  refreshRemote(): Promise<void>;
  /** Only explicit user confirmation establishes a new base; NEVER saves. */
  reconcile(input:
    | { readonly action: "keep-local" | "use-remote"; readonly confirmedByOrganizer: true }
    | { readonly action: "edited"; readonly draft: BasketCasGraph; readonly confirmedByOrganizer: true }
  ): void;
  save(): Promise<"saved" | "stale" | "precondition-required" | "superseded">;
  /** Logout / role or tournament switch destroys old privileged draft and ETag. */
  switchScope(scope: BasketCasScope): void;
  destroy(): void;
}

type MutableGraph = {
  baskets: BasketCasBasket[];
  routes: BasketCasRoute[];
};

function clone(graph: BasketCasGraph): MutableGraph {
  const value = cloneBasketCasGraph(graph);
  return {
    baskets: value.baskets.map((b) => ({ ...b, participantIds: [...b.participantIds] })),
    routes: value.routes.map((r) => ({ ...r })),
  };
}

function diff(local: BasketCasGraph, remote: BasketCasGraph): BasketCasDiffEntry[] {
  const changes: BasketCasDiffEntry[] = [];
  for (const type of ["basket", "route"] as const) {
    const own = type === "basket" ? local.baskets : local.routes;
    const current = type === "basket" ? remote.baskets : remote.routes;
    const ownMap = new Map(own.map((item) => [item.id, item]));
    const currentMap = new Map(current.map((item) => [item.id, item]));
    for (const [id, item] of ownMap) {
      const other = currentMap.get(id);
      if (!other) changes.push({ type, id, change: "removed-remote" });
      else if (JSON.stringify(item) !== JSON.stringify(other)) {
        changes.push({ type, id, change: "modified" });
      }
    }
    for (const [id] of currentMap) {
      if (!ownMap.has(id)) changes.push({ type, id, change: "added-remote" });
    }
  }
  return changes.sort((a, b) =>
    a.type.localeCompare(b.type) || a.id.localeCompare(b.id) ||
    a.change.localeCompare(b.change)
  );
}

function validScope(scope: BasketCasScope) {
  if (!Number.isSafeInteger(scope.tournamentId) || scope.tournamentId <= 0 ||
    !scope.authContextId) {
    throw new BasketCasError("WRONG_SCOPE", "Invalid tournament/authorization epoch.");
  }
}

export function createBasketCasDraftSession(
  client: BasketCasClient,
  initialScope: BasketCasScope,
): BasketCasDraftSession {
  validScope(initialScope);
  let scope: BasketCasScope = { ...initialScope };
  let base: BasketCasCanonical | null = null;
  let remote: BasketCasCanonical | null = null;
  let draft: MutableGraph | null = null;
  let phase: BasketCasDraftPhase = "uninitialized";
  let contextChanged = false;
  let saving = false;
  let epoch = 0;
  let editEpoch = 0;
  let destroyed = false;

  function active() {
    if (destroyed) throw new BasketCasError("FEATURE_DISABLED", "Draft session is destroyed.");
  }

  function clear(next: BasketCasScope) {
    epoch += 1;
    editEpoch += 1;
    scope = { ...next };
    base = null;
    remote = null;
    draft = null;
    phase = "uninitialized";
    contextChanged = false;
    // An old in-flight PUT may still settle, but its result cannot affect
    // this scope. save() is not re-entered until the old request has settled.
  }

  function view(): BasketCasDraftView {
    active();
    return {
      scope: { ...scope },
      phase,
      localDraft: draft ? clone(draft) : null,
      remoteCanonical: remote ? clone(remote.graph) : null,
      changes: draft && remote ? diff(draft, remote.graph) : [],
      dependencyMayHaveChanged: contextChanged,
      saving,
    };
  }

  async function initialize() {
    active();
    if (base || phase !== "uninitialized") {
      throw new BasketCasError("PROTOCOL_ERROR", "Already initialized; use explicit refresh.");
    }
    const requestEpoch = epoch;
    const current = { ...scope };
    const loaded = await client.load(current);
    if (destroyed || requestEpoch !== epoch) return;
    base = loaded;
    draft = clone(loaded.graph);
    phase = "editing";
  }

  function edit(mutator: (working: MutableGraph) => void) {
    active();
    if (!draft) throw new BasketCasError("PROTOCOL_ERROR", "Load canonical graph before editing.");
    const next = clone(draft);
    mutator(next);
    draft = clone(next);
    editEpoch += 1;
    // Do not automatically resolve 412 by editing after a conflict.
  }

  function markStageOrRosterChanged() {
    active();
    if (!draft) return;
    contextChanged = true;
    phase = "conflict";
    remote = null;
    editEpoch += 1;
  }

  async function refreshRemote() {
    active();
    if (!draft || !base || saving) {
      throw new BasketCasError("PROTOCOL_ERROR", "Finish a pending write before refreshing remote.");
    }
    const requestEpoch = epoch;
    const requestEditEpoch = editEpoch;
    const latest = await client.load({ ...scope });
    if (destroyed || requestEpoch !== epoch) return;
    remote = latest;
    phase = "reviewing";
    // A simultaneous local edit must remain local, not be rebased.
    if (requestEditEpoch !== editEpoch) contextChanged = true;
  }

  function reconcile(input:
    | { readonly action: "keep-local" | "use-remote"; readonly confirmedByOrganizer: true }
    | { readonly action: "edited"; readonly draft: BasketCasGraph; readonly confirmedByOrganizer: true }
  ) {
    active();
    if (input.confirmedByOrganizer !== true || phase !== "reviewing" ||
      !remote || !draft || saving) {
      throw new BasketCasError("PROTOCOL_ERROR", "Refresh and explicitly compare remote before reconciling.");
    }
    const next = input.action === "use-remote"
      ? clone(remote.graph)
      : input.action === "edited"
        ? clone(input.draft)
        : clone(draft);
    base = remote;
    remote = null;
    draft = next;
    phase = "editing";
    contextChanged = false;
    editEpoch += 1;
    // NO implicit HTTP PUT. User must press Save separately.
  }

  async function save(): Promise<"saved" | "stale" | "precondition-required" | "superseded"> {
    active();
    if (!base || !draft || phase !== "editing" || contextChanged || saving) {
      throw new BasketCasError("PROTOCOL_ERROR", "Reconcile conflict before a new explicit save.");
    }
    saving = true;
    const requestEpoch = epoch;
    const requestEditEpoch = editEpoch;
    const canonical = base;
    const local = clone(draft);
    try {
      const result = await client.save({ ...scope }, canonical, local);
      if (destroyed || epoch !== requestEpoch) return "superseded";
      if (result.kind === "stale" || result.kind === "precondition-required") {
        phase = "conflict";
        remote = null;
        return result.kind;
      }
      // User edited while PUT was in-flight, or roster changed. The server
      // saved the sent snapshot, NOT the newer local edits. Keep the edits.
      if (editEpoch !== requestEditEpoch || contextChanged) {
        base = canonical;
        remote = result.canonical;
        phase = "reviewing";
        contextChanged = true;
        return "superseded";
      }
      base = result.canonical;
      draft = clone(result.canonical.graph);
      remote = null;
      phase = "editing";
      return "saved";
    } catch (error) {
      if (destroyed || epoch !== requestEpoch) return "superseded";
      if (error instanceof BasketCasError && error.httpStatus &&
        [401, 403].includes(error.httpStatus)) {
        // Authorization was revoked. Do not retain privileged draft or token.
        clear(scope);
      } else {
        // Network/indeterminate write: never automatically retry; user must
        // explicitly read current canonical and decide what to keep.
        phase = "conflict";
        remote = null;
      }
      throw error;
    } finally {
      saving = false;
    }
  }

  function switchScope(nextScope: BasketCasScope) {
    active();
    validScope(nextScope);
    if (nextScope.tournamentId !== scope.tournamentId ||
      nextScope.authContextId !== scope.authContextId) clear(nextScope);
  }

  function destroy() {
    if (destroyed) return;
    clear(scope);
    destroyed = true;
  }

  return { view, initialize, edit, markStageOrRosterChanged, refreshRemote,
    reconcile, save, switchScope, destroy };
}
