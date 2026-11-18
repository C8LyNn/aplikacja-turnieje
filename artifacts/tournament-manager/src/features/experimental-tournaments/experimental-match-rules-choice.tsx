/**
 * V5.7 · "how a match is decided", in the wizard and the advanced editor. Three things stay apart:
 * the format (step 1), the match rules (this choice) and the classification points (league options).
 * Every option maps to preset params; the API builds and validates the real rules from them.
 * V5.10: the two-legged tie (dwumecz) is offered only where the preset has a single-elimination bracket.
 */
import { useId } from "react";
import { MATCH_RULE_PRESETS } from "@workspace/match-rules";
import { ParamControl } from "./experimental-create-wizard";
import type { PresetParamKey, PresetParams, PresetPreview } from "./experimental-create-wizard-model";

/** Params this choice owns; other blocks never render them. */
export const MATCH_PARAM_KEYS: readonly PresetParamKey[] = ["bestOf", "playoffBestOf", "setsToWin", "setPoints", "setWinBy", "allowDraws", "twoLegs"];

const SET_KEYS: readonly PresetParamKey[] = ["setsToWin", "setPoints", "setWinBy"];

function without(params: PresetParams, keys: readonly PresetParamKey[]): PresetParams {
  const next = { ...params };
  for (const key of keys) delete next[key];
  return next;
}

export type MatchRuleOptionId = (typeof MATCH_RULE_PRESETS)[number]["id"] | "custom";

/** Which ready-made option the current params describe ("custom" after "Dostosuj zasady"). */
export function currentMatchRuleOption(preview: PresetPreview, params: PresetParams): MatchRuleOptionId {
  const value = (key: PresetParamKey) => params[key] ?? preview.paramLimits.find((limit) => limit.key === key)?.value ?? (preview.params as PresetParams)[key];
  if (value("twoLegs") === 1) return "two_legs";
  const sets = value("setsToWin") ?? 0;
  if (sets > 0) {
    const hit = MATCH_RULE_PRESETS.find((preset) => preset.rules?.kind === "sets" && preset.rules.setsToWin === sets && preset.rules.pointsPerSet === value("setPoints") && preset.rules.winBy === value("setWinBy"));
    return hit?.id ?? "custom";
  }
  if (value("allowDraws") === 1) return "score_draws";
  const bestOf = value("bestOf") ?? 1;
  return MATCH_RULE_PRESETS.find((preset) => !preset.rules && !preset.allowDraws && preset.bestOf === bestOf)?.id ?? "custom";
}

/** Params after picking a ready-made option (keeps everything else the user set). */
export function paramsForMatchRuleOption(id: MatchRuleOptionId, params: PresetParams, hasLeague: boolean): PresetParams {
  const preset = MATCH_RULE_PRESETS.find((entry) => entry.id === id);
  if (!preset) return params;
  const base = without(params, ["bestOf", "playoffBestOf", ...SET_KEYS, "allowDraws", "twoLegs"]);
  if (preset.rules?.kind === "two_legs") {
    // Each leg is one game; the server sets the bracket's length to one game.
    return { ...base, twoLegs: 1 };
  }
  if (preset.rules?.kind === "sets") {
    return { ...base, setsToWin: preset.rules.setsToWin, setPoints: preset.rules.pointsPerSet, setWinBy: preset.rules.winBy, ...(hasLeague ? { allowDraws: 0 } : {}) };
  }
  return { ...base, bestOf: preset.bestOf, ...(hasLeague ? { allowDraws: preset.allowDraws ? 1 : 0 } : {}) };
}

const pointsWord = (value: number) => (value === 1 ? "punkt" : value >= 2 && value <= 4 ? "punkty" : "punktów");

/** The one-sentence summary shown under the choice (match rules, then what a result is worth). */
export function matchRulesSentence(preview: PresetPreview): string {
  const rules = preview.matchRulesSummary ?? "";
  const league = preview.leagueRules;
  if (preview.params.twoLegs === 1) {
    // V5.10: format and decision stay apart — "a knockout bracket, each pair plays two legs".
    const bracket = preview.stages.find((stage) => stage.format === "single_elimination");
    const where = preview.stages.length > 1 ? `W etapie „${bracket?.name ?? "Play-off"}” (drabinka)` : "Turniej eliminacyjny (drabinka)";
    const table = league ? ` W tabeli zwycięstwo daje ${league.points.win} ${pointsWord(league.points.win)}${league.allowDraws ? `, remis ${league.points.draw}` : ""}.` : "";
    return `${where}, w którym każda para rozgrywa dwa spotkania. O awansie decyduje suma wyników; przy równej sumie rozstrzyga organizator.${table}`;
  }
  if (!league) {
    const elimination = preview.stages.some((stage) => stage.format === "single_elimination" || stage.format === "double_elimination");
    return `${rules}${elimination ? " Zwycięzca meczu przechodzi dalej w drabince." : ""}`.trim();
  }
  const win = `Zwycięstwo daje ${league.points.win} ${pointsWord(league.points.win)} w tabeli`;
  const draw = league.allowDraws ? `, remis ${league.points.draw}` : "";
  const loss = league.points.loss ? `, porażka ${league.points.loss}` : "";
  return `${rules} ${win}${draw}${loss}.`.trim();
}

export function MatchRulesChoice({
  preview,
  params,
  onParams,
  error,
}: {
  preview: PresetPreview;
  params: PresetParams;
  onParams: (params: PresetParams) => void;
  error?: { param?: PresetParamKey; message: string | null } | null;
}) {
  const id = useId();
  const hasLeague = preview.paramLimits.some((limit) => limit.key === "allowDraws");
  const offersTwoLegs = preview.paramLimits.some((limit) => limit.key === "twoLegs");
  const selected = currentMatchRuleOption(preview, params);
  // A preset is shown only where its logic fully works: draws in leagues and groups, two legs in a bracket.
  const options = MATCH_RULE_PRESETS.filter((preset) => (hasLeague || !preset.allowDraws) && (preset.rules?.kind !== "two_legs" || offersTwoLegs));
  const limits = new Map(preview.paramLimits.map((limit) => [limit.key, { ...limit, value: params[limit.key] ?? limit.value }]));
  const twoLegsActive = selected === "two_legs";
  const setsActive = !twoLegsActive && (params.setsToWin ?? limits.get("setsToWin")?.value ?? 0) > 0;
  const detailKeys: PresetParamKey[] = twoLegsActive ? [] : setsActive ? ["setsToWin", "setPoints", "setWinBy"] : ["bestOf", "playoffBestOf"];
  const ownError = error?.param && MATCH_PARAM_KEYS.includes(error.param) ? error.message : null;
  const selectedPreset = MATCH_RULE_PRESETS.find((preset) => preset.id === selected);
  return (
    <div className="experimental-wizard-param experimental-match-rules-choice" data-testid="match-rules-choice" data-invalid={ownError ? "true" : undefined}>
      <div className="experimental-wizard-param-head">
        <span className="experimental-wizard-legend" id={`${id}-label`}>Jak rozstrzyga się mecz</span>
        <span className="experimental-wizard-help">Wybierz gotowe zasady. Format rozgrywek i punktacja tabeli zostają bez zmian.</span>
      </div>
      <div className="experimental-wizard-segments experimental-match-rules-options" role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={selectedPreset ? `${id}-description` : undefined}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected === option.id}
            className="experimental-wizard-chip"
            title={option.description}
            onClick={() => onParams(paramsForMatchRuleOption(option.id, params, hasLeague))}
          >
            {option.label}
          </button>
        ))}
        {selected === "custom" && <span className="experimental-wizard-chip" role="radio" aria-checked="true">Własne zasady</span>}
      </div>
      {selectedPreset && <p id={`${id}-description`} className="experimental-wizard-help" data-testid="match-rules-description">{selectedPreset.description}</p>}
      <p className="experimental-match-rules-summary" role="status" aria-live="polite">{matchRulesSentence(preview)}</p>
      {ownError && <p role="alert" className="experimental-wizard-error">{ownError}</p>}
      <details className="experimental-match-rules-details" open={!!ownError || selected === "custom" || undefined}>
        <summary className="cursor-pointer">Dostosuj zasady</summary>
        <div className="mt-3 space-y-3">
          {twoLegsActive && <p className="experimental-wizard-help">Każde spotkanie dwumeczu to jedna gra na bramki lub punkty (remis w jednym spotkaniu jest możliwy). Terminy obu spotkań ustawisz po starcie, osobno dla każdego. Bramki wyjazdowe nie są liczone.</p>}
          {setsActive && <p className="experimental-wizard-help">Długość meczu wynika z setów: do {limits.get("setsToWin")?.value} wygranych setów. Wszystkie sety mają te same zasady.</p>}
          {detailKeys.map((key) => limits.get(key)).filter((limit): limit is NonNullable<typeof limit> => !!limit).map((limit) => (
            <ParamControl
              key={limit.key}
              limit={limit.key === "setsToWin" ? { ...limit, options: limit.options.filter((value) => value > 0), optionLabels: limit.optionLabels?.slice(1) } : limit}
              error={error?.param === limit.key ? error.message ?? undefined : undefined}
              onChange={(value) => onParams({ ...(limit.key === "setsToWin" ? without(params, ["bestOf", "playoffBestOf"]) : params), [limit.key]: value })}
            />
          ))}
          {!setsActive && !twoLegsActive && (
            <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => onParams(paramsForMatchRuleOption("sets_2_11", params, hasLeague))}>
              Mecz na sety
            </button>
          )}
          {(setsActive || twoLegsActive) && (
            <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => onParams(paramsForMatchRuleOption("single_game", params, hasLeague))}>
              {twoLegsActive ? "Jeden mecz zamiast dwumeczu" : "Bez setów"}
            </button>
          )}
        </div>
      </details>
    </div>
  );
}
