import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TournamentStage } from "@workspace/api-client-react";
import {
  Dices,
  FastForward,
  Loader2,
  Maximize2,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  Settings,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  fetchSeedingCeremony,
  prepareSeedingCeremony,
  resetSeedingCeremony,
  revealAllSeedingDraws,
  revealNextSeedingDraw,
  type SeedingCeremonyDraw,
  type SeedingCeremonyState,
} from "@/lib/seeding-ceremony-api";
import {
  drawResultLabel,
  revealedCeremonyDraws,
  stageHasRandomCeremony,
  visibleWheelDraws,
} from "@/lib/seeding-ceremony-view";
import { getApiErrorMessage } from "@/lib/tournament-stages-ui";

// ── Animation settings ───────────────────────────────────────────────────────

interface AnimSettings {
  // Duration
  durationMode: "fixed" | "random";
  durationMin: number;          // seconds [1, 30]
  durationMax: number;          // seconds [durationMin, 30]
  durationLongEnabled: boolean;
  durationLongChance: number;   // percent [1, 99]
  durationLongMin: number;      // seconds [durationMax+0.5, 60]
  durationLongMax: number;      // seconds [durationLongMin, 60]
  // Speed (multiplier on base 4-turn spin)
  speedMode: "fixed" | "random";
  speedMin: number;             // multiplier [0.5, 5.0]
  speedMax: number;             // multiplier [speedMin, 5.0]
  speedAltEnabled: boolean;
  speedAltChance: number;       // percent [1, 99]
  speedAltMin: number;
  speedAltMax: number;
}

const ANIM_DEFAULTS: AnimSettings = {
  durationMode: "random",
  durationMin: 4,
  durationMax: 6,
  durationLongEnabled: true,
  durationLongChance: 20,
  durationLongMin: 7,
  durationLongMax: 10,
  speedMode: "random",
  speedMin: 0.9,
  speedMax: 1.1,
  speedAltEnabled: true,
  speedAltChance: 20,
  speedAltMin: 1.1,
  speedAltMax: 1.4,
};

const ANIM_LS_KEY = "seeding-ceremony-anim-v1";

function loadAnimSettings(): AnimSettings {
  try {
    const raw = localStorage.getItem(ANIM_LS_KEY);
    if (!raw) return { ...ANIM_DEFAULTS };
    return { ...ANIM_DEFAULTS, ...(JSON.parse(raw) as Partial<AnimSettings>) };
  } catch {
    return { ...ANIM_DEFAULTS };
  }
}

function saveAnimSettings(s: AnimSettings): void {
  try { localStorage.setItem(ANIM_LS_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

/** Sample animation duration (seconds). Purely visual — does not affect draw result. */
function sampleDuration(s: AnimSettings): number {
  const useLong = s.durationLongEnabled && Math.random() * 100 < s.durationLongChance;
  if (useLong) {
    const span = Math.max(0, s.durationLongMax - s.durationLongMin);
    return s.durationLongMin + Math.random() * span;
  }
  const lo = s.durationMin;
  const hi = s.durationMode === "fixed" ? lo : Math.max(lo, s.durationMax);
  return lo + Math.random() * Math.max(0, hi - lo);
}

/** Sample speed multiplier. Purely visual — does not affect draw result. */
function sampleSpeed(s: AnimSettings): number {
  const useAlt = s.speedAltEnabled && Math.random() * 100 < s.speedAltChance;
  if (useAlt) {
    const span = Math.max(0, s.speedAltMax - s.speedAltMin);
    return s.speedAltMin + Math.random() * span;
  }
  const lo = s.speedMin;
  const hi = s.speedMode === "fixed" ? lo : Math.max(lo, s.speedMax);
  return lo + Math.random() * Math.max(0, hi - lo);
}

// ── AnimSettingsPanel helpers ────────────────────────────────────────────────

function NumInput({
  value,
  onChange,
  min,
  max,
  step = 0.5,
  suffix,
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className="h-7 w-[72px] px-2 text-sm"
      />
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </div>
  );
}

function AnimSettingsPanel({
  settings,
  onChange,
}: {
  settings: AnimSettings;
  onChange: (next: AnimSettings) => void;
}) {
  const up = (patch: Partial<AnimSettings>) => onChange({ ...settings, ...patch });

  // When durationMax changes, auto-push durationLongMin up if needed
  const handleDurationMax = (n: number) => {
    const safeMax = Math.max(n, settings.durationMin);
    up({
      durationMax: safeMax,
      durationLongMin: Math.max(settings.durationLongMin, safeMax + 0.5),
      durationLongMax: Math.max(settings.durationLongMax, safeMax + 0.5),
    });
  };

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-5 text-sm">
      <p className="font-semibold">Animacja losowania</p>

      {/* ── Duration section ── */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Czas</p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={settings.durationMode}
            onValueChange={(v) => up({ durationMode: v as "fixed" | "random" })}
          >
            <SelectTrigger className="h-7 w-24 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Stały</SelectItem>
              <SelectItem value="random">Losowy</SelectItem>
            </SelectContent>
          </Select>

          {settings.durationMode === "fixed" ? (
            <NumInput
              value={settings.durationMin}
              min={1} max={30} step={0.5} suffix="s"
              onChange={(n) => up({ durationMin: n, durationMax: n })}
            />
          ) : (
            <div className="flex items-center gap-1">
              <NumInput
                value={settings.durationMin}
                min={1} max={Math.min(settings.durationMax, 30)} step={0.5}
                onChange={(n) => up({ durationMin: Math.min(n, settings.durationMax) })}
              />
              <span className="text-muted-foreground">–</span>
              <NumInput
                value={settings.durationMax}
                min={settings.durationMin} max={30} step={0.5} suffix="s"
                onChange={handleDurationMax}
              />
            </div>
          )}
        </div>

        {/* Long variant */}
        <div className="ml-3 border-l pl-3 space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={settings.durationLongEnabled}
              onCheckedChange={(v) => up({ durationLongEnabled: v })}
              id="dur-long-switch"
            />
            <Label htmlFor="dur-long-switch" className="text-sm cursor-pointer">
              Dodatkowy rzadszy wariant
            </Label>
          </div>
          {settings.durationLongEnabled && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Szansa</span>
                <NumInput
                  value={settings.durationLongChance}
                  min={1} max={99} step={5} suffix="%"
                  onChange={(n) => up({ durationLongChance: n })}
                />
              </div>
              <div className="flex items-center gap-1">
                <span>Zakres</span>
                <NumInput
                  value={settings.durationLongMin}
                  min={settings.durationMax + 0.5} max={Math.min(settings.durationLongMax, 60)} step={0.5}
                  onChange={(n) => up({ durationLongMin: Math.min(n, settings.durationLongMax) })}
                />
                <span>–</span>
                <NumInput
                  value={settings.durationLongMax}
                  min={settings.durationLongMin} max={60} step={0.5} suffix="s"
                  onChange={(n) => up({ durationLongMax: Math.max(n, settings.durationLongMin) })}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Speed section ── */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Prędkość obrotu
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={settings.speedMode}
            onValueChange={(v) => up({ speedMode: v as "fixed" | "random" })}
          >
            <SelectTrigger className="h-7 w-24 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Stała</SelectItem>
              <SelectItem value="random">Losowa</SelectItem>
            </SelectContent>
          </Select>

          {settings.speedMode === "fixed" ? (
            <NumInput
              value={settings.speedMin}
              min={0.5} max={5} step={0.1} suffix="×"
              onChange={(n) => up({ speedMin: n, speedMax: n })}
            />
          ) : (
            <div className="flex items-center gap-1">
              <NumInput
                value={settings.speedMin}
                min={0.5} max={Math.min(settings.speedMax, 5)} step={0.1}
                onChange={(n) => up({ speedMin: Math.min(n, settings.speedMax) })}
              />
              <span className="text-muted-foreground">–</span>
              <NumInput
                value={settings.speedMax}
                min={settings.speedMin} max={5} step={0.1} suffix="×"
                onChange={(n) => up({ speedMax: Math.max(n, settings.speedMin) })}
              />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Mnożnik prędkości (1× = 4 pełne obroty przy danym czasie)
        </p>

        {/* Speed alt variant */}
        <div className="ml-3 border-l pl-3 space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={settings.speedAltEnabled}
              onCheckedChange={(v) => up({ speedAltEnabled: v })}
              id="speed-alt-switch"
            />
            <Label htmlFor="speed-alt-switch" className="text-sm cursor-pointer">
              Dodatkowy rzadszy wariant
            </Label>
          </div>
          {settings.speedAltEnabled && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Szansa</span>
                <NumInput
                  value={settings.speedAltChance}
                  min={1} max={99} step={5} suffix="%"
                  onChange={(n) => up({ speedAltChance: n })}
                />
              </div>
              <div className="flex items-center gap-1">
                <span>Zakres</span>
                <NumInput
                  value={settings.speedAltMin}
                  min={0.5} max={Math.min(settings.speedAltMax, 5)} step={0.1}
                  onChange={(n) => up({ speedAltMin: Math.min(n, settings.speedAltMax) })}
                />
                <span>–</span>
                <NumInput
                  value={settings.speedAltMax}
                  min={settings.speedAltMin} max={5} step={0.1} suffix="×"
                  onChange={(n) => up({ speedAltMax: Math.max(n, settings.speedAltMin) })}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t pt-3">
        <p className="text-xs text-muted-foreground flex-1">
          Czas i prędkość są losowane niezależnie. Wynik losowania nie jest zmieniony.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onChange({ ...ANIM_DEFAULTS })}
        >
          Przywróć domyślne
        </Button>
      </div>
    </div>
  );
}

// ── Wheel ────────────────────────────────────────────────────────────────────

interface SeedingCeremonyProps {
  tournamentId: number;
  stage: TournamentStage;
  canManage: boolean;
  audience?: boolean;
  onStateChange?: (state: SeedingCeremonyState | null) => void;
}

function statusLabel(state: SeedingCeremonyState): string {
  switch (state.status) {
    case "prepared": return "Gotowe do rozpoczęcia";
    case "in_progress": return "Losowanie w toku";
    case "completed": return "Losowanie zakończone";
    case "applied": return "Wynik zastosowany";
    default: return "Nieznany stan";
  }
}

function Wheel({
  options,
  rotation,
  spinning,
  animDuration,
}: {
  options: string[];
  rotation: number;
  spinning: boolean;
  animDuration: number;
}) {
  const visible = options.slice(0, 32);
  const count = visible.length;

  // Adaptive font size: smaller for dense wheels
  const fontSize = count <= 12 ? 11 : count <= 20 ? 10 : count <= 26 ? 9 : 8;
  // Adaptive max label length to prevent overflow
  const maxChars = count <= 16 ? 12 : count <= 24 ? 9 : 7;

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[360px]"
      aria-label={`Koło losowania, pozostało ${options.length} wyników`}
    >
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1 border-x-[12px] border-t-[22px] border-x-transparent border-t-primary" />
      <svg
        viewBox="0 0 320 320"
        className="h-full w-full drop-shadow-sm"
        role="img"
        aria-label="Animowane koło dostępnych wyników"
      >
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "160px 160px",
            transition: spinning
              ? `transform ${animDuration.toFixed(2)}s cubic-bezier(.12,.7,.08,1)`
              : "none",
          }}
        >
          <circle cx="160" cy="160" r="148" className="fill-muted stroke-border" strokeWidth="2" />
          {visible.map((option, index) => {
            const angle = (360 / Math.max(count, 1)) * index;
            const radians = ((angle - 90) * Math.PI) / 180;
            const x = 160 + Math.cos(radians) * 112;
            const y = 160 + Math.sin(radians) * 112;

            // Radial orientation: labels point outward (top half) or inward (bottom half),
            // always readable — avoids tangential overlap at high seed counts.
            const labelRotation = angle <= 180 ? angle - 90 : angle + 90;

            const label =
              option.length > maxChars
                ? `${option.slice(0, maxChars - 1)}…`
                : option;

            return (
              <g key={`${option}-${index}`}>
                <line
                  x1="160"
                  y1="160"
                  x2={160 + Math.cos(radians) * 148}
                  y2={160 + Math.sin(radians) * 148}
                  className="stroke-border"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground font-semibold"
                  style={{ fontSize: `${fontSize}px` }}
                  transform={`rotate(${labelRotation}, ${x}, ${y})`}
                >
                  {label}
                </text>
              </g>
            );
          })}
          <circle cx="160" cy="160" r="42" className="fill-background stroke-primary" strokeWidth="3" />
          <text x="160" y="155" textAnchor="middle" className="fill-foreground text-[14px] font-bold">
            {options.length}
          </text>
          <text x="160" y="174" textAnchor="middle" className="fill-muted-foreground text-[10px]">
            pozostało
          </text>
        </g>
      </svg>
      {options.length > 32 && (
        <Badge variant="secondary" className="absolute bottom-2 left-1/2 -translate-x-1/2">
          Pokazano 32 z {options.length}
        </Badge>
      )}
    </div>
  );
}

function PlacementPreview({ state }: { state: SeedingCeremonyState }) {
  const revealed = revealedCeremonyDraws(state);
  const grouped = useMemo(() => {
    const map = new Map<string, SeedingCeremonyDraw[]>();
    for (const draw of revealed) {
      const key =
        draw.placement.kind === "group"
          ? `Grupa ${draw.placement.groupKey}`
          : draw.placement.kind === "bracket"
            ? `Mecz ${draw.placement.matchNumber}`
            : "Kolejność seedów";
      const rows = map.get(key) ?? [];
      rows.push(draw);
      map.set(key, rows);
    }
    return [...map.entries()];
  }, [revealed]);

  if (revealed.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Po każdym losie zawodnik pojawi się tutaj w swoim seedzie, grupie albo slocie drabinki.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {grouped.map(([label, draws]) => (
        <div key={label} className="rounded-lg border bg-card p-3">
          <h4 className="mb-2 text-sm font-semibold">{label}</h4>
          <div className="space-y-2">
            {[...draws]
              .sort((a, b) => a.seed - b.seed)
              .map((draw) => (
                <div
                  key={draw.playerId}
                  className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
                >
                  <Badge variant="secondary">#{draw.seed}</Badge>
                  <span className="min-w-0 flex-1 truncate font-medium">{draw.playerName}</span>
                  <span className="text-xs text-muted-foreground">{draw.placement.label}</span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CeremonyBody({
  state,
  currentDraw,
  rotation,
  spinning,
  pendingDraw,
  animDuration,
}: {
  state: SeedingCeremonyState;
  currentDraw: SeedingCeremonyDraw | null;
  rotation: number;
  spinning: boolean;
  pendingDraw: SeedingCeremonyDraw | null;
  animDuration: number;
}) {
  const revealed = revealedCeremonyDraws(state);
  const options = visibleWheelDraws(state, pendingDraw?.drawNumber).map((draw) =>
    drawResultLabel(draw, state.drawMode),
  );
  const progress =
    state.draws.length === 0 ? 0 : (state.revealedCount / state.draws.length) * 100;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,360px)_1fr] lg:items-center">
        <Wheel
          options={options}
          rotation={rotation}
          spinning={spinning}
          animDuration={animDuration}
        />
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span>
                {state.revealedCount} z {state.draws.length} ujawnionych
              </span>
              <Badge>{statusLabel(state)}</Badge>
            </div>
            <Progress value={progress} />
          </div>
          <div
            className="rounded-xl border bg-muted/30 p-5 text-center"
            aria-live="polite"
          >
            {spinning ? (
              <>
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
                <p className="font-semibold">Koło się obraca…</p>
              </>
            ) : currentDraw ? (
              <>
                <Sparkles className="mx-auto mb-2 h-7 w-7 text-primary" />
                <p className="text-lg font-bold">{currentDraw.playerName}</p>
                <p className="mt-1 text-base">{drawResultLabel(currentDraw, state.drawMode)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentDraw.placement.label}
                </p>
              </>
            ) : (
              <>
                <Dices className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                <p className="font-semibold">Oczekiwanie na kolejny los</p>
              </>
            )}
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {[...revealed].reverse().map((draw) => (
              <div
                key={draw.drawNumber}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  <strong>{draw.drawNumber}.</strong> {draw.playerName}
                </span>
                <span className="text-right text-xs text-muted-foreground">
                  Seed {draw.seed} · {draw.placement.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h4 className="mb-3 font-semibold">Rozmieszczenie na żywo</h4>
        <PlacementPreview state={state} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SeedingCeremony({
  tournamentId,
  stage,
  canManage,
  audience = false,
  onStateChange,
}: SeedingCeremonyProps) {
  const [state, setState] = useState<SeedingCeremonyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [error, setError] = useState<string>();
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [currentDraw, setCurrentDraw] = useState<SeedingCeremonyDraw | null>(null);
  const [pendingDraw, setPendingDraw] = useState<SeedingCeremonyDraw | null>(null);

  // Current animation params (sampled fresh before each spin)
  const [animDuration, setAnimDuration] = useState(5.0);

  // Animation settings — persisted to localStorage
  const [animSettings, setAnimSettingsRaw] = useState<AnimSettings>(loadAnimSettings);
  const setAnimSettings = useCallback((next: AnimSettings) => {
    setAnimSettingsRaw(next);
    saveAnimSettings(next);
  }, []);

  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinningRef = useRef(false);

  const applyState = useCallback(
    (next: SeedingCeremonyState | null) => {
      setState(next);
      onStateChange?.(next);
    },
    [onStateChange],
  );

  const reload = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const next = await fetchSeedingCeremony(tournamentId, stage.id);
        if (!spinningRef.current) {
          applyState(next);
          setCurrentDraw(
            next && next.revealedCount > 0 ? next.draws[next.revealedCount - 1] : null,
          );
          setPendingDraw(null);
        }
        setError(undefined);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [applyState, stage.id, tournamentId],
  );

  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(
    () => () => {
      if (animationTimer.current) clearTimeout(animationTimer.current);
      if (autoTimer.current) clearTimeout(autoTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (stage.status !== "planned" || spinning) return;
    const timer = setInterval(() => void reload(true), audience ? 2000 : 5000);
    return () => clearInterval(timer);
  }, [audience, reload, spinning, stage.status]);

  const prepare = async () => {
    setActing(true);
    setError(undefined);
    try {
      const next = await prepareSeedingCeremony(tournamentId, stage.id);
      applyState(next);
      setCurrentDraw(next.revealedCount > 0 ? next.draws[next.revealedCount - 1] : null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActing(false);
    }
  };

  const revealNext = useCallback(async () => {
    if (!state || spinning || state.revealedCount >= state.draws.length) return;
    setActing(true);
    setError(undefined);
    try {
      const next = await revealNextSeedingDraw(tournamentId, stage.id);
      const draw = next.draws[next.revealedCount - 1] ?? null;

      // Sample animation params — purely visual, result is already determined by server
      const dur = sampleDuration(animSettings);
      const speed = sampleSpeed(animSettings);
      const turns = Math.max(3, Math.round(4 * speed));

      const visible = visibleWheelDraws(state, draw?.drawNumber);
      const optionCount = Math.max(1, visible.length);
      const optionIndex = visible.findIndex(
        (candidate) => candidate.drawNumber === draw?.drawNumber,
      );
      const landingOffset = optionIndex < 0 ? 0 : (360 / optionCount) * optionIndex;

      // Apply all animation state atomically (React batches these)
      setAnimDuration(dur);
      spinningRef.current = true;
      setSpinning(true);
      setPendingDraw(draw);
      setRotation((value) => value + turns * 360 + (360 - landingOffset));

      animationTimer.current = setTimeout(
        () => {
          applyState(next);
          setCurrentDraw(draw);
          setPendingDraw(null);
          spinningRef.current = false;
          setSpinning(false);
          setActing(false);
        },
        Math.round(dur * 1000) + 100,
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      spinningRef.current = false;
      setSpinning(false);
      setPendingDraw(null);
      setActing(false);
      setAutoPlay(false);
    }
  }, [animSettings, applyState, spinning, stage.id, state, tournamentId]);

  useEffect(() => {
    if (!autoPlay || spinning || acting || !state || state.revealedCount >= state.draws.length)
      return;
    autoTimer.current = setTimeout(() => void revealNext(), 650);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [acting, autoPlay, revealNext, spinning, state]);

  useEffect(() => {
    if (state && state.revealedCount >= state.draws.length) setAutoPlay(false);
  }, [state]);

  const revealAll = async () => {
    if (!state) return;
    setActing(true);
    setAutoPlay(false);
    setError(undefined);
    try {
      const next = await revealAllSeedingDraws(tournamentId, stage.id);
      applyState(next);
      setCurrentDraw(next.draws[next.draws.length - 1] ?? null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActing(false);
    }
  };

  const reset = async () => {
    setActing(true);
    setAutoPlay(false);
    setError(undefined);
    try {
      await resetSeedingCeremony(tournamentId, stage.id);
      applyState(null);
      setCurrentDraw(null);
      setPendingDraw(null);
      setRotation(0);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActing(false);
    }
  };

  if (!stageHasRandomCeremony(stage)) return null;
  if (!loading && !state && stage.status !== "planned") return null;
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie losowania…
        </CardContent>
      </Card>
    );
  }

  const controls = canManage && stage.status === "planned";
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Dices className="h-5 w-5 text-primary" /> Ceremonia losowania
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Wynik jest wyliczony deterministycznie na serwerze. Koło wyłącznie ujawnia zapisane
              przydziały.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canManage && (
              <Button
                type="button"
                variant={showSettings ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowSettings((v) => !v)}
                aria-label="Ustawienia animacji"
                title="Ustawienia animacji"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {state && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPresentationOpen(true)}
              >
                <Maximize2 className="mr-2 h-4 w-4" /> Prezentacja
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {showSettings && canManage && (
            <AnimSettingsPanel settings={animSettings} onChange={setAnimSettings} />
          )}

          {!state ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="font-medium">Losowanie nie zostało jeszcze przygotowane.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Przygotowanie zapisze wszystkie wyniki i pozwoli bezpiecznie wznowić ceremonię po
                odświeżeniu strony.
              </p>
              {controls && (
                <Button className="mt-4" type="button" onClick={prepare} disabled={acting}>
                  {acting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Dices className="mr-2 h-4 w-4" />
                  )}
                  Przygotuj losowanie
                </Button>
              )}
            </div>
          ) : (
            <>
              <CeremonyBody
                state={state}
                currentDraw={currentDraw}
                rotation={rotation}
                spinning={spinning}
                pendingDraw={pendingDraw}
                animDuration={animDuration}
              />
              {controls && state.status !== "applied" && (
                <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                  {state.revealedCount < state.draws.length && (
                    <Button
                      type="button"
                      onClick={() => void revealNext()}
                      disabled={acting || spinning}
                    >
                      {spinning ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      Losuj następnego
                    </Button>
                  )}
                  {state.revealedCount < state.draws.length && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setAutoPlay((value) => !value)}
                      disabled={spinning && !autoPlay}
                    >
                      {autoPlay ? (
                        <Pause className="mr-2 h-4 w-4" />
                      ) : (
                        <RefreshCcw className="mr-2 h-4 w-4" />
                      )}
                      {autoPlay ? "Pauza" : "Losuj automatycznie"}
                    </Button>
                  )}
                  {state.revealedCount < state.draws.length && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={revealAll}
                      disabled={acting || spinning}
                    >
                      <FastForward className="mr-2 h-4 w-4" /> Pomiń animację
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={reset}
                    disabled={acting || spinning}
                    className="ml-auto"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Resetuj
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={presentationOpen} onOpenChange={setPresentationOpen}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Losowanie — {stage.name}</DialogTitle>
            <DialogDescription>
              Widok prezentacyjny może być pokazany uczestnikom lub publiczności.
            </DialogDescription>
          </DialogHeader>
          {state && (
            <CeremonyBody
              state={state}
              currentDraw={currentDraw}
              rotation={rotation}
              spinning={spinning}
              pendingDraw={pendingDraw}
              animDuration={animDuration}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
