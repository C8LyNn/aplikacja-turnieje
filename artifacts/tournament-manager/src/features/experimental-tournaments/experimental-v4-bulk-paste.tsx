/**
 * SWARM-006 UX v4 — paste a whole participant list, see every problem before saving.
 * Accepts one nick per line, numbered lists, Excel/Sheets columns (tab) and CSV with
 * "," or ";". Validation mirrors the server rules; the server import stays the authority.
 */
import { useId, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, CheckCircle2, ClipboardPaste, FileUp, Trash2 } from "lucide-react";
import { parseBulkRoster, plural } from "@/features/experimental-tournaments/experimental-v4-model";

export interface BulkImportOutcome {
  imported?: number;
  skipped?: number;
  replacedCount?: number | null;
  limitExceeded?: boolean;
  errors?: Array<{ line: number; content: string; reason: string }>;
}

const PREVIEW_LIMIT = 200;

export function ExperimentalBulkPaste({
  existingNames,
  existingSeeds,
  maxPlayers,
  pending,
  onImport,
  onClose,
  teams = false,
}: {
  /** V5.8: a team tournament pastes teams and says "drużyna". */
  teams?: boolean;
  existingNames: ReadonlyArray<string>;
  existingSeeds?: ReadonlyArray<number>;
  maxPlayers?: number | null;
  pending?: boolean;
  onImport: (csv: string, mode: "append" | "replace") => Promise<BulkImportOutcome>;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [outcome, setOutcome] = useState<BulkImportOutcome | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const hasPlayers = existingNames.length > 0;

  const parsed = useMemo(
    () => parseBulkRoster(text, { existingNames, existingSeeds, maxPlayers, mode }),
    [existingNames, existingSeeds, maxPlayers, mode, text],
  );
  const rows = onlyErrors ? parsed.invalid : parsed.rows;
  const toAdd = Math.max(0, parsed.valid.length - parsed.overCapacity);

  const loadFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setText(String(reader.result ?? "")); setOutcome(null); setConfirmReplace(false); };
    reader.readAsText(file);
    event.target.value = "";
  };

  const removeInvalid = () => {
    const keep = new Set(parsed.valid.map((row) => row.line));
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const header = parsed.headerDetected ? lines.findIndex((line) => line.trim()) : -1;
    setText(lines.filter((line, index) => index === header || keep.has(index + 1)).join("\n"));
    setOnlyErrors(false);
  };

  const submit = async () => {
    if (!parsed.valid.length || pending) return;
    if (mode === "replace" && hasPlayers && !confirmReplace) { setConfirmReplace(true); return; }
    setConfirmReplace(false);
    try {
      const result = await onImport(parsed.csv, mode);
      setOutcome(result ?? {});
      setText("");
      setMode("append");
    } catch {
      /* the page shows the error toast; the pasted text stays for correction */
    }
  };

  if (outcome) {
    return (
      <section className="experimental-v4-bulk" aria-labelledby={`${id}-done`}>
        <p id={`${id}-done`} className="experimental-v4-bulk-done" role="status">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          Dodano {teams ? plural(outcome.imported ?? 0, "drużynę", "drużyny", "drużyn") : plural(outcome.imported ?? 0, "zawodnika", "zawodników", "zawodników")}
          {outcome.replacedCount ? ` · usunięto poprzednich: ${outcome.replacedCount}` : ""}
          {outcome.skipped ? ` · pominięto: ${outcome.skipped}` : ""}
        </p>
        {outcome.limitExceeded ? <p className="experimental-v4-bulk-warn"><AlertTriangle className="h-4 w-4" aria-hidden="true" />Osiągnięto limit miejsc — część listy nie została dodana.</p> : null}
        {outcome.errors?.length ? (
          <ul className="experimental-v4-bulk-errors" role="list">
            {outcome.errors.map((error, index) => <li key={index}><strong>{error.content}</strong> — {error.reason}</li>)}
          </ul>
        ) : null}
        <div className="experimental-v4-bulk-actions">
          <button type="button" className="experimental-v4-btn" onClick={() => setOutcome(null)}>Wklej kolejną listę</button>
          <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={onClose}>Zamknij</button>
        </div>
      </section>
    );
  }

  return (
    <section className="experimental-v4-bulk" aria-labelledby={`${id}-title`}>
      <div className="experimental-v4-bulk-head">
        <h3 id={`${id}-title`} className="experimental-v4-bulk-title"><ClipboardPaste className="h-4 w-4" aria-hidden="true" />Wklej listę uczestników</h3>
        <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="sr-only" tabIndex={-1} onChange={loadFile} aria-hidden="true" />
        <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => fileRef.current?.click()}>
          <FileUp className="h-4 w-4" aria-hidden="true" />Wczytaj plik
        </button>
      </div>
      <label htmlFor={`${id}-text`} className="experimental-v4-muted">
        {teams ? "Jedna drużyna w wierszu. Możesz wkleić kolumny z arkusza (nazwa, rozstawienie) albo CSV z nagłówkiem. Składy uzupełnisz poniżej." : "Jeden zawodnik w wierszu. Możesz wkleić kolumny z arkusza (nick, drużyna, rozstawienie) albo CSV z nagłówkiem."}
      </label>
      <textarea
        id={`${id}-text`}
        className="experimental-v4-bulk-text"
        value={text}
        onChange={(event) => { setText(event.target.value); setConfirmReplace(false); }}
        rows={7}
        spellCheck={false}
        placeholder={"Kowalski\nNowak\tTeam Alfa\t3\nWiśniewska"}
        aria-describedby={`${id}-summary`}
      />

      {hasPlayers ? (
        <fieldset className="experimental-v4-bulk-mode">
          <legend className="experimental-v4-kicker">Co zrobić z obecną listą ({existingNames.length})?</legend>
          <label><input type="radio" name={`${id}-mode`} checked={mode === "append"} onChange={() => { setMode("append"); setConfirmReplace(false); }} /> Dopisz do listy</label>
          <label><input type="radio" name={`${id}-mode`} checked={mode === "replace"} onChange={() => { setMode("replace"); setConfirmReplace(false); }} /> Zastąp całą listę</label>
        </fieldset>
      ) : null}

      {parsed.rows.length > 0 ? (
        <>
          <div id={`${id}-summary`} className="experimental-v4-bulk-summary" role="status" aria-live="polite">
            <span className="experimental-v4-chip" data-tone="success"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{plural(toAdd, "do dodania", "do dodania", "do dodania")}</span>
            {parsed.invalid.length ? <span className="experimental-v4-chip" data-tone="danger"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />{plural(parsed.invalid.length, "wiersz z błędem", "wiersze z błędem", "wierszy z błędem")}</span> : null}
            {parsed.overCapacity ? <span className="experimental-v4-chip" data-tone="warning"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />{plural(parsed.overCapacity, "nie zmieści się", "nie zmieszczą się", "nie zmieści się")} (limit {maxPlayers ?? 256})</span> : null}
            {parsed.headerDetected ? <span className="experimental-v4-chip" data-tone="info">Nagłówek rozpoznany</span> : null}
          </div>
          {parsed.invalid.length ? (
            <div className="experimental-v4-bulk-actions">
              <label className="experimental-v4-bulk-toggle"><input type="checkbox" checked={onlyErrors} onChange={(event) => setOnlyErrors(event.target.checked)} /> Pokaż tylko błędy</label>
              <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={removeInvalid}><Trash2 className="h-4 w-4" aria-hidden="true" />Usuń błędne wiersze</button>
            </div>
          ) : null}
          <div className="experimental-v4-bulk-table" tabIndex={0} role="region" aria-label="Podgląd wklejonej listy">
            <table>
              <thead><tr><th scope="col">Wiersz</th><th scope="col">Nick</th><th scope="col">Drużyna</th><th scope="col">Rozst.</th><th scope="col">Stan</th></tr></thead>
              <tbody>
                {rows.slice(0, PREVIEW_LIMIT).map((row) => (
                  <tr key={row.line} data-invalid={row.error ? "true" : undefined}>
                    <td className="tabular-nums">{row.line}</td>
                    <td>{row.name || <em className="experimental-v4-muted">(pusty)</em>}</td>
                    <td>{row.team}</td>
                    <td className="tabular-nums">
                      {row.seed ?? ""}
                      {row.autoSeed ? <small className="experimental-v4-muted" title="Rozstawienie nadane automatycznie po wpisanych"> auto</small> : null}
                    </td>
                    <td>{row.error ? <span className="experimental-v4-bulk-error">{row.error}</span> : <span className="experimental-v4-bulk-ok">OK</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > PREVIEW_LIMIT ? <p className="experimental-v4-muted">Pokazano {PREVIEW_LIMIT} z {rows.length} wierszy.</p> : null}
          </div>
        </>
      ) : null}

      {confirmReplace ? (
        <p className="experimental-v4-bulk-warn" role="alert">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Obecni zawodnicy ({existingNames.length}) zostaną usunięci i zastąpieni nową listą. Kliknij ponownie, aby potwierdzić.
        </p>
      ) : null}
      <div className="experimental-v4-bulk-actions">
        <button type="button" className="experimental-v4-btn" data-variant="primary" disabled={!toAdd || pending} onClick={() => void submit()}>
          {pending ? "Dodawanie…" : confirmReplace ? `Zastąp listę (${toAdd})` : toAdd ? `Dodaj ${teams ? plural(toAdd, "drużynę", "drużyny", "drużyn") : plural(toAdd, "zawodnika", "zawodników", "zawodników")}` : teams ? "Dodaj drużyny" : "Dodaj zawodników"}
        </button>
        <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={onClose}>Anuluj</button>
      </div>
    </section>
  );
}
