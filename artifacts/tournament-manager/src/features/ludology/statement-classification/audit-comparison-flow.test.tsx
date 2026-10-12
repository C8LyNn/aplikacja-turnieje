import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { EMPTY_RESEARCH_PROJECT, type ResearchProjectData } from "./model";
import { parseResearchAuditSnapshot } from "./research-audit-comparison";
import CorpusHealthLab from "./CorpusHealthLab";
import AuditComparisonLab from "./AuditComparisonLab";

const STORAGE_KEY = "neoludology_research_pipeline_v8";
const context = () => memoryLocation({ path: "/ludology/statement-classification/health" });

function fixture(): ResearchProjectData {
  return {
    ...EMPTY_RESEARCH_PROJECT,
    people: [{ id: "person-e2e", displayName: "Badana osoba" }],
    sources: [{
      id: "source-1", personId: "person-e2e", title: "Wywiad",
      url: "https://example.org/interview", sourceType: "article",
      publishedAt: "2026-09-01",
    }],
    excerpts: [{ id: "excerpt-1", sourceId: "source-1", text: "Cytat z wywiadu", verificationStatus: "verified" }],
    codebooks: [{ id: "book-e2e", name: "Codebook QA", version: "1.0", status: "pilot" }],
    propositions: [{
      id: "proposition-e2e", codebookId: "book-e2e", code: "QA-01",
      label: "Pogląd QA", definition: "Definicja wyjściowa",
    }],
    coders: [{ id: "coder-e2e", displayName: "Koder QA", type: "human" }],
  };
}

let originalCreateObjectURL: typeof URL.createObjectURL | undefined;
let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined;
let originalAnchorClick: typeof HTMLAnchorElement.prototype.click | undefined;
const capturedBlobs: Blob[] = [];
const filenames: string[] = [];

function enableDownloadCapture() {
  originalCreateObjectURL = URL.createObjectURL;
  originalRevokeObjectURL = URL.revokeObjectURL;
  originalAnchorClick = window.HTMLAnchorElement.prototype.click;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: (blob: Blob) => {
      capturedBlobs.push(blob);
      return `blob:http://localhost/mock-${capturedBlobs.length}`;
    },
  });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, writable: true, value: () => {} });
  window.HTMLAnchorElement.prototype.click = function () {
    filenames.push(this.download);
  };
}

function mount(component: React.ReactElement) {
  return render(<Router hook={context().hook}>{component}</Router>);
}
function chooseBook() {
  fireEvent.change(screen.getAllByRole("combobox")[0]!, { target: { value: "book-e2e" } });
}
async function exportAudit(): Promise<string> {
  mount(<CorpusHealthLab />);
  chooseBook();
  fireEvent.click(screen.getByRole("button", { name: "Pobierz dane audytu JSON" }));
  assert.equal(capturedBlobs.length, 1);
  assert.match(filenames[0]!, /^neoludologia_audit_.*_data\.json$/);
  const raw = await capturedBlobs[0]!.text();
  const report = parseResearchAuditSnapshot(raw);
  assert.equal(report.codebook.id, "book-e2e");
  assert.equal(report.counts.sources, 1);
  assert.equal(report.counts.verifiedExcerpts, 1);
  assert.ok(report.instrumentSnapshots?.codebook.includes("Definicja wyjściowa"));
  cleanup();
  return raw;
}
function uploadAudit(raw: string, filename = "audit-previous.json") {
  const file = new window.File([raw], filename, { type: "application/json" });
  Object.defineProperty(file, "text", { configurable: true, value: async () => raw });
  fireEvent.change(screen.getByLabelText("Zaimportuj poprzedni raport audytowy JSON"), {
    target: { files: [file] },
  });
}
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  if (originalAnchorClick) window.HTMLAnchorElement.prototype.click = originalAnchorClick;
  if (originalCreateObjectURL === undefined) {
    Reflect.deleteProperty(URL, "createObjectURL");
  } else {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, writable: true, value: originalCreateObjectURL });
  }
  if (originalRevokeObjectURL === undefined) {
    Reflect.deleteProperty(URL, "revokeObjectURL");
  } else {
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, writable: true, value: originalRevokeObjectURL });
  }
  originalCreateObjectURL = undefined;
  originalRevokeObjectURL = undefined;
  originalAnchorClick = undefined;
  capturedBlobs.length = 0;
  filenames.length = 0;
});

test("real export -> import -> changed proposition blocks numeric deltas and explains the exact field", async () => {
  enableDownloadCapture();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fixture()));
  const previous = await exportAudit();

  const revised = fixture();
  revised.propositions[0]!.definition = "Definicja zmieniona w badaniu";
  localStorage.setItem(STORAGE_KEY, JSON.stringify(revised));
  mount(<AuditComparisonLab />);
  chooseBook();
  const beforeImport = localStorage.getItem(STORAGE_KEY);
  uploadAudit(previous);
  await screen.findByRole("heading", { name: "Zablokowane porównanie metodologiczne" });
  assert.ok(screen.getByRole("heading", { name: "Które definicje uległy zmianie?" }));
  assert.ok(screen.getByText("proposition · proposition-e2e · definition"));
  assert.ok(screen.getByText(JSON.stringify("Definicja wyjściowa")));
  assert.ok(screen.getByText(JSON.stringify("Definicja zmieniona w badaniu")));
  assert.equal(screen.queryByRole("heading", { name: "Zmiany między raportami" }), null);
  assert.equal(localStorage.getItem(STORAGE_KEY), beforeImport, "import must not mutate current research project");

  fireEvent.click(screen.getByRole("button", { name: "Eksportuj ostrzeżenia Markdown" }));
  assert.equal(capturedBlobs.length, 2);
  assert.match(filenames[1]!, /audit_comparison.*\.md$/);
  const explanation = await capturedBlobs[1]!.text();
  assert.match(explanation, /Nieporównywalne metodologicznie/);
  assert.match(explanation, /Definicja zmieniona w badaniu/);
  assert.doesNotMatch(explanation, /\| corpus \|/);
});

test("real export -> import with unchanged methodology allows numeric source delta and JSON export", async () => {
  enableDownloadCapture();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fixture()));
  const previous = await exportAudit();

  const changed = fixture();
  changed.sources.push({
    id: "source-2", personId: "person-e2e", title: "Referat",
    url: "https://example.org/referat", sourceType: "academic",
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(changed));
  mount(<AuditComparisonLab />);
  chooseBook();
  const beforeImport = localStorage.getItem(STORAGE_KEY);
  uploadAudit(previous);
  await screen.findByRole("heading", { name: "Zmiany między raportami" });
  assert.equal(screen.queryByRole("heading", { name: "Zablokowane porównanie metodologiczne" }), null);
  assert.ok(screen.getByRole("heading", { name: "Zmiany w profilach osób" }));
  assert.equal(localStorage.getItem(STORAGE_KEY), beforeImport);

  fireEvent.click(screen.getByRole("button", { name: "Pobierz JSON" }));
  assert.equal(capturedBlobs.length, 2);
  const comparison = JSON.parse(await capturedBlobs[1]!.text());
  assert.equal(comparison.compatible, true);
  assert.equal(comparison.metrics.find((item: { key: string }) => item.key === "sources")?.delta, 1);
  assert.equal(comparison.people.find((item: { personId: string }) => item.personId === "person-e2e")?.kind, "changed");
  assert.deepEqual(comparison.instrumentChanges, []);
});

test("invalid import shows error, retains project data, then permits loading a valid audit", async () => {
  enableDownloadCapture();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fixture()));
  const previous = await exportAudit();
  mount(<AuditComparisonLab />);
  chooseBook();
  const before = localStorage.getItem(STORAGE_KEY);

  uploadAudit('{"formatVersion":1}', "invalid.json");
  await screen.findByText(/Nieobsługiwany format raportu audytowego/);
  assert.equal(screen.queryByRole("heading", { name: "Zmiany między raportami" }), null);
  assert.equal(localStorage.getItem(STORAGE_KEY), before);

  uploadAudit(previous, "valid.json");
  await screen.findByRole("heading", { name: "Zmiany między raportami" });
  await waitFor(() => assert.equal(screen.queryByText(/Nieobsługiwany format raportu audytowego/), null));
  assert.equal(localStorage.getItem(STORAGE_KEY), before);
});
