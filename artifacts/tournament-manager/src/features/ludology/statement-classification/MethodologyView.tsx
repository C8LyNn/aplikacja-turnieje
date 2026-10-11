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
} from "@/components/tool-ui";
import { ModuleHeader } from "@/components/portfolio-ui";
import { computeCoderAgreementPairs } from "./coder-agreement";
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
  const { data, addCoder, updateCoder } = useResearchProject();
  const [coderName, setCoderName] = useState("");
  const [coderType, setCoderType] = useState<"human" | "ai">("human");
  const [editingCoderId, setEditingCoderId] = useState("");
  const [editingCoderName, setEditingCoderName] = useState("");
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
          title="Zgodność koderów — diagnostyka"
          description="To prosty procent identycznych kierunków na wspólnie zakodowanych jednostkach. Nie zastępuje α Krippendorffa ani walidacji konstruktu."
        >
          {agreementPairs.length === 0 ? (
            <ToolEmptyState title="Potrzeba co najmniej dwóch koderów" description="Dodaj kolejnego kodera i zakoduj te same fragmenty, aby zobaczyć nakładanie ocen." />
          ) : (
            <div className="space-y-2">
              {agreementPairs.map((pair) => (
                <div key={`${pair.coderAId}::${pair.coderBId}`} className="grid gap-3 rounded-xl border border-border bg-background/40 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="font-bold">{pair.coderALabel} ↔ {pair.coderBLabel}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{pair.overlap} wspólnie zakodowanych par fragment–mikrostanowisko</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black">
                      {pair.exactDirectionAgreement === null ? "—" : `${Math.round(pair.exactDirectionAgreement * 100)}%`}
                    </div>
                    <div className="text-xs text-muted-foreground">identyczny kierunek</div>
                  </div>
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
            <ToolSection title="Niezależne kodowanie" description="Docelowo ten sam materiał może być oceniany przez więcej niż jednego kodera.">
              <div className="text-sm text-muted-foreground">Pozwoli to mierzyć zgodność między koderami, np. współczynnikiem α Krippendorffa. Zgodność nie zastępuje jednak walidacji konstruktu.</div>
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
