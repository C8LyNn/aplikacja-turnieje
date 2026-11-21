import { t, serverText } from "@/i18n";
/**
 * V5.7 · set results inside the one match editor ("Wybrany mecz"). The preview uses the same rules as the
 * API (@workspace/match-rules); the API still decides and validates on save.
 */
import { useId } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { setMatchProgress, setState, type SetMatchRules, type SetScore } from "@workspace/match-rules";

export function setsText(sets: readonly SetScore[] | null | undefined): string {
  return sets && sets.length ? sets.map((set) => `${set.score1}:${set.score2}`).join(", ") : "";
}

export function SetScoreEditor({
  rules,
  sets,
  player1Name,
  player2Name,
  readOnly,
  disabled,
  onChange,
}: {
  rules: SetMatchRules;
  sets: readonly SetScore[];
  player1Name: string;
  player2Name: string;
  readOnly?: boolean;
  disabled?: boolean;
  onChange?: (sets: SetScore[]) => void;
}) {
  const id = useId();
  const progress = setMatchProgress(sets, rules, { player1: player1Name, player2: player2Name });
  const value = progress.ok ? progress.value : null;
  const change = (index: number, side: 1 | 2, next: number) => {
    if (!onChange) return;
    const safe = Number.isFinite(next) ? Math.max(0, Math.min(999, Math.trunc(next))) : 0;
    onChange(sets.map((set, position) => (position === index ? { ...set, [side === 1 ? "score1" : "score2"]: safe } : set)));
  };
  const winnerName = value?.decided ? (value.winnerSide === 1 ? player1Name : player2Name) : null;
  return (
    <section className="set-score-editor" aria-label={t("setScoreEditor.wyniki_setow")} data-decided={value?.decided ? "true" : undefined}>
      <div className="set-score-editor-tally" aria-live="polite">
        <span className="set-score-editor-tally-label">{t("setScoreEditor.sety")}</span>
        <strong className="set-score-editor-tally-value tabular-nums">{value ? `${value.setsWon1}:${value.setsWon2}` : "–"}</strong>
        {value && (value.points1 > 0 || value.points2 > 0) && <span className="set-score-editor-points tabular-nums">{t("setScoreEditor.male_punkty")}{" "}{value.points1}:{value.points2}</span>}
      </div>
      {sets.length > 0 && (
        <div className="set-score-editor-head" aria-hidden="true">
          <span />
          <span title={player1Name}>{player1Name}</span>
          <span title={player2Name}>{player2Name}</span>
        </div>
      )}
      <ol className="set-score-editor-list">
        {sets.map((set, index) => {
          const state = setState(set, rules, index);
          const note = state.kind === "finished"
            ? t("setScoreEditor.wygrywa_v0", { v0: state.winner === 1 ? player1Name : player2Name })
            : state.kind === "in_progress" ? t("setScoreEditor.trwa") : serverText(state.problem.message).replace(/^Set \d+: /, "");
          return (
            <li key={index} className="set-score-editor-row" data-state={state.kind}>
              <span className="set-score-editor-set" id={`${id}-set-${index}`}>{t("setScoreEditor.set")}{" "}{index + 1}</span>
              {[1, 2].map((side) => {
                const score = side === 1 ? set.score1 : set.score2;
                const name = side === 1 ? player1Name : player2Name;
                return readOnly ? (
                  <span key={side} className="set-score-editor-score tabular-nums" aria-label={t("setScoreEditor.set_v0_name", { v0: index + 1, name: name })}>{score}</span>
                ) : (
                  <span key={side} className="set-score-editor-input">
                    <button type="button" className="set-score-editor-step" aria-label={t("setScoreEditor.set_v0_name_minus_punkt", { v0: index + 1, name: name })} disabled={disabled || score <= 0} onClick={() => change(index, side as 1 | 2, score - 1)}>
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={999}
                      value={score}
                      disabled={disabled}
                      aria-label={t("setScoreEditor.set_v0_name", { v0: index + 1, name: name })}
                      aria-describedby={`${id}-note-${index}`}
                      onChange={(event) => change(index, side as 1 | 2, Number(event.target.value))}
                      onFocus={(event) => event.target.select()}
                    />
                    <button type="button" className="set-score-editor-step" aria-label={t("setScoreEditor.set_v0_name_plus_punkt", { v0: index + 1, name: name })} disabled={disabled || score >= 999} onClick={() => change(index, side as 1 | 2, score + 1)}>
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                );
              })}
              <span className="set-score-editor-note" id={`${id}-note-${index}`} data-state={state.kind}>{note}</span>
            </li>
          );
        })}
      </ol>
      {!readOnly && (
        <div className="set-score-editor-actions">
          <button type="button" className="experimental-v4-btn" disabled={disabled || !(sets.length === 0 || value?.canAddSet)} onClick={() => onChange?.([...sets, { score1: 0, score2: 0 }])}>
            <Plus className="h-4 w-4" aria-hidden="true" /> {sets.length === 0 ? t("setScoreEditor.wpisz_pierwszy_set") : t("setScoreEditor.dodaj_set_v0", { v0: sets.length + 1 })}
          </button>
          {sets.length > 0 && (
            <button type="button" className="experimental-v4-btn" data-variant="ghost" disabled={disabled} onClick={() => onChange?.(sets.slice(0, -1))}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> {t("setScoreEditor.usun_ostatni_set")}</button>
          )}
        </div>
      )}
      <p className="set-score-editor-status" role="status" data-tone={!progress.ok ? "error" : value?.decided ? "done" : "pending"}>
        {!progress.ok
          ? serverText(progress.problem.message)
          : value!.decided
            ? t("setScoreEditor.mecz_rozstrzygniety_wygrywa_winnername_s", { winnerName: winnerName, setsWon1: value!.setsWon1, setsWon2: value!.setsWon2 })
            : sets.length === 0
              ? t("setScoreEditor.mecz_do_setstowin_wygranych_setow", { setsToWin: rules.setsToWin, pointsPerSet: rules.pointsPerSet, v2: rules.winBy > 1 ? t("setScoreEditor.z_przewaga_winby", { winBy: rules.winBy }) : "" })
              : value!.missing}
      </p>
    </section>
  );
}
