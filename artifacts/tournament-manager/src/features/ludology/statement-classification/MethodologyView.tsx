import { type FormEvent, useState } from "react";
import {
  ToolButton,
  ToolDisclosure,
  ToolEmptyState,
  ToolInput,
  ToolNotice,
  ToolPanel,
  ToolSection,
  ToolSelect,
  ToolTextarea,
} from "@/components/tool-ui";
import { ModuleHeader } from "@/components/portfolio-ui";
import { computeCoderAgreementPairs } from "./coder-agreement";
import { adjudicationIssue, canonicalCodingPair, latestCodingAdjudication, validateAdjudicationInput } from "./adjudication-protocol";
import type { DirectionScore } from "./model";
import { PILOT_CODEBOOK } from "./pilot-codebook";
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

export default function MethodologyView() {
  const { data, addCoder, updateCoder, addAdjudication } = useResearchProject();
  const [coderName, setCoderName] = useState("");
  const [coderType, setCoderType] = useState<"human" | "ai">("human");
  const [editingCoderId, setEditingCoderId] = useState("");
  const [editingCoderName, setEditingCoderName] = useState("");
  const [adjudicationTarget, setAdjudicationTarget] = useState("");
  const [adjudicationReviewerId, setAdjudicationReviewerId] = useState("");
  const [adjudicationDecision, setAdjudicationDecision] = useState<"resolved" | "deferred">("resolved");
  const [adjudicationDirection, setAdjudicationDirection] = useState("na");
  const [adjudicationRationale, setAdjudicationRationale] = useState("");
  const [adjudicationError, setAdjudicationError] = useState("");
  const activeCodebook = data.codebooks.find((item) => item.id === PILOT_CODEBOOK.id);
  const propositions = activeCodebook
    ? data.propositions.filter((proposition) => proposition.codebookId === activeCodebook.id)
    : [];
  const agreementPairs = activeCodebook
    ? computeCoderAgreementPairs(data.codings, data.coders, activeCodebook.id)
    : [];

  function submitCoder(event: FormEvent) {
    event.preventDefault();
    if (!coderName.trim()) return;
    addCoder({ displayName: coderName.trim(), type: coderType });
    setCoderName("");
    setCoderType("human");
  }

  function startCoderEdit(coderId: string) {
    const coder = data.coders.find((item) => item.id === coderId);
    if (!coder) return;
    setEditingCoderId(coder.id);
    setEditingCoderName(coder.displayName);
  }

  function saveCoderEdit(coderId: string) {
    if (!editingCoderName.trim()) return;
    updateCoder(coderId, { displayName: editingCoderName.trim() });
    setEditingCoderId("");
  }


  function openAdjudication(aId: string, bId: string) {
    setAdjudicationTarget(JSON.stringify([aId, bId]));
    setAdjudicationReviewerId("");
    setAdjudicationDecision("resolved");
    setAdjudicationDirection("na");
    setAdjudicationRationale("");
    setAdjudicationError("");
  }

  function submitAdjudication(aId: string, bId: string) {
    const input = {
      codingAId: aId,
      codingBId: bId,
      reviewerId: adjudicationReviewerId,
      decision: adjudicationDecision,
      direction: adjudicationDecision === "deferred" || adjudicationDirection === "na"
        ? null
        : Number(adjudicationDirection) as DirectionScore,
      rationale: adjudicationRationale,
    };
    const error = validateAdjudicationInput(data, input);
    if (error) {
      setAdjudicationError(error);
      return;
    }
    addAdjudication(input);
    setAdjudicationTarget("");
    setAdjudicationError("");
  }

  return (
    <>
      <PageHeader section="METHOD" title="Metodologia" description="Podstawą ma być analiza treści i jakościowe kodowanie z pełną możliwością audytu." />
      <div className="space-y-4">
        <ToolPanel title="Aktywny codebook" description="Pilotażowy słownik mikrostanowisk używany przez Coding Lab.">
          {activeCodebook ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-xs text-muted-foreground">Nazwa</div><div className="mt-1 font-bold">{activeCodebook.name}</div></div>
              <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-xs text-muted-foreground">Wersja</div><div className="mt-1 font-bold">{activeCodebook.version}</div></div>
              <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-xs text-muted-foreground">Status</div><div className="mt-1 font-bold">{activeCodebook.status}</div></div>
              <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-xs text-muted-foreground">Mikrostanowiska</div><div className="mt-1 font-bold">{propositions.length}</div></div>
            </div>
          ) : <ToolEmptyState title="Brak codebooka" />}
          {activeCodebook?.description && <div className="mt-4 text-sm text-muted-foreground">{activeCodebook.description}</div>}
        </ToolPanel>

        <ToolPanel title="Koderzy" description="Kodowanie pozostaje przypisane do konkretnego człowieka albo systemu AI, co umożliwia późniejsze porównanie zgodności.">
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <form className="space-y-3" onSubmit={submitCoder}>
              <ToolInput value={coderName} onChange={(e) => setCoderName(e.target.value)} placeholder="Nazwa kodera" />
              <ToolSelect value={coderType} onChange={(e) => setCoderType(e.target.value as "human" | "ai")}>
                <option value="human">Człowiek</option>
                <option value="ai">AI</option>
              </ToolSelect>
              <ToolButton type="submit" variant="primary">Dodaj kodera</ToolButton>
            </form>
            <div className="space-y-2">
              {data.coders.map((coder) => {
                const codingCount = data.codings.filter((coding) => coding.coderId === coder.id).length;
                return (
                  <div key={coder.id} className="rounded-xl border border-border bg-background/40 p-4">
                    {editingCoderId === coder.id ? (
                      <div className="flex flex-wrap gap-2">
                        <ToolInput className="min-w-56 flex-1" value={editingCoderName} onChange={(e) => setEditingCoderName(e.target.value)} />
                        <ToolButton type="button" variant="primary" onClick={() => saveCoderEdit(coder.id)}>Zapisz</ToolButton>
                        <ToolButton type="button" variant="ghost" onClick={() => setEditingCoderId("")}>Anuluj</ToolButton>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-bold">{coder.displayName}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{coder.type} · {codingCount} kodowań</div>
                        </div>
                        <ToolButton type="button" variant="ghost" onClick={() => startCoderEdit(coder.id)}>Edytuj nazwę</ToolButton>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ToolPanel>

        <ToolPanel
          title="Zgodność koderów — diagnostyka i przegląd różnic"
          description="Jednostka porównania: ta sama para fragment–mikrostanowisko i wersja codebooka. N/A nie jest oceną neutralną (0). Wyniki opisują zgodność, nie prawdziwość stanowiska."
        >
          {agreementPairs.length === 0 ? (
            <ToolEmptyState title="Potrzeba co najmniej dwóch koderów" description="Dodaj kolejnego kodera i zakoduj te same jednostki niezależnie, aby porównać ich interpretacje." />
          ) : (
            <div className="space-y-4">
              <ToolNotice>
                Surowa zgodność obejmuje również obustronne N/A. Zgodność ocen kierunkowych i liniowo ważona κ Cohena wykorzystują wyłącznie pary z dwiema ocenami −2…+2. κ jest niezdefiniowana przy zbyt małej próbie albo braku zmienności rozkładów. Nie traktuj jej jako automatycznej oceny jakości badania.
              </ToolNotice>
              {agreementPairs.map((pair) => (
                <div key={`${pair.coderAId}::${pair.coderBId}`} className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{pair.coderALabel} ↔ {pair.coderBLabel}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Zakodowane jednostki: {pair.coderAUnits} / {pair.coderBUnits} · wspólne jednoznaczne: {pair.overlap}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Codebook: {activeCodebook?.version}</div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-border p-3">
                      <div className="text-xs text-muted-foreground">Zgodność wszystkich par</div>
                      <div className="mt-1 text-xl font-black">{pair.exactDirectionAgreement === null ? "—" : `${Math.round(pair.exactDirectionAgreement * 100)}%`}</div>
                      <div className="text-xs text-muted-foreground">{pair.exactDirectionMatches}/{pair.overlap} (w tym obustronne N/A)</div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <div className="text-xs text-muted-foreground">Zgodność ocen kierunkowych</div>
                      <div className="mt-1 text-xl font-black">{pair.ratedExactAgreement === null ? "—" : `${Math.round(pair.ratedExactAgreement * 100)}%`}</div>
                      <div className="text-xs text-muted-foreground">{pair.ratedExactMatches}/{pair.ratedOverlap} (bez N/A)</div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <div className="text-xs text-muted-foreground">κ Cohena · liniowa</div>
                      <div className="mt-1 text-xl font-black">{pair.linearWeightedKappa === null ? "—" : pair.linearWeightedKappa.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">korekta o zgodność oczekiwaną</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Wspólne N/A: {pair.bothNotApplicable} · N/A kontra ocena: {pair.missingVsScored} · rozbieżności: {pair.disagreements.length}
                  </div>
                  {pair.duplicateUnitsExcluded > 0 && (
                    <ToolNotice tone="danger">
                      Wyłączono {pair.duplicateUnitsExcluded} wspólnych jednostek z powielonym kodowaniem przynajmniej jednego kodera. Usuń duplikaty w Coding Lab przed interpretacją statystyk.
                    </ToolNotice>
                  )}
                  {pair.disagreements.length > 0 && (
                    <details className="rounded-lg border border-border p-3">
                      <summary className="cursor-pointer text-sm font-bold">
                        Materiał do wspólnego przeglądu ({pair.disagreements.length})
                      </summary>
                      <div className="mt-3 space-y-3">
                        {pair.disagreements.slice(0, 12).map((difference) => {
                          const excerpt = data.excerpts.find((item) => item.id === difference.excerptId);
                          const proposition = data.propositions.find((item) => item.id === difference.propositionId);
                          const source = data.sources.find((item) => item.id === excerpt?.sourceId);
                          return (
                            <div key={JSON.stringify([difference.excerptId, difference.propositionId])} className="rounded-lg border border-border bg-background/50 p-3">
                              <div className="text-xs font-bold">{proposition?.code ?? "?"} · {proposition?.label ?? "Nieznane mikrostanowisko"}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{source?.title ?? "Nieznane źródło"} · {difference.kind === "missing_vs_scored" ? "N/A kontra ocena" : "rozbieżny kierunek"}</div>
                              <blockquote className="mt-2 text-sm">“{excerpt?.text ?? "Brak fragmentu źródłowego"}”</blockquote>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <div className="text-sm">
                                  <strong>{pair.coderALabel}: {difference.coderADirection === null ? "N/A" : difference.coderADirection > 0 ? `+${difference.coderADirection}` : difference.coderADirection}</strong>
                                  {difference.coderARationale && <p className="mt-1 text-xs text-muted-foreground">{difference.coderARationale}</p>}
                                </div>
                                <div className="text-sm">
                                  <strong>{pair.coderBLabel}: {difference.coderBDirection === null ? "N/A" : difference.coderBDirection > 0 ? `+${difference.coderBDirection}` : difference.coderBDirection}</strong>
                                  {difference.coderBRationale && <p className="mt-1 text-xs text-muted-foreground">{difference.coderBRationale}</p>}
                                </div>
                              </div>
                              {source?.url && <a className="mt-2 inline-block text-xs font-semibold underline-offset-2 hover:underline" href={source.url} target="_blank" rel="noreferrer">Otwórz źródło ↗</a>}
                              {(() => {
                                const recordsA = data.codings.filter((record) =>
                                  record.coderId === pair.coderAId &&
                                  record.codebookId === activeCodebook?.id &&
                                  record.excerptId === difference.excerptId &&
                                  record.propositionId === difference.propositionId
                                );
                                const recordsB = data.codings.filter((record) =>
                                  record.coderId === pair.coderBId &&
                                  record.codebookId === activeCodebook?.id &&
                                  record.excerptId === difference.excerptId &&
                                  record.propositionId === difference.propositionId
                                );
                                if (recordsA.length !== 1 || recordsB.length !== 1) return null;
                                const recordA = recordsA[0];
                                const recordB = recordsB[0];
                                if (!recordA || !recordB) return null;
                                const key = JSON.stringify([recordA.id, recordB.id]);
                                const latest = latestCodingAdjudication(data, recordA.id, recordB.id);
                                const historyCount = data.adjudications.filter((event) =>
                                  canonicalCodingPair(event.codingAId, event.codingBId) === canonicalCodingPair(recordA.id, recordB.id)
                                ).length;
                                const problem = latest ? adjudicationIssue(data, latest) : null;
                                const availableReviewers = data.coders.filter((coder) =>
                                  coder.type === "human" &&
                                  coder.id !== pair.coderAId &&
                                  coder.id !== pair.coderBId
                                );
                                return (
                                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                                    {latest && (
                                      <div className="text-xs text-muted-foreground">
                                        Adjudykacja: <strong>{latest.decision === "resolved"
                                          ? `rozstrzygnięto (${latest.direction === null ? "N/A" : latest.direction})`
                                          : "odroczono"}</strong>
                                        {" "}· {latest.createdAt} · {historyCount} zapisów w historii
                                        {problem && <div className="mt-1 text-destructive">Wymaga przeglądu: {problem}</div>}
                                        <div className="mt-1">{latest.rationale}</div>
                                      </div>
                                    )}
                                    {adjudicationTarget !== key ? (
                                      <ToolButton type="button" variant="ghost" onClick={() => openAdjudication(recordA.id, recordB.id)}>
                                        {latest ? "Dodaj kolejną decyzję" : "Rozpatrz rozbieżność"}
                                      </ToolButton>
                                    ) : (
                                      <div className="space-y-2 rounded-lg border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Niezależny recenzent weryfikuje źródło, zapisuje uzasadnienie i nie modyfikuje ocen pierwotnych.
                                        </p>
                                        <ToolSelect value={adjudicationReviewerId} onChange={(e) => setAdjudicationReviewerId(e.target.value)}>
                                          <option value="">Wybierz trzeciego recenzenta — człowieka</option>
                                          {availableReviewers.map((coder) => <option key={coder.id} value={coder.id}>{coder.displayName}</option>)}
                                        </ToolSelect>
                                        {availableReviewers.length === 0 && <ToolNotice tone="danger">Dodaj osobnego recenzenta-człowieka w panelu „Koderzy”.</ToolNotice>}
                                        <ToolSelect value={adjudicationDecision} onChange={(e) => setAdjudicationDecision(e.target.value as "resolved" | "deferred")}>
                                          <option value="resolved">Rozstrzygnięcie</option>
                                          <option value="deferred">Odroczenie — potrzebne dodatkowe dane</option>
                                        </ToolSelect>
                                        {adjudicationDecision === "resolved" && (
                                          <ToolSelect value={adjudicationDirection} onChange={(e) => setAdjudicationDirection(e.target.value)}>
                                            <option value="na">N/A — brak podstaw do oceny stanowiska</option>
                                            <option value="-2">−2 — zdecydowanie odrzuca</option>
                                            <option value="-1">−1 — raczej odrzuca</option>
                                            <option value="0">0 — neutralne / mieszane</option>
                                            <option value="1">+1 — raczej popiera</option>
                                            <option value="2">+2 — zdecydowanie popiera</option>
                                          </ToolSelect>
                                        )}
                                        <ToolTextarea rows={3} value={adjudicationRationale} onChange={(e) => setAdjudicationRationale(e.target.value)} placeholder="Obowiązkowe uzasadnienie: dlaczego ta ocena albo dlaczego odroczenie?" />
                                        {adjudicationError && <ToolNotice tone="danger">{adjudicationError}</ToolNotice>}
                                        {excerpt?.verificationStatus !== "verified" && <ToolNotice>Najpierw zweryfikuj fragment w Warsztacie źródeł. To warunek zapisu adjudykacji.</ToolNotice>}
                                        <div className="flex flex-wrap gap-2">
                                          <ToolButton type="button" variant="primary" onClick={() => submitAdjudication(recordA.id, recordB.id)}>Zapisz decyzję</ToolButton>
                                          <ToolButton type="button" variant="ghost" onClick={() => setAdjudicationTarget("")}>Anuluj</ToolButton>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                            </div>
                          );
                        })}
                        {pair.disagreements.length > 12 && <div className="text-xs text-muted-foreground">Pokazano 12 z {pair.disagreements.length} rozbieżności. Pełny przegląd wymaga dalszego filtrowania danych.</div>}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </ToolPanel>

        <ToolPanel title="Historia codebooka" description="Każda wersja ma osobną tożsamość. Starsze kodowania pozostają przypięte do wersji, w której powstały.">
          <div className="space-y-2">
            {[...data.codebooks].reverse().map((codebook) => {
              const codingCount = data.codings.filter((coding) => coding.codebookId === codebook.id).length;
              const propositionCount = data.propositions.filter((proposition) => proposition.codebookId === codebook.id).length;
              const isCurrent = codebook.id === activeCodebook?.id;
              return (
                <div key={codebook.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-4">
                  <div>
                    <div className="font-bold">{codebook.name} · {codebook.version}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{propositionCount} mikrostanowisk · {codingCount} kodowań · status {codebook.status}</div>
                  </div>
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${isCurrent ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-border text-muted-foreground"}`}>
                    {isCurrent ? "aktualna" : "historyczna"}
                  </span>
                </div>
              );
            })}
          </div>
        </ToolPanel>

        <ToolPanel title="Definicje mikrostanowisk" description="Kod powinien być możliwy do zastosowania przez inną osobę na podstawie tych samych reguł.">
          <div className="space-y-3">
            {propositions.map((proposition) => (
              <ToolDisclosure
                key={proposition.id}
                title={`${proposition.code} — ${proposition.label}`}
                description={proposition.definition}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <ToolSection title="Włączaj, gdy">
                    {proposition.includeRules?.length ? (
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {proposition.includeRules.map((rule) => <li key={rule}>• {rule}</li>)}
                      </ul>
                    ) : <div className="text-sm text-muted-foreground">Brak dodatkowych reguł włączenia w wersji pilotażowej.</div>}
                  </ToolSection>
                  <ToolSection title="Wykluczaj, gdy">
                    {proposition.excludeRules?.length ? (
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {proposition.excludeRules.map((rule) => <li key={rule}>• {rule}</li>)}
                      </ul>
                    ) : <div className="text-sm text-muted-foreground">Brak dodatkowych reguł wyłączenia w wersji pilotażowej.</div>}
                  </ToolSection>
                </div>
                {(proposition.positiveExamples?.length || proposition.negativeExamples?.length || proposition.borderlineExamples?.length) && (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div><div className="mb-2 text-xs font-black uppercase text-muted-foreground">Przykłady +</div>{proposition.positiveExamples?.map((example) => <div key={example} className="mb-2 text-sm">{example}</div>)}</div>
                    <div><div className="mb-2 text-xs font-black uppercase text-muted-foreground">Przykłady −</div>{proposition.negativeExamples?.map((example) => <div key={example} className="mb-2 text-sm">{example}</div>)}</div>
                    <div><div className="mb-2 text-xs font-black uppercase text-muted-foreground">Graniczne</div>{proposition.borderlineExamples?.map((example) => <div key={example} className="mb-2 text-sm">{example}</div>)}</div>
                  </div>
                )}
              </ToolDisclosure>
            ))}
          </div>
        </ToolPanel>

        <ToolPanel>
          <div className="space-y-5">
            <ToolSection title="Wersjonowanie" description="Zmiana definicji kodu nie może po cichu zmienić znaczenia wcześniejszych danych.">
              <ToolNotice>Istotna zmiana definicji mikrostanowiska powinna tworzyć nową wersję codebooka i zachować informację, według której wersji wykonano każde kodowanie.</ToolNotice>
            </ToolSection>
            <ToolSection title="Debates / Discussions" description="Debata jest jednostką analizy ponad pojedynczą osobą i pojedynczym materiałem.">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Argumenty z różnych źródeł można łączyć wokół jednego jawnie zdefiniowanego pytania. Pozwala to odtwarzać historię sporu bez uznawania, że wszystkie wypowiedzi danej osoby są jednym niezmiennym stanowiskiem.</p>
                <p>Rola argumentu w debacie — główny, odpowiedź, dalszy ciąg lub kontekst — opisuje funkcję w przebiegu dyskusji, a nie automatyczny kierunek ideologiczny lub ocenę poprawności.</p>
                <p>Graf argumentacji zapisuje jawne, kierunkowe relacje: odpowiada na, wspiera, kwestionuje, doprecyzowuje i rozwija. Relacja opisuje strukturę publicznej argumentacji, ale sama nie oznacza, że którykolwiek argument jest prawdziwy, silniejszy lub reprezentatywny dla całej osoby.</p>
              </div>
            </ToolSection>
            <ToolSection title="Comparison Lab" description="Porównanie osób odbywa się na poziomie tych samych mikrostanowisk i świeżych rekonstrukcji.">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>System porównuje kierunek, siłę rekonstrukcji i zaplecze dowodowe osobno dla każdego mikrostanowiska. Nie tworzy jednego wyniku podobieństwa ani automatycznej odległości ideologicznej.</p>
                <p>Brak rekonstrukcji, status „niewystarczające dowody” i nieaktualna rekonstrukcja pozostają brakiem porównywalnych danych — nie są zastępowane zerem.</p>
              </div>
            </ToolSection>
            <ToolSection title="Corpus Health" description="Diagnostyka korpusu pokazuje ryzyka osobno zamiast redukować je do jednego wyniku.">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Audyt rozdziela kompletność metadanych, weryfikację fragmentów, przypisanie do argumentów, pokrycie codebooka, nieaktualne rekonstrukcje, sprzeczności i luki planu próbkowania.</p>
                <p>Blocker jest bramką procesu publikacyjnego, warning wymaga świadomej decyzji badacza, a info wskazuje materiał do interpretacji. Żadna z tych kategorii nie jest „oceną jakości osoby”.</p>
              </div>
            </ToolSection>
            <ToolSection title="Sampling / Corpus Plan" description="Dobór materiału jest jawny i wersjonowany zamiast pozostawać ukrytą decyzją badacza.">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Plan próbkowania określa cele dotyczące liczby niezależnych źródeł, różnorodności formatów, celu materiału i pokrycia czasowego. Fragmenty z jednego filmu nie zwiększają liczby niezależnych źródeł.</p>
                <p>Progi są celami operacyjnymi konkretnego badania, a nie uniwersalną miarą jakości. Niespełnienie celu powinno być widoczne jako luka korpusu, nie automatycznie jako „błąd” stanowiska.</p>
              </div>
            </ToolSection>
            <ToolSection title="Model wymiarów" description="Osie są osobną, wersjonowaną hipotezą interpretacyjną nad rekonstrukcjami stanowisk.">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Codebook mówi, jakie mikrostanowiska kodujemy. Dimension Model mówi dopiero później, które z nich mogą wspólnie reprezentować szerszy wymiar.</p>
                <p>Opublikowany model active/retired jest zamrożony. Zmiana osi, biegunów lub mapowań wymaga utworzenia nowej wersji draft, dzięki czemu można porównywać konkurencyjne modele na tych samych danych.</p>
              </div>
            </ToolSection>
            <ToolSection title="Niezależne kodowanie i adjudykacja" description="Ten sam materiał jest kodowany niezależnie, zanim trzecia osoba rozstrzygnie rozbieżności.">
              <div className="text-sm text-muted-foreground">Dwóch koderów najpierw ocenia ten sam, zweryfikowany fragment bez dostępu do wzajemnych ocen. Zgodność jest mierzona przed adjudykacją. Trzeci recenzent-człowiek sprawdza źródło i wybiera ocenę lub odroczenie, obowiązkowo podając uzasadnienie. Każda decyzja trafia do historii append-only; pierwotne kodowania i ich wskaźniki zgodności pozostają bez zmian. To protokół pilotażowy, nie certyfikat trafności konstruktu.</div>
            </ToolSection>
            <ToolSection title="AI" description="Automatyzacja może pomagać w wyszukiwaniu i proponowaniu kodów.">
              <ToolNotice>AI pozostaje narzędziem pomocniczym. Ostateczne kodowanie musi zachować identyfikowalnego kodera i pełny ślad do źródła.</ToolNotice>
            </ToolSection>
          </div>
        </ToolPanel>
      </div>
    </>
  );
}
