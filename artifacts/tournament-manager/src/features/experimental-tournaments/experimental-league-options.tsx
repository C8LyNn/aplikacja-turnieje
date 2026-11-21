import { t } from "@/i18n";
import { useId } from "react";
import { CalendarDays, Minus, Plus } from "lucide-react";
import {
  bestOfLabel,
  defaultWizardSchedule,
  formatLocalDate,
  leagueRulesSentence,
  plural,
  scheduleOutline,
  type PresetParamKey,
  type PresetParamLimit,
  type PresetParams,
  type PresetPreview,
  type WizardSchedule,
} from "./experimental-create-wizard-model";

export const LEAGUE_PARAM_KEYS: readonly PresetParamKey[] = ["allowDraws", "pointsWin", "pointsDraw", "pointsLoss"];
const INTERVAL_OPTIONS = [1, 2, 3, 7, 14] as const;

function intervalLabel(days: number): string {
  if (days === 7) return t("experimentalLeagueOptions.co_tydzien");
  if (days === 14) return t("experimentalLeagueOptions.co_2_tygodnie");
  if (days === 1) return "Codziennie";
  return `Co ${days} dni`;
}

function PointStepper({ limit, onChange }: { limit: PresetParamLimit; onChange: (value: number) => void }) {
  const index = limit.options.indexOf(limit.value);
  return (
    <div className="experimental-wizard-count" role="group" aria-label={limit.label}>
      <span className="experimental-wizard-legend min-w-[11rem]">{limit.label}</span>
      <button type="button" className="experimental-wizard-step-btn" aria-label={t("experimentalLeagueOptions.label_mniej", { label: limit.label })} disabled={index <= 0} onClick={() => onChange(limit.options[index - 1]!)}>
        <Minus className="h-4 w-4" />
      </button>
      <output className="experimental-wizard-count-value" aria-live="polite">{limit.value}</output>
      <button type="button" className="experimental-wizard-step-btn" aria-label={t("experimentalLeagueOptions.label_wiecej", { label: limit.label })} disabled={index >= limit.options.length - 1} onClick={() => onChange(limit.options[index + 1]!)}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * V5.3 wizard block for leagues: draws (plain yes/no), points (folded away for advanced users) and an optional
 * schedule. Everything maps 1:1 to preset params / the creation payload; the server validates it again.
 */
export function LeagueOptions({
  preview,
  params,
  onParams,
  schedule,
  onSchedule,
  error,
}: {
  preview: PresetPreview;
  params: PresetParams;
  onParams: (params: PresetParams) => void;
  schedule: WizardSchedule | null;
  onSchedule: (schedule: WizardSchedule | null) => void;
  error?: { param?: PresetParamKey; message: string | null } | null;
}) {
  const id = useId();
  const limits = new Map(preview.paramLimits.map((limit) => [limit.key, { ...limit, value: params[limit.key] ?? limit.value }]));
  const draws = limits.get("allowDraws");
  const bestOf = params.bestOf ?? preview.params.bestOf;
  const outline = scheduleOutline(preview, schedule);
  const setParam = (key: PresetParamKey, value: number) => onParams({ ...params, [key]: value });
  const showSchedule = preview.stages.some((stage) => stage.format === "round_robin" || stage.format === "group_stage");
  if (!draws && !showSchedule) return null;
  const pointLimits = (["pointsWin", "pointsDraw", "pointsLoss"] as const)
    .map((key) => limits.get(key))
    .filter((limit): limit is PresetParamLimit => !!limit && (limit.key !== "pointsDraw" || draws?.value === 1));
  return (
    <div className="experimental-wizard-stack" data-testid="league-options">
      {/* V5.7: draws are chosen with the match rules ("Jak rozstrzyga się mecz"); this block keeps the points. */}
      {draws && (
        <details className="experimental-wizard-param" open={["pointsWin", "pointsDraw", "pointsLoss"].includes(error?.param ?? "") || undefined}>
          <summary className="cursor-pointer">
            <span className="experimental-wizard-legend">{t("experimentalLeagueOptions.punktacja_tabeli")}</span>{" "}
            <span className="experimental-wizard-help">
              {leagueRulesSentence({ allowDraws: draws.value === 1, points: { win: limits.get("pointsWin")?.value ?? 3, draw: limits.get("pointsDraw")?.value ?? 1, loss: limits.get("pointsLoss")?.value ?? 0 } })}
              {" "}{t("experimentalLeagueOptions.zmien_jesli_twoja_liga_liczy")}</span>
          </summary>
          <div className="mt-3 space-y-2">
            {pointLimits.map((limit) => <PointStepper key={limit.key} limit={limit} onChange={(value) => setParam(limit.key, value)} />)}
            <p className="experimental-wizard-help">
              {t("experimentalLeagueOptions.przy_rownej_liczbie_punktow_decyduja")}</p>
            {["pointsWin", "pointsDraw", "pointsLoss"].includes(error?.param ?? "") && <p role="alert" className="experimental-wizard-error">{error?.message}</p>}
          </div>
        </details>
      )}
      {showSchedule && (
        <div className="experimental-wizard-param" data-testid="league-schedule">
          <div className="experimental-wizard-param-head">
            <span className="experimental-wizard-legend"><CalendarDays className="mr-1 inline h-4 w-4" aria-hidden="true" />{t("experimentalLeagueOptions.terminy_kolejek")}</span>
            <span className="experimental-wizard-help">{t("experimentalLeagueOptions.opcjonalnie_mozesz_prowadzic_lige_bez")}</span>
          </div>
          <div className="experimental-wizard-segments" role="radiogroup" aria-label={t("experimentalLeagueOptions.terminy_kolejek")}>
            <button type="button" role="radio" aria-checked={schedule == null} className="experimental-wizard-chip" onClick={() => onSchedule(null)}>{t("experimentalLeagueOptions.bez_terminarza")}</button>
            <button type="button" role="radio" aria-checked={schedule != null} className="experimental-wizard-chip" onClick={() => onSchedule(schedule ?? defaultWizardSchedule())}>{t("experimentalLeagueOptions.ustal_terminy")}</button>
          </div>
          {schedule && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="experimental-wizard-field">
                <span className="experimental-wizard-legend">{t("experimentalLeagueOptions.pierwsza_kolejka")}</span>
                <input type="date" className="experimental-v4-input" value={schedule.startDate} required
                  onChange={(event) => event.target.value && onSchedule({ ...schedule, startDate: event.target.value })} />
              </label>
              <label className="experimental-wizard-field">
                <span className="experimental-wizard-legend">{t("experimentalLeagueOptions.kolejne_kolejki")}</span>
                <select className="experimental-v4-input" value={schedule.intervalDays}
                  onChange={(event) => onSchedule({ ...schedule, intervalDays: Number(event.target.value) })}>
                  {INTERVAL_OPTIONS.map((days) => <option key={days} value={days}>{intervalLabel(days)}</option>)}
                </select>
              </label>
              <label className="experimental-wizard-field">
                <span className="experimental-wizard-legend">{t("experimentalLeagueOptions.godzina")}</span>
                <input type="time" className="experimental-v4-input" value={schedule.defaultTime} required
                  onChange={(event) => event.target.value && onSchedule({ ...schedule, defaultTime: event.target.value })} />
              </label>
              <p className="experimental-wizard-help sm:col-span-3">{t("experimentalLeagueOptions.strefa_czasowa")}{" "}{schedule.timeZone}{t("experimentalLeagueOptions.godziny_zapisujemy_w_tej_strefie")}</p>
            </div>
          )}
          {outline && (
            <p className="experimental-wizard-note mt-3" data-tone="info" role="status">
              {outline.rounds} {plural(outline.rounds, t("experimentalLeagueOptions.kolejka"), t("experimentalLeagueOptions.kolejki"), t("experimentalLeagueOptions.kolejek"))}{t("experimentalLeagueOptions.od")}{" "}{formatLocalDate(outline.firstDate)} {t("experimentalLeagueOptions.do")}{" "}{formatLocalDate(outline.lastDate)}
              {outline.weeks > 1 ? t("experimentalLeagueOptions.ok_weeks_v1", { weeks: outline.weeks, v1: plural(outline.weeks, t("experimentalLeagueOptions.tydzien"), t("experimentalLeagueOptions.tygodnie"), t("experimentalLeagueOptions.tygodni")) }) : ""}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
