import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
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
  createStageDraft,
  type StageDraft,
  type StageFormat,
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

export function StagePlanEditor({
  stages,
  errors,
  onChange,
}: StagePlanEditorProps) {
  const update = (index: number, patch: Partial<StageDraft>) => {
    onChange(
      stages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...patch } : stage,
      ),
    );
  };
  const changeFormat = (index: number, format: StageFormat) => {
    const current = stages[index];
    const defaults = createStageDraft(index + 1, format);
    update(index, {
      format,
      rounds:
        format === "swiss" ? (current.rounds ?? defaults.rounds) : undefined,
      groupCount:
        format === "group_stage" ? (current.groupCount ?? 2) : undefined,
      participantsPerGroup:
        format === "group_stage"
          ? (current.participantsPerGroup ?? 4)
          : undefined,
      qualifiersPerGroup:
        format === "group_stage"
          ? (current.qualifiersPerGroup ?? 2)
          : undefined,
      participantCount:
        format === "group_stage"
          ? (current.groupCount ?? 2) * (current.participantsPerGroup ?? 4)
          : current.participantCount,
    });
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(
      next.map((stage, stageIndex) => ({
        ...stage,
        name: /^Etap \d+$/.test(stage.name)
          ? `Etap ${stageIndex + 1}`
          : stage.name,
      })),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Plan etapów</h3>
          <p className="text-xs text-muted-foreground">
            Od 1 do 3 etapów. Kolejność zostanie zablokowana po rozpoczęciu
            turnieju.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={stages.length >= 3}
          onClick={() =>
            onChange([
              ...stages,
              createStageDraft(stages.length + 1, "single_elimination"),
            ])
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Dodaj etap
        </Button>
      </div>

      {stages.map((stage, index) => {
        const stageErrors = errors.filter(
          (error) => error.stageIndex === index,
        );
        const isLast = index === stages.length - 1;
        return (
          <Card
            key={stage.clientId}
            className={stageErrors.length > 0 ? "border-destructive/50" : ""}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Etap {index + 1}</CardTitle>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Przesuń etap w górę"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Przesuń etap w dół"
                  disabled={isLast}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Usuń etap"
                  disabled={stages.length === 1}
                  onClick={() =>
                    onChange(
                      stages.filter((_, stageIndex) => stageIndex !== index),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`stage-${index}-name`}>Nazwa</Label>
                <Input
                  id={`stage-${index}-name`}
                  value={stage.name}
                  onChange={(event) =>
                    update(index, { name: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={stage.format}
                  onValueChange={(value) =>
                    changeFormat(index, value as StageFormat)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STAGE_FORMAT_LABELS) as StageFormat[]).map(
                      (format) => (
                        <SelectItem key={format} value={format}>
                          {STAGE_FORMAT_LABELS[format]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Best of</Label>
                <Select
                  value={String(stage.bestOf)}
                  onValueChange={(value) =>
                    update(index, {
                      bestOf: Number(value) as StageDraft["bestOf"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 3, 5, 7].map((bestOf) => (
                      <SelectItem key={bestOf} value={String(bestOf)}>
                        BO{bestOf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {stage.format !== "group_stage" && (
                <div className="space-y-2">
                  <Label htmlFor={`stage-${index}-participants`}>
                    Liczba uczestników
                  </Label>
                  <Input
                    id={`stage-${index}-participants`}
                    type="number"
                    min={2}
                    value={stage.participantCount}
                    onChange={(event) =>
                      update(index, {
                        participantCount: integer(event.target.value, 0),
                      })
                    }
                  />
                </div>
              )}
              {stage.format === "swiss" && (
                <div className="space-y-2">
                  <Label htmlFor={`stage-${index}-rounds`}>Liczba rund</Label>
                  <Input
                    id={`stage-${index}-rounds`}
                    type="number"
                    min={1}
                    max={20}
                    value={stage.rounds ?? ""}
                    onChange={(event) =>
                      update(index, { rounds: integer(event.target.value, 0) })
                    }
                  />
                </div>
              )}
              {!isLast &&
                (stage.format === "swiss" ||
                  stage.format === "round_robin") && (
                  <div className="space-y-2">
                    <Label htmlFor={`stage-${index}-advancing`}>
                      Liczba kwalifikantów
                    </Label>
                    <Input
                      id={`stage-${index}-advancing`}
                      type="number"
                      min={2}
                      max={stage.participantCount}
                      value={stage.advancingCount ?? ""}
                      onChange={(event) =>
                        update(index, {
                          advancingCount: integer(event.target.value, 0),
                        })
                      }
                    />
                  </div>
                )}
              {stage.format === "group_stage" && (
                <>
                  <div className="space-y-2">
                    <Label>Liczba grup</Label>
                    <Select
                      value={String(stage.groupCount ?? 2)}
                      onValueChange={(value) => {
                        const groupCount = Number(value) as 2 | 4;
                        update(index, {
                          groupCount,
                          participantCount:
                            groupCount * (stage.participantsPerGroup ?? 4),
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 grupy</SelectItem>
                        <SelectItem value="4">4 grupy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`stage-${index}-group-size`}>
                      Uczestników w grupie
                    </Label>
                    <Input
                      id={`stage-${index}-group-size`}
                      type="number"
                      min={3}
                      max={8}
                      value={stage.participantsPerGroup ?? 4}
                      onChange={(event) => {
                        const participantsPerGroup = integer(
                          event.target.value,
                          0,
                        );
                        update(index, {
                          participantsPerGroup,
                          participantCount:
                            (stage.groupCount ?? 2) * participantsPerGroup,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kwalifikantów z grupy</Label>
                    <Select
                      value={String(stage.qualifiersPerGroup ?? 2)}
                      onValueChange={(value) =>
                        update(index, {
                          qualifiersPerGroup: Number(value) as 1 | 2,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 osoba</SelectItem>
                        <SelectItem value="2">2 osoby</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    Łącznie: <strong>{stage.participantCount}</strong>{" "}
                    uczestników · snake seeding
                  </div>
                </>
              )}
              {stageErrors.length > 0 && (
                <ul className="space-y-1 text-sm text-destructive sm:col-span-2">
                  {stageErrors.map((error, errorIndex) => (
                    <li key={`${error.message}-${errorIndex}`}>
                      {error.message}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
      {errors
        .filter((error) => error.stageIndex == null)
        .map((error) => (
          <p key={error.message} className="text-sm text-destructive">
            {error.message}
          </p>
        ))}
    </div>
  );
}
