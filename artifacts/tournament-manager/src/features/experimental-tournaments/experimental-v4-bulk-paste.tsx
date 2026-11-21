import { t } from "@/i18n";
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
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />{t("experimentalV4BulkPaste.dodano")}{" "}{teams ? plural(outcome.imported ?? 0, t("experimentalV4BulkPaste.druzyne"), t("experimentalV4BulkPaste.druzyny"), t("experimentalV4BulkPaste.druzyn")) : plural(outcome.imported ?? 0, t("experimentalV4BulkPaste.zawodnika"), t("experimentalV4BulkPaste.zawodnikow"), t("experimentalV4BulkPaste.zawodnikow"))}
          {outcome.replacedCount ? t("experimentalV4BulkPaste.usunieto_poprzednich_replacedcount", { replacedCount: outcome.replacedCount }) : ""}
          {outcome.skipped ? t("experimentalV4BulkPaste.pominieto_skipped", { skipped: outcome.skipped }) : ""}
        </p>
        {outcome.limitExceeded ? <p className="experimental-v4-bulk-warn"><AlertTriangle className="h-4 w-4" aria-hidden="true" />{t("experimentalV4BulkPaste.osiagnieto_limit_miejsc_czesc_listy")}</p> : null}
        {outcome.errors?.length ? (
          <ul className="experimental-v4-bulk-errors" role="list">
            {outcome.errors.map((error, index) => <li key={index}><strong>{error.content}</strong> — {error.reason}</li>)}
          </ul>
        ) : null}
        <div className="experimental-v4-bulk-actions">
          <button type="button" className="experimental-v4-btn" onClick={() => setOutcome(null)}>{t("experimentalV4BulkPaste.wklej_kolejna_liste")}</button>
          <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={onClose}>{t("experimentalV4BulkPaste.zamknij")}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="experimental-v4-bulk" aria-labelledby={`${id}-title`}>
      <div className="experimental-v4-bulk-head">
        <h3 id={`${id}-title`} className="experimental-v4-bulk-title"><ClipboardPaste className="h-4 w-4" aria-hidden="true" />{t("experimentalV4BulkPaste.wklej_liste_uczestnikow")}</h3>
        <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="sr-only" tabIndex={-1} onChange={loadFile} aria-hidden="true" />
        <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => fileRef.current?.click()}>
          <FileUp className="h-4 w-4" aria-hidden="true" />{t("experimentalV4BulkPaste.wczytaj_plik")}</button>
      </div>
      <label htmlFor={`${id}-text`} className="experimental-v4-muted">
        {teams ? t("experimentalV4BulkPaste.jedna_druzyna_w_wierszu_mozesz") : t("experimentalV4BulkPaste.jeden_zawodnik_w_wierszu_mozesz")}
      </label>
      <textarea
        id={`${id}-text`}
        className="experimental-v4-bulk-text"
        value={text}
        onChange={(event) => { setText(event.target.value); setConfirmReplace(false); }}
        rows={7}
        spellCheck={false}
        placeholder={t("experimentalV4BulkPaste.kowalski_nowak_team_alfa_3")}
        aria-describedby={`${id}-summary`}
      />

      {hasPlayers ? (
        <fieldset className="experimental-v4-bulk-mode">
          <legend className="experimental-v4-kicker">{t("experimentalV4BulkPaste.co_zrobic_z_obecna_lista")}{existingNames.length})?</legend>
          <label><input type="radio" name={`${id}-mode`} checked={mode === "append"} onChange={() => { setMode("append"); setConfirmReplace(false); }} />{" "}{t("experimentalV4BulkPaste.dopisz_do_listy")}</label>
          <label><input type="radio" name={`${id}-mode`} checked={mode === "replace"} onChange={() => { setMode("replace"); setConfirmReplace(false); }} />{" "}{t("experimentalV4BulkPaste.zastap_cala_liste")}</label>
        </fieldset>
      ) : null}

      {parsed.rows.length > 0 ? (
        <>
          <div id={`${id}-summary`} className="experimental-v4-bulk-summary" role="status" aria-live="polite">
            <span className="experimental-v4-chip" data-tone="success"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{plural(toAdd, t("experimentalV4BulkPaste.do_dodania"), t("experimentalV4BulkPaste.do_dodania"), t("experimentalV4BulkPaste.do_dodania"))}</span>
            {parsed.invalid.length ? <span className="experimental-v4-chip" data-tone="danger"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />{plural(parsed.invalid.length, t("experimentalV4BulkPaste.wiersz_z_bledem"), t("experimentalV4BulkPaste.wiersze_z_bledem"), t("experimentalV4BulkPaste.wierszy_z_bledem"))}</span> : null}
            {parsed.overCapacity ? <span className="experimental-v4-chip" data-tone="warning"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />{plural(parsed.overCapacity, t("experimentalV4BulkPaste.nie_zmiesci_sie"), t("experimentalV4BulkPaste.nie_zmieszcza_sie"), t("experimentalV4BulkPaste.nie_zmiesci_sie"))}{" "}{t("experimentalV4BulkPaste.limit")}{" "}{maxPlayers ?? 256})</span> : null}
            {parsed.headerDetected ? <span className="experimental-v4-chip" data-tone="info">{t("experimentalV4BulkPaste.naglowek_rozpoznany")}</span> : null}
          </div>
          {parsed.invalid.length ? (
            <div className="experimental-v4-bulk-actions">
              <label className="experimental-v4-bulk-toggle"><input type="checkbox" checked={onlyErrors} onChange={(event) => setOnlyErrors(event.target.checked)} />{" "}{t("experimentalV4BulkPaste.pokaz_tylko_bledy")}</label>
              <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={removeInvalid}><Trash2 className="h-4 w-4" aria-hidden="true" />{t("experimentalV4BulkPaste.usun_bledne_wiersze")}</button>
            </div>
          ) : null}
          <div className="experimental-v4-bulk-table" tabIndex={0} role="region" aria-label={t("experimentalV4BulkPaste.podglad_wklejonej_listy")}>
            <table>
              <thead><tr><th scope="col">{t("experimentalV4BulkPaste.wiersz")}</th><th scope="col">{t("experimentalV4BulkPaste.nick")}</th><th scope="col">{t("experimentalV4BulkPaste.druzyna")}</th><th scope="col">{t("experimentalV4BulkPaste.rozst")}</th><th scope="col">{t("experimentalV4BulkPaste.stan")}</th></tr></thead>
              <tbody>
                {rows.slice(0, PREVIEW_LIMIT).map((row) => (
                  <tr key={row.line} data-invalid={row.error ? "true" : undefined}>
                    <td className="tabular-nums">{row.line}</td>
                    <td>{row.name || <em className="experimental-v4-muted">{t("experimentalV4BulkPaste.pusty")}</em>}</td>
                    <td>{row.team}</td>
                    <td className="tabular-nums">
                      {row.seed ?? ""}
                      {row.autoSeed ? <small className="experimental-v4-muted" title={t("experimentalV4BulkPaste.rozstawienie_nadane_automatycznie_po_wpi")}>{" "}{t("experimentalV4BulkPaste.auto")}</small> : null}
                    </td>
                    <td>{row.error ? <span className="experimental-v4-bulk-error">{row.error}</span> : <span className="experimental-v4-bulk-ok">{t("experimentalV4BulkPaste.ok")}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > PREVIEW_LIMIT ? <p className="experimental-v4-muted">{t("experimentalV4BulkPaste.pokazano")}{" "}{PREVIEW_LIMIT}{" "}{t("i18n.word.of")}{" "}{rows.length}{" "}{t("experimentalV4BulkPaste.wierszy")}</p> : null}
          </div>
        </>
      ) : null}

      {confirmReplace ? (
        <p className="experimental-v4-bulk-warn" role="alert">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />{t("experimentalV4BulkPaste.obecni_zawodnicy")}{existingNames.length}{t("experimentalV4BulkPaste.zostana_usunieci_i_zastapieni_nowa")}</p>
      ) : null}
      <div className="experimental-v4-bulk-actions">
        <button type="button" className="experimental-v4-btn" data-variant="primary" disabled={!toAdd || pending} onClick={() => void submit()}>
          {pending ? t("experimentalV4BulkPaste.dodawanie") : confirmReplace ? t("experimentalV4BulkPaste.zastap_liste_toadd", { toAdd: toAdd }) : toAdd ? t("experimentalV4BulkPaste.dodaj_v0", { v0: teams ? plural(toAdd, t("experimentalV4BulkPaste.druzyne"), t("experimentalV4BulkPaste.druzyny"), t("experimentalV4BulkPaste.druzyn")) : plural(toAdd, t("experimentalV4BulkPaste.zawodnika"), t("experimentalV4BulkPaste.zawodnikow"), t("experimentalV4BulkPaste.zawodnikow")) }) : teams ? t("experimentalV4BulkPaste.dodaj_druzyny") : t("experimentalV4BulkPaste.dodaj_zawodnikow")}
        </button>
        <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={onClose}>{t("experimentalV4BulkPaste.anuluj")}</button>
      </div>
    </section>
  );
}
