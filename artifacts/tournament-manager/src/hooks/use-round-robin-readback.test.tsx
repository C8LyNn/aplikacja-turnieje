import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { getGetTournamentStageQueryKey, getListTournamentStagesQueryKey } from "@workspace/api-client-react";
import { useRoundRobinReadback } from "./use-round-robin-readback";
import { StageProgressView } from "@/components/stage-progress-view";

const clients: QueryClient[] = [];
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });
function client() {
  const value = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } });
  clients.push(value); return value;
}
const stages = [{ id: 31, format: "round_robin", status: "completed", version: 1 }];
const matches = (revision: number) => [{ id: 11, stageId: 31, revision, status: "completed" }];
function fixture(read: () => Promise<{ version: number }>) {
  const c = client(), key = getGetTournamentStageQueryKey(7, 31);
  c.setQueryData(key, { version: 1 });
  function Probe({ revision, version, enabled }: { revision: number; version: number; enabled: boolean }) {
    useRoundRobinReadback(7, stages.map(s => ({ ...s, version })), matches(revision), enabled);
    const query = useQuery({ queryKey: key, queryFn: read });
    return <div data-testid="canonical-version">{query.data?.version}</div>;
  }
  const view = (revision: number, version = 1, enabled = true) => <QueryClientProvider client={c}><Probe revision={revision} version={version} enabled={enabled} /></QueryClientProvider>;
  const rendered = render(view(1));
  return { rerender: (revision: number, version = 1, enabled = true) => rendered.rerender(view(revision, version, enabled)) };
}
test("RR external revision and stage-only reopen refetch canonical details without unchanged-poll loops", async () => {
  let reads = 0;
  const f = fixture(async () => ({ version: ++reads + 1 }));
  await act(async () => f.rerender(2));
  await waitFor(() => assert.equal(screen.getByTestId("canonical-version").textContent, "2"));
  await act(async () => f.rerender(2));
  assert.equal(reads, 1);
  await act(async () => f.rerender(2, 2));
  await waitFor(() => assert.equal(screen.getByTestId("canonical-version").textContent, "3"));
  assert.equal(reads, 2);
});
test("a late cancelled RR read cannot replace the newer canonical details", async () => {
  let release!: (value: { version: number }) => void;
  const old = new Promise<{ version: number }>(resolve => { release = resolve; });
  let reads = 0;
  const f = fixture(async () => ++reads === 1 ? old : { version: 3 });
  await act(async () => f.rerender(2));
  await waitFor(() => assert.equal(reads, 1));
  await act(async () => f.rerender(3));
  await waitFor(() => assert.equal(screen.getByTestId("canonical-version").textContent, "3"));
  await act(async () => { release({ version: 2 }); await old; });
  assert.equal(screen.getByTestId("canonical-version").textContent, "3");
});
test("recovery after a parent read error still detects external changes", async () => {
  let reads = 0;
  const f = fixture(async () => ({ version: ++reads + 1 }));
  await act(async () => f.rerender(2, 1, false));
  assert.equal(reads, 0);
  await act(async () => f.rerender(2, 1, true));
  await waitFor(() => assert.equal(screen.getByTestId("canonical-version").textContent, "2"));
  assert.equal(reads, 1);
});
test("unrelated DE updates and disabled reads do not invalidate RR", async () => {
  const c = client(), key = getGetTournamentStageQueryKey(7, 31);
  c.setQueryData(key, { version: 1 });
  function Probe({ revision, enabled }: { revision: number; enabled: boolean }) {
    useRoundRobinReadback(7, [{ ...stages[0], format: "double_elimination" }], matches(revision), enabled);
    return null;
  }
  const view = (revision: number, enabled: boolean) => <QueryClientProvider client={c}><Probe revision={revision} enabled={enabled} /></QueryClientProvider>;
  const r = render(view(1, true));
  await act(async () => r.rerender(view(2, true)));
  await act(async () => r.rerender(view(3, false)));
  assert.equal(c.getQueryState(key)?.isInvalidated, false);
});
for (const status of [401, 403]) {
  test(`selected RR hides cached private participants after ${status}`, async () => {
    const c = client(), key = getGetTournamentStageQueryKey(7, 31);
    const stage = { ...stages[0], status: "active", tournamentId: 7, position: 1, name: "RR" };
    c.setQueryData(getListTournamentStagesQueryKey(7), [stage]);
    c.setQueryData(key, { stage, groups: [], participants: [{
      id: 107, stageId: 31, playerId: 701, playerName: "PRIVATE_RR_PARTICIPANT", status: "active", stageSeed: 1,
      matchWins: 0, matchDraws: 0, matchLosses: 0, matchesPlayed: 0,
      gameWins: 0, gameLosses: 0, points: 0,
    }] });
    render(<QueryClientProvider client={c}><StageProgressView tournamentId={7} activeStageId={31} matches={[]} /></QueryClientProvider>);
    await screen.findByText("PRIVATE_RR_PARTICIPANT");
    await act(async () => {
      await assert.rejects(c.fetchQuery({
        queryKey: key, staleTime: 0,
        queryFn: async () => { throw Object.assign(new Error("Denied"), { status }); },
      }));
    });
    await waitFor(() => assert.equal(screen.queryByText("PRIVATE_RR_PARTICIPANT") === null, true));
    assert.ok(screen.getByText(/Nie udało się pobrać danych etapu/));
  });
}
