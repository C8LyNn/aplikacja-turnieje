import { ReadQueryState } from "@/components/read-query-state";
import { configurationErrorFeedback, configurationProblemMessage, type ConfigurationProblem } from "@/lib/stage-configuration-feedback";
import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Lock,
  Settings2,
  AlertTriangle,
  Plus,
  X,
  Save,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetTournamentStageBaskets,
  useUpdateTournamentStageBaskets,
  useListTournamentStages,
  useListPlayers,
  getGetTournamentStageBasketsQueryKey,
  type StageBasket,
  type StageBasketRoute,
  type TournamentStage,
  type Player,
} from "@workspace/api-client-react";
import {
  deriveStageBasketFlowCounts,
  type StageBasketFlowCounts,
} from "@workspace/stage-basket-flow";

// ─── color palette ──────────────────────────────────────────────────────────

export const BASKET_COLOR_DEFS: {
  id: string;
  label: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
}[] = [
  { id: "blue",   label: "Niebieski",     bg: "bg-blue-500/20",   border: "border-blue-500/50",   text: "text-blue-400",   dot: "bg-blue-400"   },
  { id: "red",    label: "Czerwony",      bg: "bg-red-500/20",    border: "border-red-500/50",    text: "text-red-400",    dot: "bg-red-400"    },
  { id: "green",  label: "Zielony",       bg: "bg-green-500/20",  border: "border-green-500/50",  text: "text-green-400",  dot: "bg-green-400"  },
  { id: "yellow", label: "Żółty",         bg: "bg-yellow-500/20", border: "border-yellow-500/50", text: "text-yellow-400", dot: "bg-yellow-400" },
  { id: "purple", label: "Fioletowy",     bg: "bg-purple-500/20", border: "border-purple-500/50", text: "text-purple-400", dot: "bg-purple-400" },
  { id: "orange", label: "Pomarańczowy",  bg: "bg-orange-500/20", border: "border-orange-500/50", text: "text-orange-400", dot: "bg-orange-400" },
];

const NEUTRAL_STYLE = {
  bg: "bg-muted/40", border: "border-border", text: "text-muted-foreground", dot: "bg-muted-foreground",
};

export function getColorStyle(colorId: string | null) {
  return BASKET_COLOR_DEFS.find((c) => c.id === colorId) ?? NEUTRAL_STYLE;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const ORDINAL_LABELS = ["A", "B", "C", "D"] as const;

export function ordinalLabel(ordinal: number): string {
  return ORDINAL_LABELS[(ordinal - 1) % 4] ?? String(ordinal);
}

export function basketLabel(type: string, ordinal: number): string {
  return type === "input"
    ? `Wejście ${ordinalLabel(ordinal)}`
    : `Wyjście ${ordinalLabel(ordinal)}`;
}

/** Returns the first ordinal in 1–4 not already present in the list. */
export function firstFreeOrdinal(existingOrdinals: number[]): number {
  for (let i = 1; i <= 4; i++) {
    if (!existingOrdinals.includes(i)) return i;
  }
  return existingOrdinals.length + 1; // fallback beyond 4
}

/**
 * Generates a basket ID that is:
 *  - lowercase alphanumeric + dots (valid pattern ^[a-z0-9][a-z0-9._:-]{0,99}$)
 *  - not already in existingIds (safe after partial deletes)
 *  - not exposed to the user
 */
export function generateBasketId(
  stageId: number,
  type: "input" | "output",
  existingIds: Set<string>,
): string {
  const prefix = `st${stageId}${type === "input" ? "in" : "out"}`;
  for (let n = 1; n <= 9; n++) {
    const id = `${prefix}${n}`;
    if (!existingIds.has(id)) return id;
  }
  // Fallback: append timestamp base-36 suffix — still valid per pattern
  return `${prefix}.${Date.now().toString(36).slice(-6)}`;
}

/**
 * Toggles a player's membership in the given input basket.
 * When adding: removes the player from any OTHER basket within the SAME stage
 * (backend forbids duplicates within a stage), but leaves other stages intact.
 * When removing: just removes from this basket.
 */
export function toggleParticipantInBasket(
  baskets: StageBasket[],
  basketId: string,
  playerId: number,
): StageBasket[] {
  const idx = baskets.findIndex((b) => b.id === basketId);
  if (idx < 0) return baskets;
  const basket = baskets[idx];
  const targetStageId = basket.stageId;
  const already = basket.participantIds.includes(playerId);

  if (already) {
    return baskets.map((b, i) =>
      i === idx ? { ...b, participantIds: b.participantIds.filter((id) => id !== playerId) } : b,
    );
  }
  // Add to target basket; remove from other baskets of the SAME stage only
  return baskets.map((b, i) =>
    i === idx
      ? { ...b, participantIds: [...b.participantIds, playerId] }
      : b.stageId === targetStageId
      ? { ...b, participantIds: b.participantIds.filter((id) => id !== playerId) }
      : b,
  );
}

function newRouteId(sourceBasketId: string, targetBasketId: string): string {
  // Sanitize for the pattern ^[a-z0-9][a-z0-9._:-]{0,99}$
  const src = sourceBasketId.replace(/[^a-z0-9._:-]/g, "").slice(0, 30);
  const tgt = targetBasketId.replace(/[^a-z0-9._:-]/g, "").slice(0, 30);
  const raw = `r.${src}.${tgt}`;
  return raw.slice(0, 100);
}

// ─── BasketCard ──────────────────────────────────────────────────────────────

interface BasketCardProps {
  basket: StageBasket;
  playerMap: Map<number, string>;
  isAdvanced: boolean;
  isLocked: boolean;
  canRemove: boolean;
  onColorChange?: (basketId: string, colorId: string | null) => void;
  onQualifierCountChange?: (basketId: string, qualifierCount: number | null) => void;
  onRemove?: (basketId: string) => void;
  onToggleParticipant?: (basketId: string, playerId: number) => void;
  availablePlayers?: Player[];
  isRouteSource?: boolean;
  isRouteTarget?: boolean;
  onSelectAsRouteSource?: (basketId: string) => void;
  onCompleteRoute?: (targetBasketId: string) => void;
}

export function BasketCard({
  basket,
  playerMap,
  isAdvanced,
  isLocked,
  canRemove,
  onColorChange,
  onQualifierCountChange,
  onRemove,
  onToggleParticipant,
  availablePlayers = [],
  isRouteSource = false,
  isRouteTarget = false,
  onSelectAsRouteSource,
  onCompleteRoute,
}: BasketCardProps) {
  const [showColors, setShowColors] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const color = getColorStyle(basket.colorId);
  const label = basketLabel(basket.type, basket.ordinal);
  const assignedNames = basket.participantIds.map((id) => playerMap.get(id) ?? `#${id}`);

  function handleCardClick() {
    if (!isAdvanced || isLocked) return;
    if (basket.type === "output" && onSelectAsRouteSource) {
      onSelectAsRouteSource(basket.id);
    } else if (isRouteTarget && onCompleteRoute) {
      onCompleteRoute(basket.id);
    }
  }

  const borderExtra = isRouteSource
    ? "ring-2 ring-primary ring-offset-1"
    : isRouteTarget
    ? "ring-2 ring-green-400 ring-offset-1 cursor-pointer"
    : "";

  return (
    <div
      className={`organizer-basket rounded-md border px-3 py-2 text-sm space-y-2 ${color.bg} ${color.border} ${borderExtra} transition-all`}
      data-testid={`basket-${basket.id}`}
      onClick={handleCardClick}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          {basket.colorId && (
            <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} aria-hidden />
          )}
          <span className={color.text}>{label}</span>
        </div>
        {isAdvanced && !isLocked && (
          <div className="flex items-center gap-1">
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowColors((v) => !v); }}
              aria-label={`Zmień kolor koszyka ${label}`}
            >
              🎨
            </button>
            {canRemove && (
              <button
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                onClick={(e) => { e.stopPropagation(); onRemove?.(basket.id); }}
                aria-label={`Usuń koszyk ${label}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Color picker */}
      {showColors && isAdvanced && !isLocked && (
        <div className="flex flex-wrap gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
          <button
            className={`w-5 h-5 rounded-full border border-border bg-muted-foreground/40 hover:ring-2 hover:ring-primary`}
            title="Bez koloru"
            onClick={() => { onColorChange?.(basket.id, null); setShowColors(false); }}
          />
          {BASKET_COLOR_DEFS.map((c) => (
            <button
              key={c.id}
              className={`w-5 h-5 rounded-full ${c.dot} hover:ring-2 hover:ring-primary ${basket.colorId === c.id ? "ring-2 ring-primary" : ""}`}
              title={c.label}
              onClick={() => { onColorChange?.(basket.id, c.id); setShowColors(false); }}
            />
          ))}
        </div>
      )}

      {/* Qualifier count field — output baskets in advanced editable mode */}
      {basket.type === "output" && isAdvanced && !isLocked && (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <label className="text-xs text-muted-foreground shrink-0" htmlFor={`qc-${basket.id}`}>
            Przechodzi:
          </label>
          <input
            id={`qc-${basket.id}`}
            type="number"
            min={1}
            step={1}
            placeholder="—"
            value={basket.qualifierCount ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") { onQualifierCountChange?.(basket.id, null); return; }
              const n = parseInt(raw, 10);
              if (!isNaN(n) && n >= 1) onQualifierCountChange?.(basket.id, n);
            }}
            data-testid={`qualifier-count-${basket.id}`}
            className="w-14 text-xs rounded border border-border bg-background px-1.5 py-0.5 text-right"
          />
        </div>
      )}
      {/* Qualifier count readonly display */}
      {basket.type === "output" && (!isAdvanced || isLocked) && basket.qualifierCount !== null && (
        <div className="text-xs text-muted-foreground">
          Przechodzi: {basket.qualifierCount}
        </div>
      )}

      {/* Participants */}
      {basket.type === "input" && (
        <div className="text-xs text-muted-foreground">
          {assignedNames.length === 0
            ? "0 uczestników"
            : assignedNames.length === 1
            ? assignedNames[0]
            : `${assignedNames.length} uczestników`}
        </div>
      )}

      {/* Player assignment in advanced mode */}
      {basket.type === "input" && isAdvanced && !isLocked && availablePlayers.length > 0 && (
        <div>
          <button
            className="text-xs text-primary hover:underline"
            onClick={(e) => { e.stopPropagation(); setShowPlayers((v) => !v); }}
          >
            {showPlayers ? "Schowaj graczy" : "Przypisz graczy"}
          </button>
          {showPlayers && (
            <div className="mt-1 max-h-32 overflow-y-auto space-y-0.5 border border-border rounded p-1 bg-card">
              {availablePlayers.map((player) => {
                const assigned = basket.participantIds.includes(player.id);
                return (
                  <label
                    key={player.id}
                    className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-foreground py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={assigned}
                      onChange={() => onToggleParticipant?.(basket.id, player.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {player.name}
                    {player.seed != null && <span className="text-muted-foreground">#{player.seed}</span>}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── StageBlock ──────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Drabinka",
  double_elimination: "Podwójna eliminacja",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
  group_stage: "Faza grupowa",
};

interface StageBlockProps {
  stage: TournamentStage;
  inputBaskets: StageBasket[];
  outputBaskets: StageBasket[];
  playerMap: Map<number, string>;
  allPlayers: Player[];
  isAdvanced: boolean;
  isLocked: boolean;
  routeSourceId: string | null;
  routeTargetStageIds: Set<number>;
  explicitAuthority: boolean;
  flowCounts?: StageBasketFlowCounts;
  onColorChange?: (basketId: string, colorId: string | null) => void;
  onQualifierCountChange?: (basketId: string, qualifierCount: number | null) => void;
  onRemoveBasket?: (basketId: string) => void;
  onToggleParticipant?: (basketId: string, playerId: number) => void;
  onAddInput?: (stageId: number) => void;
  onAddOutput?: (stageId: number) => void;
  onSelectRouteSource?: (basketId: string) => void;
  onCompleteRoute?: (targetBasketId: string) => void;
}

export function StageBlock({
  stage,
  inputBaskets,
  outputBaskets,
  playerMap,
  allPlayers,
  isAdvanced,
  isLocked,
  routeSourceId,
  routeTargetStageIds,
  explicitAuthority,
  flowCounts,
  onColorChange,
  onQualifierCountChange,
  onRemoveBasket,
  onToggleParticipant,
  onAddInput,
  onAddOutput,
  onSelectRouteSource,
  onCompleteRoute,
}: StageBlockProps) {
  const formatLabel = FORMAT_LABELS[stage.format] ?? stage.format;
  const isTargetStage = routeTargetStageIds.has(stage.id);
  const participantCount = explicitAuthority
    ? (flowCounts?.derivedParticipantCount ?? 0)
    : stage.participantCount;

  // Players already assigned to any basket in this stage (to prevent double-assign)
  const assignedInStage = new Set(
    [...inputBaskets, ...outputBaskets].flatMap((b) => b.participantIds),
  );

  return (
    <div
      className="organizer-flow-stage rounded-lg border bg-card flex flex-col shrink-0"
      data-testid={`stage-block-${stage.id}`}
    >
      {/* Stage header */}
      <div className="organizer-flow-stage-header border-b bg-muted/30 rounded-t-lg">
        <div className="font-semibold text-sm">{stage.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{formatLabel}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{participantCount} uczestników</span>
        </div>
        {explicitAuthority && (
          <div
            className="mt-2 text-xs text-muted-foreground"
            data-testid={`stage-flow-summary-${stage.id}`}
          >
            Bezpośrednio: {flowCounts?.directParticipantCount ?? 0} · Z tras: {flowCounts?.incomingRouteQuota ?? 0} · Razem: {participantCount}
          </div>
        )}
      </div>

      {/* Baskets body */}
      <div className="organizer-flow-stage-body grid grid-cols-2 flex-1">
        {/* Inputs */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Wejścia</div>
          {inputBaskets
            .slice()
            .sort((a, b) => a.ordinal - b.ordinal)
            .map((basket) => (
              <BasketCard
                key={basket.id}
                basket={basket}
                playerMap={playerMap}
                isAdvanced={isAdvanced}
                isLocked={isLocked}
                canRemove={inputBaskets.length > 1}
                onColorChange={onColorChange}
                onRemove={onRemoveBasket}
                onToggleParticipant={onToggleParticipant}
                availablePlayers={allPlayers.filter(
                  (p) => basket.participantIds.includes(p.id) || !assignedInStage.has(p.id),
                )}
                isRouteTarget={isTargetStage && !!routeSourceId}
                onCompleteRoute={onCompleteRoute}
              />
            ))}
          {isAdvanced && !isLocked && inputBaskets.length < 4 && (
            <button
              className="w-full rounded border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary py-1 transition-colors"
              onClick={() => onAddInput?.(stage.id)}
              aria-label="Dodaj koszyk wejściowy"
            >
              <Plus className="w-3 h-3 inline mr-1" />Dodaj wejście
            </button>
          )}
        </div>

        {/* Outputs */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Wyjścia</div>
          {outputBaskets
            .slice()
            .sort((a, b) => a.ordinal - b.ordinal)
            .map((basket) => (
              <BasketCard
                key={basket.id}
                basket={basket}
                playerMap={playerMap}
                isAdvanced={isAdvanced}
                isLocked={isLocked}
                canRemove={outputBaskets.length > 1}
                onColorChange={onColorChange}
                onQualifierCountChange={onQualifierCountChange}
                onRemove={onRemoveBasket}
                onToggleParticipant={onToggleParticipant}
                availablePlayers={[]}
                isRouteSource={routeSourceId === basket.id}
                onSelectAsRouteSource={onSelectRouteSource}
              />
            ))}
          {isAdvanced && !isLocked && outputBaskets.length < 4 && (
            <button
              className="w-full rounded border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary py-1 transition-colors"
              onClick={() => onAddOutput?.(stage.id)}
              aria-label="Dodaj koszyk wyjściowy"
            >
              <Plus className="w-3 h-3 inline mr-1" />Dodaj wyjście
            </button>
          )}
        </div>
      </div>

      {/* Qualifier quota summary — only when any output basket has qualifierCount set */}
      {(() => {
        const quotas = outputBaskets
          .map((b) => b.qualifierCount)
          .filter((q): q is number => q !== null);
        if (quotas.length === 0) return null;
        const total = flowCounts?.outputQualifierCount ?? 0;
        const eliminated = participantCount - total;
        const overQuota = total > participantCount;
        return (
          <div
            className={`px-3 py-1.5 border-t text-xs flex items-center gap-2 rounded-b-lg ${
              overQuota
                ? "text-destructive bg-destructive/10 border-destructive/30"
                : "text-muted-foreground bg-muted/20 border-border"
            }`}
            data-testid={`quota-summary-${stage.id}`}
          >
            <span>Łącznie przechodzi: <strong className={overQuota ? "text-destructive" : ""}>{total} / {participantCount}</strong></span>
            {!overQuota && <span>· Odpada: {eliminated}</span>}
            {overQuota && <span className="text-destructive">— przekroczono limit!</span>}
          </div>
        );
      })()}
    </div>
  );
}

// ─── RouteConnector ──────────────────────────────────────────────────────────

interface RouteConnectorProps {
  routes: StageBasketRoute[];
  basketById: Map<string, StageBasket>;
  stageById: Map<number, TournamentStage>;
  isAdvanced: boolean;
  isLocked: boolean;
  onRemoveRoute?: (routeId: string) => void;
  /** Position of the left stage (source) in the stage order. */
  leftStagePosition: number;
}

export function RouteConnector({
  routes,
  basketById,
  stageById,
  isAdvanced,
  isLocked,
  onRemoveRoute,
  leftStagePosition,
}: RouteConnectorProps) {
  // Only show routes whose source basket belongs to a stage at leftStagePosition
  const relevant = routes.filter((r) => {
    const src = basketById.get(r.sourceBasketId);
    if (!src) return false;
    const stage = stageById.get(src.stageId);
    return stage?.position === leftStagePosition;
  });

  if (relevant.length === 0) {
    return (
      <div className="self-center shrink-0 px-3 text-xs text-muted-foreground">
        Brak połączeń
      </div>
    );
  }

  return (
    <div className="organizer-route-summary flex flex-col justify-center gap-2 self-center shrink-0" role="list" aria-label="Połączenia między etapami" data-testid="route-connector">
      {relevant.map((route) => {
        const src = basketById.get(route.sourceBasketId);
        const tgt = basketById.get(route.targetBasketId);
        const srcLabel = src ? basketLabel(src.type, src.ordinal) : route.sourceBasketId;
        const tgtBasketLabel = tgt ? basketLabel(tgt.type, tgt.ordinal) : route.targetBasketId;
        const srcColor = getColorStyle(src?.colorId ?? null);
        const tgtColor = getColorStyle(tgt?.colorId ?? null);

        // Detect skip-stage route: target stage is not the immediately adjacent one
        const srcStage = src ? stageById.get(src.stageId) : undefined;
        const tgtStage = tgt ? stageById.get(tgt.stageId) : undefined;
        const isSkipRoute =
          srcStage && tgtStage && tgtStage.position > srcStage.position + 1;
        // For skip routes show "Stage name / Basket label" so it's unambiguous
        const displayTgtLabel = isSkipRoute && tgtStage
          ? `${tgtStage.name} / ${tgtBasketLabel}`
          : tgtBasketLabel;

        return (
          <div key={route.id} role="listitem" aria-label={`${srcStage?.name ?? "Źródło"}: ${srcLabel} → ${tgtStage?.name ?? "Cel"}: ${tgtBasketLabel}`} className="rounded-lg border border-border bg-card p-2 text-sm" data-testid={`route-${route.id}`}>
            <div className="grid grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)] items-center gap-1">
              <div className={`min-w-0 rounded border p-1.5 ${srcColor.bg} ${srcColor.border}`}>
                <span className="block text-xs text-muted-foreground break-words">{srcStage?.name ?? "Źródło"}</span>
                <span className="block font-medium break-words">{srcLabel}</span>
              </div>
              <ArrowRight aria-hidden="true" className="h-6 w-6 text-foreground" />
              <div className={`min-w-0 rounded border p-1.5 ${tgtColor.bg} ${tgtColor.border}`} data-testid={`route-target-${route.id}`}>
                <span className="block text-xs text-muted-foreground break-words">{tgtStage?.name ?? "Cel"}</span>
                <span className="block font-medium break-words">{tgtBasketLabel}</span>
              </div>
            </div>
            {isAdvanced && !isLocked && (
              <button
                className="mt-1 ml-auto flex min-h-6 items-center gap-1 rounded px-1 text-xs text-muted-foreground hover:text-destructive focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring transition-colors"
                onClick={() => onRemoveRoute?.(route.id)}
                aria-label={`Usuń połączenie ${srcLabel} → ${displayTgtLabel}`}
              >
                <X aria-hidden="true" className="w-3 h-3" /> Usuń połączenie
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── AddRoutePanel ───────────────────────────────────────────────────────────

interface AddRoutePanelProps {
  stages: TournamentStage[];
  basketById: Map<string, StageBasket>;
  basketsByStage: Map<number, { inputs: StageBasket[]; outputs: StageBasket[] }>;
  existingRoutes: StageBasketRoute[];
  onAddRoute: (sourceBasketId: string, targetBasketId: string) => void;
  onCancelRouteSource: () => void;
  routeSourceId: string | null;
}

function AddRoutePanel({
  stages,
  basketById,
  basketsByStage,
  existingRoutes,
  onAddRoute,
  onCancelRouteSource,
  routeSourceId,
}: AddRoutePanelProps) {
  const [sourceId, setSourceId] = useState(routeSourceId ?? "");
  const [targetId, setTargetId] = useState("");

  const sortedStages = [...stages].sort((a, b) => a.position - b.position);

  const sourceBasket = sourceId ? basketById.get(sourceId) : undefined;
  const sourceStage = sourceBasket ? stages.find((s) => s.id === sourceBasket.stageId) : undefined;

  // Valid target inputs: input baskets from stages AFTER the source stage
  const validTargets = useMemo(() => {
    if (!sourceStage) return [];
    const usedOutputs = new Set(existingRoutes.map((r) => r.sourceBasketId));
    if (usedOutputs.has(sourceId)) return []; // output already connected
    return sortedStages
      .filter((s) => s.position > sourceStage.position)
      .flatMap((s) => basketsByStage.get(s.id)?.inputs ?? []);
  }, [sourceStage, sourceId, existingRoutes, basketsByStage, sortedStages]);

  // All output baskets
  const allOutputs = sortedStages.flatMap((s) => basketsByStage.get(s.id)?.outputs ?? []);
  const usedOutputIds = new Set(existingRoutes.map((r) => r.sourceBasketId));
  const availableOutputs = allOutputs.filter((b) => !usedOutputIds.has(b.id));

  function handleAdd() {
    if (!sourceId || !targetId) return;
    onAddRoute(sourceId, targetId);
    setSourceId("");
    setTargetId("");
  }

  return (
    <div className="border border-dashed border-primary/40 rounded-lg p-3 bg-primary/5 space-y-2">
      <div className="text-xs font-medium text-primary flex items-center gap-1.5">
        <ArrowRight className="w-3.5 h-3.5" /> Dodaj połączenie między etapami
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-0.5">Koszyk wyjściowy (źródło)</label>
          <select
            className="min-h-9 w-full text-sm rounded-md border border-border bg-card px-2 py-1.5"
            value={sourceId}
            onChange={(e) => { setSourceId(e.target.value); setTargetId(""); }}
          >
            <option value="">— wybierz —</option>
            {availableOutputs.map((b) => {
              const stage = stages.find((s) => s.id === b.stageId);
              return (
                <option key={b.id} value={b.id}>
                  {stage?.name ?? `Etap ${b.stageId}`}: {basketLabel(b.type, b.ordinal)}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-0.5">Koszyk wejściowy (cel)</label>
          <select
            className="min-h-9 w-full text-sm rounded-md border border-border bg-card px-2 py-1.5"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={validTargets.length === 0}
          >
            <option value="">— wybierz —</option>
            {validTargets.map((b) => {
              const stage = stages.find((s) => s.id === b.stageId);
              return (
                <option key={b.id} value={b.id}>
                  {stage?.name ?? `Etap ${b.stageId}`}: {basketLabel(b.type, b.ordinal)}
                </option>
              );
            })}
          </select>
          {sourceId && validTargets.length === 0 && (
            <p className="text-xs text-destructive mt-1">
              Brak dostępnych celów — wybierz wyjście z wcześniejszego etapu lub usuń istniejące połączenie.
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={handleAdd} disabled={!sourceId || !targetId}>
          <ArrowRight className="w-3.5 h-3.5 mr-1" /> Połącz
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { onCancelRouteSource(); setSourceId(""); setTargetId(""); }}>
          Anuluj
        </Button>
      </div>
    </div>
  );
}

// ─── StageBasketsPanel ───────────────────────────────────────────────────────

interface StageBasketsProps {
  tournamentId: number;
  tournamentStatus: string;
  orgToken: string | null;
}

export function StageBasketsPanel({ tournamentId, tournamentStatus, orgToken }: StageBasketsProps) {
  const queryClient = useQueryClient();
  const isLocked = tournamentStatus !== "draft";
  const canEdit = !!orgToken && !isLocked;

  const basketsQuery = useGetTournamentStageBaskets(tournamentId);
  const { data: basketConfig } = basketsQuery;
  const stagesQuery = useListTournamentStages(tournamentId);
  const { data: stagesRaw } = stagesQuery;
  const playersQuery = useListPlayers(tournamentId);
  const { data: players } = playersQuery;

  const update = useUpdateTournamentStageBaskets();

  const [advancedMode, setAdvancedMode] = useState(false);
  const [draft, setDraft] = useState<{ baskets: StageBasket[]; routes: StageBasketRoute[] } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiProblems, setApiProblems] = useState<ConfigurationProblem[]>([]);
  const [addingRoute, setAddingRoute] = useState(false);
  const [routeSourceId, setRouteSourceId] = useState<string | null>(null);

  // Stages sorted by position
  const stages = useMemo(
    () => (stagesRaw ?? []).slice().sort((a, b) => a.position - b.position),
    [stagesRaw],
  );

  // Player lookup
  const playerMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of players ?? []) map.set(p.id, p.name);
    return map;
  }, [players]);

  // Working baskets and routes: draft in advanced mode, else API data
  const active = advancedMode && draft ? draft : basketConfig;
  const persistedAuthority = basketConfig?.flowAuthority === "basket_v1";
  const showDerivedFlow = advancedMode || persistedAuthority;

  // Build lookups
  const basketById = useMemo(() => {
    const map = new Map<string, StageBasket>();
    for (const b of active?.baskets ?? []) map.set(b.id, b);
    return map;
  }, [active]);

  const stageById = useMemo(() => {
    const map = new Map<number, TournamentStage>();
    for (const s of stages) map.set(s.id, s);
    return map;
  }, [stages]);

  const basketsByStage = useMemo(() => {
    const map = new Map<number, { inputs: StageBasket[]; outputs: StageBasket[] }>();
    for (const s of stages) map.set(s.id, { inputs: [], outputs: [] });
    for (const b of active?.baskets ?? []) {
      const entry = map.get(b.stageId);
      if (entry) {
        if (b.type === "input") entry.inputs.push(b);
        else entry.outputs.push(b);
      }
    }
    return map;
  }, [active, stages]);

  const flowCountsByStage = useMemo(
    () =>
      deriveStageBasketFlowCounts(
        stages,
        active?.baskets ?? [],
        active?.routes ?? [],
      ),
    [active, stages],
  );

  // Which stages can be route targets (later than source stage)
  const routeTargetStageIds = useMemo(() => {
    const set = new Set<number>();
    if (!routeSourceId) return set;
    const srcBasket = basketById.get(routeSourceId);
    if (!srcBasket) return set;
    const srcStage = stageById.get(srcBasket.stageId);
    if (!srcStage) return set;
    for (const s of stages) {
      if (s.position > srcStage.position) set.add(s.id);
    }
    return set;
  }, [routeSourceId, basketById, stageById, stages]);

  // ─ Draft edit helpers ──────────────────────────────────────────────────────

  function enterAdvancedMode() {
    if (!basketConfig) return;
    setDraft({ baskets: basketConfig.baskets.map((b) => ({ ...b })), routes: basketConfig.routes.map((r) => ({ ...r })) });
    setAdvancedMode(true);
    setApiError(null);
    setApiProblems([]);
    setAddingRoute(false);
    setRouteSourceId(null);
  }

  function cancelAdvancedMode() {
    setAdvancedMode(false);
    setDraft(null);
    setApiError(null);
    setApiProblems([]);
    setAddingRoute(false);
    setRouteSourceId(null);
  }

  function mutateDraft(fn: (d: { baskets: StageBasket[]; routes: StageBasketRoute[] }) => void) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { baskets: [...prev.baskets], routes: [...prev.routes] };
      fn(next);
      return next;
    });
  }

  function handleColorChange(basketId: string, colorId: string | null) {
    mutateDraft((d) => {
      const idx = d.baskets.findIndex((b) => b.id === basketId);
      if (idx >= 0) d.baskets[idx] = { ...d.baskets[idx], colorId };
    });
  }

  function handleQualifierCountChange(basketId: string, qualifierCount: number | null) {
    mutateDraft((d) => {
      const idx = d.baskets.findIndex((b) => b.id === basketId);
      if (idx >= 0) d.baskets[idx] = { ...d.baskets[idx], qualifierCount };
    });
  }

  function handleRemoveBasket(basketId: string) {
    mutateDraft((d) => {
      d.baskets = d.baskets.filter((b) => b.id !== basketId);
      d.routes = d.routes.filter((r) => r.sourceBasketId !== basketId && r.targetBasketId !== basketId);
    });
  }

  function handleToggleParticipant(basketId: string, playerId: number) {
    mutateDraft((d) => {
      d.baskets = toggleParticipantInBasket(d.baskets, basketId, playerId);
    });
  }

  function handleAddInput(stageId: number) {
    mutateDraft((d) => {
      const existing = d.baskets.filter((b) => b.stageId === stageId && b.type === "input");
      if (existing.length >= 4) return;
      const ordinal = firstFreeOrdinal(existing.map((b) => b.ordinal));
      const existingIds = new Set(d.baskets.map((b) => b.id));
      d.baskets.push({
        id: generateBasketId(stageId, "input", existingIds),
        stageId,
        type: "input",
        ordinal,
        order: ordinal,
        colorId: null,
        participantIds: [],
        qualifierCount: null,
      });
    });
  }

  function handleAddOutput(stageId: number) {
    mutateDraft((d) => {
      const existing = d.baskets.filter((b) => b.stageId === stageId && b.type === "output");
      if (existing.length >= 4) return;
      const ordinal = firstFreeOrdinal(existing.map((b) => b.ordinal));
      const existingIds = new Set(d.baskets.map((b) => b.id));
      d.baskets.push({
        id: generateBasketId(stageId, "output", existingIds),
        stageId,
        type: "output",
        ordinal,
        order: ordinal,
        colorId: null,
        participantIds: [],
        qualifierCount: null,
      });
    });
  }

  function handleAddRoute(sourceBasketId: string, targetBasketId: string) {
    mutateDraft((d) => {
      const id = newRouteId(sourceBasketId, targetBasketId);
      if (d.routes.some((r) => r.id === id || r.sourceBasketId === sourceBasketId)) return;
      d.routes.push({ id, sourceBasketId, targetBasketId });
    });
    setAddingRoute(false);
    setRouteSourceId(null);
  }

  function handleRemoveRoute(routeId: string) {
    mutateDraft((d) => {
      d.routes = d.routes.filter((r) => r.id !== routeId);
    });
  }

  async function handleSave() {
    if (!draft || !canEdit) return; // defensive: never save when locked or unauthenticated
    setApiError(null);
    setApiProblems([]);
    try {
      await update.mutateAsync({ id: tournamentId, data: { baskets: draft.baskets, routes: draft.routes } });
      await queryClient.invalidateQueries({ queryKey: getGetTournamentStageBasketsQueryKey(tournamentId) });
      setAdvancedMode(false);
      setDraft(null);
    } catch (e: unknown) {
      const feedback = configurationErrorFeedback(e);
      setApiError(feedback.message);
      setApiProblems(feedback.problems);
    }
  }

  // ─ Render ──────────────────────────────────────────────────────────────────

  const routesForDisplay = active?.routes ?? [];

  return (
    <ReadQueryState query={basketsQuery} loadingMessage="Ładowanie konfiguracji koszyków…" errorMessage="Nie udało się pobrać konfiguracji koszyków.">
    <ReadQueryState query={stagesQuery} loadingMessage="Ładowanie etapów…" errorMessage="Nie udało się pobrać etapów.">
    <ReadQueryState query={playersQuery} loadingMessage="Ładowanie listy graczy…" errorMessage="Nie udało się pobrać listy graczy.">
    <div className="min-w-0 max-w-full space-y-4">
      {/* Locked banner */}
      {isLocked && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 flex items-center gap-2 text-sm text-yellow-400"
          data-testid="baskets-locked-banner"
        >
          <Lock className="w-4 h-4 shrink-0" />
          Koszyki są zablokowane — konfiguracja jest tylko do odczytu po rozpoczęciu turnieju.
        </div>
      )}

      {/* Info for legacy baskets */}
      {basketConfig?.legacyDefaulted && !advancedMode && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4 shrink-0" />
          Domyślna konfiguracja koszyków — wygenerowana automatycznie. Przed startem możesz ją dostosować w trybie zaawansowanym.
        </div>
      )}

      {persistedAuthority && (
        <div
          className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground"
          data-testid="explicit-basket-authority-banner"
        >
          <Info className="w-4 h-4 shrink-0" />
          Liczby uczestników etapów i awansów wynikają z bezpośrednich przypisań, tras i limitów wyjść. Przepływem zarządzasz tutaj, w Koszykach.
        </div>
      )}

      {advancedMode && !persistedAuthority && (
        <div
          className="rounded-lg border border-border bg-muted/20 px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground"
          data-testid="basket-authority-draft-preview-banner"
        >
          <Info className="w-4 h-4 shrink-0" />
          Podgląd planowanych liczb z koszyków. Nowy model stanie się autorytatywny dopiero po poprawnym zapisie.
        </div>
      )}

      {/* API validation errors */}
      {apiError && (
        <div
          role="alert"
          className="organizer-notice organizer-notice--error rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive space-y-1"
          data-testid="baskets-api-error"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {apiError}
          </div>
          {apiProblems.length > 0 && (
            <ul className="list-disc list-inside text-xs space-y-0.5 text-destructive/80">
              {apiProblems.map((p, i) => (
                <li key={i}>{configurationProblemMessage(p, { stages, baskets: active?.baskets, routes: active?.routes })}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="organizer-section-heading flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold">Mapa przepływu uczestników</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Konfiguracja podziału uczestników pomiędzy etapami turnieju.
          </p>
        </div>
        {canEdit && !advancedMode && (
          <Button variant="outline" size="sm" onClick={enterAdvancedMode} data-testid="enter-advanced-btn">
            <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Zaawansowane koszyki
          </Button>
        )}
        {advancedMode && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={cancelAdvancedMode}>
              <X className="w-3.5 h-3.5 mr-1" /> Anuluj
            </Button>
            <Button size="sm" onClick={handleSave} disabled={update.isPending} data-testid="save-baskets-btn">
              <Save className="w-3.5 h-3.5 mr-1" />
              {update.isPending ? "Zapisywanie…" : "Zapisz konfigurację"}
            </Button>
          </div>
        )}
      </div>

      {/* Add route panel */}
      {advancedMode && addingRoute && (
        <AddRoutePanel
          stages={stages}
          basketById={basketById}
          basketsByStage={basketsByStage}
          existingRoutes={routesForDisplay}
          onAddRoute={handleAddRoute}
          onCancelRouteSource={() => { setAddingRoute(false); setRouteSourceId(null); }}
          routeSourceId={routeSourceId}
        />
      )}

      {/* Horizontal stage map */}
      {stages.length === 0 && (
        <div className="organizer-empty-state flex items-center justify-center border border-dashed py-12 text-muted-foreground text-sm">
          Brak etapów — dodaj etapy do turnieju, aby skonfigurować koszyki.
        </div>
      )}

      {stages.length > 0 && (
        <div
          className="organizer-flow-map min-w-0 max-w-full overflow-x-auto pb-2"
          style={{ scrollbarWidth: "thin" }}
          data-testid="baskets-map"
        >
          <div className="flex items-start gap-0 min-w-max">
            {stages.map((stage, idx) => {
              const { inputs, outputs } = basketsByStage.get(stage.id) ?? { inputs: [], outputs: [] };
              const isLast = idx === stages.length - 1;

              return (
                <div key={stage.id} className="flex items-start">
                  <StageBlock
                    stage={stage}
                    inputBaskets={inputs}
                    outputBaskets={outputs}
                    playerMap={playerMap}
                    allPlayers={players ?? []}
                    isAdvanced={advancedMode}
                    isLocked={isLocked}
                    routeSourceId={routeSourceId}
                    routeTargetStageIds={routeTargetStageIds}
                    explicitAuthority={showDerivedFlow}
                    flowCounts={flowCountsByStage.get(stage.id)}
                    onColorChange={handleColorChange}
                    onQualifierCountChange={handleQualifierCountChange}
                    onRemoveBasket={handleRemoveBasket}
                    onToggleParticipant={handleToggleParticipant}
                    onAddInput={handleAddInput}
                    onAddOutput={handleAddOutput}
                    onSelectRouteSource={(id) => { setRouteSourceId(id); setAddingRoute(true); }}
                    onCompleteRoute={(targetId) => {
                      if (routeSourceId) {
                        handleAddRoute(routeSourceId, targetId);
                      }
                    }}
                  />
                  {!isLast && (
                    <RouteConnector
                      routes={routesForDisplay}
                      basketById={basketById}
                      stageById={stageById}
                      isAdvanced={advancedMode}
                      isLocked={isLocked}
                      onRemoveRoute={handleRemoveRoute}
                      leftStagePosition={stage.position}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add route button in advanced mode */}
      {advancedMode && !isLocked && !addingRoute && stages.length > 1 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={() => setAddingRoute(true)}
            data-testid="add-route-btn"
          >
            <ArrowRight className="w-3.5 h-3.5 mr-1.5" /> Dodaj połączenie między etapami
          </Button>
        </div>
      )}

      {/* Validation problems from API response */}
      {!advancedMode && basketConfig?.validation && !basketConfig.validation.valid && (
        <div role="alert" className="organizer-notice rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm" data-testid="baskets-validation-warning">
          <div className="flex items-center gap-1.5 text-yellow-400 font-medium mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Konfiguracja koszyków jest nieprawidłowa
          </div>
          <ul className="list-disc list-inside text-xs text-yellow-300/80 space-y-0.5">
            {basketConfig.validation.problems.map((p, i) => (
              <li key={i}>{configurationProblemMessage(p, { stages, baskets: active?.baskets, routes: active?.routes })}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
    </ReadQueryState>
    </ReadQueryState>
    </ReadQueryState>
  );
}
