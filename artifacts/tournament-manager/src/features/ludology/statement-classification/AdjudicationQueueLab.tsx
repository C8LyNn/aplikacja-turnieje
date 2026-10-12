import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/portfolio-ui";
import { ToolButton, ToolEmptyState, ToolInput, ToolNotice, ToolPanel, ToolSelect, ToolTextarea } from "@/components/tool-ui";
import {
  buildAdjudicationQueue,
  exportAdjudicationQueueCsv,
  summarizeAdjudicationQueue,
  type AdjudicationQueueStatus,
  type AdjudicationPriority,
} from "./adjudication-queue";
import { validateAdjudicationInput } from "./adjudication-protocol";
import type { DirectionScore } from "./model";
import { PILOT_CODEBOOK } from "./pilot-codebook";
import { useResearchProject } from "./use-research-project";

const BASE = "/ludology/statement-classification";

const STATUS_LABELS: Record<AdjudicationQueueStatus, string> = {
  pending: "Do rozpatrzenia",
  deferred: "Odroczone",
  blocked: "Zablokowane",
  needs_review: "Do ponownej oceny",
  resolved: "Rozstrzygnięte",
};
const PRIORITY_LABELS: Record<AdjudicationPriority, string> = {
  high: "Wysoki · przeciwne kierunki",
  medium: "Średni · N/A kontra ocena",
  low: "Niski · różna siła lub 0",
};
const showDirection = (value: DirectionScore | null) =>
  value === null ? "N/A" : value > 0 ? `+${value}` : String(value);

export default function AdjudicationQueueLab() {
  const { data, addAdjudication } = useResearchProject();
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("");
  const [personId, setPersonId] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [decision, setDecision] = useState<"resolved" | "deferred">("resolved");
  const [direction, setDirection] = useState("na");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState("");

  const items = useMemo(
    () => buildAdjudicationQueue(data, PILOT_CODEBOOK.id),
    [data],
  );
  const summary = summarizeAdjudicationQueue(items);
  const filtered = items.filter((item) => {
    if (status === "open" && item.status === "resolved") return false;
    if (status !== "open" && status !== "all" && item.status !== status) return false;
    if (priority && item.priority !== priority) return false;
    if (personId && item.personId !== personId) return false;
    if (search) {
      const excerpt = data.excerpts.find((candidate) => candidate.id === item.excerptId);
      const proposition = data.propositions.find((candidate) => candidate.id === item.propositionId);
      const source = data.sources.find((candidate) => candidate.id === item.sourceId);
      const haystack = [excerpt?.text, proposition?.label, proposition?.code, source?.title].join(" ").toLocaleLowerCase();
      if (!haystack.includes(search.toLocaleLowerCase().trim())) return false;
    }
    return true;
  });

  function selectItem(key: string) {
    setSelected((previous) => previous === key ? "" : key);
    setReviewerId("");
    setDecision("resolved");
    setDirection("na");
    setRationale("");
    setError("");
  }

  function submit(codingAId: string | null, codingBId: string | null) {
    if (!codingAId || !codingBId) return;
    const input = {
      codingAId, codingBId, reviewerId, decision,
      direction: decision === "deferred" || direction === "na" ? null : Number(direction) as DirectionScore,
      rationale,
    };
    const problem = validateAdjudicationInput(data, input);
    if (problem) {
      setError(problem);
      return;
    }
    addAdjudication(input);
    setSelected("");
    setError("");
  }

  function exportReport() {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const csv = exportAdjudicationQueueCsv(data, filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `neoludologia_adjudication_queue_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <ModuleHeader
        code="LUDO 02 / REVIEW"
        title="Adjudication Queue"
        description="Przegląd różnic między koderami, jawna priorytetyzacja i audyt decyzji. Rozstrzygnięcia nie nadpisują pierwotnych obserwacji."
        accent="amber"
        backHref={BASE}
        backLabel="Kategoryzacja wypowiedzi i poglądów"
      />

      <ToolPanel title="Stan przeglądu" description="Liczby odnoszą się do par ocen (fragment × mikrostanowisko × para koderów), nie do niezależnych źródeł.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {([
            ["Wszystkie", summary.total],
            ["Oczekujące", summary.pending],
            ["Odroczone", summary.deferred],
            ["Do powtórzenia", summary.needs_review],
            ["Zablokowane", summary.blocked],
            ["Rozstrzygnięte", summary.resolved],
          ] as const).map(([label, count]) => (
            <div key={label} className="rounded-xl border border-border bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 text-2xl font-black tabular-nums">{count}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Kolejność pracy: ponowna ocena → nierozstrzygnięte → odroczone → blokady danych. Priorytet analityczny zależy od rodzaju rozbieżności, a nie od wartości poglądów.
        </div>
      </ToolPanel>

      <ToolPanel title={`Lista rozbieżności (${filtered.length}/${items.length})`}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ToolSelect aria-label="Status rozbieżności" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Wszystkie nierozstrzygnięte</option>
            <option value="all">Wszystkie statusy</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </ToolSelect>
          <ToolSelect aria-label="Priorytet" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Dowolny priorytet</option>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </ToolSelect>
          <ToolSelect aria-label="Osoba" value={personId} onChange={(e) => setPersonId(e.target.value)}>
            <option value="">Wszystkie osoby</option>
            {data.people.map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}
          </ToolSelect>
          <ToolInput aria-label="Szukaj w materiale" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Teza, źródło lub fragment…" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">Eksportuje widoczne po filtrach wiersze i ślad do źródeł. Dane CSV mogą zawierać cytaty pośrednio identyfikowalne przez odnośniki.</div>
          <ToolButton type="button" variant="ghost" onClick={exportReport}>Eksportuj widok CSV</ToolButton>
        </div>
        {filtered.length === 0 ? (
          <ToolEmptyState title="Brak rozbieżności w tym widoku" description="Zmień filtry albo zakoduj te same fragmenty przez co najmniej dwóch różnych koderów." />
        ) : (
          <div className="mt-4 space-y-3">
            {filtered.map((item) => {
              const excerpt = data.excerpts.find((candidate) => candidate.id === item.excerptId);
              const source = data.sources.find((candidate) => candidate.id === item.sourceId);
              const proposition = data.propositions.find((candidate) => candidate.id === item.propositionId);
              const coderA = data.coders.find((candidate) => candidate.id === item.coderAId);
              const coderB = data.coders.find((candidate) => candidate.id === item.coderBId);
              const reviewing = selected === item.key;
              const reviewers = data.coders.filter((coder) =>
                coder.type === "human" && coder.id !== item.coderAId && coder.id !== item.coderBId
              );
              return (
                <article key={item.key} className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold">{proposition?.code ?? "?"} — {proposition?.label ?? item.propositionId}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{source?.title ?? "Brak źródła"} · {STATUS_LABELS[item.status]} · {PRIORITY_LABELS[item.priority]}</div>
                    </div>
                    <ToolButton type="button" variant="ghost" onClick={() => selectItem(item.key)}>
                      {reviewing ? "Zamknij" : "Szczegóły"}
                    </ToolButton>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>{coderA?.displayName ?? item.coderAId}: <strong>{showDirection(item.directionA)}</strong></div>
                    <div>{coderB?.displayName ?? item.coderBId}: <strong>{showDirection(item.directionB)}</strong></div>
                  </div>
                  {reviewing && (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      <ToolNotice>{item.reason}</ToolNotice>
                      <blockquote className="rounded-lg border border-border p-3 text-sm">{excerpt?.text ?? "Brak zachowanego fragmentu."}</blockquote>
                      {excerpt?.contextBefore && <div className="text-xs text-muted-foreground">Przed: {excerpt.contextBefore}</div>}
                      {excerpt?.contextAfter && <div className="text-xs text-muted-foreground">Po: {excerpt.contextAfter}</div>}
                      {source?.url && <a href={source.url} target="_blank" rel="noreferrer" className="text-xs font-semibold underline-offset-2 hover:underline">Otwórz źródło ↗</a>}
                      {item.adjudicationId && (
                        <div className="rounded-lg border border-border p-3 text-xs">
                          <strong>Ostatnia decyzja:</strong> {item.adjudicationDate ?? "brak daty"} · {item.adjudicationId}
                          <p className="mt-1">{item.adjudicationRationale}</p>
                        </div>
                      )}
                      {(item.status === "pending" || item.status === "deferred" || item.status === "needs_review") && (
                        <div className="grid gap-3 rounded-lg border border-border p-3">
                          <ToolSelect aria-label="Trzeci recenzent" value={reviewerId} onChange={(e) => setReviewerId(e.target.value)}>
                            <option value="">Wybierz niezależnego recenzenta</option>
                            {reviewers.map((reviewer) => <option key={reviewer.id} value={reviewer.id}>{reviewer.displayName}</option>)}
                          </ToolSelect>
                          {reviewers.length === 0 && <ToolNotice tone="danger">W Metodologii dodaj trzeciego recenzenta-człowieka.</ToolNotice>}
                          <ToolSelect aria-label="Decyzja" value={decision} onChange={(e) => setDecision(e.target.value as "resolved" | "deferred")}>
                            <option value="resolved">Rozstrzygnij</option>
                            <option value="deferred">Odroczone — potrzebne dodatkowe dane</option>
                          </ToolSelect>
                          {decision === "resolved" && (
                            <ToolSelect aria-label="Ocena rozstrzygająca" value={direction} onChange={(e) => setDirection(e.target.value)}>
                              <option value="na">N/A — niewystarczające dane</option>
                              <option value="-2">−2</option>
                              <option value="-1">−1</option>
                              <option value="0">0 — rzeczywiście mieszane / neutralne</option>
                              <option value="1">+1</option>
                              <option value="2">+2</option>
                            </ToolSelect>
                          )}
                          <ToolTextarea aria-label="Uzasadnienie" rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Uzasadnij decyzję na podstawie oryginalnej wypowiedzi…" />
                          {error && <ToolNotice tone="danger">{error}</ToolNotice>}
                          <div>
                            <ToolButton type="button" variant="primary" onClick={() => submit(item.codingAId, item.codingBId)}>
                              Zapisz do historii adjudykacji
                            </ToolButton>
                          </div>
                        </div>
                      )}
                      {item.status === "blocked" && <ToolNotice tone="danger">Napraw duplikaty albo weryfikację źródła przed rozstrzygnięciem.</ToolNotice>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </ToolPanel>
      <ToolNotice>
        Ten panel nie wylicza ideologicznego wyniku osoby. Stan rozstrzygnięć nie wpływa automatycznie na profile dowodów. Dane są zapisane lokalnie w przeglądarce; wykonuj regularne kopie JSON.
      </ToolNotice>
    </>
  );
}
