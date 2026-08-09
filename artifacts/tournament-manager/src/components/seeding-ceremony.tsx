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
import { Progress } from "@/components/ui/progress";
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
}: {
  options: string[];
  rotation: number;
  spinning: boolean;
}) {
  const visible = options.slice(0, 32);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[360px]" aria-label={`Koło losowania, pozostało ${options.length} wyników`}>
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1 border-x-[12px] border-t-[22px] border-x-transparent border-t-primary" />
      <svg viewBox="0 0 320 320" className="h-full w-full drop-shadow-sm" role="img" aria-label="Animowane koło dostępnych wyników">
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "160px 160px",
            transition: spinning ? "transform 1.65s cubic-bezier(.12,.7,.08,1)" : "none",
          }}
        >
          <circle cx="160" cy="160" r="148" className="fill-muted stroke-border" strokeWidth="2" />
          {visible.map((option, index) => {
            const angle = (360 / Math.max(visible.length, 1)) * index;
            const radians = ((angle - 90) * Math.PI) / 180;
            const x = 160 + Math.cos(radians) * 112;
            const y = 160 + Math.sin(radians) * 112;
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
                  className="fill-foreground text-[11px] font-semibold"
                  transform={`rotate(${angle}, ${x}, ${y})`}
                >
                  {option.length > 12 ? `${option.slice(0, 11)}…` : option}
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
      const key = draw.placement.kind === "group"
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
                <div key={draw.playerId} className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
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
}: {
  state: SeedingCeremonyState;
  currentDraw: SeedingCeremonyDraw | null;
  rotation: number;
  spinning: boolean;
  pendingDraw: SeedingCeremonyDraw | null;
}) {
  const revealed = revealedCeremonyDraws(state);
  const options = visibleWheelDraws(state, pendingDraw?.drawNumber)
    .map((draw) => drawResultLabel(draw, state.drawMode));
  const progress = state.draws.length === 0 ? 0 : (state.revealedCount / state.draws.length) * 100;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,360px)_1fr] lg:items-center">
        <Wheel options={options} rotation={rotation} spinning={spinning} />
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span>{state.revealedCount} z {state.draws.length} ujawnionych</span>
              <Badge>{statusLabel(state)}</Badge>
            </div>
            <Progress value={progress} />
          </div>
          <div className="rounded-xl border bg-muted/30 p-5 text-center" aria-live="polite">
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
                <p className="mt-1 text-sm text-muted-foreground">{currentDraw.placement.label}</p>
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
              <div key={draw.drawNumber} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span><strong>{draw.drawNumber}.</strong> {draw.playerName}</span>
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
  const [rotation, setRotation] = useState(0);
  const [currentDraw, setCurrentDraw] = useState<SeedingCeremonyDraw | null>(null);
  const [pendingDraw, setPendingDraw] = useState<SeedingCeremonyDraw | null>(null);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinningRef = useRef(false);

  const applyState = useCallback((next: SeedingCeremonyState | null) => {
    setState(next);
    onStateChange?.(next);
  }, [onStateChange]);

  const reload = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const next = await fetchSeedingCeremony(tournamentId, stage.id);
      if (!spinningRef.current) {
        applyState(next);
        setCurrentDraw(next && next.revealedCount > 0 ? next.draws[next.revealedCount - 1] : null);
        setPendingDraw(null);
      }
      setError(undefined);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [applyState, stage.id, tournamentId]);

  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => () => {
    if (animationTimer.current) clearTimeout(animationTimer.current);
    if (autoTimer.current) clearTimeout(autoTimer.current);
  }, []);

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
      spinningRef.current = true;
      setSpinning(true);
      setPendingDraw(draw);
      const visible = visibleWheelDraws(state, draw?.drawNumber);
      const optionCount = Math.max(1, visible.length);
      const optionIndex = visible.findIndex((candidate) => candidate.drawNumber === draw?.drawNumber);
      const landingOffset = optionIndex < 0 ? 0 : (360 / optionCount) * optionIndex;
      setRotation((value) => value + 1440 + (360 - landingOffset));
      animationTimer.current = setTimeout(() => {
        applyState(next);
        setCurrentDraw(draw);
        setPendingDraw(null);
        spinningRef.current = false;
        setSpinning(false);
        setActing(false);
      }, 1700);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      spinningRef.current = false;
      setSpinning(false);
      setPendingDraw(null);
      setActing(false);
      setAutoPlay(false);
    }
  }, [applyState, spinning, stage.id, state, tournamentId]);

  useEffect(() => {
    if (!autoPlay || spinning || acting || !state || state.revealedCount >= state.draws.length) return;
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
              Wynik jest wyliczony deterministycznie na serwerze. Koło wyłącznie ujawnia zapisane przydziały.
            </p>
          </div>
          {state && (
            <Button type="button" variant="outline" size="sm" onClick={() => setPresentationOpen(true)}>
              <Maximize2 className="mr-2 h-4 w-4" /> Prezentacja
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {!state ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="font-medium">Losowanie nie zostało jeszcze przygotowane.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Przygotowanie zapisze wszystkie wyniki i pozwoli bezpiecznie wznowić ceremonię po odświeżeniu strony.
              </p>
              {controls && (
                <Button className="mt-4" type="button" onClick={prepare} disabled={acting}>
                  {acting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Dices className="mr-2 h-4 w-4" />}
                  Przygotuj losowanie
                </Button>
              )}
            </div>
          ) : (
            <>
              <CeremonyBody state={state} currentDraw={currentDraw} rotation={rotation} spinning={spinning} pendingDraw={pendingDraw} />
              {controls && state.status !== "applied" && (
                <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                  {state.revealedCount < state.draws.length && (
                    <Button type="button" onClick={() => void revealNext()} disabled={acting || spinning}>
                      {spinning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                      Losuj następnego
                    </Button>
                  )}
                  {state.revealedCount < state.draws.length && (
                    <Button type="button" variant="secondary" onClick={() => setAutoPlay((value) => !value)} disabled={spinning && !autoPlay}>
                      {autoPlay ? <Pause className="mr-2 h-4 w-4" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                      {autoPlay ? "Pauza" : "Losuj automatycznie"}
                    </Button>
                  )}
                  {state.revealedCount < state.draws.length && (
                    <Button type="button" variant="outline" onClick={revealAll} disabled={acting || spinning}>
                      <FastForward className="mr-2 h-4 w-4" /> Pomiń animację
                    </Button>
                  )}
                  <Button type="button" variant="ghost" onClick={reset} disabled={acting || spinning} className="ml-auto">
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
          {state && <CeremonyBody state={state} currentDraw={currentDraw} rotation={rotation} spinning={spinning} pendingDraw={pendingDraw} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
