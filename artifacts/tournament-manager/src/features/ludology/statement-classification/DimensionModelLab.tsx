import { type FormEvent, useMemo, useState } from "react";
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
import {
  dimensionModelDimensions,
  dimensionModelSummary,
  modelReadinessMatrix,
} from "./dimension-model-analysis";
import {
  canEditDimensionModelStructure,
  dimensionModelStatusOptions,
} from "./dimension-model-lifecycle";
import { isAssessmentStale } from "./evidence-analysis";
import type {
  DimensionLinkOrientation,
  DimensionLinkRelevance,
  DimensionModelStatus,
} from "./model";
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

function percent(numerator: number, denominator: number): string {
  if (denominator <= 0) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export default function DimensionModelLab() {
  const {
    data,
    addDimensionModel,
    updateDimensionModel,
    deleteDimensionModel,
    cloneDimensionModelVersion,
    addDimension,
    updateDimension,
    deleteDimension,
    upsertDimensionLink,
    deleteDimensionLink,
  } = useResearchProject();

  const [selectedModelId, setSelectedModelId] = useState(data.dimensionModels[0]?.id ?? "");
  const [newModelName, setNewModelName] = useState("");
  const [newModelVersion, setNewModelVersion] = useState("0.1.0");
  const [newModelCodebookId, setNewModelCodebookId] = useState(PILOT_CODEBOOK.id);
  const [newModelDescription, setNewModelDescription] = useState("");
  const [cloneVersion, setCloneVersion] = useState("");

  const [dimensionCode, setDimensionCode] = useState("");
  const [dimensionLabel, setDimensionLabel] = useState("");
  const [negativePole, setNegativePole] = useState("");
  const [positivePole, setPositivePole] = useState("");
  const [dimensionDescription, setDimensionDescription] = useState("");

  const [linkDimensionId, setLinkDimensionId] = useState("");
  const [linkPropositionId, setLinkPropositionId] = useState("");
  const [linkOrientation, setLinkOrientation] = useState<DimensionLinkOrientation>("positive");
  const [linkRelevance, setLinkRelevance] = useState<DimensionLinkRelevance>("core");
  const [linkRationale, setLinkRationale] = useState("");

  const modelSummaries = data.dimensionModels.map((model) => ({
    model,
    summary: dimensionModelSummary(data, model.id),
  }));
  const selectedModel = data.dimensionModels.find((model) => model.id === selectedModelId);
  const selectedCodebook = data.codebooks.find((codebook) => codebook.id === selectedModel?.codebookId);
  const modelDimensions = selectedModel
    ? dimensionModelDimensions(data, selectedModel.id)
    : [];
  const modelDimensionIds = new Set(modelDimensions.map((dimension) => dimension.id));
  const modelLinks = selectedModel
    ? data.dimensionLinks.filter((link) => link.dimensionModelId === selectedModel.id)
    : [];
  const propositions = selectedModel
    ? data.propositions.filter((proposition) => proposition.codebookId === selectedModel.codebookId)
    : [];
  const readiness = selectedModel
    ? modelReadinessMatrix(data, selectedModel.id)
    : [];

  const structuralEditable = selectedModel
    ? canEditDimensionModelStructure(selectedModel.status)
    : false;

  const linkedPropositionIds = new Set(modelLinks.map((link) => link.propositionId));
  const freshAssessments = selectedModel
    ? data.assessments.filter(
        (assessment) =>
          assessment.codebookId === selectedModel.codebookId &&
          linkedPropositionIds.has(assessment.propositionId) &&
          !isAssessmentStale(data, assessment),
      )
    : [];
  const staleAssessments = selectedModel
    ? data.assessments.filter(
        (assessment) =>
          assessment.codebookId === selectedModel.codebookId &&
          linkedPropositionIds.has(assessment.propositionId) &&
          isAssessmentStale(data, assessment),
      )
    : [];

  const totalReadinessLinks = readiness.reduce((sum, row) => sum + row.totalLinks, 0);
  const directionalReadinessLinks = readiness.reduce((sum, row) => sum + row.directionalLinks, 0);

  const dimensionsWithNoLinks = modelDimensions.filter(
    (dimension) => !modelLinks.some((link) => link.dimensionId === dimension.id),
  ).length;

  const unlinkedPropositions = propositions.filter(
    (proposition) => !linkedPropositionIds.has(proposition.id),
  ).length;

  const nextDimensionOrder = useMemo(
    () => modelDimensions.reduce((max, dimension) => Math.max(max, dimension.order ?? 0), 0) + 1,
    [modelDimensions],
  );

  function submitModel(event: FormEvent) {
    event.preventDefault();
    if (!newModelName.trim() || !newModelVersion.trim() || !newModelCodebookId) return;
    const id = addDimensionModel({
      name: newModelName.trim(),
      version: newModelVersion.trim(),
      codebookId: newModelCodebookId,
      status: "draft",
      description: newModelDescription.trim() || undefined,
    });
    setSelectedModelId(id);
    setNewModelName("");
    setNewModelVersion("0.1.0");
    setNewModelDescription("");
  }

  function removeModel() {
    if (!selectedModel) return;
    if (typeof window !== "undefined" && !window.confirm(
      `Usunąć model „${selectedModel.name} ${selectedModel.version}” wraz z wymiarami i mapowaniami?`,
    )) return;
    deleteDimensionModel(selectedModel.id);
    const replacement = data.dimensionModels.find((model) => model.id !== selectedModel.id);
    setSelectedModelId(replacement?.id ?? "");
  }

  function cloneModel() {
    if (!selectedModel || !cloneVersion.trim()) return;
    const id = cloneDimensionModelVersion(selectedModel.id, cloneVersion.trim());
    setSelectedModelId(id);
    setCloneVersion("");
  }

  function submitDimension(event: FormEvent) {
    event.preventDefault();
    if (!selectedModel || !structuralEditable) return;
    if (!dimensionCode.trim() || !dimensionLabel.trim() || !negativePole.trim() || !positivePole.trim()) return;
    const id = addDimension({
      dimensionModelId: selectedModel.id,
      code: dimensionCode.trim(),
      label: dimensionLabel.trim(),
      negativePoleLabel: negativePole.trim(),
      positivePoleLabel: positivePole.trim(),
      description: dimensionDescription.trim() || undefined,
      order: nextDimensionOrder,
    });
    setLinkDimensionId(id);
    setDimensionCode("");
    setDimensionLabel("");
    setNegativePole("");
    setPositivePole("");
    setDimensionDescription("");
  }

  function submitLink(event: FormEvent) {
    event.preventDefault();
    if (!selectedModel || !structuralEditable || !linkDimensionId || !linkPropositionId) return;
    if (!modelDimensionIds.has(linkDimensionId)) return;
    upsertDimensionLink(
      {
        dimensionModelId: selectedModel.id,
        dimensionId: linkDimensionId,
        propositionId: linkPropositionId,
      },
      {
        orientation: linkOrientation,
        relevance: linkRelevance,
        rationale: linkRationale.trim() || undefined,
      },
    );
    setLinkPropositionId("");
    setLinkRationale("");
  }

  return (
    <>
      <PageHeader
        section="MAP"
        title="Model wymiarów"
        description="Wersjonowana warstwa interpretacyjna łączy mikrostanowiska z kandydackimi wymiarami. Nie przepisuje danych źródłowych i nie wylicza jeszcze współrzędnych X/Y."
      />

      <div className="space-y-4">
        <ToolPanel
          title="Modele interpretacyjne"
          description="Możesz utrzymywać kilka konkurencyjnych modeli na tym samym codebooku i porównywać ich pokrycie bez zmiany wcześniejszych kodowań."
        >
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <form className="space-y-3" onSubmit={submitModel}>
              <ToolInput value={newModelName} onChange={(e) => setNewModelName(e.target.value)} placeholder="Nazwa modelu, np. Model 2D — hipoteza A" />
              <div className="grid gap-3 sm:grid-cols-2">
                <ToolInput value={newModelVersion} onChange={(e) => setNewModelVersion(e.target.value)} placeholder="Wersja" />
                <ToolSelect value={newModelCodebookId} onChange={(e) => setNewModelCodebookId(e.target.value)}>
                  {data.codebooks.map((codebook) => (
                    <option key={codebook.id} value={codebook.id}>{codebook.name} · {codebook.version}</option>
                  ))}
                </ToolSelect>
              </div>
              <ToolTextarea rows={3} value={newModelDescription} onChange={(e) => setNewModelDescription(e.target.value)} placeholder="Hipoteza i cel modelu" />
              <ToolButton type="submit" variant="primary">Utwórz model roboczy</ToolButton>
            </form>

            <div className="space-y-3">
              {data.dimensionModels.length === 0 ? (
                <ToolEmptyState
                  title="Brak modeli wymiarów"
                  description="To celowe: osie nie są zaszyte w danych. Utwórz pierwszy model dopiero jako jawną hipotezę badawczą."
                />
              ) : (
                <>
                  <ToolSelect value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)}>
                    <option value="">Wybierz model…</option>
                    {data.dimensionModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} · {model.version} · {model.status}
                      </option>
                    ))}
                  </ToolSelect>

                  {selectedModel && (
                    <div className="rounded-xl border border-border bg-background/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-black">{selectedModel.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            v{selectedModel.version} · {selectedModel.status} · codebook {selectedCodebook?.version ?? "?"}
                          </div>
                          {selectedModel.description && <div className="mt-3 text-sm text-muted-foreground">{selectedModel.description}</div>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ToolSelect
                            className="w-auto"
                            value={selectedModel.status}
                            onChange={(e) => updateDimensionModel(selectedModel.id, { status: e.target.value as DimensionModelStatus })}
                          >
                            {dimensionModelStatusOptions(selectedModel.status).map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </ToolSelect>
                          <ToolButton type="button" variant="ghost" onClick={removeModel} disabled={!structuralEditable}>Usuń</ToolButton>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                        <ToolInput value={cloneVersion} onChange={(e) => setCloneVersion(e.target.value)} placeholder="Nowa wersja, np. 0.2.0" />
                        <ToolButton type="button" onClick={cloneModel} disabled={!cloneVersion.trim()}>Klonuj jako nową wersję</ToolButton>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </ToolPanel>

        {data.dimensionModels.length > 1 && (
          <ToolPanel
            title="Porównanie konkurencyjnych modeli"
            description="Porównujemy strukturę i pokrycie tymi samymi rekonstrukcjami. Wyższe pokrycie nie oznacza automatycznie lepszego modelu."
            flush
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-border bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Model</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-center">Wymiary</th>
                    <th className="px-3 py-3 text-center">Mapowania</th>
                    <th className="px-3 py-3 text-center">Mikrostanowiska</th>
                    <th className="px-3 py-3 text-center">Osoby z danymi</th>
                    <th className="px-4 py-3 text-center">Pokrycie kierunkowe</th>
                  </tr>
                </thead>
                <tbody>
                  {modelSummaries.map(({ model, summary }) => (
                    <tr
                      key={model.id}
                      className={`cursor-pointer border-b border-border/60 last:border-b-0 ${model.id === selectedModelId ? "bg-primary/5" : "hover:bg-muted/30"}`}
                      onClick={() => setSelectedModelId(model.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold">{model.name}</div>
                        <div className="text-xs text-muted-foreground">v{model.version}</div>
                      </td>
                      <td className="px-3 py-3 text-center">{model.status}</td>
                      <td className="px-3 py-3 text-center">{summary.dimensions}</td>
                      <td className="px-3 py-3 text-center">{summary.links}</td>
                      <td className="px-3 py-3 text-center">{summary.mappedPropositions}</td>
                      <td className="px-3 py-3 text-center">{summary.peopleWithDirectionalCoverage}/{data.people.length}</td>
                      <td className="px-4 py-3 text-center font-bold">
                        {summary.directionalCoverage === null ? "—" : `${Math.round(summary.directionalCoverage * 100)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ToolPanel>
        )}

        {selectedModel && (
          <>
            {!structuralEditable && (
              <ToolNotice>
                Model ma status {selectedModel.status}. Struktura i metadane są zamrożone, a opublikowanej wersji nie można przywrócić do draftu. Aby coś zmienić, sklonuj model do nowej wersji draft.
              </ToolNotice>
            )}

            <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
              <ToolPanel title="Dodaj wymiar" description="Nazwy biegunów są częścią modelu interpretacyjnego, nie cechą osoby.">
                <form className="space-y-3" onSubmit={submitDimension}>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <ToolInput value={dimensionCode} onChange={(e) => setDimensionCode(e.target.value)} placeholder="Kod, np. D01" disabled={!structuralEditable} />
                    <ToolInput value={dimensionLabel} onChange={(e) => setDimensionLabel(e.target.value)} placeholder="Nazwa wymiaru" disabled={!structuralEditable} />
                  </div>
                  <ToolInput value={negativePole} onChange={(e) => setNegativePole(e.target.value)} placeholder="Biegun ujemny" disabled={!structuralEditable} />
                  <ToolInput value={positivePole} onChange={(e) => setPositivePole(e.target.value)} placeholder="Biegun dodatni" disabled={!structuralEditable} />
                  <ToolTextarea rows={3} value={dimensionDescription} onChange={(e) => setDimensionDescription(e.target.value)} placeholder="Co ten wymiar ma mierzyć?" disabled={!structuralEditable} />
                  <ToolButton type="submit" variant="primary" disabled={!structuralEditable}>Dodaj wymiar</ToolButton>
                </form>
              </ToolPanel>

              <ToolPanel title={`Wymiary modelu (${modelDimensions.length})`}>
                {modelDimensions.length === 0 ? (
                  <ToolEmptyState title="Model nie ma jeszcze wymiarów" description="Dodaj pierwszy wymiar jako hipotezę, a następnie jawnie przypisz do niego mikrostanowiska." />
                ) : (
                  <div className="space-y-3">
                    {modelDimensions.map((dimension) => {
                      const links = modelLinks.filter((link) => link.dimensionId === dimension.id);
                      return (
                        <ToolDisclosure
                          key={dimension.id}
                          title={`${dimension.code} — ${dimension.label}`}
                          description={`${dimension.negativePoleLabel} ↔ ${dimension.positivePoleLabel} · ${links.length} mapowań`}
                        >
                          <div className="space-y-4">
                            {dimension.description && <div className="text-sm text-muted-foreground">{dimension.description}</div>}
                            <div className="grid gap-3 sm:grid-cols-2">
                              <ToolInput
                                value={dimension.negativePoleLabel}
                                onChange={(e) => updateDimension(dimension.id, { negativePoleLabel: e.target.value })}
                                disabled={!structuralEditable}
                              />
                              <ToolInput
                                value={dimension.positivePoleLabel}
                                onChange={(e) => updateDimension(dimension.id, { positivePoleLabel: e.target.value })}
                                disabled={!structuralEditable}
                              />
                            </div>

                            <div className="space-y-2">
                              {links.length === 0 ? (
                                <div className="text-sm text-muted-foreground">Brak przypisanych mikrostanowisk.</div>
                              ) : links.map((link) => {
                                const proposition = propositions.find((item) => item.id === link.propositionId);
                                return (
                                  <div key={link.id} className="rounded-xl border border-border bg-card/40 p-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <div className="font-bold">{proposition?.code ?? "?"} — {proposition?.label ?? "Brak mikrostanowiska"}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                          {link.orientation === "positive"
                                            ? `+ mikrostanowiska → ${dimension.positivePoleLabel}`
                                            : `+ mikrostanowiska → ${dimension.negativePoleLabel}`}
                                          {" · "}{link.relevance}
                                        </div>
                                        {link.rationale && <div className="mt-2 text-sm text-muted-foreground">{link.rationale}</div>}
                                      </div>
                                      <ToolButton type="button" variant="ghost" onClick={() => deleteDimensionLink(link.id)} disabled={!structuralEditable}>Usuń mapowanie</ToolButton>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex justify-end">
                              <ToolButton type="button" variant="ghost" onClick={() => deleteDimension(dimension.id)} disabled={!structuralEditable}>Usuń wymiar</ToolButton>
                            </div>
                          </div>
                        </ToolDisclosure>
                      );
                    })}
                  </div>
                )}
              </ToolPanel>
            </div>

            <ToolPanel
              title="Mapowanie mikrostanowisk"
              description="Orientation mówi wyłącznie, w którą stronę osi wskazuje dodatni kierunek danego mikrostanowiska. Relevance jest kategorią jakościową — nie wagą liczbową."
            >
              <form className="grid gap-3 lg:grid-cols-[1.2fr_1.6fr_1fr_1fr] lg:items-end" onSubmit={submitLink}>
                <div>
                  <div className="mb-1 text-xs font-bold text-muted-foreground">Wymiar</div>
                  <ToolSelect value={linkDimensionId} onChange={(e) => setLinkDimensionId(e.target.value)} disabled={!structuralEditable}>
                    <option value="">Wybierz wymiar…</option>
                    {modelDimensions.map((dimension) => <option key={dimension.id} value={dimension.id}>{dimension.code} — {dimension.label}</option>)}
                  </ToolSelect>
                </div>
                <div>
                  <div className="mb-1 text-xs font-bold text-muted-foreground">Mikrostanowisko</div>
                  <ToolSelect value={linkPropositionId} onChange={(e) => setLinkPropositionId(e.target.value)} disabled={!structuralEditable}>
                    <option value="">Wybierz mikrostanowisko…</option>
                    {propositions.map((proposition) => <option key={proposition.id} value={proposition.id}>{proposition.code} — {proposition.label}</option>)}
                  </ToolSelect>
                </div>
                <div>
                  <div className="mb-1 text-xs font-bold text-muted-foreground">Orientacja</div>
                  <ToolSelect value={linkOrientation} onChange={(e) => setLinkOrientation(e.target.value as DimensionLinkOrientation)} disabled={!structuralEditable}>
                    <option value="positive">+ → biegun dodatni</option>
                    <option value="negative">+ → biegun ujemny</option>
                  </ToolSelect>
                </div>
                <div>
                  <div className="mb-1 text-xs font-bold text-muted-foreground">Znaczenie</div>
                  <ToolSelect value={linkRelevance} onChange={(e) => setLinkRelevance(e.target.value as DimensionLinkRelevance)} disabled={!structuralEditable}>
                    <option value="core">core</option>
                    <option value="supporting">supporting</option>
                    <option value="exploratory">exploratory</option>
                  </ToolSelect>
                </div>
                <div className="lg:col-span-3">
                  <ToolInput value={linkRationale} onChange={(e) => setLinkRationale(e.target.value)} placeholder="Dlaczego to mikrostanowisko należy do tego wymiaru?" disabled={!structuralEditable} />
                </div>
                <ToolButton type="submit" variant="primary" disabled={!structuralEditable || !linkDimensionId || !linkPropositionId}>Zapisz mapowanie</ToolButton>
              </form>
            </ToolPanel>

            <ToolPanel title="Audyt konstrukcji modelu" description="Ten etap bada strukturę hipotezy. Nie wyznacza jeszcze pozycji żadnej osoby.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-2xl font-black">{modelDimensions.length}</div><div className="text-xs text-muted-foreground">wymiarów</div></div>
                <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-2xl font-black">{modelLinks.length}</div><div className="text-xs text-muted-foreground">mapowań</div></div>
                <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-2xl font-black">{unlinkedPropositions}</div><div className="text-xs text-muted-foreground">mikrostanowisk poza modelem</div></div>
                <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-2xl font-black">{freshAssessments.length}</div><div className="text-xs text-muted-foreground">aktualnych rekonstrukcji dla mapowań</div></div>
                <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-2xl font-black">{percent(directionalReadinessLinks, totalReadinessLinks)}</div><div className="text-xs text-muted-foreground">pokrycia kierunkowego macierzy</div></div>
              </div>
              <div className="mt-4 space-y-2">
                {modelDimensions.length === 0 && <ToolNotice>Model bez wymiarów nie może jeszcze pełnić funkcji interpretacyjnej.</ToolNotice>}
                {dimensionsWithNoLinks > 0 && <ToolNotice>{dimensionsWithNoLinks} wymiarów nie ma żadnego przypisanego mikrostanowiska.</ToolNotice>}
                {staleAssessments.length > 0 && <ToolNotice>{staleAssessments.length} rekonstrukcji powiązanych z modelem jest nieaktualnych względem dowodów.</ToolNotice>}
                {modelLinks.length > 0 && totalReadinessLinks === 0 && <ToolNotice>Nie ma jeszcze osób z gotowymi rekonstrukcjami dla powiązanych mikrostanowisk.</ToolNotice>}
              </div>
            </ToolPanel>

            <ToolPanel
              title="Macierz gotowości do modelowania"
              description="Komórka pokazuje: rekonstrukcje z kierunkiem / wszystkie mikrostanowiska przypisane do wymiaru. To pokrycie, nie współrzędna."
              flush
            >
              {data.people.length === 0 || modelDimensions.length === 0 ? (
                <div className="p-5">
                  <ToolEmptyState title="Brak macierzy" description="Potrzebne są osoby w korpusie oraz co najmniej jeden wymiar." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="border-b border-border bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Osoba</th>
                        {modelDimensions.map((dimension) => (
                          <th key={dimension.id} className="px-3 py-3 text-center">{dimension.code}</th>
                        ))}
                        <th className="px-4 py-3 text-center">Całość</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readiness.map((row) => {
                        const person = data.people.find((item) => item.id === row.personId);
                        return (
                          <tr key={row.personId} className="border-b border-border/60 last:border-b-0">
                            <td className="px-4 py-3 font-semibold">{person?.displayName ?? row.personId}</td>
                            {row.dimensions.map((cell) => (
                              <td key={cell.dimensionId} className="px-3 py-3 text-center">
                                <div className="font-bold">{cell.directionalLinks}/{cell.totalLinks}</div>
                                {(cell.staleLinks > 0 || cell.insufficientLinks > 0) && (
                                  <div className="mt-1 text-[10px] text-muted-foreground">
                                    {cell.staleLinks > 0 ? `stale ${cell.staleLinks}` : ""}
                                    {cell.staleLinks > 0 && cell.insufficientLinks > 0 ? " · " : ""}
                                    {cell.insufficientLinks > 0 ? `N/A ${cell.insufficientLinks}` : ""}
                                  </div>
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-center font-black">{row.directionalLinks}/{row.totalLinks}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ToolPanel>

            <ToolPanel title="Przed agregacją">
              <div className="space-y-4">
                <ToolSection title="Czego ten moduł jeszcze nie robi">
                  <ToolNotice>
                    Nie liczy średniej, nie nadaje wag liczbowych kategoriom core/supporting/exploratory, nie ustala X/Y i nie publikuje pozycji ludzi. To pozostaje osobnym etapem modelowania po pilotażu.
                  </ToolNotice>
                </ToolSection>
                <ToolSection title="Dlaczego">
                  <div className="text-sm leading-6 text-muted-foreground">
                    Ten sam korpus i te same rekonstrukcje mogą zostać przetestowane przez kilka konkurencyjnych modeli wymiarów. Dzięki temu zmiana hipotezy nie wymaga zmiany cytatów, kodowań ani profili dowodów.
                  </div>
                </ToolSection>
              </div>
            </ToolPanel>
          </>
        )}
      </div>
    </>
  );
}
