import { t, stageLabel } from "@/i18n";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DrawPresenter, TOURNAMENT_PRESENTERS, Wheel, loadPresenter, savePresenter, usePrefersReducedMotion, type PresenterId } from "@/components/draw-presenters";
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

import {
  ANIM_DEFAULTS,
  loadAnimSettings,
  normalizeAnimSettings,
  sampleDuration,
  sampleSpeed,
  saveAnimSettings,
  type AnimSettings,
} from "@/lib/seeding-animation-settings";

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
      <p className="font-semibold">{t("seedingCeremony.animacja_losowania")}</p>

      {/* ── Duration section ── */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("seedingCeremony.czas")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={settings.durationMode}
            onValueChange={(v) => up({ durationMode: v as "fixed" | "random" })}
          >
            <SelectTrigger className="h-7 w-24 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">{t("seedingCeremony.staly")}</SelectItem>
              <SelectItem value="random">{t("seedingCeremony.losowy")}</SelectItem>
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
              {t("seedingCeremony.dodatkowy_rzadszy_wariant")}</Label>
          </div>
          {settings.durationLongEnabled && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>{t("seedingCeremony.szansa")}</span>
                <NumInput
                  value={settings.durationLongChance}
                  min={1} max={99} step={5} suffix="%"
                  onChange={(n) => up({ durationLongChance: n })}
                />
              </div>
              <div className="flex items-center gap-1">
                <span>{t("seedingCeremony.zakres")}</span>
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
          {t("seedingCeremony.predkosc_obrotu")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={settings.speedMode}
            onValueChange={(v) => up({ speedMode: v as "fixed" | "random" })}
          >
            <SelectTrigger className="h-7 w-24 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">{t("seedingCeremony.stala")}</SelectItem>
              <SelectItem value="random">{t("seedingCeremony.losowa")}</SelectItem>
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
          {t("seedingCeremony.mnoznik_predkosci_1_4_pelne")}</p>

        {/* Speed alt variant */}
        <div className="ml-3 border-l pl-3 space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={settings.speedAltEnabled}
              onCheckedChange={(v) => up({ speedAltEnabled: v })}
              id="speed-alt-switch"
            />
            <Label htmlFor="speed-alt-switch" className="text-sm cursor-pointer">
              {t("seedingCeremony.dodatkowy_rzadszy_wariant")}</Label>
          </div>
          {settings.speedAltEnabled && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>{t("seedingCeremony.szansa")}</span>
                <NumInput
                  value={settings.speedAltChance}
                  min={1} max={99} step={5} suffix="%"
                  onChange={(n) => up({ speedAltChance: n })}
                />
              </div>
              <div className="flex items-center gap-1">
                <span>{t("seedingCeremony.zakres")}</span>
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
          {t("seedingCeremony.czas_i_predkosc_sa_losowane")}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onChange({ ...ANIM_DEFAULTS })}
        >
          {t("seedingCeremony.przywroc_domyslne")}</Button>
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
    case "prepared": return t("seedingCeremony.gotowe_do_rozpoczecia");
    case "in_progress": return t("seedingCeremony.losowanie_w_toku");
    case "completed": return t("seedingCeremony.losowanie_zakonczone");
    case "applied": return t("seedingCeremony.wynik_zastosowany");
    default: return t("seedingCeremony.nieznany_stan");
  }
}

function PlacementPreview({ state }: { state: SeedingCeremonyState }) {
  const revealed = revealedCeremonyDraws(state);
  const grouped = useMemo(() => {
    const map = new Map<string, SeedingCeremonyDraw[]>();
    for (const draw of revealed) {
      const key =
        draw.placement.kind === "group"
          ? t("seedingCeremony.grupa_groupkey", { groupKey: draw.placement.groupKey })
          : draw.placement.kind === "bracket"
            ? t("seedingCeremony.mecz_matchnumber", { matchNumber: draw.placement.matchNumber })
            : t("seedingCeremony.kolejnosc_seedow");
      const rows = map.get(key) ?? [];
      rows.push(draw);
      map.set(key, rows);
    }
    return [...map.entries()];
  }, [revealed]);

  if (revealed.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {t("seedingCeremony.po_kazdym_losie_zawodnik_pojawi")}</div>
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
  presenter = "kolo",
}: {
  state: SeedingCeremonyState;
  currentDraw: SeedingCeremonyDraw | null;
  rotation: number;
  spinning: boolean;
  pendingDraw: SeedingCeremonyDraw | null;
  animDuration: number;
  presenter?: PresenterId;
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
        {presenter === "kolo" ? (
          <Wheel
            options={options}
            rotation={rotation}
            spinning={spinning}
            animDuration={animDuration}
          />
        ) : (() => {
          // #324-L01-B: every presenter shows the result the server already stored (the pending or the last revealed draw)
          const shown = spinning ? pendingDraw : currentDraw;
          const target = shown ? drawResultLabel(shown, state.drawMode) : null;
          const pool = target && !options.includes(target) ? [...options, target] : options;
          return (
            <DrawPresenter id={presenter} frame={{ pool, target, subject: shown?.playerName ?? null, running: spinning,
              durationMs: Math.round(animDuration * 1000), drawKey: shown?.drawNumber ?? 0 }} />
          );
        })()}
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span>
                {state.revealedCount}{" "}{t("i18n.word.of")}{" "}{state.draws.length} {t("seedingCeremony.ujawnionych")}</span>
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
                <p className="font-semibold">{presenter === "kolo" ? t("seedingCeremony.kolo_sie_obraca") : t("seedingCeremony.losowanie")}</p>
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
                <p className="font-semibold">{t("seedingCeremony.oczekiwanie_na_kolejny_los")}</p>
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
                  {t("seedingCeremony.seed")}{" "}{draw.seed} · {draw.placement.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h4 className="mb-3 font-semibold">{t("seedingCeremony.rozmieszczenie_na_zywo")}</h4>
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
    const normalized = normalizeAnimSettings(next);
    setAnimSettingsRaw(normalized);
    saveAnimSettings(normalized);
  }, []);

  // #324-L01-B: how the stored result is shown — a browser preference that never touches the draw
  const [presenter, setPresenterRaw] = useState<PresenterId>(() => loadPresenter());
  const setPresenter = useCallback((id: PresenterId) => { setPresenterRaw(id); savePresenter(id); }, []);
  const reducedMotion = usePrefersReducedMotion();
  const finishSpin = useRef<(() => void) | null>(null);

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
      const next = await revealNextSeedingDraw(tournamentId, stage.id, state.revealedCount);
      const draw = next.draws[next.revealedCount - 1] ?? null;

      // Sample animation params — purely visual, result is already determined by server
      const dur = presenter === "szybko" || reducedMotion ? 0.3 : sampleDuration(animSettings);
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

      const complete = () => {
        finishSpin.current = null;
        if (animationTimer.current) clearTimeout(animationTimer.current);
        applyState(next);
        setCurrentDraw(draw);
        setPendingDraw(null);
        spinningRef.current = false;
        setSpinning(false);
        setActing(false);
      };
      finishSpin.current = complete;
      animationTimer.current = setTimeout(complete, Math.round(dur * 1000) + 100);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      spinningRef.current = false;
      setSpinning(false);
      setPendingDraw(null);
      setActing(false);
      setAutoPlay(false);
    }
  }, [animSettings, applyState, presenter, reducedMotion, spinning, stage.id, state, tournamentId]);

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
      const next = await revealAllSeedingDraws(tournamentId, stage.id, state?.revealedCount);
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
          <Loader2 className="h-4 w-4 animate-spin" /> {t("seedingCeremony.ladowanie_losowania")}</CardContent>
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
              <Dices className="h-5 w-5 text-primary" /> {t("seedingCeremony.ceremonia_losowania")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("seedingCeremony.wynik_jest_wyliczony_deterministycznie_n")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canManage && (
              <Button
                type="button"
                variant={showSettings ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowSettings((v) => !v)}
                aria-label={t("seedingCeremony.ustawienia_animacji")}
                title={t("seedingCeremony.ustawienia_animacji")}
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
                <Maximize2 className="mr-2 h-4 w-4" /> {t("seedingCeremony.prezentacja")}</Button>
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
              <p className="font-medium">{t("seedingCeremony.losowanie_nie_zostalo_jeszcze_przygotowa")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("seedingCeremony.przygotowanie_zapisze_wszystkie_wyniki_i")}</p>
              {controls && (
                <Button className="mt-4" type="button" onClick={prepare} disabled={acting}>
                  {acting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Dices className="mr-2 h-4 w-4" />
                  )}
                  {t("seedingCeremony.przygotuj_losowanie")}</Button>
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
                presenter={presenter}
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
                      {t("seedingCeremony.losuj_nastepnego")}</Button>
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
                      {autoPlay ? t("seedingCeremony.pauza") : t("seedingCeremony.losuj_automatycznie")}
                    </Button>
                  )}
                  {spinning && (
                    // #324-L01-B: the result is already stored — stop the animation and show it now
                    <Button type="button" variant="secondary" onClick={() => finishSpin.current?.()} data-testid="ceremony-show-now">
                      <FastForward className="mr-2 h-4 w-4" /> {t("seedingCeremony.pokaz_wynik_od_razu")}</Button>
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{t("seedingCeremony.prezentacja")}</span>
                    <select className="min-h-9 rounded-md border bg-background px-2" value={presenter} disabled={spinning}
                      onChange={(event) => setPresenter(event.target.value as PresenterId)} aria-label={t("seedingCeremony.prezentacja_losowania")}>
                      {TOURNAMENT_PRESENTERS.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}{option.status === "STABLE_CANDIDATE" ? t("seedingCeremony.nowa") : ""}</option>
                      ))}
                    </select>
                  </label>
                  {state.revealedCount < state.draws.length && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={revealAll}
                      disabled={acting || spinning}
                    >
                      <FastForward className="mr-2 h-4 w-4" /> {t("seedingCeremony.pomin_animacje")}</Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={reset}
                    disabled={acting || spinning}
                    className="ml-auto"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> {t("seedingCeremony.resetuj")}</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={presentationOpen} onOpenChange={setPresentationOpen}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("seedingCeremony.losowanie_2")}{" "}{stageLabel(stage.name)}</DialogTitle>
            <DialogDescription>
              {t("seedingCeremony.widok_prezentacyjny_moze_byc_pokazany")}</DialogDescription>
          </DialogHeader>
          {state && (
            <CeremonyBody
              state={state}
              currentDraw={currentDraw}
              rotation={rotation}
              spinning={spinning}
              pendingDraw={pendingDraw}
              animDuration={animDuration}
              presenter={presenter}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
