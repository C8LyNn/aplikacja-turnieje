import { t } from "@/i18n";
import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileJson, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { plural, rangeText, type PresetParams, type PresetPreview, type ParticipantType, type PresetId, type Visibility, type WizardKind } from "./experimental-create-wizard-model";

/** Mirrors the server's AiTournamentConfigV1 after validation. */
export interface ImportedAiConfig {
  schemaVersion: 1;
  kind: WizardKind;
  participants: { type: ParticipantType; count: number };
  visibility: Visibility;
  structure: { type: "preset"; presetId: PresetId; params: PresetParams } | { type: "stages"; stages: unknown[] };
  /** V5.3: league schedule for the first league/group stage. */
  schedule?: { timeZone?: string; startDate: string; intervalDays: number; defaultTime: string };
  notes?: string;
}

export type AiImportResult =
  | { valid: true; config: ImportedAiConfig; preview: PresetPreview; continueIn: "wizard" | "advanced"; notes: string | null }
  | { valid: false; problems: Array<{ path: string; code: string; message: string }> };

export const AI_SPEC_URL = "/api/tournaments/ai-spec.md";
export const AI_SCHEMA_URL = "/api/tournaments/ai-spec/schema.json";
const MAX_BYTES = 64 * 1024;

export function ExperimentalAiImport({
  onUse,
  onClose,
}: {
  onUse: (result: Extract<AiImportResult, { valid: true }>) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [result, setResult] = useState<AiImportResult | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const check = async (raw: string) => {
    setResult(null);
    setNetworkError(null);
    if (new Blob([raw]).size > MAX_BYTES) {
      setStatus("done");
      setResult({ valid: false, problems: [{ path: "", code: "TOO_LARGE", message: t("experimentalAiImport.plik_jest_za_duzy_maks") }] });
      return;
    }
    setStatus("checking");
    try {
      const response = await fetch("/api/tournaments/ai-config/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ text: raw }),
      });
      const body = (await response.json()) as AiImportResult;
      setResult(body);
      setStatus("done");
    } catch {
      setNetworkError(t("experimentalAiImport.nie_udalo_sie_polaczyc_z"));
      setStatus("error");
    }
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setStatus("done");
      setResult({ valid: false, problems: [{ path: "", code: "TOO_LARGE", message: t("experimentalAiImport.plik_jest_za_duzy_maks") }] });
      return;
    }
    const content = await file.text();
    setText(content);
    await check(content);
  };

  const valid = result?.valid ? result : null;
  return (
    <section className="experimental-ai-import" aria-labelledby="experimental-ai-import-title">
      <div className="experimental-ai-import-head">
        <div>
          <p className="experimental-wizard-eyebrow"><Sparkles className="inline h-3.5 w-3.5" aria-hidden="true" /> {t("experimentalAiImport.projektowanie_z_ai")}</p>
          <h3 id="experimental-ai-import-title">{t("experimentalAiImport.wczytaj_plan_przygotowany_przez_ai")}</h3>
        </div>
        <button type="button" className="experimental-wizard-step-btn" aria-label={t("experimentalAiImport.zamknij_import")} onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <ol className="experimental-ai-import-steps">
        <li>
          <strong>{t("experimentalAiImport.pobierz_specyfikacje")}</strong> {t("experimentalAiImport.i_przekaz_ja_dowolnemu_modelowi")}<span className="experimental-ai-import-links">
            <a className="experimental-v4-btn" href={AI_SPEC_URL} download>
              <Download className="h-4 w-4" aria-hidden="true" /> {t("experimentalAiImport.specyfikacja_dla_ai_md")}</a>
            <a className="experimental-v4-btn" data-variant="ghost" href={AI_SCHEMA_URL} download>
              <FileJson className="h-4 w-4" aria-hidden="true" /> {t("experimentalAiImport.schemat_json")}</a>
          </span>
        </li>
        <li><strong>{t("experimentalAiImport.opisz_rozgrywki")}</strong> {t("experimentalAiImport.np_24_druzyny_grupy_po")}</li>
        <li><strong>{t("experimentalAiImport.wklej_odpowiedz_ai")}</strong> {t("experimentalAiImport.albo_wczytaj_plik_sprawdzimy_go")}</li>
        <li><strong>{t("experimentalAiImport.popraw_i_zatwierdz")}</strong> {t("experimentalAiImport.nazwe_i_haslo_wpiszesz_sam")}</li>
      </ol>

      <div className="experimental-wizard-field">
        <label htmlFor="experimental-ai-import-text" className="experimental-wizard-legend">{t("experimentalAiImport.plik_json_od_ai")}</label>
        <Textarea
          id="experimental-ai-import-text"
          rows={8}
          spellCheck={false}
          value={text}
          placeholder='{ "schemaVersion": 1, "participants": { "count": 16 }, "structure": { "type": "preset", "presetId": "groups_playoff" } }'
          onChange={(event) => {
            setText(event.target.value);
            setResult(null);
            setStatus("idle");
          }}
          className="experimental-ai-import-textarea"
        />
        <div className="experimental-wizard-inline-actions">
          <button type="button" className="experimental-v4-btn" data-variant="primary" disabled={!text.trim() || status === "checking"} onClick={() => void check(text)}>
            {status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
            {t("experimentalAiImport.sprawdz_plik")}</button>
          <button type="button" className="experimental-v4-btn" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden="true" /> {t("experimentalAiImport.wczytaj_plik")}</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json,.txt"
            className="experimental-wizard-sr"
            aria-label={t("experimentalAiImport.wybierz_plik_json_od_ai")}
            onChange={(event) => {
              void loadFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {networkError && (
        <p className="experimental-wizard-note" data-tone="danger" role="alert"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{networkError}</p>
      )}

      {result && !result.valid && (
        <div className="experimental-ai-import-problems" role="alert">
          <p><AlertTriangle className="inline h-4 w-4" aria-hidden="true" /> {t("experimentalAiImport.plik_wymaga_poprawek")}{result.problems.length}{t("experimentalAiImport.nic_nie_zostalo_zapisane")}</p>
          <ul>
            {result.problems.map((problem, index) => (
              <li key={`${problem.path}-${index}`}>
                {problem.path && <code>{problem.path}</code>} {problem.message}
              </li>
            ))}
          </ul>
          <p className="experimental-wizard-help">{t("experimentalAiImport.mozesz_skopiowac_te_liste_do")}</p>
        </div>
      )}

      {valid && (
        <div className="experimental-ai-import-ok" role="status">
          <p className="experimental-ai-import-ok-title"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /> {t("experimentalAiImport.plik_jest_poprawny")}</p>
          <p>
            <strong>{valid.preview.label}</strong> · {valid.config.participants.count} {valid.config.participants.type === "teams" ? plural(valid.config.participants.count, t("experimentalAiImport.druzyna"), t("experimentalAiImport.druzyny"), t("experimentalAiImport.druzyn")) : plural(valid.config.participants.count, t("experimentalAiImport.uczestnik"), t("experimentalAiImport.uczestnikow"), t("experimentalAiImport.uczestnikow"))}
            {" · "}{rangeText(valid.preview.totals.matches)} {plural(valid.preview.totals.matches.max, t("experimentalAiImport.mecz"), t("experimentalAiImport.mecze"), t("experimentalAiImport.meczow"))}
            {" · "}{valid.preview.stages.map((stage) => stage.name).join(" → ")}
          </p>
          {valid.notes && (
            <figure className="experimental-ai-import-notes">
              <figcaption>{t("experimentalAiImport.uwagi_z_pliku_tylko_do")}</figcaption>
              <blockquote>{valid.notes}</blockquote>
            </figure>
          )}
          <p className="experimental-wizard-help">
            {valid.continueIn === "wizard"
              ? t("experimentalAiImport.przejdziesz_do_kroku_dopasuj_gdzie")
              : t("experimentalAiImport.to_wlasny_plan_etapow_otworzymy")}
          </p>
          <button type="button" className="experimental-v4-btn" data-variant="primary" onClick={() => onUse(valid)}>
            {t("experimentalAiImport.uzyj_tej_konfiguracji")}</button>
        </div>
      )}
    </section>
  );
}
