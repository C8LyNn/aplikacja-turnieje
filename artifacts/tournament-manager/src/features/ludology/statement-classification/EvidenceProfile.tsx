import { useState } from "react";
import {
  ToolButton,
  ToolEmptyState,
  ToolNotice,
  ToolPanel,
  ToolSection,
  ToolSelect,
  ToolTextarea,
} from "@/components/tool-ui";
import { ModuleHeader } from "@/components/portfolio-ui";
import { useResearchProject } from "./use-research-project";
import { PILOT_CODEBOOK } from "./pilot-codebook";
import {
  countEvidenceDirections,
  evidenceSignature,
  groupEvidenceByYear,
  personEvidence,
} from "./evidence-analysis";

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

export default function EvidenceProfile() {
  const { data, upsertAssessment } = useResearchProject();
  const [personId, setPersonId] = useState(data.people[0]?.id ?? "");
  const [selectedPropositionId, setSelectedPropositionId] = useState("");
  const [assessmentStatus, setAssessmentStatus] = useState<"insufficient_evidence" | "stable" | "context_dependent" | "contradictory" | "position_change">("insufficient_evidence");
  const [assessmentDirection, setAssessmentDirection] = useState<"" | "-2" | "-1" | "0" | "1" | "2">("");
  const [assessmentConfidence, setAssessmentConfidence] = useState<"low" | "medium" | "high">("medium");
  const [assessmentSynthesis, setAssessmentSynthesis] = useState("");
  const [assessmentReviewerId, setAssessmentReviewerId] = useState(data.coders[0]?.id ?? "");
  const currentCodebook = data.codebooks.find((item) => item.id === PILOT_CODEBOOK.id);
  const currentPropositions = currentCodebook
    ? data.propositions.filter((proposition) => proposition.codebookId === currentCodebook.id)
    : [];
  const evidence = currentCodebook
    ? personEvidence(data, personId, currentCodebook.id)
    : { sources: [], excerpts: [], codings: [], argumentsCount: 0 };
  const personSourceRecords = evidence.sources;
  const personSources = new Set(personSourceRecords.map((source) => source.id));
  const personExcerptRecords = evidence.excerpts;
  const personExcerptIds = new Set(personExcerptRecords.map((excerpt) => excerpt.id));
  const personCodings = evidence.codings;
  const personArgumentCount = evidence.argumentsCount;
  const personAssessments = data.assessments.filter((assessment) =>
    assessment.personId === personId && assessment.codebookId === currentCodebook?.id
  );
  const evidenceTimeline = groupEvidenceByYear(personCodings, data.excerpts, data.sources);
  const verifiedExcerptCount = personExcerptRecords.filter((excerpt) => excerpt.verificationStatus === "verified").length;
  const coveredPropositions = new Set(personCodings.map((coding) => coding.propositionId)).size;
  const sourceTypeCounts = personSourceRecords.reduce<Record<string, number>>((acc, source) => {
    acc[source.sourceType] = (acc[source.sourceType] ?? 0) + 1;
    return acc;
  }, {});
  const dominantSourceType = Object.entries(sourceTypeCounts).sort((a, b) => b[1] - a[1])[0];
  const dominantSourceShare = dominantSourceType && personSourceRecords.length
    ? dominantSourceType[1] / personSourceRecords.length
    : 0;
  const metadataSlots = personSourceRecords.length * 5;
  const filledMetadataSlots = personSourceRecords.reduce((total, source) =>
    total +
    Number(Boolean(source.publishedAt)) +
    Number(Boolean(source.purpose)) +
    Number(Boolean(source.preparedness)) +
    Number(Boolean(source.scope)) +
    Number(Boolean(source.language)), 0);
  const metadataCompleteness = metadataSlots > 0 ? filledMetadataSlots / metadataSlots : 0;

  function openProposition(propositionId: string) {
    setSelectedPropositionId(propositionId);
    const existing = data.assessments.find((assessment) =>
      assessment.personId === personId &&
      assessment.propositionId === propositionId &&
      assessment.codebookId === currentCodebook?.id
    );
    setAssessmentStatus(existing?.status ?? "insufficient_evidence");
    setAssessmentDirection(existing?.direction === null || existing?.direction === undefined ? "" : String(existing.direction) as typeof assessmentDirection);
    setAssessmentConfidence(existing?.confidence ?? "medium");
    setAssessmentSynthesis(existing?.synthesis ?? "");
    setAssessmentReviewerId(existing?.reviewerId ?? data.coders[0]?.id ?? "");
  }

  function saveAssessment() {
    if (!currentCodebook || !selectedPropositionId) return;
    const selectedCodings = personCodings.filter((coding) => coding.propositionId === selectedPropositionId);
    upsertAssessment(
      {
        personId,
        propositionId: selectedPropositionId,
        codebookId: currentCodebook.id,
      },
      {
        reviewerId: assessmentReviewerId || undefined,
        status: assessmentStatus,
        direction: assessmentDirection === "" ? null : Number(assessmentDirection) as -2 | -1 | 0 | 1 | 2,
        confidence: assessmentConfidence,
        synthesis: assessmentSynthesis.trim() || undefined,
        evidenceSignature: evidenceSignature(selectedCodings),
      },
    );
  }

  return (
    <>
      <PageHeader
        section="EVID"
        title="Profil dowodów"
        description="Najpierw pokazujemy strukturę materiału dowodowego. Pozycja na mapie będzie późniejszą interpretacją tych danych."
      />
      {data.people.length === 0 ? (
        <ToolPanel><ToolEmptyState title="Brak osób do analizy" description="Dodaj osobę i rozpocznij budowę korpusu." /></ToolPanel>
      ) : (
        <div className="space-y-4">
          <ToolPanel title="Badana osoba">
            <ToolSelect value={personId} onChange={(e) => { setPersonId(e.target.value); setSelectedPropositionId(""); }}>
              {data.people.map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}
            </ToolSelect>
          </ToolPanel>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-border bg-card/60 p-4"><div className="text-2xl font-black">{personSources.size}</div><div className="text-xs text-muted-foreground">źródeł</div></div>
            <div className="rounded-2xl border border-border bg-card/60 p-4"><div className="text-2xl font-black">{personExcerptIds.size}</div><div className="text-xs text-muted-foreground">fragmentów</div></div>
            <div className="rounded-2xl border border-border bg-card/60 p-4"><div className="text-2xl font-black">{personCodings.length}</div><div className="text-xs text-muted-foreground">kodowań</div></div>
            <div className="rounded-2xl border border-border bg-card/60 p-4"><div className="text-2xl font-black">{new Set(personCodings.map((coding) => coding.propositionId)).size}/{currentPropositions.length}</div><div className="text-xs text-muted-foreground">mikrostanowisk z dowodami</div></div>
            <div className="rounded-2xl border border-border bg-card/60 p-4"><div className="text-2xl font-black">{personAssessments.length}/{currentPropositions.length}</div><div className="text-xs text-muted-foreground">rekonstrukcji stanowiska</div></div>
          </div>

          <ToolPanel
            title="Corpus Health"
            description="Pilotażowe diagnostyki jakości korpusu. Progi są operacyjne i nie są miarą prawdziwości ani trafności stanowiska."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <div className="text-xl font-black">{personArgumentCount}</div>
                <div className="text-xs text-muted-foreground">jednostek argumentacyjnych</div>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <div className="text-xl font-black">{personExcerptRecords.length ? Math.round((verifiedExcerptCount / personExcerptRecords.length) * 100) : 0}%</div>
                <div className="text-xs text-muted-foreground">fragmentów zweryfikowanych</div>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <div className="text-xl font-black">{coveredPropositions}/{currentPropositions.length}</div>
                <div className="text-xs text-muted-foreground">pokrycie codebooka</div>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <div className="text-xl font-black">{Object.keys(sourceTypeCounts).length}</div>
                <div className="text-xs text-muted-foreground">typów źródeł</div>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <div className="text-xl font-black">{Math.round(metadataCompleteness * 100)}%</div>
                <div className="text-xs text-muted-foreground">kompletności metadanych źródeł</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {personSourceRecords.length > 0 && personSourceRecords.length < 3 && (
                <ToolNotice>Mały korpus: mniej niż 3 materiały źródłowe. Profil powinien być traktowany jako bardzo wstępny.</ToolNotice>
              )}
              {dominantSourceType && dominantSourceShare > 0.65 && personSourceRecords.length >= 3 && (
                <ToolNotice>
                  Koncentracja źródeł: {Math.round(dominantSourceShare * 100)}% materiałów ma typ „{dominantSourceType[0]}”. Warto dołożyć inne formaty.
                </ToolNotice>
              )}
              {personExcerptRecords.length > 0 && verifiedExcerptCount / personExcerptRecords.length < 0.5 && (
                <ToolNotice>Większość fragmentów nie ma jeszcze statusu „zweryfikowany”. Nie używaj tego profilu jako gotowego wyniku publicznego.</ToolNotice>
              )}
              {currentPropositions.length > 0 && coveredPropositions / currentPropositions.length < 0.5 && (
                <ToolNotice>Pokrycie codebooka jest poniżej połowy. Brak obserwacji pozostaje brakiem danych, nie stanowiskiem neutralnym.</ToolNotice>
              )}
              {personSourceRecords.length > 0 && metadataCompleteness < 0.6 && (
                <ToolNotice>Metadane źródeł są niekompletne. Uzupełnij datę, cel materiału, tryb wypowiedzi, zakres i język tam, gdzie da się je ustalić.</ToolNotice>
              )}
              {coveredPropositions > personAssessments.length && (
                <ToolNotice>Część mikrostanowisk ma już zakodowane dowody, ale nie ma jeszcze jawnej rekonstrukcji stanowiska. Evidence Matrix nie powinna być traktowana jako gotowy profil.</ToolNotice>
              )}
            </div>
          </ToolPanel>

          <ToolPanel title="Evidence Matrix" description="Kolumny kierunku liczą niezależne jednostki argumentacyjne, nie liczbę cytatów. Liczba kodowań pozostaje pokazana osobno.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Mikrostanowisko</th>
                    <th className="px-3 py-3 text-center">Za</th>
                    <th className="px-3 py-3 text-center">Przeciw</th>
                    <th className="px-3 py-3 text-center">Mieszane</th>
                    <th className="px-3 py-3 text-center">N/A</th>
                    <th className="px-3 py-3 text-center">Jednostki</th>
                    <th className="px-3 py-3 text-center">Kodowania</th>
                    <th className="px-3 py-3 text-center">Rekonstrukcja</th>
                    <th className="px-3 py-3 text-right">Audyt</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPropositions.map((proposition) => {
                    const codings = personCodings.filter((coding) => coding.propositionId === proposition.id);
                    const counts = countEvidenceDirections(codings, data.excerpts);
                    const assessment = data.assessments.find((item) =>
                      item.personId === personId &&
                      item.propositionId === proposition.id &&
                      item.codebookId === currentCodebook?.id
                    );
                    const assessmentStale = Boolean(
                      assessment && assessment.evidenceSignature !== evidenceSignature(codings)
                    );
                    const {
                      positive,
                      negative,
                      mixed,
                      na,
                      units: allUnits,
                      contradiction,
                    } = counts;
                    return (
                      <tr key={proposition.id} className="border-b border-border/60 last:border-0">
                        <td className="px-3 py-3">
                          <div className="font-bold">{proposition.code} — {proposition.label}</div>
                          {contradiction && <div className="mt-1 text-xs text-amber-400">Sprzeczne kierunki dowodów — wymaga przeglądu.</div>}
                        </td>
                        <td className="px-3 py-3 text-center font-bold">{positive}</td>
                        <td className="px-3 py-3 text-center font-bold">{negative}</td>
                        <td className="px-3 py-3 text-center">{mixed}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground">{na}</td>
                        <td className="px-3 py-3 text-center">{allUnits}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground">{codings.length}</td>
                        <td className="px-3 py-3 text-center text-xs">
                          {assessment ? (
                            <div>
                              <div>{assessment.direction === null ? "N/A" : assessment.direction > 0 ? `+${assessment.direction}` : assessment.direction} · {assessment.status}</div>
                              {assessmentStale && <div className="mt-1 text-amber-400">dowody zmienione</div>}
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <ToolButton type="button" variant="ghost" onClick={() => openProposition(proposition.id)}>
                            Przegląd
                          </ToolButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ToolPanel>

          <ToolPanel title="Evidence Timeline" description="Chronologia pokazuje materiał według dat źródeł bez uśredniania starszych i nowszych stanowisk.">
            {personCodings.length === 0 ? (
              <ToolEmptyState title="Brak danych czasowych" description="Kodowania pojawią się na osi po dodaniu źródeł i fragmentów." />
            ) : evidenceTimeline.years.length === 0 ? (
              <ToolEmptyState title="Brak dat źródeł" description="Dodaj daty publikacji materiałów, aby analizować zmianę stanowisk w czasie." />
            ) : (
              <div className="space-y-3">
                {evidenceTimeline.years.map((bucket) => (
                  <div key={bucket.year} className="grid gap-3 rounded-xl border border-border bg-background/40 p-4 sm:grid-cols-[90px_1fr]">
                    <div className="text-xl font-black">{bucket.year}</div>
                    <div>
                      <div className="text-sm font-semibold">{bucket.units} jednostek argumentacyjnych · {bucket.codings} kodowań</div>
                      <div className="mt-1 text-xs text-muted-foreground">Jednostki — za: {bucket.positive} · przeciw: {bucket.negative} · mieszane: {bucket.mixed}</div>
                    </div>
                  </div>
                ))}
                {evidenceTimeline.undatedCodings > 0 && (
                  <ToolNotice>{evidenceTimeline.undatedCodings} kodowań pochodzi ze źródeł bez daty publikacji i nie trafia na oś czasu.</ToolNotice>
                )}
              </div>
            )}
          </ToolPanel>

          {selectedPropositionId && (() => {
            const proposition = data.propositions.find((item) => item.id === selectedPropositionId);
            const codings = personCodings.filter((coding) => coding.propositionId === selectedPropositionId);
            const assessment = data.assessments.find((item) =>
              item.personId === personId &&
              item.propositionId === selectedPropositionId &&
              item.codebookId === currentCodebook?.id
            );
            const assessmentStale = Boolean(
              assessment && assessment.evidenceSignature !== evidenceSignature(codings)
            );
            if (!proposition) return null;
            return (
              <ToolPanel
                title={`Audyt: ${proposition.code} — ${proposition.label}`}
                description="Każda obserwacja prowadzi z powrotem do fragmentu i materiału źródłowego."
                actions={<ToolButton type="button" variant="ghost" onClick={() => setSelectedPropositionId("")}>Zamknij</ToolButton>}
              >
                <div className="space-y-4">
                  <ToolSection
                    title="Rekonstrukcja stanowiska"
                    description="To osobna warstwa interpretacyjna oparta na zakodowanych dowodach. Nie zmienia danych źródłowych ani kodowań."
                  >
                    <div className="grid gap-3 lg:grid-cols-3">
                      <ToolSelect value={assessmentDirection} onChange={(e) => setAssessmentDirection(e.target.value as typeof assessmentDirection)}>
                        <option value="">Kierunek: brak / nierozstrzygnięty</option>
                        <option value="-2">−2 — zdecydowanie odrzuca</option>
                        <option value="-1">−1 — raczej odrzuca</option>
                        <option value="0">0 — mieszane / warunkowe</option>
                        <option value="1">+1 — raczej popiera</option>
                        <option value="2">+2 — zdecydowanie popiera</option>
                      </ToolSelect>
                      <ToolSelect value={assessmentStatus} onChange={(e) => setAssessmentStatus(e.target.value as typeof assessmentStatus)}>
                        <option value="insufficient_evidence">Niewystarczające dowody</option>
                        <option value="stable">Stanowisko stabilne</option>
                        <option value="context_dependent">Zależne od kontekstu</option>
                        <option value="contradictory">Sprzeczne / nierozstrzygnięte</option>
                        <option value="position_change">Kandydat zmiany stanowiska</option>
                      </ToolSelect>
                      <ToolSelect value={assessmentConfidence} onChange={(e) => setAssessmentConfidence(e.target.value as typeof assessmentConfidence)}>
                        <option value="low">Pewność rekonstrukcji: niska</option>
                        <option value="medium">Pewność rekonstrukcji: średnia</option>
                        <option value="high">Pewność rekonstrukcji: wysoka</option>
                      </ToolSelect>
                    </div>
                    <ToolSelect value={assessmentReviewerId} onChange={(e) => setAssessmentReviewerId(e.target.value)}>
                      <option value="">Brak przypisanego recenzenta</option>
                      {data.coders.map((coder) => <option key={coder.id} value={coder.id}>{coder.displayName} · {coder.type}</option>)}
                    </ToolSelect>
                    {assessmentStale && (
                      <ToolNotice>
                        Rekonstrukcja została zapisana dla wcześniejszego zestawu dowodów. Przejrzyj nowe lub usunięte kodowania i zapisz ją ponownie.
                      </ToolNotice>
                    )}
                    <ToolTextarea
                      rows={4}
                      value={assessmentSynthesis}
                      onChange={(e) => setAssessmentSynthesis(e.target.value)}
                      placeholder="Krótka synteza: co dokładnie można ostrożnie powiedzieć o stanowisku tej osoby i jakie są zastrzeżenia?"
                    />
                    <ToolButton type="button" variant="primary" onClick={saveAssessment}>Zapisz rekonstrukcję</ToolButton>
                  </ToolSection>

                  <ToolSection title="Dowody źródłowe" description={`${codings.length} kodowań powiązanych z tym mikrostanowiskiem.`}>
                  <div className="space-y-3">
                  {codings.length === 0 && <ToolEmptyState title="Brak kodowań dla tego mikrostanowiska" description="Możesz oznaczyć rekonstrukcję jako niewystarczające dowody albo wrócić do Coding Lab." />}
                  {codings.map((coding) => {
                    const excerpt = data.excerpts.find((item) => item.id === coding.excerptId);
                    const source = data.sources.find((item) => item.id === excerpt?.sourceId);
                    const argument = data.arguments.find((item) => item.id === excerpt?.argumentId);
                    const directionLabel =
                      coding.direction === null ? "N/A" :
                      coding.direction === -2 ? "−2 zdecydowanie odrzuca" :
                      coding.direction === -1 ? "−1 raczej odrzuca" :
                      coding.direction === 0 ? "0 mieszane / warunkowe" :
                      coding.direction === 1 ? "+1 raczej popiera" :
                      "+2 zdecydowanie popiera";
                    return (
                      <div key={coding.id} className="rounded-xl border border-border bg-background/40 p-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <span>{directionLabel}</span><span>·</span>
                          <span>jawność {coding.explicitness}</span><span>·</span>
                          <span>{coding.evidenceLevel}</span><span>·</span>
                          <span>pewność {coding.confidence}</span>
                        </div>
                        <blockquote className="mt-3 text-sm leading-6">“{excerpt?.text ?? "Brak fragmentu"}”</blockquote>
                        {excerpt?.contextBefore && <div className="mt-2 text-xs text-muted-foreground">Przed: {excerpt.contextBefore}</div>}
                        {excerpt?.contextAfter && <div className="mt-1 text-xs text-muted-foreground">Po: {excerpt.contextAfter}</div>}
                        {coding.rationale && <div className="mt-3 rounded-lg border border-border/60 bg-card/40 p-3 text-sm">Uzasadnienie: {coding.rationale}</div>}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                          <div>
                            {argument?.title ? `${argument.title} · ` : ""}
                            {excerpt?.verificationStatus ?? "unverified"}
                            {excerpt?.timestampStart !== undefined ? ` · ${excerpt.timestampStart}s${excerpt.timestampEnd !== undefined ? `–${excerpt.timestampEnd}s` : ""}` : ""}
                          </div>
                          {source?.url && (
                            <a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-foreground underline-offset-2 hover:underline">
                              Otwórz źródło ↗
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                  </ToolSection>
                </div>
              </ToolPanel>
            );
          })()}

          <ToolNotice>
            Ten widok celowo nie liczy jeszcze pozycji X/Y. Pokrycie, sprzeczności i liczba obserwacji pozostają widoczne przed agregacją.
          </ToolNotice>
        </div>
      )}
    </>
  );
}
