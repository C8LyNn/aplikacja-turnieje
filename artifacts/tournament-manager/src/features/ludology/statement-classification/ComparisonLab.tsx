import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/portfolio-ui";
import {
  ToolEmptyState,
  ToolNotice,
  ToolPanel,
  ToolSelect,
} from "@/components/tool-ui";
import {
  buildComparisonRows,
  comparisonSummary,
  type ComparisonRelation,
} from "./comparison-analysis";
import { PILOT_CODEBOOK } from "./pilot-codebook";
import { useResearchProject } from "./use-research-project";

const BASE = "/ludology/statement-classification";

const RELATION_LABELS: Record<ComparisonRelation, string> = {
  same_direction: "zgodny kierunek i siła",
  opposed_direction: "przeciwne kierunki",
  different_strength: "ten sam kierunek, inna siła",
  mixed_or_neutral: "mieszane / neutralne",
  insufficient: "brak porównywalnych danych",
};

function directionLabel(direction: -2 | -1 | 0 | 1 | 2 | null): string {
  if (direction === null) return "N/A";
  return direction > 0 ? `+${direction}` : String(direction);
}

function PageHeader() {
  return (
    <ModuleHeader
      code="LUDO 02 / COMPARE"
      title="Comparison Lab"
      description="Porównuj zrekonstruowane mikrostanowiska dwóch osób bez tworzenia jednego wyniku podobieństwa ani automatycznej mapy."
      accent="amber"
      backHref={BASE}
      backLabel="Kategoryzacja wypowiedzi i poglądów"
    />
  );
}

export default function ComparisonLab() {
  const { data } = useResearchProject();
  const [codebookId, setCodebookId] = useState(
    data.codebooks.find((item) => item.id === PILOT_CODEBOOK.id)?.id ??
      data.codebooks[0]?.id ??
      "",
  );
  const [leftPersonId, setLeftPersonId] = useState(data.people[0]?.id ?? "");
  const [rightPersonId, setRightPersonId] = useState(data.people[1]?.id ?? "");

  const selectedPersonIds = useMemo(
    () => [leftPersonId, rightPersonId].filter(Boolean),
    [leftPersonId, rightPersonId],
  );

  const rows =
    codebookId && selectedPersonIds.length === 2 && leftPersonId !== rightPersonId
      ? buildComparisonRows(data, codebookId, selectedPersonIds)
      : [];
  const summary = comparisonSummary(rows);

  const leftPerson = data.people.find((person) => person.id === leftPersonId);
  const rightPerson = data.people.find((person) => person.id === rightPersonId);
  const codebook = data.codebooks.find((item) => item.id === codebookId);

  return (
    <>
      <PageHeader />

      <div className="space-y-4">
        <ToolNotice>
          Porównanie działa wyłącznie na jawnie zapisanych rekonstrukcjach stanowisk. Brak rekonstrukcji, status „niewystarczające dowody” albo nieaktualna rekonstrukcja nie są zamieniane na neutralność.
        </ToolNotice>

        <ToolPanel
          title="Kontekst porównania"
          description="Wybierz jedną wersję codebooka i dwie osoby. Porównywane są te same mikrostanowiska."
        >
          <div className="grid gap-3 lg:grid-cols-3">
            <ToolSelect value={codebookId} onChange={(event) => setCodebookId(event.target.value)}>
              <option value="">Wybierz codebook…</option>
              {data.codebooks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.version} · {item.status}
                </option>
              ))}
            </ToolSelect>

            <ToolSelect value={leftPersonId} onChange={(event) => setLeftPersonId(event.target.value)}>
              <option value="">Pierwsza osoba…</option>
              {data.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </ToolSelect>

            <ToolSelect value={rightPersonId} onChange={(event) => setRightPersonId(event.target.value)}>
              <option value="">Druga osoba…</option>
              {data.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </ToolSelect>
          </div>

          {leftPersonId && rightPersonId && leftPersonId === rightPersonId && (
            <div className="mt-3">
              <ToolNotice tone="danger">Wybierz dwie różne osoby.</ToolNotice>
            </div>
          )}
        </ToolPanel>

        {!codebookId || data.people.length < 2 ? (
          <ToolPanel>
            <ToolEmptyState
              title="Za mało danych do porównania"
              description="Potrzebujesz codebooka oraz co najmniej dwóch osób w korpusie."
            />
          </ToolPanel>
        ) : leftPersonId !== rightPersonId && leftPersonId && rightPersonId ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{summary.propositions}</div>
                <div className="text-xs text-muted-foreground">mikrostanowisk</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{summary.comparable}</div>
                <div className="text-xs text-muted-foreground">porównywalnych</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{summary.sameDirection}</div>
                <div className="text-xs text-muted-foreground">zgodny kierunek i siła</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{summary.differentStrength}</div>
                <div className="text-xs text-muted-foreground">ten sam kierunek, inna siła</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{summary.opposedDirection}</div>
                <div className="text-xs text-muted-foreground">przeciwne kierunki</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{summary.insufficient}</div>
                <div className="text-xs text-muted-foreground">brak porównywalnych danych</div>
              </div>
            </div>

            <ToolPanel
              title={`${leftPerson?.displayName ?? "Osoba A"} ↔ ${rightPerson?.displayName ?? "Osoba B"}`}
              description={`${codebook?.name ?? "Codebook"} · ${codebook?.version ?? ""}. Wiersze pokazują rekonstrukcje i siłę zaplecza dowodowego, nie „kto ma rację”.`}
              flush
            >
              {rows.length === 0 ? (
                <div className="p-5">
                  <ToolEmptyState title="Brak mikrostanowisk w wybranym codebooku" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1160px] text-sm">
                    <thead className="border-b border-border bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Mikrostanowisko</th>
                        <th className="px-3 py-3 text-center">{leftPerson?.displayName ?? "Osoba A"}</th>
                        <th className="px-3 py-3 text-center">Dowody A</th>
                        <th className="px-3 py-3 text-center">{rightPerson?.displayName ?? "Osoba B"}</th>
                        <th className="px-3 py-3 text-center">Dowody B</th>
                        <th className="px-4 py-3 text-center">Relacja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const [left, right] = row.cells;
                        return (
                          <tr key={row.proposition.id} className="border-b border-border/60 last:border-b-0 align-top">
                            <td className="px-4 py-3">
                              <div className="font-bold">{row.proposition.code} — {row.proposition.label}</div>
                              <div className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                                {row.proposition.definition}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {left?.assessment ? (
                                <div>
                                  <div className="text-lg font-black">
                                    {directionLabel(left.assessment.direction)}
                                  </div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {left.assessment.status} · {left.assessment.confidence}
                                  </div>
                                  {left.stale && (
                                    <div className="mt-1 text-xs font-bold text-amber-300">
                                      nieaktualna rekonstrukcja
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">brak rekonstrukcji</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center text-xs">
                              <div className="font-bold">{left?.evidence.units ?? 0} jednostek</div>
                              <div className="mt-1 text-muted-foreground">
                                {left?.evidence.sources ?? 0} źródeł · {left?.evidence.codings ?? 0} kodowań
                              </div>
                              {left?.evidence.contradiction && (
                                <div className="mt-1 font-bold text-amber-300">sprzeczne kierunki</div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {right?.assessment ? (
                                <div>
                                  <div className="text-lg font-black">
                                    {directionLabel(right.assessment.direction)}
                                  </div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {right.assessment.status} · {right.assessment.confidence}
                                  </div>
                                  {right.stale && (
                                    <div className="mt-1 text-xs font-bold text-amber-300">
                                      nieaktualna rekonstrukcja
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">brak rekonstrukcji</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center text-xs">
                              <div className="font-bold">{right?.evidence.units ?? 0} jednostek</div>
                              <div className="mt-1 text-muted-foreground">
                                {right?.evidence.sources ?? 0} źródeł · {right?.evidence.codings ?? 0} kodowań
                              </div>
                              {right?.evidence.contradiction && (
                                <div className="mt-1 font-bold text-amber-300">sprzeczne kierunki</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-xs font-bold">
                              {RELATION_LABELS[row.relation]}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ToolPanel>

            <ToolPanel
              title="Jak czytać wynik"
              description="Podsumowania są licznikami kategorii, a nie metryką dystansu."
            >
              <div className="grid gap-3 lg:grid-cols-2">
                <ToolNotice>
                  „Przeciwne kierunki” oznaczają wyłącznie, że świeże rekonstrukcje tego samego mikrostanowiska mają różne znaki. Nie oznacza to automatycznie fundamentalnego konfliktu światopoglądowego.
                </ToolNotice>
                <ToolNotice>
                  „Brak porównywalnych danych” zachowuje różnicę między brakiem rekonstrukcji, niewystarczającymi dowodami i stale assessment. System nie uzupełnia braków zerem.
                </ToolNotice>
              </div>
            </ToolPanel>
          </>
        ) : null}
      </div>
    </>
  );
}
