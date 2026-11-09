/**
 * Regression tests for the viewer/fan create-tournament ownership bug.
 *
 * Product rule (enforced here):
 *   ONLY the "organizer" role may create tournaments.
 *   Fan, support, developer, and anonymous (no role) are all blocked at the
 *   route level and must not see "Nowy turniej" / "Utwórz turniej" UI.
 *
 * Root cause of the original bug:
 *   1. dashboard.tsx showed "Utwórz turniej" without role-gating → fans could
 *      reach /tournaments/new via the dashboard.
 *   2. /tournaments/new had no route guard → direct URL navigation worked for
 *      any role.
 *   3. (ancillary) after create the role stayed "fan", causing a confusing
 *      "Tryb kibica — tylko do odczytu" banner even though the orgToken was
 *      stored; users then tried manual organizer login and received "Ten turniej
 *      nie ma hasła organizatora". Fixed by rule #1+#2: fans can no longer reach
 *      the create form at all.
 *
 * Guard implementation note:
 *   The guard (outer CreateTournament) calls useAuth + useLocation + useEffect
 *   unconditionally on every render. The navigate side-effect is deferred to
 *   useEffect so it never runs during the render phase. CreateTournamentForm
 *   (inner) is only mounted when role === "organizer", so all form hooks always
 *   run in a stable order — there is no conditional hook execution.
 *
 * Covered regression points:
 *   - viewer (fan) does not see "Nowy turniej" in any UI surface;
 *   - support does not see "Nowy turniej" in any UI surface;
 *   - organizer sees "Nowy turniej";
 *   - fan direct navigation to /tournaments/new → redirected to /fan;
 *   - support direct navigation → redirected to /support;
 *   - developer direct navigation → redirected to /developer;
 *   - anonymous (no role) direct navigation → redirected to /;
 *   - organizer can open the form;
 *   - role change organizer → fan during component lifecycle fires redirect
 *     without hook ordering error (guard/form split correctness);
 *   - password-protected create as organizer stores organizerToken and navigates to
 *     management UI (role stays "organizer" — no automatic switching needed).
 */

import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider, useAuth } from "@/context/auth-context";
import CreateTournament from "./create-tournament";
import Dashboard from "./dashboard";
import FanView from "./fan-view";

// ── helpers ────────────────────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;
const queryClients = new Set<QueryClient>();

afterEach(() => {
  cleanup();
  for (const qc of queryClients) qc.clear();
  queryClients.clear();
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
  window.sessionStorage.clear();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeQueryClient() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } },
  });
  queryClients.add(qc);
  return qc;
}

/** Render a page component with providers. `role` is written to localStorage before render. */
function renderPage(
  component: React.ReactElement,
  path: string,
  role: "organizer" | "fan" | "support" | "developer" | null,
  fetchImpl?: typeof fetch,
) {
  if (role) window.localStorage.setItem("tm_role", role);
  if (fetchImpl) globalThis.fetch = fetchImpl;
  const qc = makeQueryClient();
  const location = memoryLocation({ path, record: true });
  render(
    <QueryClientProvider client={qc}>
      <Router hook={location.hook}>
        <AuthProvider>
          {component}
        </AuthProvider>
      </Router>
    </QueryClientProvider>,
  );
  return { qc, location };
}

const emptyTournamentsFetch: typeof fetch = async (input) => {
  const url = typeof input === "string" ? input : (input as Request).url;
  if (url.includes("/api/tournaments")) return jsonResponse([]);
  return new Response(null, { status: 404 });
};

// ── 1: UI surfaces hide "Nowy turniej" / "Utwórz turniej" for non-organizer roles ──

describe("viewer UI does not offer create-tournament", () => {
  test("FanView has no 'Utwórz turniej' or 'Nowy turniej' link", async () => {
    renderPage(<FanView />, "/fan", "fan", emptyTournamentsFetch);
    await waitFor(() => {
      const html = document.body.innerHTML;
      assert.equal(html.includes("Utwórz turniej"), false, "FanView must not contain 'Utwórz turniej'");
      assert.equal(html.includes("Nowy turniej"), false, "FanView must not contain 'Nowy turniej'");
    });
  });

  test("Dashboard hides 'Utwórz turniej' for fan role", async () => {
    renderPage(<Dashboard />, "/dashboard", "fan", emptyTournamentsFetch);
    await waitFor(() => {
      const links = Array.from(document.querySelectorAll("a,button")).map((el) => el.textContent ?? "");
      assert.equal(
        links.some((t) => t.includes("Utwórz turniej") || t.includes("Nowy turniej")),
        false,
        "Dashboard must not show create-tournament UI for fan role",
      );
    });
  });

  test("Dashboard hides 'Utwórz turniej' for support role", async () => {
    renderPage(<Dashboard />, "/dashboard", "support", emptyTournamentsFetch);
    await waitFor(() => {
      const links = Array.from(document.querySelectorAll("a,button")).map((el) => el.textContent ?? "");
      assert.equal(
        links.some((t) => t.includes("Utwórz turniej") || t.includes("Nowy turniej")),
        false,
        "Dashboard must not show create-tournament UI for support role",
      );
    });
  });

  test("Dashboard shows 'Utwórz turniej' for organizer role", async () => {
    renderPage(<Dashboard />, "/dashboard", "organizer", emptyTournamentsFetch);
    await waitFor(() => {
      const links = Array.from(document.querySelectorAll("a")).map((el) => el.textContent ?? "");
      assert.equal(
        links.some((t) => t.includes("Utwórz turniej") || t.includes("Nowy turniej")),
        true,
        "Dashboard must show 'Utwórz turniej' for organizer role",
      );
    });
  });
});

// ── 2: Route guard on /tournaments/new ────────────────────────────────────────
//
// The guard defers navigate to useEffect, so the redirect fires after the first
// render. RTL's render() wraps in act(), which flushes effects — assertions
// can be synchronous for "no form" (render is immediate) but the location
// update is checked with waitFor to be explicit about the async boundary.

describe("route guard blocks non-organizer roles from /tournaments/new", () => {
  test("fan is redirected to /fan and no form renders", async () => {
    const { location } = renderPage(<CreateTournament />, "/tournaments/new", "fan", emptyTournamentsFetch);
    // Guard renders null synchronously; form must not appear
    assert.equal(document.querySelector("form"), null, "must not render form for fan");
    await waitFor(() => {
      assert.ok(location.history.includes("/fan"), `expected /fan in history, got ${JSON.stringify(location.history)}`);
    });
  });

  test("support is redirected to /support and no form renders", async () => {
    const { location } = renderPage(<CreateTournament />, "/tournaments/new", "support", emptyTournamentsFetch);
    assert.equal(document.querySelector("form"), null, "must not render form for support");
    await waitFor(() => {
      assert.ok(location.history.includes("/support"), `expected /support in history, got ${JSON.stringify(location.history)}`);
    });
  });

  test("developer is redirected to / and no form renders", async () => {
    const { location } = renderPage(<CreateTournament />, "/tournaments/new", "developer", emptyTournamentsFetch);
    assert.equal(document.querySelector("form"), null, "must not render form for developer");
    await waitFor(() => {
      assert.ok(location.history.includes("/"), `expected / in history, got ${JSON.stringify(location.history)}`);
    });
  });

  test("anonymous (no role) is redirected to / and no form renders", async () => {
    const { location } = renderPage(<CreateTournament />, "/tournaments/new", null, emptyTournamentsFetch);
    assert.equal(document.querySelector("form"), null, "must not render form for anonymous");
    await waitFor(() => {
      assert.ok(location.history.includes("/"), `expected / in history, got ${JSON.stringify(location.history)}`);
    });
  });

  test("organizer can open the form", async () => {
    renderPage(<CreateTournament />, "/tournaments/new", "organizer", emptyTournamentsFetch);
    await waitFor(() => {
      assert.ok(screen.queryByLabelText("Nazwa turnieju *"), "form must render for organizer");
    });
  });
});

// ── 3: Hook ordering regression — role change during component lifecycle ───────
//
// This test verifies that the guard/form split correctly handles a mid-session
// role change without triggering a "Rendered more/fewer hooks than during the
// previous render" React invariant violation.
//
// In the old (broken) implementation, hooks were called AFTER a conditional
// early return. When role changed from organizer to fan, React would have seen
// a different number of hooks between renders and thrown an error.
//
// In the new implementation:
//   - CreateTournament (guard): always calls useAuth + useLocation + useEffect
//     unconditionally.
//   - CreateTournamentForm (inner): mounted only when role === "organizer";
//     when role changes, React unmounts the entire inner component — this is a
//     valid component lifecycle, not a hook ordering violation.
//
// The RoleChanger helper calls setRole("fan") from inside the tree so the
// auth context propagates the change. No error thrown = guard/form split is
// correct.

describe("hook ordering: role change during CreateTournament lifecycle", () => {
  /**
   * A sibling component that immediately sets role to the given value.
   * Using useEffect so the change happens after the initial render
   * (organizer → form mounted) and then triggers a re-render of the guard.
   */
  function RoleChanger({ targetRole }: { targetRole: string }) {
    const { setRole } = useAuth();
    useEffect(() => {
      setRole(targetRole as Parameters<typeof setRole>[0]);
    }, [setRole, targetRole]);
    return null;
  }

  test("organizer → fan role change triggers redirect without hook ordering error", async () => {
    window.localStorage.setItem("tm_role", "organizer");
    const qc = makeQueryClient();
    queryClients.add(qc);
    const location = memoryLocation({ path: "/tournaments/new", record: true });

    // render() is wrapped in act(); no exception here means hooks remained stable
    render(
      <QueryClientProvider client={qc}>
        <Router hook={location.hook}>
          <AuthProvider>
            <CreateTournament />
            {/* After first render with organizer role (form mounted), switch to fan */}
            <RoleChanger targetRole="fan" />
          </AuthProvider>
        </Router>
      </QueryClientProvider>,
    );

    // Guard fires redirect after the role change propagates
    await waitFor(() => {
      assert.ok(
        location.history.includes("/fan"),
        `expected redirect to /fan after role change; history: ${JSON.stringify(location.history)}`,
      );
    });

    // Form must be gone after the role change
    assert.equal(document.querySelector("form"), null, "form must unmount when role changes to fan");
  });
});

// ── 4: Password-protected create as organizer stores organizerToken ─────────────────

describe("password-protected create: organizerToken ownership", () => {
  test("stores organizerToken in sessionStorage and navigates to management UI (role stays organizer)", async () => {
    const TOURNAMENT_ID = 42;
    const ORG_TOKEN = "tok-organizer-abc";

    globalThis.fetch = async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/api/tournaments") && !url.includes(`/api/tournaments/${TOURNAMENT_ID}`)) {
        return jsonResponse(
          {
            id: TOURNAMENT_ID,
            name: "Turniej testowy",
            format: "single_elimination",
            status: "draft",
            resultModelVersion: "series_v1",
            rankingPolicy: "match_record_v1",
            defaultBestOf: 1,
            hasHostCode: false,
            hasOrganizerPassword: true,
            hasSupportPassword: false,
            activeStageId: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            organizerToken: ORG_TOKEN,
          },
          201,
        );
      }
      return new Response(null, { status: 404 });
    };

    const { location } = renderPage(<CreateTournament />, "/tournaments/new", "organizer");

    await waitFor(() => screen.getByLabelText("Nazwa turnieju *"));

    // Preserve creator access while establishing a durable login credential.
    await userEvent.type(screen.getByLabelText("Nazwa turnieju *"), "Turniej testowy");
    await userEvent.type(screen.getByLabelText("Hasło organizatora *"), "test-password");
    await userEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));

    await waitFor(() => {
      // organizerToken stored in sessionStorage under the created tournament ID
      const stored = window.sessionStorage.getItem(`tm_org_${TOURNAMENT_ID}`);
      assert.equal(stored, ORG_TOKEN, `organizerToken must be in sessionStorage; got: ${stored}`);

      // role must NOT change — user was already organizer, stays organizer
      const role = window.localStorage.getItem("tm_role");
      assert.equal(role, "organizer", `role must remain 'organizer' after create; got: ${role}`);

      // navigated to the tournament management URL
      assert.ok(
        location.history.some((p) => p.includes(`/tournaments/${TOURNAMENT_ID}`)),
        `expected navigation to /tournaments/${TOURNAMENT_ID}, history: ${JSON.stringify(location.history)}`,
      );
    });
  });
});
