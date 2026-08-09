import React from "react";
import { ArrowDown, ArrowUp, Dices, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  balancedGroupSizes,
  createStageDraft,
  ENTRY_SEEDING_LABELS,
  groupAdvancingCount,
  groupLabelFromIndex,
  previewBracketPairs,
  previewGroupSeedPlacement,
  singleEliminationAdvancingOptions,
  singleEliminationStageMetrics,
  stageUsesRandom,
  synchronizeStageParticipantFlow,
  type EntrySeedingMethod,
  type GroupResultSeedingMethod,
  type RandomRevealOrder,
  type StageDraft,
  type StageFormat,
  type StagePlacementMethod,
  type StagePlanValidationError,
  STAGE_FORMAT_LABELS,
} from "@/lib/tournament-stages-ui";

interface StagePlanEditorProps {
  stages: StageDraft[];
  errors: StagePlanValidationError[];
  onChange: (stages: StageDraft[]) => void;
}

function integer(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function defaultGroupCount(participantCount: number): number {
  return Math.min(2, Math.max(1, Math.floor(participantCount / 2)));
}

function defaultPlacement(format: StageFormat): StagePlacementMethod {
  if (format === "group_stage") return "snake";
  if (format === "single_elimination") return "standard";
  return "standings_order";
}

function previewSeedLabel(seed: number | null): string {
  return seed == null ? "BYE" : `#${seed}`;
}

export function StagePlanEditor({ stages, errors, onChange }: StagePlanEditorProps) {
  const update = (index: number, patch: Partial<StageDraft>) => {
    const next = stages.map((stage, stageIndex) =>
      stageIndex === index ? { ...stage, ...patch } : stage,
    );
    onChange(synchronizeStageParticipantFlow(next));
  };

  const changeFormat = (index: number, format: StageFormat) => {
    const current = stages[index];
    const defaults = createStageDraft(index + 1, format);
    const participantCount = current.participantCount;
    const groupCount = defaultGroupCount(participantCount);
    update(index, {
      format,
      rounds: format === "swiss" ? (current.rounds ?? defaults.rounds) : undefined,
      groupCount: format === "group_stage" ? groupCount : undefined,
      participantsPerGroup: format === "group_stage" ? Math.ceil(participantCount / groupCount) : undefined,
      qualifiersPerGroup: format === "group_stage"
        ? Math.min(current.qualifiersPerGroup ?? 2, Math.ceil(participantCount / groupCount))
        : undefined,
      participantCount,
      placementMethod: defaultPlacement(format),
      resultSeedingMethod: format === "group_stage" ? (current.resultSeedingMethod ?? "rank_bands") : "rank_bands",
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(synchronizeStageParticipantFlow(next.map((stage, stageIndex) => ({
      ...stage,
      name: /^Etap \d+$/.test(stage.name) ? `Etap ${stageIndex + 1}` : stage.name,
    }))));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Plan etapów</h3>
          <p className="text-xs text-muted-foreground">
            Podstawowe ustawienia są widoczne od razu. Seedowanie i rozmieszczenie są opcjonalne.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={stages.length >= 3}
          onClick={() => {
            onChange(synchronizeStageParticipantFlow([
              ...stages,
              {
                ...createStageDraft(stages.length + 1, "single_elimination"),
                participantCount: 2,
              },
            ]));
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Dodaj etap
        </Button>
      </div>

      {stages.map((stage, index) => {
        const stageErrors = errors.filter((error) => error.stageIndex === index);
        const isLast = index === stages.length - 1;
        const groupSizes = stage.format === "group_stage"
          ? balancedGroupSizes(stage.participantCount, stage.groupCount ?? 0)
          : [];
        const advancing = stage.format === "group_stage" ? groupAdvancingCount(stage) : 0;
        const everyoneAdvances = stage.format === "group_stage" && advancing === stage.participantCount;
        const groupPreview = stage.format === "group_stage" ? previewGroupSeedPlacement(stage) : [];
        const bracketPreview = stage.format === "single_elimination" ? previewBracketPairs(stage) : [];
        const eliminationMetrics = stage.format === "single_elimination"
          ? singleEliminationStageMetrics(stage)
          : null;

        return (
          <Card key={stage.clientId} className={stageErrors.length > 0 ? "border-destructive/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Etap {index + 1}</CardTitle>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Przesuń etap w górę" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Przesuń etap w dół" disabled={isLast} onClick={() => move(index, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Usuń etap" disabled={stages.length === 1} onClick={() => onChange(synchronizeStageParticipantFlow(stages.filter((_, stageIndex) => stageIndex !== index)))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`stage-${index}-name`}>Nazwa</Label>
                <Input id={`stage-${index}-name`} value={stage.name} onChange={(event) => update(index, { name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={stage.format} onValueChange={(value) => changeFormat(index, value as StageFormat)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STAGE_FORMAT_LABELS) as StageFormat[]).map((format) => (
                      <SelectItem key={format} value={format}>{STAGE_FORMAT_LABELS[format]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Best of</Label>
                <Select value={String(stage.bestOf)} onValueChange={(value) => update(index, { bestOf: Number(value) as StageDraft["bestOf"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 3, 5, 7].map((bestOf) => <SelectItem key={bestOf} value={String(bestOf)}>BO{bestOf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`stage-${index}-participants`}>Liczba uczestników</Label>
                <Input id={`stage-${index}-participants`} type="number" min={2} value={stage.participantCount} disabled={index > 0} onChange={(event) => update(index, { participantCount: integer(event.target.value, 0) })} />
                {index > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {stage.participantCount} uczestników — awansujący z Etapu {index}.
                  </p>
                )}
              </div>
              {stage.format === "swiss" && (
                <div className="space-y-2">
                  <Label htmlFor={`stage-${index}-rounds`}>Liczba rund</Label>
                  <Input id={`stage-${index}-rounds`} type="number" min={1} max={20} value={stage.rounds ?? ""} onChange={(event) => update(index, { rounds: integer(event.target.value, 0) })} />
                </div>
              )}
              {!isLast && (stage.format === "swiss" || stage.format === "round_robin") && (
                <div className="space-y-2">
                  <Label htmlFor={`stage-${index}-advancing`}>Liczba kwalifikantów</Label>
                  <Input id={`stage-${index}-advancing`} type="number" min={2} max={stage.participantCount} value={stage.advancingCount ?? ""} onChange={(event) => update(index, { advancingCount: integer(event.target.value, 0) })} />
                </div>
              )}
              {!isLast && stage.format === "single_elimination" && (
                <div className="space-y-2">
                  <Label>Liczba kwalifikantów</Label>
                  <Select value={String(stage.advancingCount ?? "")} onValueChange={(value) => update(index, { advancingCount: Number(value) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {singleEliminationAdvancingOptions(stage.participantCount).map((count) => (
                        <SelectItem key={count} value={String(count)}>{count}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {eliminationMetrics && (
                <div className="rounded-md border bg-muted/30 p-3 text-sm sm:col-span-2">
                  <div>Awansuje: <strong>{eliminationMetrics.advancingCount}</strong></div>
                  <div>Rundy do rozegrania: <strong>{eliminationMetrics.rounds}</strong></div>
                  <div>Przewidywana liczba meczów: <strong>{eliminationMetrics.matchCount}</strong></div>
                  <div>Etap docelowy: <strong>{isLast ? "zakończenie turnieju" : `Etap ${index + 2}`}</strong></div>
                </div>
              )}

              {stage.format === "group_stage" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`stage-${index}-group-count`}>Liczba grup</Label>
                    <Input id={`stage-${index}-group-count`} type="number" min={1} max={Math.max(1, Math.floor(stage.participantCount / 2))} value={stage.groupCount ?? 1} onChange={(event) => update(index, { groupCount: integer(event.target.value, 0) })} />
                    <p className="text-xs text-muted-foreground">Każda grupa musi mieć co najmniej 2 uczestników.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`stage-${index}-qualifiers`}>Maks. kwalifikantów z grupy</Label>
                    <Input id={`stage-${index}-qualifiers`} type="number" min={1} max={groupSizes.length > 0 ? Math.max(...groupSizes) : 1} value={stage.qualifiersPerGroup ?? 1} onChange={(event) => update(index, { qualifiersPerGroup: integer(event.target.value, 0) })} />
                    <p className="text-xs text-muted-foreground">Jeśli grupa jest mniejsza od limitu, przechodzą z niej wszyscy.</p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3 text-sm sm:col-span-2">
                    <div>Rozmiary grup: <strong>{groupSizes.join(", ") || "—"}</strong></div>
                    <div>Dalej przechodzi: <strong>{advancing}</strong> z {stage.participantCount}</div>
                    {everyoneAdvances && <div className="mt-1 font-medium">Wszyscy uczestnicy awansują — etap służy rozstawieniu.</div>}
                  </div>
                </>
              )}

              <details className="rounded-md border p-3 sm:col-span-2">
                <summary className="cursor-pointer text-sm font-medium">Seedowanie i rozmieszczenie (opcjonalne)</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Seedy na wejściu do etapu</Label>
                    <Select value={stage.entrySeedingMethod} onValueChange={(value) => update(index, { entrySeedingMethod: value as EntrySeedingMethod })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ENTRY_SEEDING_LABELS) as EntrySeedingMethod[]).map((method) => (
                          <SelectItem key={method} value={method}>{ENTRY_SEEDING_LABELS[method]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {stage.entrySeedingMethod === "manual" && (
                      <p className="text-xs text-muted-foreground">Przed startem etapu każdy uczestnik musi mieć unikalny seed 1–N.</p>
                    )}
                  </div>

                  {stage.format === "group_stage" && (
                    <div className="space-y-2">
                      <Label>Rozmieszczenie w grupach</Label>
                      <Select value={stage.placementMethod} onValueChange={(value) => update(index, { placementMethod: value as StagePlacementMethod })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="snake">Snake — rozdziel najlepsze seedy</SelectItem>
                          <SelectItem value="random">Losowo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {stage.format === "single_elimination" && (
                    <div className="space-y-2">
                      <Label>Rozmieszczenie w drabince</Label>
                      <Select value={stage.placementMethod} onValueChange={(value) => update(index, { placementMethod: value as StagePlacementMethod })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standardowe — najwyższy kontra najniższy</SelectItem>
                          <SelectItem value="random">Losowe miejsca w drabince</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {stage.format === "group_stage" && (
                    <div className="space-y-2">
                      <Label>Nowe seedy po grupach</Label>
                      <Select value={stage.resultSeedingMethod} onValueChange={(value) => update(index, { resultSeedingMethod: value as GroupResultSeedingMethod })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rank_bands">Pasma miejsc — 1. miejsca, potem 2. itd.</SelectItem>
                          <SelectItem value="global_ranking">Klasyfikacja globalna według wyników</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {stageUsesRandom(stage) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`stage-${index}-random-seed`}>Klucz losowania</Label>
                        <div className="flex gap-2">
                          <Input id={`stage-${index}-random-seed`} value={stage.randomSeed ?? ""} onChange={(event) => update(index, { randomSeed: event.target.value })} />
                          <Button type="button" variant="outline" size="icon" aria-label="Wygeneruj nowy klucz losowania" onClick={() => update(index, { randomSeed: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${index}` })}>
                            <Dices className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Ten sam klucz zawsze daje ten sam wynik i umożliwia audyt.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Sposób pokazania losowania</Label>
                        <Select value={stage.randomRevealOrder} onValueChange={(value) => update(index, { randomRevealOrder: value as RandomRevealOrder })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instant">Pokaż cały wynik od razu</SelectItem>
                            <SelectItem value="sequential">Ujawniaj po kolei — pod przyszłe koło</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {groupPreview.length > 0 && (
                    <div className="rounded-md bg-muted/30 p-3 text-xs sm:col-span-2">
                      <div className="mb-2 font-medium text-foreground">Podgląd rozmieszczenia seedów</div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {groupPreview.map((seeds, groupIndex) => (
                          <div key={groupIndex}><strong>Grupa {groupLabelFromIndex(groupIndex)}:</strong> {seeds.map((seed) => `#${seed}`).join(", ")}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {bracketPreview.length > 0 && (
                    <div className="rounded-md bg-muted/30 p-3 text-xs sm:col-span-2">
                      <div className="mb-2 font-medium text-foreground">Podgląd pierwszej rundy</div>
                      <div className="grid gap-1 sm:grid-cols-2">
                        {bracketPreview.map(([left, right], matchIndex) => (
                          <div key={matchIndex}>M{matchIndex + 1}: {previewSeedLabel(left)} vs {previewSeedLabel(right)}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>

              {stageErrors.length > 0 && (
                <ul className="space-y-1 text-sm text-destructive sm:col-span-2">
                  {stageErrors.map((error, errorIndex) => <li key={`${error.message}-${errorIndex}`}>{error.message}</li>)}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
      {errors.filter((error) => error.stageIndex == null).map((error) => (
        <p key={error.message} className="text-sm text-destructive">{error.message}</p>
      ))}
    </div>
  );
}
