import { type FormEvent, useState } from "react";
import {
  ToolButton,
  ToolEmptyState,
  ToolNotice,
  ToolPanel,
  ToolSelect,
  ToolTextarea,
} from "@/components/tool-ui";
import { ModuleHeader } from "@/components/portfolio-ui";
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

export default function CodingLab() {
  const { data, addCoding, deleteCoding } = useResearchProject();
  const [excerptId, setExcerptId] = useState("");
  const [codingPersonId, setCodingPersonId] = useState("");
  const [codingSourceId, setCodingSourceId] = useState("");
  const [coderId, setCoderId] = useState(data.coders[0]?.id ?? "");
  const [propositionId, setPropositionId] = useState("");
  const [direction, setDirection] = useState<"" | "-2" | "-1" | "0" | "1" | "2">("");
  const [explicitness, setExplicitness] = useState<"0" | "1" | "2" | "3">("2");
  const [evidenceLevel, setEvidenceLevel] = useState<"direct" | "argumentative" | "inferred">("argumentative");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium");
  const [rationale, setRationale] = useState("");
  const [filterPropositionId, setFilterPropositionId] = useState("");
  const [filterConfidence, setFilterConfidence] = useState("");
  const [filterVerification, setFilterVerification] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const codebook = data.codebooks.find((item) => item.id === PILOT_CODEBOOK.id);
    const coder = data.coders.find((item) => item.id === coderId) ?? data.coders[0];
    if (!excerptId || !propositionId || !codebook || !coder) return;
    const duplicate = data.codings.some((coding) =>
      coding.excerptId === excerptId &&
      coding.propositionId === propositionId &&
      coding.coderId === coder.id &&
      coding.codebookId === codebook.id
    );
    if (duplicate) return;
    addCoding({
      excerptId,
      propositionId,
      coderId: coder.id,
      codebookId: codebook.id,
      direction: direction === "" ? null : Number(direction) as -2 | -1 | 0 | 1 | 2,
      explicitness: Number(explicitness) as 0 | 1 | 2 | 3,
      evidenceLevel,
      confidence,
      rationale: rationale.trim() || undefined,
    });
    setRationale("");
  }

  const candidateSources = data.sources.filter((source) => !codingPersonId || source.personId === codingPersonId);
  const candidateSourceIds = new Set(candidateSources.map((source) => source.id));
  const candidateExcerpts = data.excerpts.filter((excerpt) =>
    (!codingSourceId || excerpt.sourceId === codingSourceId) &&
    (!codingPersonId || candidateSourceIds.has(excerpt.sourceId))
  );
  const selectedExcerpt = data.excerpts.find((excerpt) => excerpt.id === excerptId);
  const activeCoder = data.coders.find((item) => item.id === coderId) ?? data.coders[0];
  const activeCodebook = data.codebooks.find((item) => item.id === PILOT_CODEBOOK.id);
  const activePropositions = activeCodebook
    ? data.propositions.filter((item) => item.codebookId === activeCodebook.id)
    : [];
  const hasDuplicateCoding = Boolean(
    selectedExcerpt &&
    propositionId &&
    activeCoder &&
    activeCodebook &&
    data.codings.some((coding) =>
      coding.excerptId === selectedExcerpt.id &&
      coding.propositionId === propositionId &&
      coding.coderId === activeCoder.id &&
      coding.codebookId === activeCodebook.id
    )
  );
  const filteredCodings = data.codings.filter((coding) => {
    if (coding.codebookId !== activeCodebook?.id) return false;
    const excerpt = data.excerpts.find((item) => item.id === coding.excerptId);
    const source = data.sources.find((item) => item.id === excerpt?.sourceId);
    if (codingPersonId && source?.personId !== codingPersonId) return false;
    if (codingSourceId && source?.id !== codingSourceId) return false;
    if (filterPropositionId && coding.propositionId !== filterPropositionId) return false;
    if (filterConfidence && coding.confidence !== filterConfidence) return false;
    if (filterVerification) {
      const excerpt = data.excerpts.find((item) => item.id === coding.excerptId);
      if ((excerpt?.verificationStatus ?? "unverified") !== filterVerification) return false;
    }
    return true;
  });

  return (
    <>
      <PageHeader section="CODE" title="Coding Lab" description="Kodowanie jest interpretacją fragmentu według jawnego codebooka, nie etykietą osoby." />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ToolPanel title="Materiał dowodowy">
          {data.excerpts.length === 0 ? (
            <ToolEmptyState title="Brak fragmentów do kodowania" description="Utwórz fragment w Warsztacie źródeł." />
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <ToolSelect value={codingPersonId} onChange={(e) => { setCodingPersonId(e.target.value); setCodingSourceId(""); setExcerptId(""); }}>
                  <option value="">Wszystkie osoby</option>
                  {data.people.map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}
                </ToolSelect>
                <ToolSelect value={codingSourceId} onChange={(e) => { setCodingSourceId(e.target.value); setExcerptId(""); }}>
                  <option value="">Wszystkie źródła</option>
                  {candidateSources.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}
                </ToolSelect>
              </div>
              <ToolSelect value={excerptId} onChange={(e) => setExcerptId(e.target.value)}>
                <option value="">Wybierz fragment…</option>
                {candidateExcerpts.map((excerpt) => {
                  const source = data.sources.find((item) => item.id === excerpt.sourceId);
                  return <option key={excerpt.id} value={excerpt.id}>{source?.title ?? "Źródło"} — {excerpt.text.slice(0, 70)}</option>;
                })}
              </ToolSelect>
              {selectedExcerpt && (
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <blockquote className="text-sm leading-6">“{selectedExcerpt.text}”</blockquote>
                  {selectedExcerpt.contextBefore && <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{selectedExcerpt.contextBefore}</div>}
                </div>
              )}
            </div>
          )}
        </ToolPanel>

        <ToolPanel title="Nowe kodowanie" description="Brak danych oznacz jako N/A, nie jako neutralne 0.">
          <form className="space-y-3" onSubmit={submit}>
            <ToolSelect value={coderId} onChange={(e) => setCoderId(e.target.value)}>
              {data.coders.map((coder) => <option key={coder.id} value={coder.id}>{coder.displayName} · {coder.type}</option>)}
            </ToolSelect>
            <ToolSelect value={propositionId} onChange={(e) => setPropositionId(e.target.value)}>
              <option value="">Wybierz mikrostanowisko…</option>
              {activePropositions.map((proposition) => <option key={proposition.id} value={proposition.id}>{proposition.code} — {proposition.label}</option>)}
            </ToolSelect>
            <ToolSelect value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}>
              <option value="">N/A — niewystarczające / nie dotyczy</option>
              <option value="-2">−2 — zdecydowanie odrzuca</option>
              <option value="-1">−1 — raczej odrzuca</option>
              <option value="0">0 — rzeczywiście mieszane / warunkowe</option>
              <option value="1">+1 — raczej popiera</option>
              <option value="2">+2 — zdecydowanie popiera</option>
            </ToolSelect>
            <div className="grid gap-3 sm:grid-cols-2">
              <ToolSelect value={explicitness} onChange={(e) => setExplicitness(e.target.value as typeof explicitness)}>
                <option value="0">Jawność 0 — bardzo pośrednie</option>
                <option value="1">Jawność 1 — implikowane</option>
                <option value="2">Jawność 2 — wyraźne</option>
                <option value="3">Jawność 3 — wprost</option>
              </ToolSelect>
              <ToolSelect value={evidenceLevel} onChange={(e) => setEvidenceLevel(e.target.value as typeof evidenceLevel)}>
                <option value="direct">Dowód: deklaracja bezpośrednia</option>
                <option value="argumentative">Dowód: wyraźna argumentacja</option>
                <option value="inferred">Dowód: wnioskowany</option>
              </ToolSelect>
            </div>
            <ToolSelect value={confidence} onChange={(e) => setConfidence(e.target.value as typeof confidence)}>
              <option value="low">Pewność interpretacji: niska</option>
              <option value="medium">Pewność interpretacji: średnia</option>
              <option value="high">Pewność interpretacji: wysoka</option>
            </ToolSelect>
            <ToolTextarea rows={4} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Uzasadnienie kodowania / wyjątki / zastrzeżenia…" />
            {hasDuplicateCoding && <ToolNotice tone="danger">Ten koder zakodował już ten fragment dla wybranego mikrostanowiska w tej wersji codebooka.</ToolNotice>}
            <ToolButton type="submit" variant="primary" disabled={!excerptId || !propositionId || hasDuplicateCoding}>Zapisz kodowanie</ToolButton>
          </form>
        </ToolPanel>
      </div>

      <ToolPanel
        title={`Zakodowane obserwacje (${filteredCodings.length}/${data.codings.filter((coding) => coding.codebookId === activeCodebook?.id).length})`}
        actions={
          <div className="grid gap-2 sm:grid-cols-3">
            <ToolSelect value={filterPropositionId} onChange={(e) => setFilterPropositionId(e.target.value)} className="min-w-44">
              <option value="">Wszystkie mikrostanowiska</option>
              {activePropositions.map((proposition) => <option key={proposition.id} value={proposition.id}>{proposition.code}</option>)}
            </ToolSelect>
            <ToolSelect value={filterConfidence} onChange={(e) => setFilterConfidence(e.target.value)} className="min-w-40">
              <option value="">Każda pewność</option>
              <option value="low">Niska</option><option value="medium">Średnia</option><option value="high">Wysoka</option>
            </ToolSelect>
            <ToolSelect value={filterVerification} onChange={(e) => setFilterVerification(e.target.value)} className="min-w-44">
              <option value="">Każdy status fragmentu</option>
              <option value="unverified">Nieweryfikowany</option><option value="checked">Sprawdzony</option><option value="verified">Zweryfikowany</option>
            </ToolSelect>
          </div>
        }
      >
        {data.codings.filter((coding) => coding.codebookId === activeCodebook?.id).length === 0 ? (
          <ToolEmptyState title="Brak kodowań" description="Pierwsze kodowanie w aktualnym codebooku pojawi się tutaj wraz z pełnym śladem do fragmentu źródłowego." />
        ) : filteredCodings.length === 0 ? (
          <ToolEmptyState title="Brak wyników dla filtrów" description="Zmień filtry, aby zobaczyć pozostałe kodowania aktualnego codebooka." />
        ) : (
          <div className="space-y-3">
            {[...filteredCodings].reverse().map((coding) => {
              const excerpt = data.excerpts.find((item) => item.id === coding.excerptId);
              const proposition = data.propositions.find((item) => item.id === coding.propositionId);
              const source = data.sources.find((item) => item.id === excerpt?.sourceId);
              return (
                <div key={coding.id} className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>{proposition?.code ?? "?"}</span><span>·</span>
                    <span>{coding.direction === null ? "N/A" : coding.direction > 0 ? `+${coding.direction}` : coding.direction}</span><span>·</span>
                    <span>{coding.evidenceLevel}</span><span>·</span><span>{coding.confidence}</span>
                  </div>
                  <div className="mt-2 text-sm font-bold">{proposition?.label ?? "Nieznana teza"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{source?.title ?? "Źródło"} — “{excerpt?.text.slice(0, 180) ?? "Brak fragmentu"}”</div>
                  {coding.rationale && <div className="mt-2 text-sm">{coding.rationale}</div>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <div className="text-xs text-muted-foreground">
                      Fragment: {excerpt?.verificationStatus ?? "unverified"}
                      {excerpt?.timestampStart !== undefined ? ` · ${excerpt.timestampStart}s` : ""}
                    </div>
                    <div className="flex items-center gap-2">
                      {source?.url && <a href={source.url} target="_blank" rel="noreferrer" className="text-xs font-semibold underline-offset-2 hover:underline">Źródło ↗</a>}
                      <ToolButton type="button" variant="ghost" onClick={() => deleteCoding(coding.id)}>Usuń kodowanie</ToolButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ToolPanel>
    </>
  );
}
