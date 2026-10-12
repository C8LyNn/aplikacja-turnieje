import { type FormEvent, useMemo, useState } from "react";
import {
  ToolButton,
  ToolEmptyState,
  ToolInput,
  ToolNotice,
  ToolPanel,
  ToolSelect,
  ToolTextarea,
} from "@/components/tool-ui";
import { ModuleHeader } from "@/components/portfolio-ui";
import type { SamplingPlan, SamplingPlanStatus } from "./model";
import {
  evaluateSamplingPlanForAllPeople,
  personSamplingProfile,
} from "./sampling-analysis";
import { useResearchProject } from "./use-research-project";

const BASE = "/ludology/statement-classification";

function PageHeader({ section, title, description }: { section: string; title: string; description: string }) {
  return (
    <ModuleHeader
      code={`LUDO 02 / ${section}`}
      title={title}
      description={description}
      accent="amber"
      backHref={BASE}
      backLabel="Kategoryzacja wypowiedzi i poglądów"
    />
  );
}

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function parseOptionalPercent(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value / 100));
}

function parseOptionalNumber(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, value) : null;
}

export default function SamplingLab() {
  const {
    data,
    addSamplingPlan,
    updateSamplingPlan,
    deleteSamplingPlan,
  } = useResearchProject();

  const [selectedPlanId, setSelectedPlanId] = useState(data.samplingPlans[0]?.id ?? "");
  const [name, setName] = useState("Plan pilotażowy");
  const [version, setVersion] = useState("0.1.0");
  const [minimumSources, setMinimumSources] = useState("5");
  const [minimumTypes, setMinimumTypes] = useState("2");
  const [minimumPurposes, setMinimumPurposes] = useState("2");
  const [minimumPreparedness, setMinimumPreparedness] = useState("2");
  const [minimumScopes, setMinimumScopes] = useState("2");
  const [minimumDatedShare, setMinimumDatedShare] = useState("75");
  const [maximumTypeShare, setMaximumTypeShare] = useState("70");
  const [minimumTemporalSpan, setMinimumTemporalSpan] = useState("1");
  const [notes, setNotes] = useState("");

  const selectedPlan = data.samplingPlans.find((plan) => plan.id === selectedPlanId);
  const evaluations = selectedPlan
    ? evaluateSamplingPlanForAllPeople(data, selectedPlan)
    : [];

  const corpusProfiles = useMemo(
    () => data.people.map((person) => ({
      person,
      profile: personSamplingProfile(data, person.id),
    })),
    [data],
  );

  function submitPlan(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !version.trim()) return;
    const id = addSamplingPlan({
      name: name.trim(),
      version: version.trim(),
      status: "draft",
      minimumSourcesPerPerson: Math.max(0, Number(minimumSources) || 0),
      minimumSourceTypesPerPerson: Math.max(0, Number(minimumTypes) || 0),
      minimumPurposesPerPerson: Math.max(0, Number(minimumPurposes) || 0),
      minimumPreparednessModesPerPerson: Math.max(0, Number(minimumPreparedness) || 0),
      minimumScopesPerPerson: Math.max(0, Number(minimumScopes) || 0),
      minimumDatedSourceShare: parseOptionalPercent(minimumDatedShare),
      maximumSingleSourceTypeShare: parseOptionalPercent(maximumTypeShare),
      minimumTemporalSpanYears: parseOptionalNumber(minimumTemporalSpan),
      notes: notes.trim() || undefined,
    });
    setSelectedPlanId(id);
  }

  function patchNumber<K extends keyof SamplingPlan>(
    key: K,
    raw: string,
    mode: "integer" | "percent" | "optional-number" = "integer",
  ) {
    if (!selectedPlan) return;
    let value: number | null;
    if (mode === "percent") value = parseOptionalPercent(raw);
    else if (mode === "optional-number") value = parseOptionalNumber(raw);
    else value = Math.max(0, Number(raw) || 0);
    updateSamplingPlan(selectedPlan.id, { [key]: value } as Partial<SamplingPlan>);
  }

  function removePlan() {
    if (!selectedPlan) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Usunąć plan próbkowania „${selectedPlan.name} ${selectedPlan.version}”?`)
    ) return;
    deleteSamplingPlan(selectedPlan.id);
    setSelectedPlanId(data.samplingPlans.find((plan) => plan.id !== selectedPlan.id)?.id ?? "");
  }

  const peopleMeetingPlan = evaluations.filter((evaluation) => evaluation.meetsPlan).length;
  const totalGaps = evaluations.reduce((sum, evaluation) => sum + evaluation.gaps.length, 0);

  return (
    <>
      <PageHeader
        section="SAMPLE"
        title="Sampling / Corpus Plan"
        description="Planowanie korpusu ma ograniczać cherry-picking. Liczymy niezależne źródła, ich różnorodność i pokrycie czasowe — nie liczbę cytatów."
      />

      <div className="space-y-4">
        <ToolNotice>
          Cele w tym module są operacyjne i konfigurowalne. Ich spełnienie nie dowodzi trafności rekonstrukcji, a niespełnienie nie oznacza automatycznie, że korpus jest bezwartościowy.
        </ToolNotice>

        <ToolPanel
          title="Plan próbkowania"
          description="Wersjonowany zestaw celów mówi, jakiego korpusu chcemy przed interpretacją wyników."
        >
          <div className="grid gap-4 xl:grid-cols-[390px_1fr]">
            <form className="space-y-3" onSubmit={submitPlan}>
              <ToolInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa planu" />
              <ToolInput value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Wersja" />
              <div className="grid gap-3 sm:grid-cols-2">
                <ToolInput type="number" min="0" value={minimumSources} onChange={(e) => setMinimumSources(e.target.value)} placeholder="Min. źródeł / osoba" />
                <ToolInput type="number" min="0" value={minimumTypes} onChange={(e) => setMinimumTypes(e.target.value)} placeholder="Min. typów" />
                <ToolInput type="number" min="0" value={minimumPurposes} onChange={(e) => setMinimumPurposes(e.target.value)} placeholder="Min. celów materiału" />
                <ToolInput type="number" min="0" value={minimumPreparedness} onChange={(e) => setMinimumPreparedness(e.target.value)} placeholder="Min. trybów wypowiedzi" />
                <ToolInput type="number" min="0" value={minimumScopes} onChange={(e) => setMinimumScopes(e.target.value)} placeholder="Min. zakresów" />
                <ToolInput type="number" min="0" step="0.1" value={minimumTemporalSpan} onChange={(e) => setMinimumTemporalSpan(e.target.value)} placeholder="Min. lat rozpiętości" />
                <ToolInput type="number" min="0" max="100" value={minimumDatedShare} onChange={(e) => setMinimumDatedShare(e.target.value)} placeholder="% źródeł z datą" />
                <ToolInput type="number" min="0" max="100" value={maximumTypeShare} onChange={(e) => setMaximumTypeShare(e.target.value)} placeholder="Max % jednego typu" />
              </div>
              <ToolTextarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Uzasadnienie planu / wyjątki" />
              <ToolButton type="submit" variant="primary">Utwórz plan</ToolButton>
            </form>

            <div className="space-y-3">
              {data.samplingPlans.length === 0 ? (
                <ToolEmptyState
                  title="Brak planu próbkowania"
                  description="Utwórz pierwszy plan. Domyślne wartości formularza są tylko punktem startowym pilotażu i można je zmienić."
                />
              ) : (
                <>
                  <ToolSelect value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                    {data.samplingPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name} · {plan.version} · {plan.status}</option>
                    ))}
                  </ToolSelect>

                  {selectedPlan && (
                    <div className="space-y-4 rounded-xl border border-border bg-background/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-black">{selectedPlan.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">v{selectedPlan.version}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ToolSelect
                            className="w-auto"
                            value={selectedPlan.status}
                            onChange={(e) => updateSamplingPlan(selectedPlan.id, { status: e.target.value as SamplingPlanStatus })}
                          >
                            <option value="draft">draft</option>
                            <option value="active">active</option>
                            <option value="retired">retired</option>
                          </ToolSelect>
                          <ToolButton type="button" variant="ghost" onClick={removePlan}>Usuń</ToolButton>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="text-xs text-muted-foreground">
                          Min. źródeł
                          <ToolInput
                            className="mt-1"
                            type="number"
                            min="0"
                            value={selectedPlan.minimumSourcesPerPerson}
                            onChange={(e) => patchNumber("minimumSourcesPerPerson", e.target.value)}
                          />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Min. typów
                          <ToolInput
                            className="mt-1"
                            type="number"
                            min="0"
                            value={selectedPlan.minimumSourceTypesPerPerson}
                            onChange={(e) => patchNumber("minimumSourceTypesPerPerson", e.target.value)}
                          />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Min. celów
                          <ToolInput
                            className="mt-1"
                            type="number"
                            min="0"
                            value={selectedPlan.minimumPurposesPerPerson}
                            onChange={(e) => patchNumber("minimumPurposesPerPerson", e.target.value)}
                          />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Min. trybów
                          <ToolInput
                            className="mt-1"
                            type="number"
                            min="0"
                            value={selectedPlan.minimumPreparednessModesPerPerson}
                            onChange={(e) => patchNumber("minimumPreparednessModesPerPerson", e.target.value)}
                          />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Min. zakresów
                          <ToolInput
                            className="mt-1"
                            type="number"
                            min="0"
                            value={selectedPlan.minimumScopesPerPerson}
                            onChange={(e) => patchNumber("minimumScopesPerPerson", e.target.value)}
                          />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Min. datowanych
                          <ToolInput
                            className="mt-1"
                            type="number"
                            min="0"
                            max="100"
                            value={selectedPlan.minimumDatedSourceShare === null ? "" : Math.round(selectedPlan.minimumDatedSourceShare * 100)}
                            onChange={(e) => patchNumber("minimumDatedSourceShare", e.target.value, "percent")}
                            placeholder="brak"
                          />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Max jednego typu
                          <ToolInput
                            className="mt-1"
                            type="number"
                            min="0"
                            max="100"
                            value={selectedPlan.maximumSingleSourceTypeShare === null ? "" : Math.round(selectedPlan.maximumSingleSourceTypeShare * 100)}
                            onChange={(e) => patchNumber("maximumSingleSourceTypeShare", e.target.value, "percent")}
                            placeholder="brak"
                          />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Min. lat
                          <ToolInput
                            className="mt-1"
                            type="number"
                            min="0"
                            step="0.1"
                            value={selectedPlan.minimumTemporalSpanYears ?? ""}
                            onChange={(e) => patchNumber("minimumTemporalSpanYears", e.target.value, "optional-number")}
                            placeholder="brak"
                          />
                        </label>
                      </div>

                      <ToolTextarea
                        rows={3}
                        value={selectedPlan.notes ?? ""}
                        onChange={(e) => updateSamplingPlan(selectedPlan.id, { notes: e.target.value || undefined })}
                        placeholder="Notatki metodologiczne"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </ToolPanel>

        <ToolPanel
          title="Surowy profil korpusu"
          description="Ten widok działa nawet bez planu i pokazuje fakty o materiale, zanim porównamy go z jakimkolwiek celem próbkowania."
          flush
        >
          {data.people.length === 0 ? (
            <div className="p-5">
              <ToolEmptyState title="Brak osób" description="Dodaj osoby i źródła, aby zobaczyć strukturę korpusu." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b border-border bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Osoba</th>
                    <th className="px-3 py-3 text-center">Źródła</th>
                    <th className="px-3 py-3 text-center">Typy</th>
                    <th className="px-3 py-3 text-center">Cele</th>
                    <th className="px-3 py-3 text-center">Tryby</th>
                    <th className="px-3 py-3 text-center">Zakresy</th>
                    <th className="px-3 py-3 text-center">Datowane</th>
                    <th className="px-3 py-3 text-center">Dominujący typ</th>
                    <th className="px-3 py-3 text-center">Rozpiętość</th>
                    <th className="px-4 py-3 text-center">Największy udział cytatów z 1 źródła</th>
                  </tr>
                </thead>
                <tbody>
                  {corpusProfiles.map(({ person, profile }) => (
                    <tr key={person.id} className="border-b border-border/60 last:border-b-0">
                      <td className="px-4 py-3 font-semibold">{person.displayName}</td>
                      <td className="px-3 py-3 text-center">{profile.sourceCount}</td>
                      <td className="px-3 py-3 text-center">{profile.sourceTypeCount}</td>
                      <td className="px-3 py-3 text-center">{profile.purposeCount}</td>
                      <td className="px-3 py-3 text-center">{profile.preparednessModeCount}</td>
                      <td className="px-3 py-3 text-center">{profile.scopeCount}</td>
                      <td className="px-3 py-3 text-center">{profile.datedSourceCount}/{profile.sourceCount}</td>
                      <td className="px-3 py-3 text-center">{profile.dominantSourceType ?? "—"} {profile.dominantSourceTypeShare === null ? "" : `(${percent(profile.dominantSourceTypeShare)})`}</td>
                      <td className="px-3 py-3 text-center">{profile.temporalSpanYears === null ? "—" : `${profile.temporalSpanYears.toFixed(1)} lat`}</td>
                      <td className="px-4 py-3 text-center">{percent(profile.largestSourceExcerptShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ToolPanel>

        {selectedPlan && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{peopleMeetingPlan}/{data.people.length}</div>
                <div className="text-xs text-muted-foreground">osób spełniających aktualny plan</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{totalGaps}</div>
                <div className="text-xs text-muted-foreground">otwartych luk próbkowania</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{data.sources.length}</div>
                <div className="text-xs text-muted-foreground">niezależnych materiałów w całym korpusie</div>
              </div>
            </div>

            <ToolPanel
              title="Luki względem planu"
              description="Lista mówi, czego brakuje względem przyjętego planu. Nie przelicza jakości badań na jeden score."
            >
              {evaluations.length === 0 ? (
                <ToolEmptyState title="Brak osób do oceny" />
              ) : (
                <div className="space-y-3">
                  {evaluations.map((evaluation) => {
                    const person = data.people.find((item) => item.id === evaluation.personId);
                    return (
                      <div key={evaluation.personId} className="rounded-xl border border-border bg-background/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-bold">{person?.displayName ?? evaluation.personId}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {evaluation.profile.sourceCount} źródeł · {evaluation.profile.sourceTypeCount} typów · {evaluation.profile.purposeCount} celów materiału
                            </div>
                          </div>
                          <div className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${evaluation.meetsPlan ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
                            {evaluation.meetsPlan ? "plan spełniony" : `${evaluation.gaps.length} luk`}
                          </div>
                        </div>

                        {evaluation.gaps.length > 0 && (
                          <div className="mt-3 grid gap-2 lg:grid-cols-2">
                            {evaluation.gaps.map((gap) => (
                              <div key={gap.code} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm">
                                <div>{gap.message}</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  actual: {gap.actual === null ? "brak danych" : gap.code.includes("share") || gap.code === "source_type_concentration" ? percent(gap.actual) : gap.actual.toFixed(gap.code === "temporal_span" ? 1 : 0)}
                                  {" · "}target: {gap.code.includes("share") || gap.code === "source_type_concentration" ? percent(gap.target) : gap.target}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ToolPanel>
          </>
        )}

        <ToolNotice>
          Szczególnie ważny jest udział cytatów z jednego źródła: 40 fragmentów z jednego filmu nadal oznacza jeden materiał źródłowy. Sampling Lab nie pozwala traktować ich jako 40 niezależnych obserwacji korpusu.
        </ToolNotice>
      </div>
    </>
  );
}
