import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React, { useEffect, useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useTournamentCsvFileReader } from "./use-tournament-csv-file-reader";

const originalFileReader = globalThis.FileReader;

// The fake deliberately permits callbacks after abort: abort alone is not a race guard.
class DeferredFileReader {
  static instances: DeferredFileReader[] = [];
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
  result: string | ArrayBuffer | null = null;
  readyState = DeferredFileReader.EMPTY;
  aborted = false;

  constructor() { DeferredFileReader.instances.push(this); }
  readAsText(_file: Blob) { this.readyState = DeferredFileReader.LOADING; }
  abort() { this.aborted = true; this.readyState = DeferredFileReader.DONE; }
  resolve(value: string) {
    this.result = value;
    this.readyState = DeferredFileReader.DONE;
    this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
  }
  reject() {
    this.readyState = DeferredFileReader.DONE;
    this.onerror?.({ target: this } as unknown as ProgressEvent<FileReader>);
  }
}

function Harness({ tournamentId }: { tournamentId: number }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const reader = useTournamentCsvFileReader(tournamentId, {
    onLoad: (value) => {
      setText(value);
      setError("");
      setPreview("");
      setConfirmed(false);
    },
    onError: () => setError("Nie udało się odczytać pliku CSV."),
  });

  // Mirrors TournamentDetail's CSV state reset on route ID change.
  useEffect(() => {
    reader.invalidate();
    setText("");
    setError("");
    setPreview("");
    setConfirmed(false);
  }, [tournamentId]);

  return (
    <div>
      <input data-testid="csv-file" type="file" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) reader.read(file);
      }} />
      <textarea aria-label="CSV text" value={text} onChange={(event) => {
        reader.invalidate();
        setText(event.target.value);
      }} />
      <button onClick={() => setConfirmed(true)}>Zastąp</button>
      <button onClick={() => {
        reader.invalidate();
        setText(""); setError(""); setPreview(""); setConfirmed(false);
      }}>Zamknij CSV</button>
      <output data-testid="scope">{tournamentId}</output>
      <output data-testid="error">{error}</output>
      <output data-testid="preview">{preview}</output>
      <output data-testid="confirm">{confirmed ? "confirmed" : "idle"}</output>
    </div>
  );
}

function selectCsv(fileName: string) {
  fireEvent.change(screen.getByTestId("csv-file"), {
    target: { files: [new File(["name\n" + fileName], fileName + ".csv", { type: "text/csv" })] },
  });
  return DeferredFileReader.instances.at(-1)!;
}

afterEach(() => {
  cleanup();
  DeferredFileReader.instances.length = 0;
  globalThis.FileReader = originalFileReader;
});

test("FE-CSV-01: A confirmed replacement never arms B on same-instance route change", () => {
  globalThis.FileReader = DeferredFileReader as unknown as typeof FileReader;
  const ui = render(<Harness tournamentId={101} />);
  const first = selectCsv("A");
  act(() => first.resolve("name\nA"));
  fireEvent.click(screen.getByRole("button", { name: "Zastąp" }));
  assert.equal(screen.getByTestId("confirm").textContent, "confirmed");
  ui.rerender(<Harness tournamentId={202} />);
  assert.equal(screen.getByTestId("scope").textContent, "202");
  assert.equal((screen.getByRole("textbox", { name: "CSV text" }) as HTMLTextAreaElement).value, "");
  assert.equal(screen.getByTestId("confirm").textContent, "idle");
});

test("FE-CSV-02: late A.onload and A.onerror are ignored under tournament B", () => {
  globalThis.FileReader = DeferredFileReader as unknown as typeof FileReader;
  const ui = render(<Harness tournamentId={101} />);
  const stale = selectCsv("A");
  ui.rerender(<Harness tournamentId={202} />);
  assert.equal(stale.aborted, true);
  act(() => { stale.resolve("name\nA"); stale.reject(); });
  assert.equal((screen.getByRole("textbox", { name: "CSV text" }) as HTMLTextAreaElement).value, "");
  assert.equal(screen.getByTestId("error").textContent, "");
  assert.equal(screen.getByTestId("preview").textContent, "");
});

test("FE-CSV-03: latest B file selection/manual input wins over A and stale B reads", () => {
  globalThis.FileReader = DeferredFileReader as unknown as typeof FileReader;
  const ui = render(<Harness tournamentId={101} />);
  const staleA = selectCsv("A");
  ui.rerender(<Harness tournamentId={202} />);
  const staleB = selectCsv("B-old");
  const latestB = selectCsv("B-new");
  act(() => { staleA.resolve("name\nA"); staleB.resolve("name\nB-old"); latestB.resolve("name\nB-new"); });
  assert.equal((screen.getByRole("textbox", { name: "CSV text" }) as HTMLTextAreaElement).value, "name\nB-new");

  const pending = selectCsv("B-older");
  fireEvent.change(screen.getByRole("textbox", { name: "CSV text" }), { target: { value: "name\nB-typed" } });
  act(() => pending.resolve("name\nB-older"));
  assert.equal((screen.getByRole("textbox", { name: "CSV text" }) as HTMLTextAreaElement).value, "name\nB-typed");
});

test("FE-CSV-04: modal close and unmount prevent delayed FileReader callbacks", () => {
  globalThis.FileReader = DeferredFileReader as unknown as typeof FileReader;
  const ui = render(<Harness tournamentId={101} />);
  const stale = selectCsv("A");
  fireEvent.click(screen.getByRole("button", { name: "Zamknij CSV" }));
  assert.equal(stale.aborted, true);
  act(() => { stale.resolve("name\nA"); stale.reject(); });
  assert.equal((screen.getByRole("textbox", { name: "CSV text" }) as HTMLTextAreaElement).value, "");
  assert.equal(screen.getByTestId("error").textContent, "");
  const after = selectCsv("B");
  ui.unmount();
  assert.equal(after.aborted, true);
  act(() => { after.resolve("name\nB"); after.reject(); });
});

test("Current file read failure emits one scoped error; a new selection clears it", () => {
  globalThis.FileReader = DeferredFileReader as unknown as typeof FileReader;
  render(<Harness tournamentId={101} />);
  const failed = selectCsv("fail");
  act(() => failed.reject());
  assert.match(screen.getByTestId("error").textContent ?? "", /Nie udało się odczytać/);
  const success = selectCsv("success");
  act(() => success.resolve("name\nB"));
  assert.equal(screen.getByTestId("error").textContent, "");
  assert.equal((screen.getByRole("textbox", { name: "CSV text" }) as HTMLTextAreaElement).value, "name\nB");
});
