import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React, { useEffect, useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useScopedBackupPreview } from "./use-scoped-backup-preview";

const originalFileReader = globalThis.FileReader;

// Deliberately calls queued handlers even after abort, to test epoch/identity guards.
class DeferredReader {
  static instances: DeferredReader[] = [];
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
  readyState = 0;
  result: string | ArrayBuffer | null = null;
  aborted = false;
  constructor() { DeferredReader.instances.push(this); }
  readAsText(_blob: Blob) { this.readyState = DeferredReader.LOADING; }
  abort() { this.aborted = true; this.readyState = DeferredReader.DONE; }
  resolve(source: string) {
    this.readyState = DeferredReader.DONE;
    this.result = source;
    this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
  }
  fail() {
    this.readyState = DeferredReader.DONE;
    this.onerror?.({ target: this } as unknown as ProgressEvent<FileReader>);
  }
}

function validBackup(name: string, visibility = "public_online") {
  return JSON.stringify({
    schemaVersion: 2, resultModelVersion: "series_v1", rankingPolicy: "match_record_v1",
    exportedAt: "2026-10-14T00:00:00.000Z",
    tournament: { name, visibility }, players: [], matches: [], resultHistory: [], actionLog: [],
  });
}

function Harness({ scope }: { scope: string }) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [organizerSecret, setOrganizerSecret] = useState("");
  const read = useScopedBackupPreview(scope, {
    onPreview: backup => { setPreview(backup.tournament.name); setError(""); },
    onError: message => { setPreview(""); setError(message); },
  });
  useEffect(() => {
    read.invalidate();
    setPreview(""); setError(""); setOrganizerSecret("");
  }, [scope]); // Harness mirrors route-context reset; tests target the real hook guard.
  const choose = (file: File | undefined) => {
    read.invalidate();
    setPreview(""); setError(""); setOrganizerSecret("");
    if (file) read.read(file);
  };
  return <section>
    <input aria-label="backup file" type="file" onChange={e => choose(e.target.files?.[0])} />
    <input aria-label="new credential" value={organizerSecret} onChange={e => setOrganizerSecret(e.target.value)} />
    <button onClick={() => { read.invalidate(); setPreview(""); setError(""); setOrganizerSecret(""); }}>close</button>
    <output data-testid="preview">{preview}</output>
    <output data-testid="error">{error}</output>
    <output data-testid="scope">{scope}</output>
  </section>;
}

function pick(name: string) {
  fireEvent.change(screen.getByLabelText("backup file"), {
    target: { files: [new window.File(["pending"], name + ".json", { type: "application/json" })] },
  });
  return DeferredReader.instances.at(-1)!;
}

afterEach(() => {
  cleanup();
  DeferredReader.instances.length = 0;
  globalThis.FileReader = originalFileReader;
});

test("UX045-R12-01: newer selected B wins over delayed A after abort", () => {
  globalThis.FileReader = DeferredReader as unknown as typeof FileReader;
  render(<Harness scope="tournament-A" />);
  const a = pick("A");
  fireEvent.change(screen.getByLabelText("new credential"), { target: { value: "SENSITIVE_A" } });
  const b = pick("B");
  assert.equal(a.aborted, true);
  assert.equal((screen.getByLabelText("new credential") as HTMLInputElement).value, "");
  act(() => { b.resolve(validBackup("New B")); a.resolve(validBackup("Old A")); a.fail(); });
  assert.equal(screen.getByTestId("preview").textContent, "New B");
  assert.equal(screen.getByTestId("error").textContent, "");
});

test("UX045-R12-02: tournament A to B rerender ignores late onload/onerror", () => {
  globalThis.FileReader = DeferredReader as unknown as typeof FileReader;
  const v = render(<Harness scope="A" />);
  const a = pick("A");
  v.rerender(<Harness scope="B" />);
  assert.equal(a.aborted, true);
  act(() => { a.resolve(validBackup("Private A", "private_online")); a.fail(); });
  assert.equal(screen.getByTestId("scope").textContent, "B");
  assert.equal(screen.getByTestId("preview").textContent, "");
  assert.equal(screen.getByTestId("error").textContent, "");
});

test("UX045-R12-03: close/unmount prevent stale preview resurrection", () => {
  globalThis.FileReader = DeferredReader as unknown as typeof FileReader;
  const v = render(<Harness scope="A" />);
  const a = pick("A");
  fireEvent.click(screen.getByRole("button", { name: "close" }));
  assert.equal(a.aborted, true);
  act(() => { a.resolve(validBackup("Old A")); a.fail(); });
  assert.equal(screen.getByTestId("preview").textContent, "");
  const b = pick("B");
  v.unmount();
  assert.equal(b.aborted, true);
  act(() => { b.resolve(validBackup("Old B")); b.fail(); });
});

test("UX045-R12-04: current malformed backup and FileReader error retain parser errors only in current scope", () => {
  globalThis.FileReader = DeferredReader as unknown as typeof FileReader;
  render(<Harness scope="A" />);
  const bad = pick("bad");
  act(() => bad.resolve('{"schemaVersion":1}'));
  assert.match(screen.getByTestId("error").textContent ?? "", /legacy backupu v1/);
  const failed = pick("failed");
  act(() => failed.fail());
  assert.match(screen.getByTestId("error").textContent ?? "", /Nie udało się odczytać pliku backupu/);
  const good = pick("good");
  act(() => good.resolve(validBackup("Good B")));
  assert.equal(screen.getByTestId("preview").textContent, "Good B");
  assert.equal(screen.getByTestId("error").textContent, "");
});

test("UX045-R12-05: compatible V2 and V3 parser flow unchanged, latest file only", () => {
  globalThis.FileReader = DeferredReader as unknown as typeof FileReader;
  render(<Harness scope="A" />);
  const v2 = pick("v2");
  act(() => v2.resolve(validBackup("V2")));
  assert.equal(screen.getByTestId("preview").textContent, "V2");
  const v3 = pick("v3");
  act(() => v3.resolve(JSON.stringify({
    ...JSON.parse(validBackup("V3")), schemaVersion: 3,
    stages: [], groups: [], stageParticipants: [],
  })));
  assert.equal(screen.getByTestId("preview").textContent, "V3");
});
