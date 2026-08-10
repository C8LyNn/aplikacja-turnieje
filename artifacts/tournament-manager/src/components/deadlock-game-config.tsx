import { useEffect, useMemo, useState } from "react";
import {
  DEADLOCK_CONFIG_VERSION,
  DEADLOCK_GAME_ID,
  DEADLOCK_HEROES,
  getDeadlockHero,
  type DeadlockHeroDefinition,
} from "@workspace/game-catalog";
import {
  getGetTournamentQueryKey,
  useUpdateTournament,
  type DeadlockTournamentGameConfig,
  type Tournament,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Gamepad2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type GameConfig = DeadlockTournamentGameConfig | null;

export function gameAssetUrl(iconKey: string): string {
  const base = import.meta.env?.BASE_URL || "/";
  return `${base.endsWith("/") ? base : `${base}/`}${iconKey}`;
}

export function DeadlockHeroIcon({
  hero,
  className,
}: {
  hero: DeadlockHeroDefinition;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [hero.id]);

  if (failed) {
    return (
      <span
        aria-label={`${hero.displayName} — brak ikony`}
        className={cn(
          "inline-flex items-center justify-center rounded bg-muted font-semibold text-muted-foreground",
          className,
        )}
      >
        {hero.displayName.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={gameAssetUrl(hero.iconKey)}
      alt={hero.displayName}
      className={cn("rounded object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}

export function ForcedHeroBadge({
  gameConfig,
  compact = false,
}: {
  gameConfig?: Tournament["gameConfig"];
  compact?: boolean;
}) {
  const hero = getDeadlockHero(gameConfig?.config.forcedHeroId);
  if (!gameConfig || gameConfig.gameId !== DEADLOCK_GAME_ID) return null;

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex gap-2 py-1", compact && "text-xs")}
    >
      {hero ? (
        <DeadlockHeroIcon hero={hero} className="h-5 w-5" />
      ) : (
        <Gamepad2 className="h-4 w-4" />
      )}
      <span>Deadlock</span>
      {hero && <span className="font-semibold">· {hero.displayName}</span>}
    </Badge>
  );
}

export function GameConfigPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: GameConfig;
  onChange: (value: GameConfig) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const visibleHeroes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pl");
    return query
      ? DEADLOCK_HEROES.filter((hero) =>
          hero.displayName.toLocaleLowerCase("pl").includes(query),
        )
      : DEADLOCK_HEROES;
  }, [search]);
  const selectedHeroId = value?.config.forcedHeroId;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tournament-game">Gra (opcjonalnie)</Label>
        <Select
          value={value?.gameId ?? "none"}
          disabled={disabled}
          onValueChange={(gameId) =>
            onChange(
              gameId === DEADLOCK_GAME_ID
                ? {
                    gameId: DEADLOCK_GAME_ID,
                    configVersion: DEADLOCK_CONFIG_VERSION,
                    config: {},
                  }
                : null,
            )
          }
        >
          <SelectTrigger id="tournament-game">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Bez konfiguracji gry</SelectItem>
            <SelectItem value={DEADLOCK_GAME_ID}>Deadlock</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Konfiguracja gry jest niezależna od formatu i etapów turnieju.
        </p>
      </div>

      {value?.gameId === DEADLOCK_GAME_ID && (
        <div className="space-y-3">
          <div>
            <Label>Wymuszona postać (opcjonalnie)</Label>
            <p className="text-xs text-muted-foreground">
              Jeżeli wybierzesz postać, obowiązuje ona wszystkich uczestników turnieju.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Szukaj postaci Deadlocka"
              className="pl-9"
              value={search}
              disabled={disabled}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Szukaj postaci…"
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-md border p-2">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {visibleHeroes.map((hero) => {
                const selected = selectedHeroId === hero.id;
                return (
                  <button
                    key={hero.id}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={hero.displayName}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-1 rounded-md border p-2 text-center text-xs transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent hover:border-border hover:bg-muted/50",
                    )}
                    onClick={() =>
                      onChange({
                        ...value,
                        config: selected ? {} : { forcedHeroId: hero.id },
                      })
                    }
                  >
                    <DeadlockHeroIcon hero={hero} className="h-12 w-12" />
                    <span className="w-full truncate">{hero.displayName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TournamentGameConfigPanel({
  tournament,
}: {
  tournament: Tournament;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateTournament = useUpdateTournament();
  const [value, setValue] = useState<GameConfig>(tournament.gameConfig ?? null);

  useEffect(() => setValue(tournament.gameConfig ?? null), [tournament.gameConfig]);

  const locked = tournament.status !== "draft";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gra i postać</CardTitle>
        <CardDescription>
          Opcjonalna konfiguracja gry. Po rozpoczęciu turnieju pozostaje tylko do odczytu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GameConfigPicker value={value} onChange={setValue} disabled={locked} />
        {locked ? (
          <ForcedHeroBadge gameConfig={tournament.gameConfig} />
        ) : (
          <Button
            disabled={updateTournament.isPending}
            onClick={() =>
              updateTournament.mutate(
                { id: tournament.id, data: { gameConfig: value } },
                {
                  onSuccess: () => {
                    void queryClient.invalidateQueries({
                      queryKey: getGetTournamentQueryKey(tournament.id),
                    });
                    toast({ title: "Zapisano konfigurację gry" });
                  },
                  onError: (error) =>
                    toast({
                      title: "Nie udało się zapisać konfiguracji gry",
                      description: error instanceof Error ? error.message : undefined,
                      variant: "destructive",
                    }),
                },
              )
            }
          >
            {updateTournament.isPending ? "Zapisywanie…" : "Zapisz konfigurację gry"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
