import {
  DEADLOCK_HEROES,
  getDeadlockEffectiveStageBans,
  sortHeroesByName,
  type DeadlockHeroId,
} from "@workspace/game-catalog";
import { DeadlockHeroIcon } from "@/components/deadlock-game-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DeadlockTournamentGameConfig } from "@workspace/api-client-react";

interface DeadlockStageBansEditorProps {
  additional: readonly DeadlockHeroId[];
  inherited: readonly DeadlockHeroId[];
  onChange: (heroIds: DeadlockHeroId[]) => void;
  disabled?: boolean;
}

const HEROES = sortHeroesByName(DEADLOCK_HEROES);

export function DeadlockStageBansEditor({
  additional,
  inherited,
  onChange,
  disabled = false,
}: DeadlockStageBansEditorProps) {
  const inheritedSet = new Set(inherited);
  const additionalSet = new Set(additional);

  const toggle = (heroId: DeadlockHeroId) => {
    if (disabled || inheritedSet.has(heroId)) return;
    onChange(
      additionalSet.has(heroId)
        ? additional.filter((candidate) => candidate !== heroId)
        : [...additional, heroId],
    );
  };

  return (
    <div className="space-y-3 rounded-md border p-3 sm:col-span-2">
      <div>
        <p className="text-sm font-medium">Dodatkowe bany postaci w tym etapie</p>
        <p className="text-xs text-muted-foreground">
          Bany kumulują się. Odziedziczonych z wcześniejszych etapów nie można tutaj usunąć.
        </p>
      </div>

      {inherited.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Odziedziczone</p>
          <div className="flex flex-wrap gap-2">
            {HEROES.filter((hero) => inheritedSet.has(hero.id)).map((hero) => (
              <Badge key={hero.id} variant="secondary" className="gap-2 py-1 pr-2">
                <DeadlockHeroIcon hero={hero} className="h-8 w-8" />
                {hero.displayName}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {HEROES.map((hero) => {
          const inheritedHero = inheritedSet.has(hero.id);
          const selected = inheritedHero || additionalSet.has(hero.id);
          return (
            <Button
              key={hero.id}
              type="button"
              variant={selected ? "secondary" : "outline"}
              disabled={disabled || inheritedHero}
              aria-pressed={selected}
              onClick={() => toggle(hero.id)}
              className={cn(
                "h-auto min-h-12 justify-start gap-2 px-2 py-2 text-left",
                inheritedHero && "opacity-70",
                additionalSet.has(hero.id) && "border-primary bg-primary/10",
              )}
            >
              <DeadlockHeroIcon hero={hero} className="h-9 w-9 shrink-0" />
              <span className="truncate text-xs">{hero.displayName}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function DeadlockStageBansSummary({
  gameConfig,
  orderedStageKeys,
  stageKey,
}: {
  gameConfig?: DeadlockTournamentGameConfig | null;
  orderedStageKeys: readonly string[];
  stageKey: string;
}) {
  if (!gameConfig || gameConfig.gameId !== "deadlock") return null;
  const heroIds = getDeadlockEffectiveStageBans(gameConfig.config, orderedStageKeys, stageKey);
  if (heroIds.length === 0) return null;
  const heroSet = new Set(heroIds);
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Obowiązujące bany postaci w tym etapie
      </p>
      <div className="flex flex-wrap gap-2">
        {HEROES.filter((hero) => heroSet.has(hero.id)).map((hero) => (
          <Badge key={hero.id} variant="secondary" className="gap-2 py-1 pr-2">
            <DeadlockHeroIcon hero={hero} className="h-9 w-9" />
            {hero.displayName}
          </Badge>
        ))}
      </div>
    </div>
  );
}
