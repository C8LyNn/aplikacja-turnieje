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
  if (days === 7) return "Co tydzień";
  if (days === 14) return "Co 2 tygodnie";
  if (days === 1) return "Codziennie";
  return `Co ${days} dni`;
}

function PointStepper({ limit, onChange }: { limit: PresetParamLimit; onChange: (value: number) => void }) {
  const index = limit.options.indexOf(limit.value);
  return (
    <div className="experimental-wizard-count" role="group" aria-label={limit.label}>
      <span className="experimental-wizard-legend min-w-[11rem]">{limit.label}</span>
      <button type="button" className="experimental-wizard-step-btn" aria-label={`${limit.label}: mniej`} disabled={index <= 0} onClick={() => onChange(limit.options[index - 1]!)}>
        <Minus className="h-4 w-4" />
      </button>
      <output className="experimental-wizard-count-value" aria-live="polite">{limit.value}</output>
      <button type="button" className="experimental-wizard-step-btn" aria-label={`${limit.label}: więcej`} disabled={index >= limit.options.length - 1} onClick={() => onChange(limit.options[index + 1]!)}>
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
      {draws && (
        <div className="experimental-wizard-param" data-invalid={error?.param === "allowDraws" ? "true" : undefined}>
          <div className="experimental-wizard-param-head">
            <span className="experimental-wizard-legend" id={`${id}-draws`}>Remisy</span>
            <span className="experimental-wizard-help">
              {bestOf === 1
                ? "Remis ma sens, gdy wynik meczu to np. gole lub punkty. W grach z jednym zwycięzcą zostaw „Bez remisów”."
                : `Remisy działają przy meczu na jedną grę. Teraz mecz to „${bestOfLabel(bestOf).toLowerCase()}”.`}
            </span>
          </div>
          <div className="experimental-wizard-segments" role="radiogroup" aria-labelledby={`${id}-draws`}>
            {[0, 1].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={draws.value === value}
                className="experimental-wizard-chip"
                disabled={value === 1 && bestOf !== 1}
                onClick={() => setParam("allowDraws", value)}
              >
                {value === 1 ? "Remisy możliwe" : "Bez remisów"}
              </button>
            ))}
          </div>
          {error?.param === "allowDraws" && <p role="alert" className="experimental-wizard-error">{error.message}</p>}
        </div>
      )}
      {draws && (
        <details className="experimental-wizard-param" open={["pointsWin", "pointsDraw", "pointsLoss"].includes(error?.param ?? "") || undefined}>
          <summary className="cursor-pointer">
            <span className="experimental-wizard-legend">Punktacja</span>{" "}
            <span className="experimental-wizard-help">
              {leagueRulesSentence({ allowDraws: draws.value === 1, points: { win: limits.get("pointsWin")?.value ?? 3, draw: limits.get("pointsDraw")?.value ?? 1, loss: limits.get("pointsLoss")?.value ?? 0 } })}
              {" "}Zmień, jeśli Twoja liga liczy inaczej.
            </span>
          </summary>
          <div className="mt-3 space-y-2">
            {pointLimits.map((limit) => <PointStepper key={limit.key} limit={limit} onChange={(value) => setParam(limit.key, value)} />)}
            <p className="experimental-wizard-help">
              Przy równej liczbie punktów decydują kolejno: mecze bezpośrednie, różnica wyników, zdobyte, liczba zwycięstw, a na końcu rozstawienie.
            </p>
            {["pointsWin", "pointsDraw", "pointsLoss"].includes(error?.param ?? "") && <p role="alert" className="experimental-wizard-error">{error?.message}</p>}
          </div>
        </details>
      )}
      {showSchedule && (
        <div className="experimental-wizard-param" data-testid="league-schedule">
          <div className="experimental-wizard-param-head">
            <span className="experimental-wizard-legend"><CalendarDays className="mr-1 inline h-4 w-4" aria-hidden="true" />Terminy kolejek</span>
            <span className="experimental-wizard-help">Opcjonalnie. Możesz prowadzić ligę bez dat albo ustalić je teraz — każdy termin zmienisz później w panelu prowadzącego.</span>
          </div>
          <div className="experimental-wizard-segments" role="radiogroup" aria-label="Terminy kolejek">
            <button type="button" role="radio" aria-checked={schedule == null} className="experimental-wizard-chip" onClick={() => onSchedule(null)}>Bez terminarza</button>
            <button type="button" role="radio" aria-checked={schedule != null} className="experimental-wizard-chip" onClick={() => onSchedule(schedule ?? defaultWizardSchedule())}>Ustal terminy</button>
          </div>
          {schedule && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="experimental-wizard-field">
                <span className="experimental-wizard-legend">Pierwsza kolejka</span>
                <input type="date" className="experimental-v4-input" value={schedule.startDate} required
                  onChange={(event) => event.target.value && onSchedule({ ...schedule, startDate: event.target.value })} />
              </label>
              <label className="experimental-wizard-field">
                <span className="experimental-wizard-legend">Kolejne kolejki</span>
                <select className="experimental-v4-input" value={schedule.intervalDays}
                  onChange={(event) => onSchedule({ ...schedule, intervalDays: Number(event.target.value) })}>
                  {INTERVAL_OPTIONS.map((days) => <option key={days} value={days}>{intervalLabel(days)}</option>)}
                </select>
              </label>
              <label className="experimental-wizard-field">
                <span className="experimental-wizard-legend">Godzina</span>
                <input type="time" className="experimental-v4-input" value={schedule.defaultTime} required
                  onChange={(event) => event.target.value && onSchedule({ ...schedule, defaultTime: event.target.value })} />
              </label>
              <p className="experimental-wizard-help sm:col-span-3">Strefa czasowa: {schedule.timeZone}. Godziny zapisujemy w tej strefie — zmiana czasu letniego ich nie przesunie.</p>
            </div>
          )}
          {outline && (
            <p className="experimental-wizard-note mt-3" data-tone="info" role="status">
              {outline.rounds} {plural(outline.rounds, "kolejka", "kolejki", "kolejek")}: od {formatLocalDate(outline.firstDate)} do {formatLocalDate(outline.lastDate)}
              {outline.weeks > 1 ? ` (ok. ${outline.weeks} ${plural(outline.weeks, "tydzień", "tygodnie", "tygodni")})` : ""}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
