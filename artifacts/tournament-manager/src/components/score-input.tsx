// QW-10 · the score between "−" and "+" can be typed: tap/click or Tab into it, type the number (on phones the
// numeric keypad opens), ↑/↓ change it by one. It only edits the draft — saving stays on "Zapisz wynik", and Enter
// never saves, so a stray key cannot confirm a result.
import { t } from "@/i18n";
import type { FocusEvent, KeyboardEvent } from "react";

/** The value after typing `raw` into a field holding `current`; null when the input cannot be a score. */
export function typedScore(raw: string, max: number): number | null {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return 0;
  const whole = Number(digits.slice(-String(max).length));
  if (whole <= max) return whole;
  // A digit typed after the current value ("1" then "3" in a field capped at 2) counts on its own.
  const last = Number(digits.slice(-1));
  return last <= max ? last : null;
}

export function ScoreInput({ value, max, name, disabled, className, onChange, onFocus }: {
  value: number;
  max: number;
  name: string;
  disabled?: boolean;
  className?: string;
  onChange: (next: number) => void;
  onFocus?: () => void;
}) {
  const step = (delta: number) => {
    const next = Math.max(0, Math.min(max, value + delta));
    if (next !== value) onChange(next);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      enterKeyHint="done"
      aria-label={t("scoreInput.wynik_name", { name: name })}
      title={t("scoreInput.wpisz_wynik_0_max_albo", { max: max })}
      value={String(value)}
      disabled={disabled}
      data-testid="score-input"
      className={className}
      onFocus={(event: FocusEvent<HTMLInputElement>) => { event.currentTarget.select(); onFocus?.(); }}
      onChange={(event) => {
        const next = typedScore(event.currentTarget.value, max);
        if (next !== null && next !== value) onChange(next);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") { event.preventDefault(); step(1); }
        else if (event.key === "ArrowDown") { event.preventDefault(); step(-1); }
        else if (event.key === "Enter") event.preventDefault();
      }}
    />
  );
}
