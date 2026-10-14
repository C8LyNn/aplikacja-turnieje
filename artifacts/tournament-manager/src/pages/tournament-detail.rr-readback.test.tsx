import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getGetTournamentStageQueryKey } from "@workspace/api-client-react";
import { RoundRobinReadbackBridge } from "./tournament-detail";

const clients = new Set<QueryClient>();
afterEach(() => {
  cleanup();
  clients.forEach(client => client.clear());
  clients.clear();
});

const key = getGetTournamentStageQueryKey(77, 31);
const rr = [{ id: 31, format: "round_robin", status: "completed", winnerId: 101 }];
const de = [{ id: 31, format: "double_elimination", status: "active", winnerId: null }];
const match = (revision: number, status = "completed") => [{
  id: 450, stageId: 31, revision, status, resultType: status === "completed" ? "played" : null,
  score1: status === "completed" ? 2 : null, score2: 1, winnerId: status === "completed" ? 101 : null,
}];

function setup({
  stages = rr, onRead, startVersion = 1,
}: {
  stages?: typeof rr;
  onRead: () => Promise<{ version: number }>;
  startVersion?: number;
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: 60000 } },
  });
  clients.add(client);
  client.setQueryData(key, { version: startVersion });
  function StageRows() {
    const query = useQuery({ queryKey: key, queryFn: onRead, staleTime: Infinity, retry: false });
    return <output data-testid="rank-version">{query.data?.version ?? "none"}</output>;
  }
  const view = (revision: number, selected = stages, status = "completed") =>
    <QueryClientProvider client={client}>
      <RoundRobinReadbackBridge tournamentId={77} stages={selected} matches={match(revision, status)}>
        <StageRows />
      </RoundRobinReadbackBridge>
    </QueryClientProvider>;
  const rendered = render(view(1));
  return { client, rerender: (revision: number, selected = stages, status = "completed") => rendered.rerender(view(revision, selected, status)) };
}

test("T100 F058-R13-01: external RR match revision refreshes the canonical stage detail, never computes a local rank", async () => {
  let version = 2;
  let reads = 0;
  const { rerender } = setup({ onRead: async () => { reads += 1; return { version }; } });
  assert.equal(screen.getByTestId("rank-version").textContent, "1");
  await act(async () => { rerender(2); });
  await waitFor(() => assert.equal(screen.getByTestId("rank-version").textContent, "2"));
  assert.equal(reads, 1);
  await act(async () => { rerender(2); });
  assert.equal(reads, 1, "identical canonical snapshot must not cause a refetch storm");
  version = 3;
  await act(async () => { rerender(3, rr.map(s => ({ ...s, status: "active", winnerId: null })), "pending"); });
  await waitFor(() => assert.equal(screen.getByTestId("rank-version").textContent, "3"));
  assert.equal(reads, 2);
});

test("T100 F058-R13-02: an older deferred stage read cannot overwrite a newer revision", async () => {
  let releaseOld: ((value: {version:number}) => void) | undefined;
  const old = new Promise<{version:number}>(resolve => { releaseOld = resolve; });
  let reads = 0;
  const { rerender } = setup({
    onRead: async () => {
      reads += 1;
      return reads === 1 ? old : { version: 3 };
    },
  });
  await act(async () => { rerender(2); });
  await act(async () => { rerender(3); });
  await waitFor(() => assert.equal(screen.getByTestId("rank-version").textContent, "3"));
  await act(async () => { releaseOld?.({ version: 2 }); await old; });
  assert.equal(screen.getByTestId("rank-version").textContent, "3", "late cancelled read must not restore N");
});

for (const forbidden of [401, 403]) {
  test(`T100 F058-R13-03: forbidden RR detail ${forbidden} suppresses cached standings until a successful retry`, async () => {
    let blocked = true;
    let reads = 0;
    const { rerender } = setup({
      onRead: async () => {
        reads += 1;
        if (blocked) throw Object.assign(new Error("Forbidden"), { status: forbidden });
        return { version: 2 };
      },
    });
    await act(async () => { rerender(2); });
    await screen.findByRole("alert");
    assert.equal(screen.queryByTestId("rank-version"), null, "private cached version 1 must be unmounted");
    blocked = false;
    fireEvent.click(screen.getByRole("button", { name: /Spróbuj ponownie/ }));
    await waitFor(() => assert.equal(screen.getByTestId("rank-version").textContent, "2"));
    assert.equal(reads, 2);
  });
}

test("T100 F058-R13-04: unrelated SE/DE match snapshots do not invalidate stage details", async () => {
  let reads = 0;
  const { rerender } = setup({
    stages: de,
    onRead: async () => { reads += 1; return { version: 2 }; },
  });
  await act(async () => { rerender(2, de); });
  assert.equal(screen.getByTestId("rank-version").textContent, "1");
  assert.equal(reads, 0);
});

test("T100 F058-R13-05: terminal RR stage-only reopen triggers server detail readback", async () => {
  let reads = 0;
  const { rerender } = setup({
    onRead: async () => { reads += 1; return { version: 2 }; },
  });
  await act(async () => {
    rerender(1, rr.map(stage => ({ ...stage, status: "active", winnerId: null })));
  });
  await waitFor(() => assert.equal(screen.getByTestId("rank-version").textContent, "2"));
  assert.equal(reads, 1, "stage lifecycle change alone must refresh selected RR participant records");
});

test("T100 F058-R13-06: denied/no-op backend change cannot synthesize an RR ranking", async () => {
  let reads = 0;
  const { rerender } = setup({
    onRead: async () => { reads += 1; return { version: 2 }; },
  });
  await act(async () => { rerender(1); });
  assert.equal(screen.getByTestId("rank-version").textContent, "1");
  assert.equal(reads, 0, "rejected 409 / unchanged canonical snapshot must not fabricate a new state");
});
