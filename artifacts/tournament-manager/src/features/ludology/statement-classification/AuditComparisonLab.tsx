import { type ChangeEvent, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/portfolio-ui";
import { ToolButton, ToolEmptyState, ToolNotice, ToolPanel, ToolSelect } from "@/components/tool-ui";
import { PILOT_CODEBOOK } from "./pilot-codebook";
import { useResearchProject } from "./use-research-project";
import { buildResearchAuditReport, type ResearchAuditReport } from "./research-audit-report";
import {
  compareResearchAudits,
  parseResearchAuditSnapshot,
  renderAuditComparisonMarkdown,
  type AuditComparison,
} from "./research-audit-comparison";

const BASE = "/ludology/statement-classification";
const PERSON_STATUS: Record<AuditComparison["people"][number]["kind"], string> = {
  added: "Nowa osoba",
  removed: "Usunięta osoba",
  changed: "Zmieniony profil",
  unchanged: "Bez zmian w raporcie",
};

function showCount(value: number | null): string {
  return value === null ? "nie oceniano" : String(value);
}
function showDelta(value: number | null): string {
  return value === null ? "nie oceniano" : value > 0 ? `+${value}` : String(value);
}

/** This view never writes imported data into the live research project. */
export default function AuditComparisonLab() {
  const { data } = useResearchProject();
  const [codebookId, setCodebookId] = useState(PILOT_CODEBOOK.id);
  const [samplingPlanId, setSamplingPlanId] = useState("");
  const [baseline, setBaseline] = useState<ResearchAuditReport | null>(null);
  const [baselineFilename, setBaselineFilename] = useState("");
  const [fileError, setFileError] = useState("");

  const current = useMemo(() => {
    if (!data.codebooks.some(item => item.id === codebookId)) return null;
    return buildResearchAuditReport(data, {
      codebookId,
      samplingPlanId: samplingPlanId || null,
      generatedAt: new Date().toISOString(),
    });
  }, [data, codebookId, samplingPlanId]);

  const comparison = useMemo(
    () => baseline && current ? compareResearchAudits(baseline, current) : null,
    [baseline, current],
  );

  async function importAudit(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setFileError("");
    setBaseline(null);
    setBaselineFilename("");
    if (file.size > 2_000_000) {
      setFileError("Plik przekracza limit 2 MB dla raportu audytowego. Pełny eksport projektu nie jest tutaj obsługiwany.");
      return;
    }
    try {
      const parsed = parseResearchAuditSnapshot(await file.text());
      setBaseline(parsed);
      setBaselineFilename(file.name);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Nie udało się odczytać raportu audytowego.");
    }
  }

  function downloadComparison(format: "md" | "json") {
    if (!comparison || typeof window === "undefined" || typeof document === "undefined") return;
    const text = format === "md"
      ? renderAuditComparisonMarkdown(comparison)
      : JSON.stringify(comparison, null, 2);
    const mime = format === "md" ? "text/markdown" : "application/json";
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `neoludologia_audit_comparison_${new Date().toISOString().slice(0,10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <ModuleHeader
        code="LUDO 02 / AUDIT Δ"
        title="Historia audytu"
        description="Porównuj wcześniejszy raport z aktualnym korpusem. Ochrona metodologiczna blokuje wyliczanie różnic między odmiennymi wersjami narzędzi badawczych."
        accent="amber"
        backHref={BASE}
        backLabel="Kategoryzacja wypowiedzi i poglądów"
      />
      <div className="space-y-4">
        <ToolNotice>
          Import nie zmienia danych projektu. Raport bazowy musi pochodzić z eksportu JSON „Corpus Health” (formatVersion=1), a nie z kopii całego projektu. Nowe eksporty zapisują definicje narzędzi badawczych; starsze raporty można odczytać, ale nie można z nimi bezpiecznie wyliczyć różnic. Porównanie nie stanowi zgody na publikację.
        </ToolNotice>
        <ToolPanel title="Kontekst bieżącego audytu" description="Wybierz te same wersje codebooka i planu co w raporcie bazowym. Różnice w metodologii będą sygnalizowane jako blokada porównania.">
          <div className="grid gap-3 md:grid-cols-2">
            <ToolSelect aria-label="Codebook aktualnego audytu" value={codebookId} onChange={event => setCodebookId(event.target.value)}>
              {data.codebooks.map(book => (
                <option key={book.id} value={book.id}>{book.name} · {book.version} · {book.status}</option>
              ))}
            </ToolSelect>
            <ToolSelect aria-label="Plan próbkowania aktualnego audytu" value={samplingPlanId} onChange={event => setSamplingPlanId(event.target.value)}>
              <option value="">Bez planu próbkowania</option>
              {data.samplingPlans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name} · {plan.version} · {plan.status}</option>
              ))}
            </ToolSelect>
          </div>
        </ToolPanel>
        <ToolPanel title="Raport bazowy" description="Wybierz wcześniejszą migawkę audytu JSON, aby ocenić zmiany. Dane są odczytywane wyłącznie w przeglądarce i nie są zapisywane w localStorage.">
          <div className="space-y-3">
            <input
              type="file"
              accept=".json,application/json"
              aria-label="Zaimportuj poprzedni raport audytowy JSON"
              onChange={importAudit}
              className="block w-full rounded-lg border border-border bg-background/70 px-3 py-2 text-sm"
            />
            {fileError && <ToolNotice tone="danger">{fileError}</ToolNotice>}
            {baseline && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/40 p-3 text-sm">
                <div>
                  <strong>{baselineFilename}</strong>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {baseline.generatedAt} · {baseline.codebook.name} {baseline.codebook.version}
                    {" "}· {baseline.samplingPlan ? `plan ${baseline.samplingPlan.name} ${baseline.samplingPlan.version}` : "bez planu"}
                    {" "}· {baseline.instrumentSnapshots ? "zapis definicji narzędzi" : "brak zapisu definicji (starszy eksport)"}
                  </div>
                </div>
                <ToolButton type="button" variant="ghost" onClick={() => {setBaseline(null);setBaselineFilename("");}}>Usuń bazę</ToolButton>
              </div>
            )}
          </div>
        </ToolPanel>
        {!baseline ? (
          <ToolPanel title="Porównanie">
            <ToolEmptyState title="Brak raportu bazowego" description="Wyeksportuj migawkę audytu JSON z Corpus Health, a przy kolejnym badaniu wczytaj ją tutaj." />
          </ToolPanel>
        ) : !current ? (
          <ToolNotice tone="danger">Wybrany codebook nie istnieje w aktualnych danych projektu.</ToolNotice>
        ) : comparison && !comparison.compatible ? (
          <ToolPanel title="Zablokowane porównanie metodologiczne">
            <ToolNotice tone="danger">Dane pochodzą z nieporównywalnych kontekstów. Nie wyliczono różnic liczbowych ani zmian profili.</ToolNotice>
            <div className="mt-3 space-y-2">
              {comparison.blockingReasons.map((reason, index) => (
                <div key={index} className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm">{reason}</div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ToolButton type="button" variant="ghost" onClick={() => downloadComparison("md")}>Eksportuj ostrzeżenia Markdown</ToolButton>
            </div>
          </ToolPanel>
        ) : comparison ? (
          <>
            <ToolPanel title="Zmiany między raportami" description="Dodatnia zmiana liczby wpisów nie oznacza automatycznie poprawy jakości badań. N/A i dane nieocenione nie są zerem.">
              <div className="mb-3 text-xs text-muted-foreground">
                Wcześniej: {comparison.before.generatedAt} → teraz: {comparison.after.generatedAt}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-sm">
                  <thead className="border-b border-border text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Obszar</th>
                      <th className="px-3 py-2 text-left">Miara</th>
                      <th className="px-3 py-2 text-right">Poprzednio</th>
                      <th className="px-3 py-2 text-right">Teraz</th>
                      <th className="px-3 py-2 text-right">Różnica</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.metrics.map(metric => (
                      <tr key={metric.group + metric.key} className="border-b border-border/60">
                        <td className="px-3 py-2 text-xs text-muted-foreground">{metric.group}</td>
                        <td className="px-3 py-2">{metric.label}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{showCount(metric.before)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{showCount(metric.after)}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">{showDelta(metric.delta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ToolPanel>
            <ToolPanel title="Zmiany w profilach osób" description="Identyfikatory osób pozwalają odróżnić zmianę nazwy od dodania nowego profilu. Zmiany flag są porównywane według kodu i poziomu ostrzeżenia.">
              <div className="space-y-2">
                {comparison.people.filter(person => person.kind !== "unchanged").length === 0 ? (
                  <ToolNotice>Nie wykryto zmian w podstawowych metrykach osób zapisanych w raportach.</ToolNotice>
                ) : comparison.people.filter(person => person.kind !== "unchanged").map(person => (
                  <div key={person.personId} className="rounded-lg border border-border bg-background/40 p-3 text-sm">
                    <div className="font-semibold">{person.currentName ?? person.previousName} · {PERSON_STATUS[person.kind]}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Źródła {showCount(person.sourcesBefore)} → {showCount(person.sourcesAfter)} · zweryfikowane fragmenty {showCount(person.verifiedBefore)} → {showCount(person.verifiedAfter)}
                    </div>
                    {person.flagsAdded.length > 0 && <div className="mt-2 text-xs">Nowe flagi: {person.flagsAdded.join("; ")}</div>}
                    {person.flagsRemoved.length > 0 && <div className="mt-2 text-xs">Flagi nieobecne w nowym raporcie: {person.flagsRemoved.join("; ")}</div>}
                  </div>
                ))}
              </div>
            </ToolPanel>
            <ToolPanel title="Eksport porównania">
              <div className="flex flex-wrap gap-2">
                <ToolButton type="button" variant="primary" onClick={() => downloadComparison("md")}>Pobierz Markdown</ToolButton>
                <ToolButton type="button" variant="ghost" onClick={() => downloadComparison("json")}>Pobierz JSON</ToolButton>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Raporty nie są podpisane kryptograficznie, a zgodne identyfikatory codebooka nie gwarantują niezmienności definicji. Interpretuj różnice w kontekście przebiegu badania.
              </p>
            </ToolPanel>
          </>
        ) : null}
      </div>
    </>
  );
}
