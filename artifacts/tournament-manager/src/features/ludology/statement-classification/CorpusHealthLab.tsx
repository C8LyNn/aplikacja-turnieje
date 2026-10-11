import { useMemo, useState } from "react";
import {
  ToolEmptyState,
  ToolNotice,
  ToolPanel,
  ToolSelect,
} from "@/components/tool-ui";
import { ModuleHeader } from "@/components/portfolio-ui";
import {
  activeSamplingPlan,
  buildCorpusHealthMatrix,
  corpusHealthTotals,
} from "./corpus-health";
import { useResearchProject } from "./use-research-project";
import { PILOT_CODEBOOK } from "./pilot-codebook";

const BASE = "/ludology/statement-classification";

function PageHeader() {
  return (
    <ModuleHeader
      code="LUDO 02 / HEALTH"
      title="Corpus Health"
      description="Diagnostyka kompletności i ryzyk korpusu przed publikacją wyników. Brak jednego syntetycznego score jest celowy."
      accent="amber"
      backHref={BASE}
      backLabel="Kategoryzacja wypowiedzi i poglądów"
    />
  );
}

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

export default function CorpusHealthLab() {
  const { data } = useResearchProject();
  const [codebookId, setCodebookId] = useState(
    data.codebooks.find((item) => item.id === PILOT_CODEBOOK.id)?.id ??
      data.codebooks[0]?.id ??
      "",
  );
  const [samplingPlanId, setSamplingPlanId] = useState(
    activeSamplingPlan(data)?.id ?? "",
  );

  const samplingPlan =
    data.samplingPlans.find((plan) => plan.id === samplingPlanId) ?? null;
  const rows = useMemo(
    () => (codebookId ? buildCorpusHealthMatrix(data, codebookId, samplingPlan) : []),
    [data, codebookId, samplingPlan],
  );
  const totals = corpusHealthTotals(rows);

  return (
    <>
      <PageHeader />

      <div className="space-y-4">
        <ToolNotice>
          Ten ekran nie ocenia „jakości osoby” ani nie tworzy jednego wyniku jakości badań. Pokazuje osobno braki techniczne, pokrycie dowodów, sprzeczności i luki planu próbkowania.
        </ToolNotice>

        <ToolPanel
          title="Kontekst audytu"
          description="Wybierz codebook oraz opcjonalny plan próbkowania, względem których chcesz sprawdzić korpus."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <ToolSelect value={codebookId} onChange={(event) => setCodebookId(event.target.value)}>
              <option value="">Wybierz codebook…</option>
              {data.codebooks.map((codebook) => (
                <option key={codebook.id} value={codebook.id}>
                  {codebook.name} · {codebook.version} · {codebook.status}
                </option>
              ))}
            </ToolSelect>
            <ToolSelect value={samplingPlanId} onChange={(event) => setSamplingPlanId(event.target.value)}>
              <option value="">Bez planu próbkowania</option>
              {data.samplingPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · {plan.version} · {plan.status}
                </option>
              ))}
            </ToolSelect>
          </div>
        </ToolPanel>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="text-2xl font-black">{totals.people}</div>
            <div className="text-xs text-muted-foreground">osób</div>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="text-2xl font-black">{totals.blockerFlags}</div>
            <div className="text-xs text-muted-foreground">blockerów</div>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="text-2xl font-black">{totals.warningFlags}</div>
            <div className="text-xs text-muted-foreground">ostrzeżeń</div>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="text-2xl font-black">{totals.staleAssessments}</div>
            <div className="text-xs text-muted-foreground">stale assessments</div>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="text-2xl font-black">{totals.contradictions}</div>
            <div className="text-xs text-muted-foreground">sprzeczności</div>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="text-2xl font-black">{totals.samplingGaps}</div>
            <div className="text-xs text-muted-foreground">luk samplingu</div>
          </div>
        </div>

        <ToolPanel
          title="Macierz zdrowia korpusu"
          description="Wartości są rozdzielone, żeby nie ukrywać różnych typów problemów za jednym numerem."
          flush
        >
          {!codebookId ? (
            <div className="p-5">
              <ToolEmptyState title="Wybierz codebook" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-5">
              <ToolEmptyState title="Brak osób w korpusie" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="border-b border-border bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Osoba</th>
                    <th className="px-3 py-3 text-center">Źródła</th>
                    <th className="px-3 py-3 text-center">Argumenty</th>
                    <th className="px-3 py-3 text-center">Weryfikacja</th>
                    <th className="px-3 py-3 text-center">Argument assignment</th>
                    <th className="px-3 py-3 text-center">Jednostki dowodowe</th>
                    <th className="px-3 py-3 text-center">Codebook coverage</th>
                    <th className="px-3 py-3 text-center">Rekonstrukcje</th>
                    <th className="px-3 py-3 text-center">Stale</th>
                    <th className="px-3 py-3 text-center">Sprzeczności</th>
                    <th className="px-3 py-3 text-center">Metadata</th>
                    <th className="px-4 py-3 text-center">Sampling gaps</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const person = data.people.find((item) => item.id === row.personId);
                    return (
                      <tr key={row.personId} className="border-b border-border/60 last:border-b-0">
                        <td className="px-4 py-3 font-semibold">{person?.displayName ?? row.personId}</td>
                        <td className="px-3 py-3 text-center">{row.sourceCount}</td>
                        <td className="px-3 py-3 text-center">{row.argumentCount}</td>
                        <td className="px-3 py-3 text-center">{percent(row.verificationShare)}</td>
                        <td className="px-3 py-3 text-center">{percent(row.argumentAssignmentShare)}</td>
                        <td className="px-3 py-3 text-center">{row.independentEvidenceUnitCount}</td>
                        <td className="px-3 py-3 text-center">{row.propositionCoverageCount}/{row.propositionCount}</td>
                        <td className="px-3 py-3 text-center">{row.assessmentCount}/{row.propositionCount}</td>
                        <td className="px-3 py-3 text-center">{row.staleAssessmentCount}</td>
                        <td className="px-3 py-3 text-center">{row.contradictionCount}</td>
                        <td className="px-3 py-3 text-center">{percent(row.metadataCompleteness)}</td>
                        <td className="px-4 py-3 text-center">{row.samplingGaps.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ToolPanel>

        <ToolPanel
          title="Flagi wymagające uwagi"
          description="Blocker oznacza, że publikacja profilu powinna poczekać. Warning wymaga świadomej decyzji badacza. Info zwraca uwagę na materiał do interpretacji."
        >
          {rows.every((row) => row.flags.length === 0) ? (
            <ToolNotice tone="success">Brak flag dla wybranego kontekstu audytu.</ToolNotice>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => {
                const person = data.people.find((item) => item.id === row.personId);
                if (row.flags.length === 0) return null;
                return (
                  <div key={row.personId} className="rounded-xl border border-border bg-background/40 p-4">
                    <div className="font-bold">{person?.displayName ?? row.personId}</div>
                    <div className="mt-3 grid gap-2 lg:grid-cols-2">
                      {row.flags.map((flag, index) => (
                        <div
                          key={`${flag.code}:${index}`}
                          className="rounded-lg border border-border/60 bg-card/40 px-3 py-2"
                        >
                          <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                            {flag.severity} · {flag.code}
                          </div>
                          <div className="mt-1 text-sm">{flag.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ToolPanel>

        <ToolPanel
          title="Zasada publikacyjna"
          description="Corpus Health nie zastępuje recenzji badacza."
        >
          <div className="text-sm leading-6 text-muted-foreground">
            Profil publiczny powinien być generowany dopiero wtedy, gdy badacz świadomie zaakceptuje stan korpusu. System ma pokazać ryzyka i ich źródło, ale nie może ukrywać ich pod automatycznym „75/100”.
          </div>
        </ToolPanel>
      </div>
    </>
  );
}
