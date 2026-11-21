import { t } from "@/i18n";
import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormatSketch } from "@/components/format-sketch";
import {
  plural,
  stageChain,
  type PresetId,
  type PresetPreview,
} from "@/features/experimental-tournaments/experimental-create-wizard-model";
import {
  estimateText,
  isUsablePreview,
  parseQuickCount,
  postPresetJson,
  QUICK_BEST_OF_OPTIONS,
  QUICK_PRESET_DEFAULT_COUNT,
  QUICK_PRESETS,
  quickPreviewBody,
  quickRecommendBody,
  recommendationsFrom,
  type QuickBestOf,
} from "@/lib/classic-quick-presets";

const DEBOUNCE_MS = 250;

type Estimate = { status: "ready"; text: string } | { status: "unavailable"; text: string };

function participantsText(preview: PresetPreview): string {
  const { mode, count, minimum } = preview.participants;
  const noun = plural(count, t("classicQuickPresets.uczestnik"), t("classicQuickPresets.uczestnikow"), t("classicQuickPresets.uczestnikow"));
  return mode === "exact"
    ? t("classicQuickPresets.dokladnie_count_noun", { count: count, noun: noun })
    : t("classicQuickPresets.maks_count_noun_turniej_wystartuje", { count: count, noun: noun, minimum: minimum });
}

/**
 * QW-03b · "Szybki wybór" in the Classic creator. Nothing is fetched until the organizer gives a
 * participant count or picks a preset; the estimates and the chosen layout come from the server.
 */
export function ClassicQuickPresets({
  presetId,
  count,
  bestOf,
  onSelect,
  onCountChange,
  onBestOfChange,
  onPreview,
}: {
  presetId: PresetId | null;
  count: string;
  bestOf: QuickBestOf;
  onSelect: (presetId: PresetId | null) => void;
  onCountChange: (count: string) => void;
  onBestOfChange: (bestOf: QuickBestOf) => void;
  onPreview: (preview: PresetPreview | null) => void;
}) {
  const participantCount = parseQuickCount(count);
  const [estimates, setEstimates] = useState<{ count: number; byPreset: Partial<Record<PresetId, Estimate>> } | null>(null);
  const [estimatesError, setEstimatesError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ key: string; data: PresetPreview } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Estimates for every card: one recommend call (same answers as the Modern wizard's defaults).
  useEffect(() => {
    if (participantCount === null) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      postPresetJson("/api/tournaments/presets/recommend", quickRecommendBody(participantCount), controller.signal)
        .then((data) => {
          const list = recommendationsFrom(data);
          if (!list) throw new Error(t("classicQuickPresets.nieoczekiwana_odpowiedz_serwera"));
          const byPreset: Partial<Record<PresetId, Estimate>> = {};
          for (const item of list) {
            byPreset[item.presetId] = item.available && isUsablePreview(item.preview)
              ? { status: "ready", text: estimateText(item.preview) }
              : { status: "unavailable", text: item.unavailableReason || t("classicQuickPresets.niedostepne_dla_tej_liczby_uczestnikow") };
          }
          setEstimates({ count: participantCount, byPreset });
          setEstimatesError(null);
        })
        .catch((error: Error) => {
          if (controller.signal.aborted) return;
          setEstimatesError(error.message);
        });
    }, DEBOUNCE_MS);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [participantCount]);

  // The chosen preset: the same preview request the Modern wizard sends.
  const previewKey = presetId && participantCount !== null ? `${presetId}:${participantCount}:${bestOf}` : "";
  useEffect(() => {
    onPreview(null);
    setPreviewError(null);
    if (!presetId || participantCount === null) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      postPresetJson("/api/tournaments/presets/preview", quickPreviewBody(presetId, participantCount, bestOf), controller.signal)
        .then((data) => {
          if (!isUsablePreview(data) || data.presetId !== presetId) throw new Error(t("classicQuickPresets.nieoczekiwana_odpowiedz_serwera"));
          setPreview({ key: previewKey, data });
          onPreview(data);
        })
        .catch((error: Error) => {
          if (controller.signal.aborted) return;
          setPreviewError(error.message);
        });
    }, DEBOUNCE_MS);
    return () => { window.clearTimeout(timer); controller.abort(); };
    // onPreview is a state setter from the page; previewKey covers presetId, count and bestOf.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);

  const current = preview && preview.key === previewKey ? preview.data : null;
  const shownEstimates = estimates && estimates.count === participantCount ? estimates.byPreset : null;
  const selected = useMemo(() => QUICK_PRESETS.find((item) => item.presetId === presetId) ?? null, [presetId]);
  const countProblem = count.trim() !== "" && participantCount === null ? t("classicQuickPresets.podaj_liczbe_od_2_do") : null;

  const choose = (id: PresetId) => {
    if (participantCount === null) onCountChange(String(QUICK_PRESET_DEFAULT_COUNT));
    onSelect(id);
  };

  return (
    <section aria-labelledby="quick-presets-title" className="space-y-3 rounded-lg border p-4" data-testid="classic-quick-presets">
      <div className="flex items-start gap-3">
        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 id="quick-presets-title" className="text-base font-medium">{t("classicQuickPresets.szybki_wybor")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("classicQuickPresets.gotowy_uklad_dla_podanej_liczby")}</p>
        </div>
      </div>
      <div className="max-w-[14rem] space-y-2">
        <Label htmlFor="quick-participant-count">{t("classicQuickPresets.liczba_uczestnikow")}</Label>
        <Input
          id="quick-participant-count"
          type="number"
          inputMode="numeric"
          min={2}
          max={128}
          value={count}
          onChange={(event) => onCountChange(event.target.value)}
          placeholder={`np. ${QUICK_PRESET_DEFAULT_COUNT}`}
          aria-describedby={countProblem ? "quick-participant-count-error" : undefined}
          aria-invalid={countProblem ? true : undefined}
        />
        {countProblem && <p id="quick-participant-count-error" className="text-xs font-medium text-destructive">{countProblem}</p>}
      </div>
      <div role="radiogroup" aria-labelledby="quick-presets-title" className="grid gap-2 sm:grid-cols-2">
        {QUICK_PRESETS.map((item) => {
          const estimate = shownEstimates?.[item.presetId];
          const unavailable = estimate?.status === "unavailable";
          const checked = item.presetId === presetId;
          return (
            <label
              key={item.presetId}
              data-testid="quick-preset"
              data-preset={item.presetId}
              className={`flex min-w-0 items-start gap-3 rounded-lg border p-3 ${unavailable ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${checked ? "border-primary bg-primary/5" : unavailable ? "" : "hover:bg-muted/20"}`}
            >
              <input
                type="radio"
                name="classic-quick-preset"
                value={item.presetId}
                checked={checked}
                disabled={unavailable && !checked}
                onChange={() => choose(item.presetId)}
                className="mt-1 accent-primary"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block text-xs text-muted-foreground">{item.hint}</span>
                {estimate && (
                  <span className={`block text-xs ${unavailable ? "text-muted-foreground" : "font-medium text-foreground"}`} data-testid="quick-preset-estimate">
                    {estimate.text}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {estimatesError && (
        <p className="text-xs text-muted-foreground">{t("classicQuickPresets.nie_udalo_sie_policzyc_przyblizen")}{estimatesError}{t("classicQuickPresets.wybor_nadal_dziala")}</p>
      )}
      {selected && (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3" data-testid="quick-preset-summary">
          <p className="text-sm font-medium">
            {selected.label}
            {current ? ` — ${estimateText(current)}` : previewError ? "" : t("classicQuickPresets.licze_uklad")}
          </p>
          {current && (
            <>
              <p className="text-xs text-muted-foreground">{participantsText(current)}</p>
              <ol className="list-decimal space-y-1 pl-5 text-xs" aria-label={t("classicQuickPresets.uklad_etapow")}>
                {stageChain(current).map((line, index) => <li key={index}>{line}</li>)}
              </ol>
              <FormatSketch stages={current.stages} accent="hsl(var(--primary))" />
              {current.warnings.length > 0 && (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {current.warnings.map((warning, index) => <li key={index}>{warning}</li>)}
                </ul>
              )}
            </>
          )}
          {previewError && <p className="text-xs font-medium text-destructive" data-testid="quick-preset-error">{previewError}</p>}
          <div className="space-y-2">
            <p className="text-xs font-medium" id="quick-best-of-label">{t("classicQuickPresets.dlugosc_meczu")}</p>
            <div role="group" aria-labelledby="quick-best-of-label" className="flex flex-wrap gap-2">
              {QUICK_BEST_OF_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={option === bestOf ? "default" : "outline"}
                  aria-pressed={option === bestOf}
                  onClick={() => onBestOfChange(option)}
                >
                  {t("classicQuickPresets.bo")}{option}
                </Button>
              ))}
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(null)}>
            {t("classicQuickPresets.ustaw_format_recznie")}</Button>
        </div>
      )}
    </section>
  );
}
