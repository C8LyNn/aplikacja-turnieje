import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import { BackupRestoreDialog } from "./backup-restore-dialog";

const previousFileReader = globalThis.FileReader;
const previousFetch = globalThis.fetch;

class DeferredFileReader {
  static instances: DeferredFileReader[] = [];
  static EMPTY = 0;
  static LOADING = 1;
  static DONE = 2;
  readyState = 0;
  result: string | ArrayBuffer | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
  aborted = false;
  constructor() { DeferredFileReader.instances.push(this); }
  readAsText(_blob: Blob) { this.readyState = 1; }
  abort() { this.readyState = 2; this.aborted = true; }
  succeed(contents: string) {
    this.result = contents; this.readyState = 2;
    this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
  }
  fail() {
    this.readyState = 2;
    this.onerror?.({ target: this } as unknown as ProgressEvent<FileReader>);
  }
}

function backup(name: string, visibility: string = "public_online") {
  return JSON.stringify({
    schemaVersion: 2, resultModelVersion: "series_v1", rankingPolicy: "match_record_v1",
    exportedAt: "2026-10-14T00:00:00Z",
    tournament: { name, visibility }, players: [], matches: [], resultHistory: [], actionLog: [],
  });
}

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  const loc = memoryLocation({ path: "/tournaments/101" });
  let posts = 0;
  const postBodies: unknown[] = [];
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "POST") {
      posts++;
      postBodies.push(JSON.parse(String(init.body ?? "{}")));
    }
    return new Response(JSON.stringify({ error: "request intentionally rejected in test" }), { status: 422, headers: { "content-type": "application/json" } });
  };
  const view = (open: boolean) => (
    <QueryClientProvider client={client}>
      <Router hook={loc.hook} searchHook={loc.searchHook}>
        <AuthProvider><BackupRestoreDialog open={open} onClose={() => {}} /></AuthProvider>
      </Router>
    </QueryClientProvider>
  );
  const ui = render(view(true));
  return { ui, loc, view, getPosts: () => posts, postBodies, client };
}

function select(name: string) {
  fireEvent.change(screen.getByLabelText("Plik backupu"), {
    target: { files: [new window.File(["pending"], name + ".json", { type: "application/json" })] },
  });
  return DeferredFileReader.instances.at(-1)!;
}

afterEach(() => {
  cleanup();
  DeferredFileReader.instances.length = 0;
  globalThis.FileReader = previousFileReader;
  globalThis.fetch = previousFetch;
  sessionStorage.clear();
});

test("UX045-DIALOG-01: newly selected backup clears secrets; old A.onload/onerror cannot replace B", () => {
  globalThis.FileReader = DeferredFileReader as unknown as typeof FileReader;
  const v = renderDialog();
  const a = select("A");
  act(() => a.succeed(backup("A", "private_online")));
  fireEvent.change(screen.getByLabelText(/Nowe hasło organizatora/), { target: { value: "SECRET_A_ORGANIZER" } });
  fireEvent.change(screen.getByLabelText(/Nowe hasło widza/), { target: { value: "SECRET_A_VIEWER" } });
  fireEvent.change(screen.getByLabelText(/Nowe hasło wsparcia/), { target: { value: "SECRET_A_SUPPORT" } });
  const b = select("B");
  assert.equal((screen.getByLabelText(/Nowe hasło organizatora/) as HTMLInputElement).value, "");
  assert.equal((screen.getByLabelText(/Nowe hasło wsparcia/) as HTMLInputElement).value, "");
  assert.equal(screen.queryByLabelText(/Nowe hasło widza/), null);
  act(() => { b.succeed(backup("B")); a.succeed(backup("A")); a.fail(); });
  assert.match(screen.getByText(/Wczytano backup V2: B/).textContent ?? "", /B/);
  assert.equal(v.getPosts(), 0);
  assert.ok((screen.getByRole("button", { name: /Przywróć jako nowy turniej/ }) as HTMLButtonElement).disabled);
});

test("UX045-DIALOG-02: A pending -> B route -> delayed callback ignored, no credentials survive", () => {
  globalThis.FileReader = DeferredFileReader as unknown as typeof FileReader;
  const v = renderDialog();
  fireEvent.change(screen.getByLabelText(/Nowe hasło organizatora/), { target: { value: "SECRET_A" } });
  const a = select("A");
  fireEvent.change(screen.getByLabelText(/Nowe hasło organizatora/), { target: { value: "SECRET_A2" } });
  act(() => v.loc.navigate("/tournaments/202"));
  assert.equal(a.aborted, true);
  assert.equal((screen.getByLabelText(/Nowe hasło organizatora/) as HTMLInputElement).value, "");
  act(() => { a.succeed(backup("A")); a.fail(); });
  assert.equal(screen.queryByText(/Wczytano backup V2: A/), null);
  assert.equal(v.getPosts(), 0);
});

test("UX045-DIALOG-03: close and reopen while reading clears pending preview and form", () => {
  globalThis.FileReader = DeferredFileReader as unknown as typeof FileReader;
  const v = renderDialog();
  const stale = select("A");
  v.ui.rerender(v.view(false));
  assert.equal(stale.aborted, true);
  v.ui.rerender(v.view(true));
  act(() => { stale.succeed(backup("A")); stale.fail(); });
  assert.equal(screen.queryByText(/Wczytano backup V2: A/), null);
  assert.equal((screen.getByLabelText(/Nowe hasło organizatora/) as HTMLInputElement).value, "");
  assert.equal(v.getPosts(), 0);
});

test("UX045-DIALOG-04: current valid V3 backup keeps new-tournament restore button behavior", () => {
  globalThis.FileReader = DeferredFileReader as unknown as typeof FileReader;
  const v = renderDialog();
  const current = select("V3");
  act(() => current.succeed(JSON.stringify({
    ...JSON.parse(backup("Current V3")), schemaVersion: 3,
    stages: [], groups: [], stageParticipants: [],
  })));
  assert.ok(screen.getByText(/Wczytano backup V3: Current V3/));
  const restore = screen.getByRole("button", { name: /Przywróć jako nowy turniej/ }) as HTMLButtonElement;
  assert.ok(restore.disabled);
  fireEvent.change(screen.getByLabelText(/Nowe hasło organizatora/), { target: { value: "NEWPASSWORD123" } });
  assert.equal(restore.disabled, false);
  assert.equal(v.getPosts(), 0);
});

test("UX045-DIALOG-05: explicit B import uses only new B file and credentials; no silent A POST", async () => {
  globalThis.FileReader = DeferredFileReader as unknown as typeof FileReader;
  const v = renderDialog();
  const a = select("A");
  act(() => a.succeed(backup("A", "private_online")));
  fireEvent.change(screen.getByLabelText(/Nowe hasło organizatora/), { target: { value: "A_OLD_SECRET_999" } });
  const b = select("B");
  act(() => { b.succeed(backup("B")); a.succeed(backup("A")); a.fail(); });
  assert.equal(v.getPosts(), 0);
  const restore = screen.getByRole("button", { name: /Przywróć jako nowy turniej/ }) as HTMLButtonElement;
  assert.ok(restore.disabled);
  fireEvent.change(screen.getByLabelText(/Nowe hasło organizatora/), { target: { value: "B_NEW_SECRET_123" } });
  assert.equal(restore.disabled, false);
  fireEvent.click(restore);
  await waitFor(() => assert.equal(v.getPosts(), 1));
  const body = JSON.stringify(v.postBodies[0]);
  assert.match(body, /"name":"B"/);
  assert.match(body, /B_NEW_SECRET_123/);
  assert.doesNotMatch(body, /A_OLD_SECRET_999/);
  assert.doesNotMatch(body, /"name":"A"/);
});
