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
    <section className="set-score-editor" aria-label="Wyniki setów" data-decided={value?.decided ? "true" : undefined}>
      <div className="set-score-editor-tally" aria-live="polite">
        <span className="set-score-editor-tally-label">Sety</span>
        <strong className="set-score-editor-tally-value tabular-nums">{value ? `${value.setsWon1}:${value.setsWon2}` : "–"}</strong>
        {value && (value.points1 > 0 || value.points2 > 0) && <span className="set-score-editor-points tabular-nums">małe punkty {value.points1}:{value.points2}</span>}
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
            ? `wygrywa ${state.winner === 1 ? player1Name : player2Name}`
            : state.kind === "in_progress" ? "trwa" : state.problem.message.replace(/^Set \d+: /, "");
          return (
            <li key={index} className="set-score-editor-row" data-state={state.kind}>
              <span className="set-score-editor-set" id={`${id}-set-${index}`}>Set {index + 1}</span>
              {[1, 2].map((side) => {
                const score = side === 1 ? set.score1 : set.score2;
                const name = side === 1 ? player1Name : player2Name;
                return readOnly ? (
                  <span key={side} className="set-score-editor-score tabular-nums" aria-label={`Set ${index + 1} — ${name}`}>{score}</span>
                ) : (
                  <span key={side} className="set-score-editor-input">
                    <button type="button" className="set-score-editor-step" aria-label={`Set ${index + 1}: ${name} minus punkt`} disabled={disabled || score <= 0} onClick={() => change(index, side as 1 | 2, score - 1)}>
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={999}
                      value={score}
                      disabled={disabled}
                      aria-label={`Set ${index + 1} — ${name}`}
                      aria-describedby={`${id}-note-${index}`}
                      onChange={(event) => change(index, side as 1 | 2, Number(event.target.value))}
                      onFocus={(event) => event.target.select()}
                    />
                    <button type="button" className="set-score-editor-step" aria-label={`Set ${index + 1}: ${name} plus punkt`} disabled={disabled || score >= 999} onClick={() => change(index, side as 1 | 2, score + 1)}>
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
            <Plus className="h-4 w-4" aria-hidden="true" /> {sets.length === 0 ? "Wpisz pierwszy set" : `Dodaj set ${sets.length + 1}`}
          </button>
          {sets.length > 0 && (
            <button type="button" className="experimental-v4-btn" data-variant="ghost" disabled={disabled} onClick={() => onChange?.(sets.slice(0, -1))}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Usuń ostatni set
            </button>
          )}
        </div>
      )}
      <p className="set-score-editor-status" role="status" data-tone={!progress.ok ? "error" : value?.decided ? "done" : "pending"}>
        {!progress.ok
          ? progress.problem.message
          : value!.decided
            ? `Mecz rozstrzygnięty: wygrywa ${winnerName} (${value!.setsWon1}:${value!.setsWon2} w setach).`
            : sets.length === 0
              ? `Mecz do ${rules.setsToWin} wygranych setów; set do ${rules.pointsPerSet} pkt${rules.winBy > 1 ? ` z przewagą ${rules.winBy}` : ""}.`
              : value!.missing}
      </p>
    </section>
  );
}
