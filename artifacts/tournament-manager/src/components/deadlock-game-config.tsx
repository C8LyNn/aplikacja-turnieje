import { useEffect, useState, useCallback } from "react";
import {
  DEADLOCK_CONFIG_VERSION,
  DEADLOCK_GAME_ID,
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
import { Gamepad2, Lock, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const banMode = value?.config?.banMode ?? "shared_pool";
  const bansPerPlayer = value?.config?.bansPerPlayer ?? 5;

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
        <div className="space-y-4">

          {/* Ban mode */}
          <div className="space-y-2">
            <Label>Tryb banowania</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["shared_pool", "opponent_only"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...value!, config: { ...value!.config, banMode: mode } })}
                  className={cn(
                    "rounded-lg border p-3 text-left text-xs transition-colors",
                    banMode === mode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-muted-foreground/40",
                    disabled && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <p className="font-semibold text-sm mb-0.5">
                    {mode === "shared_pool" ? "Wspólna pula banów" : "Bany przeciwnika"}
                  </p>
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    {mode === "shared_pool"
                      ? "Gracz nie może wybrać hero zbanowanego przez siebie ani przeciwnika."
                      : "Gracz nie może wybrać hero zbanowanego przez przeciwnika (własne bany go nie blokują)."}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Bans per player */}
          <div className="space-y-2">
            <Label>Bany na gracza (0–20)</Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Zmniejsz liczbę banów"
                disabled={disabled || bansPerPlayer <= 0}
                onClick={() => onChange({ ...value!, config: { ...value!.config, bansPerPlayer: Math.max(0, bansPerPlayer - 1) } })}
                className="w-8 h-8 flex items-center justify-center rounded border border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono font-bold text-lg" aria-live="polite">{bansPerPlayer}</span>
              <button
                type="button"
                aria-label="Zwiększ liczbę banów"
                disabled={disabled || bansPerPlayer >= 20}
                onClick={() => onChange({ ...value!, config: { ...value!.config, bansPerPlayer: Math.min(20, bansPerPlayer + 1) } })}
                className="w-8 h-8 flex items-center justify-center rounded border border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-muted-foreground">
                {bansPerPlayer === 0 ? "Bany wyłączone" : `${bansPerPlayer} ban${bansPerPlayer === 1 ? "" : "y/ów"} na gracza`}
              </span>
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
        <CardTitle>Gra i reguły</CardTitle>
        <CardDescription>
          Opcjonalna konfiguracja gry. Po rozpoczęciu turnieju reguły pozostają tylko do odczytu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Reguły gry (locked after draft) ── */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reguły gry</p>
          <GameConfigPicker value={value} onChange={setValue} disabled={locked} />
          {locked ? (
            <div className="space-y-2">
              <ForcedHeroBadge gameConfig={tournament.gameConfig} />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-3 h-3 shrink-0" />
                Turniej aktywny — reguły zablokowane.
              </p>
            </div>
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
        </div>

      </CardContent>
    </Card>
  );
}

// ── Presentation panel data ──────────────────────────────────────────────────

const COLOR_PRESETS = [
  { id: "deadlock",      label: "Emerald Occult", swatch: "#0e1a10", accent: "#3d8055" },
  { id: "obsidian",      label: "Obsidian",       swatch: "#10100f", accent: "#919aaa" },
  { id: "crimson-vault", label: "Crimson Vault",  swatch: "#130608", accent: "#c23348" },
  { id: "abyssal",       label: "Abyssal",        swatch: "#0a0f1e", accent: "#4a9ee6" },
  { id: "iron-citadel",  label: "Iron Citadel",   swatch: "#0d1015", accent: "#7aacba" },
  { id: "ember",         label: "Ember",          swatch: "#130a06", accent: "#d46a2a" },
  { id: "void",          label: "Void",           swatch: "#0e080f", accent: "#9946e0" },
  { id: "copper-age",    label: "Copper Age",     swatch: "#130d06", accent: "#d46828" },
  { id: "glacier",       label: "Glacier",        swatch: "#080f14", accent: "#20bcd4" },
  { id: "midnight-rose", label: "Midnight Rose",  swatch: "#0c0a14", accent: "#d44e80" },
  { id: "toxic",         label: "Toxic",          swatch: "#070f04", accent: "#52c42a" },
  { id: "sandstorm",     label: "Sandstorm",      swatch: "#120e06", accent: "#d49e28" },
] as const;

const FONT_PRESETS = [
  { id: "inter",    label: "Inter",    note: "Domyślna" },
  { id: "rajdhani", label: "Rajdhani", note: "Geometryczna" },
  { id: "orbitron", label: "Orbitron", note: "Sci-fi" },
  { id: "exo2",     label: "Exo 2",   note: "Tech" },
  { id: "saira",    label: "Saira",    note: "Wąska" },
  { id: "play",     label: "Play",     note: "Gamelike" },
] as const;

const FRAME_PRESETS = [
  { id: "sharp",   label: "Sharp",   note: "0 px" },
  { id: "cut",     label: "Cut",     note: "2 px" },
  { id: "tech",    label: "Tech",    note: "4 px" },
  { id: "rounded", label: "Rounded", note: "8 px" },
  { id: "pill",    label: "Pill",    note: "24 px" },
  { id: "glow",    label: "Glow",    note: "Poświata" },
] as const;

export function TournamentPresentationPanel({ tournament }: { tournament: Tournament }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateTournament = useUpdateTournament();

  const ps = (tournament as any).presentationSettings as {
    deadlockTheme?: boolean;
    colorPreset?: string | null;
    fontPreset?: string | null;
    frameStyle?: string | null;
  } | null | undefined;

  // Derive initial values — shim legacy deadlockTheme boolean
  const initialColor = ps?.colorPreset ?? (ps?.deadlockTheme ? "deadlock" : "");
  const [colorPreset, setColorPreset] = useState<string>(initialColor);
  const [fontPreset, setFontPreset]   = useState<string>(ps?.fontPreset ?? "inter");
  const [frameStyle, setFrameStyle]   = useState<string>(ps?.frameStyle ?? "rounded");

  // Stay in sync if tournament data refreshes externally
  useEffect(() => {
    setColorPreset(ps?.colorPreset ?? (ps?.deadlockTheme ? "deadlock" : ""));
    setFontPreset(ps?.fontPreset ?? "inter");
    setFrameStyle(ps?.frameStyle ?? "rounded");
  }, [ps?.colorPreset, ps?.deadlockTheme, ps?.fontPreset, ps?.frameStyle]);

  const saveSettings = useCallback(
    (patch: { colorPreset?: string; fontPreset?: string; frameStyle?: string }) => {
      const next = {
        colorPreset: patch.colorPreset  ?? colorPreset,
        fontPreset:  patch.fontPreset   ?? fontPreset,
        frameStyle:  patch.frameStyle   ?? frameStyle,
        deadlockTheme: (patch.colorPreset ?? colorPreset) === "deadlock",
      };
      updateTournament.mutate(
        { id: tournament.id, data: { presentationSettings: next } as any },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(tournament.id) });
            toast({ title: "Zapisano ustawienia prezentacji" });
          },
          onError: (error) =>
            toast({
              title: "Nie udało się zapisać ustawień prezentacji",
              description: error instanceof Error ? error.message : undefined,
              variant: "destructive",
            }),
        },
      );
    },
    [colorPreset, fontPreset, frameStyle, tournament.id, updateTournament, queryClient, toast],
  );

  const handleColor = (id: string) => {
    const next = colorPreset === id ? "" : id;
    setColorPreset(next);
    saveSettings({ colorPreset: next });
  };

  const handleFont = (id: string) => {
    setFontPreset(id);
    saveSettings({ fontPreset: id });
  };

  const handleFrame = (id: string) => {
    setFrameStyle(id);
    saveSettings({ frameStyle: id });
  };

  return (
    <div className="space-y-5 border-t border-border/50 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wizualia prezentacji</p>

      {/* ── Colour presets ── */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Motyw kolorów</p>
        <div className="grid grid-cols-3 gap-2">
          {COLOR_PRESETS.map((preset) => {
            const active = colorPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleColor(preset.id)}
                disabled={updateTournament.isPending}
                title={preset.label}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs transition-all disabled:opacity-50",
                  active
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                    : "border-border/40 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/60",
                )}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-sm border border-white/10"
                  style={{ background: `linear-gradient(135deg, ${preset.swatch} 55%, ${preset.accent} 100%)` }}
                />
                <span className="truncate font-medium leading-none">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Font presets ── */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Czcionka</p>
        <div className="grid grid-cols-3 gap-2">
          {FONT_PRESETS.map((preset) => {
            const active = fontPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleFont(preset.id)}
                disabled={updateTournament.isPending}
                className={cn(
                  "flex flex-col rounded-lg border px-2 py-2 text-left text-xs transition-all disabled:opacity-50",
                  active
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                    : "border-border/40 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/60",
                )}
              >
                <span className="font-semibold leading-none">{preset.label}</span>
                <span className="mt-0.5 text-[10px] opacity-60">{preset.note}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Frame presets ── */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Styl ramek</p>
        <div className="grid grid-cols-3 gap-2">
          {FRAME_PRESETS.map((preset) => {
            const active = frameStyle === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleFrame(preset.id)}
                disabled={updateTournament.isPending}
                className={cn(
                  "flex flex-col rounded-lg border px-2 py-2 text-left text-xs transition-all disabled:opacity-50",
                  active
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                    : "border-border/40 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/60",
                )}
              >
                <span className="font-semibold leading-none">{preset.label}</span>
                <span className="mt-0.5 text-[10px] opacity-60">{preset.note}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
