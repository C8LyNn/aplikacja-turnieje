import { t } from "@/i18n";
import { MATCH_PARAM_KEYS, MatchRulesChoice } from "./experimental-match-rules-choice";
import { LEAGUE_PARAM_KEYS, LeagueOptions } from "./experimental-league-options";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Globe,
  Info,
  Layers,
  Loader2,
  Lock,
  Minus,
  Plus,
  Scale,
  Settings2,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  User,
  Users,
  Zap,
} from "lucide-react";
import { setActiveOrganizerToken, useCreateTournament } from "@workspace/api-client-react";
import { PasswordField } from "@/components/password-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import {
  ORGANIZER_PASSWORD_MIN_LENGTH,
  organizerPasswordError,
  organizerPasswordRemaining,
  tournamentNameError,
} from "@/lib/create-tournament-validation";
import { getApiErrorMessage } from "@/lib/tournament-stages-ui";
import {
  buildCreatePayload,
  clampCount,
  COUNT_SHORTCUTS,
  DEFAULT_DRAFT,
  MAX_PARTICIPANTS,
  MIN_PARTICIPANTS,
  participantNoun,
  plural,
  rangeText,
  readWizardDraft,
  reconcilePresetAfterAnswers,
  requestParams,
  WIZARD_DRAFT_KEY,
  WIZARD_STEPS,
  customPlanFromPreview,
  stageChain,
  writeWizardDraft,
  type PresetParamKey,
  type PresetParamLimit,
  type PresetPreview,
  type PresetRecommendation,
  type RecommendationResult,
  type Visibility,
  type WizardAnswers,
  type WizardDraft,
  type WizardStepIndex,
  bestOfLabel,
  stageDecisionText,
  formatLocalDate,
  scheduleOutline,
  isLeagueOnly,
  scheduleTargetStage,
  type WizardSchedule,
} from "./experimental-create-wizard-model";
import { ExperimentalAiImport, type AiImportResult } from "./experimental-ai-import";
import { FormatSketch } from "@/components/format-sketch";

const ADVANCED_PATH = "/experimental/tournaments/new/advanced";
/** V5.4: seeding rules live in the advanced editor; the simple wizard keeps the safe defaults. */
export const ADVANCED_PARAM_KEYS: PresetParamKey[] = ["entrySeeding", "groupPlacement", "qualifierSeeding"];

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

async function postJson<T>(url: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string; param?: PresetParamKey };
  if (!response.ok) {
    const error = new Error(data.error || t("experimentalCreateWizard.serwer_odpowiedzial_bledem_http_status", { status: response.status })) as Error & { param?: PresetParamKey };
    error.param = data.param;
    throw error;
  }
  return data;
}

// ── small building blocks ───────────────────────────────────────────────────

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
}

function ChoiceGroup<T extends string>({
  legend,
  help,
  options,
  value,
  onChange,
  columns = 2,
}: {
  legend: string;
  help?: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3;
}) {
  const name = useId();
  return (
    <fieldset className="experimental-wizard-field">
      <legend className="experimental-wizard-legend">{legend}</legend>
      {help && <p className="experimental-wizard-help">{help}</p>}
      <div className="experimental-wizard-choices" data-columns={columns}>
        {options.map((option) => (
          <label key={option.value} className="experimental-wizard-choice" data-checked={option.value === value ? "true" : "false"}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="experimental-wizard-sr"
            />
            {option.icon && <span className="experimental-wizard-choice-icon" aria-hidden="true">{option.icon}</span>}
            <span className="experimental-wizard-choice-text">
              <span className="experimental-wizard-choice-label">{option.label}</span>
              {option.hint && <span className="experimental-wizard-choice-hint">{option.hint}</span>}
            </span>
            <Check className="experimental-wizard-choice-check" aria-hidden="true" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CountField({ value, onChange, noun }: { value: number; onChange: (value: number) => void; noun: (n: number) => string }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = (raw: string) => {
    const next = clampCount(raw);
    setText(String(next));
    onChange(next);
  };
  return (
    <fieldset className="experimental-wizard-field">
      <legend className="experimental-wizard-legend">{noun(5) === "drużyn" ? t("experimentalCreateWizard.ile") : t("experimentalCreateWizard.ilu")} {noun(5)} {t("experimentalCreateWizard.planujesz")}</legend>
      <p className="experimental-wizard-help">{t("experimentalCreateWizard.wystarczy_przyblizona_liczba_zmienisz_ja")}</p>
      <div className="experimental-wizard-count">
        <button type="button" className="experimental-wizard-step-btn" aria-label={t("experimentalCreateWizard.mniej")} disabled={value <= MIN_PARTICIPANTS} onClick={() => onChange(value - 1)}>
          <Minus className="h-4 w-4" />
        </button>
        <Input
          aria-label={t("experimentalCreateWizard.liczba_v0", { v0: noun(5) })}
          inputMode="numeric"
          className="experimental-wizard-count-input"
          value={text}
          onChange={(event) => setText(event.target.value.replace(/[^\d]/g, "").slice(0, 3))}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit((event.target as HTMLInputElement).value);
            }
          }}
        />
        <button type="button" className="experimental-wizard-step-btn" aria-label={t("experimentalCreateWizard.wiecej")} disabled={value >= MAX_PARTICIPANTS} onClick={() => onChange(value + 1)}>
          <Plus className="h-4 w-4" />
        </button>
        <div className="experimental-wizard-count-shortcuts" role="group" aria-label={t("experimentalCreateWizard.szybki_wybor")}>
          {COUNT_SHORTCUTS.map((count) => (
            <button key={count} type="button" className="experimental-wizard-chip" aria-pressed={value === count} onClick={() => onChange(count)}>
              {count}
            </button>
          ))}
        </div>
      </div>
    </fieldset>
  );
}

function Stepper({ step, maxVisited, onGo }: { step: WizardStepIndex; maxVisited: WizardStepIndex; onGo: (step: WizardStepIndex) => void }) {
  return (
    <nav aria-label={t("experimentalCreateWizard.kroki_kreatora")} className="experimental-wizard-stepper">
      <ol>
        {WIZARD_STEPS.map((item, index) => {
          const state = index === step ? "current" : index < step || index <= maxVisited ? "done" : "todo";
          return (
            <li key={item.id} data-state={state}>
              <button
                type="button"
                onClick={() => onGo(index as WizardStepIndex)}
                disabled={index > maxVisited}
                aria-current={index === step ? "step" : undefined}
              >
                <span className="experimental-wizard-stepper-dot" aria-hidden="true">
                  {state === "done" && index !== step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="experimental-wizard-stepper-label">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="experimental-wizard-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
      {hint && <p>{hint}</p>}
    </div>
  );
}

function PresetStats({ preview, teams = false }: { preview: PresetPreview; teams?: boolean }) {
  const per = preview.totals.matchesPerParticipant;
  return (
    <dl className="experimental-wizard-stats">
      <Stat label={t("experimentalCreateWizard.mecze")} value={rangeText(preview.totals.matches)} />
      {isLeagueOnly(preview)
        ? <Stat label={t("experimentalCreateWizard.kolejki")} value={rangeText(preview.totals.rounds)} hint={t("experimentalCreateWizard.kazdy_gra_najwyzej_raz_w")} />
        : <Stat label={t("experimentalCreateWizard.rundy")} value={rangeText(preview.totals.rounds)} hint={t("experimentalCreateWizard.lacznie_we_wszystkich_etapach")} />}
      <Stat label={teams ? t("experimentalCreateWizard.mecze_na_druzyne") : t("experimentalCreateWizard.mecze_na_osobe")} value={per.min === per.max ? String(per.min) : `${per.min}–${per.max}`} hint={per.min === per.max ? t("experimentalCreateWizard.tyle_samo_dla_kazdego") : t("experimentalCreateWizard.zaleznie_od_wynikow")} />
    </dl>
  );
}

export function StageFlow({ preview }: { preview: PresetPreview }) {
  return (
    <ol className="experimental-wizard-flow" aria-label={t("experimentalCreateWizard.uklad_etapow")}>
      {preview.stages.map((stage) => (
        <li key={stage.key} className="experimental-wizard-flow-stage" data-format={stage.format}>
          <div className="experimental-wizard-flow-head">
            <span className="experimental-wizard-flow-index">{stage.position}</span>
            <div className="min-w-0">
              <p className="experimental-wizard-flow-name">{stage.name}</p>
              <p className="experimental-wizard-flow-format">{stage.formatLabel} · {stageDecisionText(preview.stagePlan?.stages.find((planned) => planned.position === stage.position)?.matchRules ?? preview.matchRules, stage.bestOf)}</p>
            </div>
          </div>
          <ul className="experimental-wizard-flow-facts">
            <li>{stage.participantCount} {plural(stage.participantCount, t("experimentalCreateWizard.uczestnik"), t("experimentalCreateWizard.uczestnikow"), t("experimentalCreateWizard.uczestnikow"))}</li>
            {stage.groupSizes && (
              <li>
                {stage.groupSizes.length} {plural(stage.groupSizes.length, t("experimentalCreateWizard.grupa"), t("experimentalCreateWizard.grupy"), t("experimentalCreateWizard.grup"))}
                {new Set(stage.groupSizes).size === 1 ? ` po ${stage.groupSizes[0]}` : ` (${stage.groupSizes.join(", ")})`}
              </li>
            )}
            <li>{rangeText(stage.matches)} {plural(stage.matches.max, t("experimentalCreateWizard.mecz"), t("experimentalCreateWizard.mecze_2"), t("experimentalCreateWizard.meczow"))} · {rangeText(stage.rounds)} {plural(stage.rounds.max, t("experimentalCreateWizard.runda"), t("experimentalCreateWizard.rundy_2"), t("experimentalCreateWizard.rund"))}</li>
            {stage.byes > 0 && <li>{stage.byes} {plural(stage.byes, t("experimentalCreateWizard.wolny_los"), t("experimentalCreateWizard.wolne_losy"), t("experimentalCreateWizard.wolnych_losow"))}</li>}
          </ul>
          <p className="experimental-wizard-flow-advance">
            {stage.advancingCount != null ? <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
            <span>{stage.advancementText}</span>
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Publishes the action bar's rendered height as --x-wizard-actions-h on the wizard root; returns the cleanup. */
export function syncActionBarHeight(root: HTMLElement | null, bar: HTMLElement | null): (() => void) | undefined {
  if (!root || !bar) return undefined;
  const apply = () => root.style.setProperty("--x-wizard-actions-h", `${Math.ceil(bar.getBoundingClientRect().height)}px`);
  apply();
  if (typeof ResizeObserver === "undefined") return undefined;
  const observer = new ResizeObserver(apply);
  observer.observe(bar);
  return () => observer.disconnect();
}

export function PreviewPanel({
  preview,
  noun,
  loading,
  stale,
  schedule = null,
  compact = false,
}: {
  preview: PresetPreview | null;
  noun: (n: number) => string;
  loading: boolean;
  stale: boolean;
  schedule?: WizardSchedule | null;
  /** V5.4: rules and notes fold away (format step, final step); numbers and stages stay visible. */
  compact?: boolean;
}) {
  if (!preview) {
    return (
      <aside className="experimental-wizard-preview" aria-label={t("experimentalCreateWizard.podglad_rozgrywek")} aria-busy={loading}>
        <p className="experimental-wizard-help">{loading ? t("experimentalCreateWizard.przygotowuje_podglad") : t("experimentalCreateWizard.wybierz_format_aby_zobaczyc_podglad")}</p>
      </aside>
    );
  }
  const people = preview.participants;
  return (
    <aside className="experimental-wizard-preview" aria-label={t("experimentalCreateWizard.podglad_rozgrywek")} aria-busy={loading} data-stale={stale ? "true" : "false"}>
      <div className="experimental-wizard-preview-head">
        <p className="experimental-wizard-eyebrow">{t("experimentalCreateWizard.podglad")}{" "}{loading && <Loader2 className="inline h-3.5 w-3.5 animate-spin" aria-label={t("experimentalCreateWizard.aktualizowanie")} />}</p>
        <h3>{preview.label}</h3>
        <p className="experimental-wizard-chip-static" data-mode={people.mode}>
          {people.mode === "exact"
            ? t("experimentalCreateWizard.dokladnie_count_v1", { count: people.count, v1: noun(people.count) })
            : t("experimentalCreateWizard.od_minimum_do_count_v2", { minimum: people.minimum, count: people.count, v2: noun(5) })}
        </p>
      </div>
      <PresetStats preview={preview} teams={noun(5) === "drużyn"} />
      {/* #323-C: the layout drawn from the same preview numbers, before anything is created. */}
      <FormatSketch stages={preview.stages} accent="var(--x-gold)" captions={!compact} className="experimental-wizard-sketch" />
      <StageFlow preview={preview} />
      {compact ? (
        <details className="experimental-wizard-more experimental-wizard-preview-more">
          <summary>
            {t("experimentalCreateWizard.zasady_kolejki_i_uwagi")}{preview.requirements.length + preview.warnings.length > 0 && (
              <span className="experimental-wizard-count-badge">{preview.requirements.length + preview.warnings.length}</span>
            )}
          </summary>
          <PreviewRules preview={preview} schedule={schedule} />
        </details>
      ) : (
        <PreviewRules preview={preview} schedule={schedule} />
      )}
    </aside>
  );
}

function PreviewRules({ preview, schedule }: { preview: PresetPreview; schedule: WizardSchedule | null }) {
  return (
    <>
      <LeagueFacts preview={preview} schedule={schedule} />
      <section className="experimental-wizard-rules">
        <h4><Trophy className="h-4 w-4" aria-hidden="true" /> {t("experimentalCreateWizard.zwyciezca")}</h4>
        <p>{preview.winnerRule}</p>
        <h4><Scale className="h-4 w-4" aria-hidden="true" /> {t("experimentalCreateWizard.remisy_i_rowne_miejsca")}</h4>
        <ul>{preview.tieRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
      </section>
      {(preview.requirements.length > 0 || preview.warnings.length > 0) && (
        <ul className="experimental-wizard-notes">
          {preview.requirements.map((text) => (
            <li key={text} data-tone="warning"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{text}</li>
          ))}
          {preview.warnings.map((text) => (
            <li key={text} data-tone="info"><Info className="h-4 w-4 shrink-0" aria-hidden="true" />{text}</li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * V5.3: rounds, resting participants and dates in plain words. Scoring is explained once, under
 * "Remisy i równe miejsca" (the server's own description of the rules).
 */
function LeagueFacts({ preview, schedule }: { preview: PresetPreview; schedule: WizardSchedule | null }) {
  const outline = scheduleOutline(preview, schedule) ?? (preview.schedule
    ? { stageName: preview.schedule.stageName, rounds: preview.schedule.rounds, firstDate: preview.schedule.firstDate, lastDate: preview.schedule.lastDate, weeks: 0 }
    : null);
  const target = scheduleTargetStage(preview);
  if (!target) return null;
  return (
    <section className="experimental-wizard-rules" data-testid="league-facts">
      {(
        <>
          <h4><CalendarDays className="h-4 w-4" aria-hidden="true" /> {t("experimentalCreateWizard.kolejki_i_terminy")}</h4>
          <p>
            {target.rounds.max} {plural(target.rounds.max, t("experimentalCreateWizard.kolejka"), t("experimentalCreateWizard.kolejki_2"), t("experimentalCreateWizard.kolejek"))}
            {target.byes > 0 || target.participantCount % 2 === 1 ? t("experimentalCreateWizard.w_kazdej_kolejce_jeden_uczestnik") : ""}.{" "}
            {outline
              ? t("experimentalCreateWizard.od_v0_do_v1", { v0: formatLocalDate(outline.firstDate), v1: formatLocalDate(outline.lastDate) })
              : t("experimentalCreateWizard.bez_terminarza_daty_mozesz_dodac")}
          </p>
        </>
      )}
    </section>
  );
}

const FAMILY_ICON: Record<PresetPreview["family"], ReactNode> = {
  elimination: <Swords className="h-5 w-5" />,
  points: <Scale className="h-5 w-5" />,
  multi_stage: <Layers className="h-5 w-5" />,
};

function PresetCard({
  item,
  selected,
  onSelect,
}: {
  item: PresetRecommendation;
  selected: boolean;
  onSelect: () => void;
}) {
  const preview = item.preview!;
  return (
    <label className="experimental-wizard-preset" data-checked={selected ? "true" : "false"} data-recommended={item.recommended ? "true" : "false"}>
      <input type="radio" name="experimental-wizard-preset" checked={selected} onChange={onSelect} className="experimental-wizard-sr" />
      <span className="experimental-wizard-preset-icon" aria-hidden="true">{FAMILY_ICON[item.family]}</span>
      <span className="experimental-wizard-preset-body">
        <span className="experimental-wizard-preset-title">
          {item.label}
          {item.recommended && <span className="experimental-wizard-badge"><Sparkles className="h-3 w-3" aria-hidden="true" /> {t("experimentalCreateWizard.polecany")}</span>}
        </span>
        <span className="experimental-wizard-preset-short">{item.short}</span>
        {item.reasons.length > 0 && (
          <span className="experimental-wizard-preset-reasons">
            {/* V5.8: the recommendation says why, in the user's terms. */}
            {item.recommended ? t("experimentalCreateWizard.polecamy_bo_v0", { v0: item.reasons.join(" ").replace(/^./, (first) => first.toLowerCase()) }) : item.reasons.join(" ")}
          </span>
        )}
        <span className="experimental-wizard-preset-meta">
          {rangeText(preview.totals.matches)} {plural(preview.totals.matches.max, t("experimentalCreateWizard.mecz"), t("experimentalCreateWizard.mecze_2"), t("experimentalCreateWizard.meczow"))} · {rangeText(preview.totals.rounds)} {plural(preview.totals.rounds.max, t("experimentalCreateWizard.runda"), t("experimentalCreateWizard.rundy_2"), t("experimentalCreateWizard.rund"))}
          {preview.stages.length > 1 ? t("experimentalCreateWizard.length_etapy", { length: preview.stages.length }) : ""} {t("experimentalCreateWizard.min")}{" "}{preview.totals.matchesPerParticipant.min} {plural(preview.totals.matchesPerParticipant.min, t("experimentalCreateWizard.mecz"), t("experimentalCreateWizard.mecze_2"), t("experimentalCreateWizard.meczow"))} {t("experimentalCreateWizard.na_osobe")}</span>
        {/* V5.8: how people advance (multi-stage) and how the winner is decided — the real differences, from the engine. */}
        <span className="experimental-wizard-preset-rules">
          {[preview.stages.length > 1 ? preview.stages[0]?.advancementText : null, preview.winnerRule].filter(Boolean).join(" ")}
        </span>
      </span>
      <Check className="experimental-wizard-choice-check" aria-hidden="true" />
    </label>
  );
}

export function ParamControl({
  limit,
  onChange,
  error,
}: {
  limit: PresetParamLimit;
  onChange: (value: number) => void;
  error?: string;
}) {
  const id = useId();
  const isBestOf = limit.key === "bestOf" || limit.key === "playoffBestOf";
  const isLegs = limit.key === "legs";
  const index = limit.options.indexOf(limit.value);
  const labels = limit.optionLabels;
  const segmented = isBestOf || isLegs || Boolean(labels) || limit.options.length <= 6;
  const format = (value: number) => (labels ? labels[limit.options.indexOf(value)] ?? String(value) : isBestOf ? bestOfLabel(value) : isLegs ? (value === 2 ? t("experimentalCreateWizard.mecz_i_rewanz") : t("experimentalCreateWizard.jeden_mecz")) : String(value));
  return (
    <div className="experimental-wizard-param" data-invalid={error ? "true" : undefined}>
      <div className="experimental-wizard-param-head">
        <span className="experimental-wizard-legend" id={`${id}-label`}>{limit.label}</span>
        <span className="experimental-wizard-help" id={`${id}-help`}>{limit.help}</span>
      </div>
      {segmented ? (
        <div className="experimental-wizard-segments" role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={`${id}-help`}>
          {limit.options.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={value === limit.value}
              className="experimental-wizard-chip"
              onClick={() => onChange(value)}
            >
              {format(value)}
            </button>
          ))}
        </div>
      ) : (
        <div className="experimental-wizard-count" role="group" aria-labelledby={`${id}-label`}>
          <button type="button" className="experimental-wizard-step-btn" aria-label={t("experimentalCreateWizard.label_mniej", { label: limit.label })} disabled={index <= 0} onClick={() => onChange(limit.options[index - 1])}>
            <Minus className="h-4 w-4" />
          </button>
          <output className="experimental-wizard-count-value" aria-live="polite">{format(limit.value)}</output>
          <button type="button" className="experimental-wizard-step-btn" aria-label={t("experimentalCreateWizard.label_wiecej", { label: limit.label })} disabled={index >= limit.options.length - 1} onClick={() => onChange(limit.options[index + 1])}>
            <Plus className="h-4 w-4" />
          </button>
          <span className="experimental-wizard-help">{t("experimentalCreateWizard.zakres")}{" "}{limit.options[0]}–{limit.options.at(-1)}</span>
        </div>
      )}
      {error && <p role="alert" className="experimental-wizard-error">{error}</p>}
    </div>
  );
}

// ── the wizard ──────────────────────────────────────────────────────────────

type Remote<T> = { status: "idle" | "loading" | "ready" | "error"; data: T | null; error: string | null; param?: PresetParamKey };

export function ExperimentalCreateWizard() {
  const [, navigate] = useLocation();
  const { storeOrgToken } = useAuth();
  const createTournament = useCreateTournament();
  const [draft, setDraft] = useState<WizardDraft>(() => readWizardDraft(safeSessionStorage()));
  const { step, answers, presetId, params } = draft;
  const noun = useCallback((n: number) => participantNoun(answers.participantType, n), [answers.participantType]);

  const [recommendations, setRecommendations] = useState<Remote<RecommendationResult>>({ status: "idle", data: null, error: null });
  const [preview, setPreview] = useState<Remote<PresetPreview>>({ status: "idle", data: null, error: null });
  const [organizerPassword, setOrganizerPassword] = useState("");
  const [supportPassword, setSupportPassword] = useState("");
  const [viewerPassword, setViewerPassword] = useState("");
  const [showPassword, setShowPassword] = useState({ organizer: false, support: false, viewer: false });
  const [touched, setTouched] = useState({ name: false, organizer: false });
  const [showValidation, setShowValidation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"checking" | "ready" | "unavailable">("checking");
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [imported, setImported] = useState(false);
  const submitInFlight = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wizardRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  // QW-01: the sticky preview column must end above the sticky action bar, whatever height the bar has.
  useLayoutEffect(() => syncActionBarHeight(wizardRef.current, actionsRef.current), [importOpen]);
  const nameRef = useRef<HTMLInputElement>(null);
  const organizerRef = useRef<HTMLInputElement>(null);
  const supportRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<HTMLInputElement>(null);

  const update = useCallback((patch: Partial<WizardDraft>) => setDraft((current) => ({ ...current, ...patch })), []);
  const setAnswers = (patch: Partial<WizardAnswers>) =>
    setDraft((current) => ({ ...current, answers: { ...current.answers, ...patch }, params: {} }));

  useEffect(() => writeWizardDraft(safeSessionStorage(), draft), [draft]);

  const goTo = useCallback((next: WizardStepIndex) => {
    setDraft((current) => ({ ...current, step: next, maxVisitedStep: Math.max(current.maxVisitedStep, next) as WizardStepIndex }));
  }, []);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    if (typeof window.scrollTo === "function" && !/jsdom/i.test(navigator.userAgent)) {
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* jsdom */ }
    }
  }, [step]);

  // Recommendations follow the answers.
  const answersKey = JSON.stringify(answers);
  useEffect(() => {
    if (step < 1) return;
    const controller = new AbortController();
    setRecommendations((current) => ({ ...current, status: "loading", error: null }));
    postJson<RecommendationResult>("/api/tournaments/presets/recommend", answers, controller.signal)
      .then((data) => {
        setRecommendations({ status: "ready", data, error: null });
        setDraft((current) => {
          const reconciled = reconcilePresetAfterAnswers(current.presetId, data.recommendations);
          return reconciled === current.presetId ? current : { ...current, presetId: reconciled, params: {} };
        });
      })
      .catch((error: Error) => {
        if (controller.signal.aborted) return;
        setRecommendations({ status: "error", data: null, error: error.message });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answersKey, step >= 1]);

  // Live preview for the chosen preset and tuned parameters.
  const requestKey = presetId ? JSON.stringify(requestParams(presetId, answers, params)) : "";
  useEffect(() => {
    if (!presetId || step < 1) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPreview((current) => ({ ...current, status: "loading" }));
      postJson<PresetPreview>(
        "/api/tournaments/presets/preview",
        { presetId, params: requestParams(presetId, answers, params), priority: answers.priority },
        controller.signal,
      )
        .then((data) => setPreview({ status: "ready", data, error: null }))
        .catch((error: Error & { param?: PresetParamKey }) => {
          if (controller.signal.aborted) return;
          setPreview((current) => ({ status: "error", data: current.data, error: error.message, param: error.param }));
        });
    }, 120);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId, requestKey, answers.priority, step >= 1]);

  const checkApiHealth = useCallback(async () => {
    setApiStatus("checking");
    try {
      const response = await fetch("/api/healthz", { headers: { Accept: "application/json" } });
      setApiStatus(response.ok ? "ready" : "unavailable");
    } catch {
      setApiStatus("unavailable");
    }
  }, []);
  useEffect(() => {
    if (step === 3) void checkApiHealth();
  }, [step, checkApiHealth]);

  const currentPreview = preview.data && preview.data.presetId === presetId ? preview.data : null;
  const previewValid = currentPreview != null && preview.status !== "error";
  const recommendationList = recommendations.data?.recommendations ?? [];
  const available = recommendationList.filter((item) => item.available);
  const unavailable = recommendationList.filter((item) => !item.available);
  const PRIMARY_PRESET_COUNT = 3;
  const selectedIndex = available.findIndex((item) => item.presetId === presetId);
  const visiblePresets = showAllPresets || selectedIndex >= PRIMARY_PRESET_COUNT ? available : available.slice(0, PRIMARY_PRESET_COUNT);
  const hiddenPresetCount = available.length - visiblePresets.length;
  const selectedRecommendation = recommendationList.find((item) => item.presetId === presetId) ?? null;
  // Before the tuned preview arrives, show the default preview from the recommendation.
  const shownPreview = currentPreview ?? selectedRecommendation?.preview ?? null;

  const nameProblem = tournamentNameError(draft.name);
  const organizerProblem = organizerPasswordError(organizerPassword);
  const supportProblem = supportPassword.length > 0 && supportPassword.length < ORGANIZER_PASSWORD_MIN_LENGTH
    ? t("experimentalCreateWizard.haslo_pomocnika_musi_miec_co", { ORGANIZER_PASSWORD_MIN_LENGTH: ORGANIZER_PASSWORD_MIN_LENGTH })
    : null;
  const viewerProblem = draft.visibility === "private_online" && viewerPassword.length < ORGANIZER_PASSWORD_MIN_LENGTH
    ? t("experimentalCreateWizard.haslo_dla_widzow_musi_miec", { ORGANIZER_PASSWORD_MIN_LENGTH: ORGANIZER_PASSWORD_MIN_LENGTH })
    : null;

  const reset = () => {
    try { safeSessionStorage()?.removeItem(WIZARD_DRAFT_KEY); } catch { /* ignore */ }
    setDraft(DEFAULT_DRAFT);
    setOrganizerPassword("");
    setSupportPassword("");
    setViewerPassword("");
    setShowValidation(false);
    setTouched({ name: false, organizer: false });
    setSubmitError(null);
  };

  const applyImported = (result: Extract<AiImportResult, { valid: true }>) => {
    setImportOpen(false);
    const config = result.config;
    if (config.structure.type !== "preset") {
      // A custom stage plan cannot be expressed by a preset: it is kept as-is and edited in the advanced editor.
      const next: WizardDraft = { ...draft, visibility: config.visibility, custom: customPlanFromPreview(result.preview) };
      writeWizardDraft(safeSessionStorage(), next);
      setDraft(next);
      navigate(ADVANCED_PATH);
      return;
    }
    const structure = config.structure;
    const continueInAdvanced = result.continueIn === "advanced";
    setDraft((current) => ({
      ...current,
      custom: null,
      step: 2,
      maxVisitedStep: Math.max(current.maxVisitedStep, 2) as WizardStepIndex,
      answers: { ...current.answers, kind: config.kind, participantType: config.participants.type, participantCount: config.participants.count },
      presetId: structure.presetId,
      params: { ...structure.params },
      visibility: config.visibility,
      schedule: config.schedule
        ? { timeZone: config.schedule.timeZone ?? "Europe/Warsaw", startDate: config.schedule.startDate, intervalDays: config.schedule.intervalDays, defaultTime: config.schedule.defaultTime }
        : current.schedule,
    }));
    setImported(true);
    if (continueInAdvanced) navigate(ADVANCED_PATH);
  };

  // V5.4: both modes edit the same persisted draft — nothing is converted or dropped on the way.
  const openAdvanced = () => {
    writeWizardDraft(safeSessionStorage(), draft);
    navigate(ADVANCED_PATH);
  };

  const submit = () => {
    setSubmitError(null);
    setShowValidation(true);
    const firstInvalid = nameProblem ? nameRef : organizerProblem ? organizerRef : supportProblem ? supportRef : viewerProblem ? viewerRef : null;
    if (firstInvalid) {
      firstInvalid.current?.focus();
      return;
    }
    if (!currentPreview || !previewValid) {
      setSubmitError(t("experimentalCreateWizard.podglad_rozgrywek_nie_jest_gotowy"));
      return;
    }
    if (apiStatus !== "ready") {
      setSubmitError(t("experimentalCreateWizard.serwer_turniejowy_jest_teraz_niedostepny"));
      return;
    }
    if (submitInFlight.current) return;
    submitInFlight.current = true;
    createTournament.mutate(
      {
        data: buildCreatePayload(currentPreview, { ...draft, participantType: answers.participantType }, {
          organizerPassword,
          supportPassword,
          viewerPassword,
        }),
      },
      {
        onSuccess: (response) => {
          submitInFlight.current = false;
          try { safeSessionStorage()?.removeItem(WIZARD_DRAFT_KEY); } catch { /* ignore */ }
          storeOrgToken(response.id, response.organizerToken);
          setActiveOrganizerToken(response.organizerToken);
          navigate(`/experimental/tournaments/${response.id}?tab=players`);
        },
        onError: (error) => {
          submitInFlight.current = false;
          setSubmitError(getApiErrorMessage(error));
          void checkApiHealth();
        },
      },
    );
  };

  const primary = (() => {
    switch (step) {
      case 0:
        return { label: t("experimentalCreateWizard.pokaz_propozycje"), disabled: false, onClick: () => goTo(1) };
      case 1:
        return { label: t("experimentalCreateWizard.dalej_dopasuj"), disabled: !presetId || recommendations.status !== "ready", onClick: () => goTo(2) };
      case 2:
        return { label: t("experimentalCreateWizard.dalej_nazwa_i_haslo"), disabled: !previewValid, onClick: () => goTo(3) };
      default:
        return {
          label: createTournament.isPending ? t("experimentalCreateWizard.tworzenie") : apiStatus === "checking" ? t("experimentalCreateWizard.sprawdzanie_serwera") : t("experimentalCreateWizard.utworz_turniej"),
          disabled: createTournament.isPending || apiStatus === "checking",
          onClick: submit,
        };
    }
  })();

  const title = [t("experimentalCreateWizard.jakie_rozgrywki_organizujesz"), t("experimentalCreateWizard.wybierz_format"), t("experimentalCreateWizard.dopasuj_szczegoly"), t("experimentalCreateWizard.nazwij_turniej_i_zabezpiecz_go")][step];
  const lead = [
    t("experimentalCreateWizard.odpowiedz_na_kilka_pytan_zaproponujemy"),
    t("experimentalCreateWizard.formaty_dobrane_do_participantcount_v1", { participantCount: answers.participantCount, v1: noun(answers.participantCount) }),
    t("experimentalCreateWizard.zmiany_od_razu_aktualizuja_podglad"),
    t("experimentalCreateWizard.haslo_organizatora_chroni_zarzadzanie_tu"),
  ][step];

  return (
    <div ref={wizardRef} className="experimental-wizard" data-step={step}>
      <header className="experimental-wizard-top">
        <div>
          <p className="experimental-wizard-eyebrow">{t("experimentalCreateWizard.nowe_rozgrywki_krok")}{" "}{step + 1} z {WIZARD_STEPS.length}</p>
          <h2 ref={headingRef} tabIndex={-1} className="experimental-wizard-title">{title}</h2>
          <p className="experimental-wizard-lead">{lead}</p>
        </div>
        <div className="experimental-wizard-top-actions">
          <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => setImportOpen(true)} aria-expanded={importOpen}>
            <Sparkles className="h-4 w-4" aria-hidden="true" /> {t("experimentalCreateWizard.plik_od_ai")}</button>
          <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={openAdvanced}>
            <Settings2 className="h-4 w-4" aria-hidden="true" /> {t("experimentalCreateWizard.tryb_zaawansowany")}</button>
        </div>
      </header>

      <Stepper step={step} maxVisited={draft.maxVisitedStep} onGo={goTo} />

      <div className="experimental-wizard-body" data-has-preview={step >= 1 ? "true" : "false"}>
        <section className="experimental-wizard-main" aria-labelledby="experimental-wizard-section">
          <h3 id="experimental-wizard-section" className="experimental-wizard-sr">{importOpen ? t("experimentalCreateWizard.import_z_pliku_ai") : WIZARD_STEPS[step].label}</h3>

          {importOpen && <ExperimentalAiImport onUse={applyImported} onClose={() => setImportOpen(false)} />}

          {!importOpen && step === 0 && (
            <div className="experimental-wizard-stack">
              {/* V5.8: the two either-or questions sit side by side on wide screens, so step 1 fits one screen. */}
              <div className="experimental-wizard-pair">
              <div>
              <ChoiceGroup
                legend={t("experimentalCreateWizard.co_organizujesz")}
                value={answers.kind}
                onChange={(kind) => setAnswers({ kind })}
                options={[
                  { value: "tournament", label: t("experimentalCreateWizard.turniej"), hint: t("experimentalCreateWizard.jedno_wydarzenie_np_na_jeden"), icon: <Trophy className="h-5 w-5" /> },
                  { value: "league", label: t("experimentalCreateWizard.liga"), hint: t("experimentalCreateWizard.tabela_i_mecze_kazdy_z"), icon: <CalendarDays className="h-5 w-5" /> },
                ]}
              />
              {answers.kind === "league" && (
                <p className="experimental-wizard-note" data-tone="info">
                  <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t("experimentalCreateWizard.liga_to_tabela_kazdy_z")}</p>
              )}
              </div>
              <div>
              <ChoiceGroup
                legend={t("experimentalCreateWizard.kto_bierze_udzial")}
                value={answers.participantType}
                onChange={(participantType) => setAnswers({ participantType })}
                options={[
                  { value: "players", label: t("experimentalCreateWizard.gracze"), hint: t("experimentalCreateWizard.kazdy_gra_sam_za_siebie"), icon: <User className="h-5 w-5" /> },
                  { value: "teams", label: t("experimentalCreateWizard.druzyny"), hint: t("experimentalCreateWizard.zglaszasz_zespoly"), icon: <Users className="h-5 w-5" /> },
                ]}
              />
              {answers.participantType === "teams" && (
                <p className="experimental-wizard-note" data-tone="info">
                  <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t("experimentalCreateWizard.kazda_druzyna_ma_sklad_kapitan")}</p>
              )}
              </div>
              </div>
              <CountField value={answers.participantCount} onChange={(participantCount) => setAnswers({ participantCount })} noun={noun} />
              <ChoiceGroup
                legend={t("experimentalCreateWizard.podzielic_na_grupy")}
                help={t("experimentalCreateWizard.grupy_to_male_tabele_na")}
                columns={3}
                value={answers.grouping}
                onChange={(grouping) => setAnswers({ grouping })}
                options={[
                  { value: "any", label: t("experimentalCreateWizard.wszystko_jedno"), hint: t("experimentalCreateWizard.pokazemy_obie_mozliwosci") },
                  { value: "yes", label: t("experimentalCreateWizard.tak_z_grupami"), hint: t("experimentalCreateWizard.grupy_potem_drabinka") },
                  { value: "no", label: t("experimentalCreateWizard.bez_grup"), hint: t("experimentalCreateWizard.jedna_tabela_albo_drabinka") },
                ]}
              />
              <ChoiceGroup
                legend={t("experimentalCreateWizard.na_czym_ci_najbardziej_zalezy")}
                columns={3}
                value={answers.priority}
                onChange={(priority) => setAnswers({ priority })}
                options={[
                  { value: "short", label: t("experimentalCreateWizard.krotko"), hint: t("experimentalCreateWizard.jak_najmniej_meczow"), icon: <Zap className="h-5 w-5" /> },
                  { value: "more_matches", label: t("experimentalCreateWizard.wiecej_grania"), hint: t("experimentalCreateWizard.kazdy_gra_kilka_razy"), icon: <Swords className="h-5 w-5" /> },
                  { value: "accurate", label: t("experimentalCreateWizard.pewny_zwyciezca"), hint: t("experimentalCreateWizard.mniej_przypadku"), icon: <ShieldCheck className="h-5 w-5" /> },
                ]}
              />
              <button type="button" className="experimental-wizard-custom" onClick={() => setImportOpen(true)}>
                <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="experimental-wizard-choice-label">{t("experimentalCreateWizard.masz_gotowy_plan_od_ai")}</span>
                  <span className="experimental-wizard-choice-hint">{t("experimentalCreateWizard.pobierz_specyfikacje_popros_dowolna_ai")}</span>
                </span>
              </button>
            </div>
          )}

          {!importOpen && step === 1 && (
            <div className="experimental-wizard-stack">
              {draft.custom && (
                <div className="experimental-wizard-note" data-tone="info" role="status">
                  <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {t("experimentalCreateWizard.masz_wlasny_plan")}{" "}<strong>{draft.custom.label}</strong> ({draft.custom.preview.stages.length} {plural(draft.custom.preview.stages.length, t("experimentalCreateWizard.etap"), t("experimentalCreateWizard.etapy_2"), t("experimentalCreateWizard.etapow"))}{t("experimentalCreateWizard.prosty_kreator_go_nie_edytuje")}{" "}<button type="button" className="experimental-wizard-link" onClick={openAdvanced}>{t("experimentalCreateWizard.wroc_do_wlasnego_planu")}</button>
                  </span>
                </div>
              )}
              {recommendations.status === "loading" && available.length === 0 && (
                <p className="experimental-wizard-help" role="status"><Loader2 className="inline h-4 w-4 animate-spin" aria-hidden="true" /> {t("experimentalCreateWizard.dobieram_formaty")}</p>
              )}
              {recommendations.status === "error" && (
                <p className="experimental-wizard-note" data-tone="danger" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t("experimentalCreateWizard.nie_udalo_sie_pobrac_propozycji")}{" "}{recommendations.error}
                </p>
              )}
              {(recommendations.data?.notes ?? []).map((note) => (
                <p key={note} className="experimental-wizard-note" data-tone="info" role="note">
                  <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {note}
                </p>
              ))}
              {available.length > 0 && (
                <fieldset className="experimental-wizard-field">
                  <legend className="experimental-wizard-sr">{t("experimentalCreateWizard.format_rozgrywek")}</legend>
                  <div className="experimental-wizard-presets">
                    {visiblePresets.map((item) => (
                      <PresetCard key={item.presetId} item={item} selected={!draft.custom && item.presetId === presetId} onSelect={() => update({ presetId: item.presetId, params: {}, custom: null })} />
                    ))}
                  </div>
                  {hiddenPresetCount > 0 && (
                    <button type="button" className="experimental-v4-btn experimental-wizard-show-more" data-variant="ghost" onClick={() => setShowAllPresets(true)}>
                      {t("experimentalCreateWizard.pokaz_pozostale_formaty")}{hiddenPresetCount})
                    </button>
                  )}
                </fieldset>
              )}
              <button type="button" className="experimental-wizard-custom" onClick={openAdvanced}>
                <Settings2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="experimental-wizard-choice-label">{t("experimentalCreateWizard.wszystkie_ustawienia_naraz")}</span>
                  <span className="experimental-wizard-choice-hint">{t("experimentalCreateWizard.tryb_zaawansowany_rozstawienie_awanse_pu")}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
              {(unavailable.length > 0 || (recommendations.data?.planned.length ?? 0) > 0) && (
                <details className="experimental-wizard-more">
                  <summary>{t("experimentalCreateWizard.dlaczego_nie_widze_innych_formatow")}</summary>
                  <ul>
                    {unavailable.map((item) => (
                      <li key={item.presetId}><strong>{item.label}</strong> — {item.unavailableReason}</li>
                    ))}
                    {recommendations.data?.planned.map((item) => (
                      <li key={item.id}><strong>{item.label}</strong> {t("experimentalCreateWizard.w_przygotowaniu")}{" "}{item.reason}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {!importOpen && step === 2 && (
            <div className="experimental-wizard-stack">
              {shownPreview ? (
                <>
                  {imported && (
                    <p className="experimental-wizard-note" data-tone="info" role="status">
                      <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {t("experimentalCreateWizard.ustawienia_wczytane_z_pliku_ai")}</p>
                  )}
                  <div className="experimental-wizard-param">
                    <div className="experimental-wizard-param-head">
                      <span className="experimental-wizard-legend">{t("experimentalCreateWizard.liczba_uczestnikow")}</span>
                      <span className="experimental-wizard-help">
                        {shownPreview.participants.mode === "exact"
                          ? t("experimentalCreateWizard.ten_format_ma_staly_plan")
                          : t("experimentalCreateWizard.to_limit_miejsc_turniej_wystartuje", { v0: noun(5) })}
                      </span>
                    </div>
                    <div className="experimental-wizard-count">
                      <button type="button" className="experimental-wizard-step-btn" aria-label={t("experimentalCreateWizard.mniej_uczestnikow")} disabled={answers.participantCount <= MIN_PARTICIPANTS} onClick={() => setAnswers({ participantCount: answers.participantCount - 1 })}>
                        <Minus className="h-4 w-4" />
                      </button>
                      <output className="experimental-wizard-count-value" aria-live="polite">{answers.participantCount}</output>
                      <button type="button" className="experimental-wizard-step-btn" aria-label={t("experimentalCreateWizard.wiecej_uczestnikow")} disabled={answers.participantCount >= MAX_PARTICIPANTS} onClick={() => setAnswers({ participantCount: answers.participantCount + 1 })}>
                        <Plus className="h-4 w-4" />
                      </button>
                      <span className="experimental-wizard-help">{noun(answers.participantCount)}</span>
                    </div>
                    {preview.status === "error" && preview.param === "participantCount" && (
                      <p role="alert" className="experimental-wizard-error">{preview.error}</p>
                    )}
                  </div>
                  <MatchRulesChoice
                    preview={shownPreview}
                    params={params}
                    onParams={(next) => update({ params: next })}
                    error={preview.status === "error" ? { param: preview.param, message: preview.error } : null}
                  />
                  {shownPreview.paramLimits
                    .filter((limit) => limit.key !== "participantCount" && !LEAGUE_PARAM_KEYS.includes(limit.key) && !ADVANCED_PARAM_KEYS.includes(limit.key) && !MATCH_PARAM_KEYS.includes(limit.key))
                    .map((limit) => (
                      <ParamControl
                        key={limit.key}
                        limit={{ ...limit, value: params[limit.key] ?? limit.value }}
                        error={preview.status === "error" && preview.param === limit.key ? preview.error ?? undefined : undefined}
                        onChange={(value) => update({ params: { ...params, [limit.key]: value } })}
                      />
                    ))}
                  <LeagueOptions
                    preview={shownPreview}
                    params={params}
                    onParams={(next) => update({ params: next })}
                    schedule={draft.schedule}
                    onSchedule={(schedule) => update({ schedule })}
                    error={preview.status === "error" ? { param: preview.param, message: preview.error } : null}
                  />
                  {preview.status === "error" && !preview.param && (
                    <p role="alert" className="experimental-wizard-note" data-tone="danger">
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{preview.error}
                    </p>
                  )}
                  {preview.status === "error" && preview.param && !LEAGUE_PARAM_KEYS.includes(preview.param) && !MATCH_PARAM_KEYS.includes(preview.param) && !shownPreview.paramLimits.some((limit) => limit.key === preview.param) && (
                    <p role="alert" className="experimental-wizard-note" data-tone="danger">
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{preview.error}
                    </p>
                  )}
                  <div className="experimental-wizard-inline-actions">
                    <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => update({ params: {}, schedule: null })} disabled={Object.keys(params).length === 0 && draft.schedule == null}>
                      {t("experimentalCreateWizard.przywroc_proponowane")}</button>
                    <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={openAdvanced}>
                      <Settings2 className="h-4 w-4" aria-hidden="true" /> {t("experimentalCreateWizard.edytuj_w_trybie_zaawansowanym")}</button>
                  </div>
                </>
              ) : (
                <p className="experimental-wizard-help" role="status"><Loader2 className="inline h-4 w-4 animate-spin" aria-hidden="true" /> {t("experimentalCreateWizard.przygotowuje_podglad")}</p>
              )}
            </div>
          )}

          {!importOpen && step === 3 && (
            <form
              className="experimental-wizard-stack"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <div className="experimental-wizard-field">
                <Label htmlFor="experimental-wizard-name" className="experimental-wizard-legend">{t("experimentalCreateWizard.nazwa_turnieju")}{" "}<span className="experimental-wizard-required">{t("experimentalCreateWizard.wymagane")}</span></Label>
                <Input
                  id="experimental-wizard-name"
                  ref={nameRef}
                  value={draft.name}
                  autoComplete="off"
                  placeholder={t("experimentalCreateWizard.np_wiosenny_puchar_klubu")}
                  aria-invalid={(touched.name || showValidation) && nameProblem ? true : undefined}
                  onChange={(event) => update({ name: event.target.value })}
                  onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                />
                {(touched.name || showValidation) && nameProblem && <p role="alert" className="experimental-wizard-error">{nameProblem}</p>}
              </div>

              <div className="experimental-wizard-field">
                <PasswordField
                  id="experimental-wizard-organizer-password"
                  label={t("experimentalCreateWizard.haslo_organizatora_wymagane")}
                  value={organizerPassword}
                  onChange={setOrganizerPassword}
                  visible={showPassword.organizer}
                  onToggle={() => setShowPassword((current) => ({ ...current, organizer: !current.organizer }))}
                  inputRef={organizerRef}
                  minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
                  description={t("experimentalCreateWizard.potrzebne_aby_zarzadzac_turniejem_na")}
                  detail={organizerPasswordRemaining(organizerPassword) > 0 ? t("experimentalCreateWizard.jeszcze_v0_v1", { v0: organizerPasswordRemaining(organizerPassword), v1: plural(organizerPasswordRemaining(organizerPassword), t("experimentalCreateWizard.znak"), t("experimentalCreateWizard.znaki"), t("experimentalCreateWizard.znakow")) }) : undefined}
                  error={touched.organizer || showValidation ? organizerProblem ?? undefined : undefined}
                  onBlur={() => setTouched((current) => ({ ...current, organizer: true }))}
                />
              </div>

              <ChoiceGroup<Visibility>
                legend={t("experimentalCreateWizard.kto_moze_ogladac")}
                columns={3}
                value={draft.visibility}
                onChange={(visibility) => update({ visibility })}
                options={[
                  { value: "public_online", label: t("experimentalCreateWizard.kazdy_z_linkiem"), hint: t("experimentalCreateWizard.publiczne_wyniki"), icon: <Globe className="h-5 w-5" /> },
                  { value: "private_online", label: t("experimentalCreateWizard.z_haslem"), hint: t("experimentalCreateWizard.widzowie_podaja_haslo"), icon: <Lock className="h-5 w-5" /> },
                  { value: "private_offline", label: t("experimentalCreateWizard.ukryty"), hint: t("experimentalCreateWizard.widzowie_nie_widza_turnieju_az"), icon: <ShieldCheck className="h-5 w-5" /> },
                ]}
              />
              {draft.visibility === "private_online" && (
                <PasswordField
                  id="experimental-wizard-viewer-password"
                  label={t("experimentalCreateWizard.haslo_dla_widzow_wymagane")}
                  value={viewerPassword}
                  onChange={setViewerPassword}
                  visible={showPassword.viewer}
                  onToggle={() => setShowPassword((current) => ({ ...current, viewer: !current.viewer }))}
                  inputRef={viewerRef}
                  minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
                  error={showValidation ? viewerProblem ?? undefined : undefined}
                />
              )}

              {answers.participantType === "teams" && (
                <fieldset className="experimental-wizard-field">
                  <legend className="experimental-wizard-legend">{t("experimentalCreateWizard.sklad_druzyny_opcjonalnie")}</legend>
                  <p className="experimental-wizard-help">{t("experimentalCreateWizard.turniej_wystartuje_dopiero_gdy_kazda")}</p>
                  <div className="experimental-wizard-inline-actions">
                    <label className="experimental-wizard-roster-limit">
                      <span>{t("experimentalCreateWizard.minimum_w_podstawie")}</span>
                      <select aria-label={t("experimentalCreateWizard.minimum_zawodnikow_w_podstawie")} value={draft.rosterMin ?? ""} onChange={(event) => update({ rosterMin: event.target.value ? Number(event.target.value) : null })}>
                        <option value="">{t("experimentalCreateWizard.bez_limitu")}</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    <label className="experimental-wizard-roster-limit">
                      <span>{t("experimentalCreateWizard.maksimum_w_skladzie")}</span>
                      <select aria-label={t("experimentalCreateWizard.maksimum_osob_w_skladzie")} value={draft.rosterMax ?? ""} onChange={(event) => update({ rosterMax: event.target.value ? Number(event.target.value) : null })}>
                        <option value="">{t("experimentalCreateWizard.bez_limitu")}</option>
                        {[2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25].map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                  </div>
                  {draft.rosterMin != null && draft.rosterMax != null && draft.rosterMax < draft.rosterMin && (
                    <p role="alert" className="experimental-wizard-error">{t("experimentalCreateWizard.maksimum_nie_moze_byc_mniejsze")}</p>
                  )}
                </fieldset>
              )}

              <details className="experimental-wizard-more" open={Boolean(supportPassword || draft.description) || undefined}>
                <summary>{t("experimentalCreateWizard.opis_i_haslo_pomocnika_opcjonalnie")}</summary>
                <div className="experimental-wizard-stack">
                  <div className="experimental-wizard-field">
                    <Label htmlFor="experimental-wizard-description" className="experimental-wizard-legend">{t("experimentalCreateWizard.opis")}</Label>
                    <Textarea
                      id="experimental-wizard-description"
                      rows={3}
                      value={draft.description}
                      placeholder={t("experimentalCreateWizard.krotka_informacja_dla_uczestnikow_i")}
                      onChange={(event) => update({ description: event.target.value })}
                    />
                  </div>
                  <PasswordField
                    id="experimental-wizard-support-password"
                    label={t("experimentalCreateWizard.haslo_pomocnika")}
                    value={supportPassword}
                    onChange={setSupportPassword}
                    visible={showPassword.support}
                    onToggle={() => setShowPassword((current) => ({ ...current, support: !current.support }))}
                    inputRef={supportRef}
                    minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
                    description={t("experimentalCreateWizard.pomocnik_moze_wpisywac_wyniki_ale")}
                    error={showValidation ? supportProblem ?? undefined : undefined}
                  />
                </div>
              </details>

              {shownPreview && (
                <div className="experimental-wizard-summary" aria-label={t("experimentalCreateWizard.podsumowanie")}>
                  <p className="experimental-wizard-eyebrow">{t("experimentalCreateWizard.utworzysz")}</p>
                  <p className="experimental-wizard-summary-line">
                    <strong>{draft.name.trim() || t("experimentalCreateWizard.turniej_bez_nazwy")}</strong> · {shownPreview.label} ·{" "}
                    {shownPreview.participants.mode === "exact" ? t("experimentalCreateWizard.dokladnie") : "do"} {shownPreview.participants.count} {noun(shownPreview.participants.count)}
                  </p>
                  <ol className="experimental-wizard-chain" aria-label={t("experimentalCreateWizard.etapy")}>
                    {stageChain(shownPreview).map((item) => <li key={item}>{item}</li>)}
                  </ol>
                  <p className="experimental-wizard-help">{t("experimentalCreateWizard.nastepny_krok_dodasz_uczestnikow_mozesz")}</p>
                </div>
              )}

              {apiStatus === "unavailable" && (
                <p className="experimental-wizard-note" data-tone="danger" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t("experimentalCreateWizard.serwer_turniejowy_jest_niedostepny")}<button type="button" className="experimental-wizard-link" onClick={() => void checkApiHealth()}>{t("experimentalCreateWizard.sprawdz_ponownie")}</button>
                </p>
              )}
              {submitError && (
                <p className="experimental-wizard-note" data-tone="danger" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{submitError}
                </p>
              )}
              <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            </form>
          )}
        </section>

        {step >= 1 && !importOpen && (
          <PreviewPanel preview={shownPreview} noun={noun} loading={preview.status === "loading" || recommendations.status === "loading"} stale={preview.status === "error"} schedule={draft.schedule} compact={step !== 2} />
        )}
      </div>

      {!importOpen && <div ref={actionsRef} className="experimental-wizard-actions">
        {step >= 1 && shownPreview && (
          <p className="experimental-wizard-actions-summary" aria-live="polite">
            <strong>{shownPreview.label}</strong> · {rangeText(shownPreview.totals.matches)} {plural(shownPreview.totals.matches.max, t("experimentalCreateWizard.mecz"), t("experimentalCreateWizard.mecze_2"), t("experimentalCreateWizard.meczow"))} · {rangeText(shownPreview.totals.rounds)} {plural(shownPreview.totals.rounds.max, t("experimentalCreateWizard.runda"), t("experimentalCreateWizard.rundy_2"), t("experimentalCreateWizard.rund"))}
          </p>
        )}
        <div className="experimental-wizard-actions-secondary">
          {step > 0 ? (
            <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => goTo((step - 1) as WizardStepIndex)}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("experimentalCreateWizard.wstecz")}</button>
          ) : (
            <Link href="/experimental/tournaments/dashboard" className="experimental-v4-btn" data-variant="ghost">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("experimentalCreateWizard.anuluj")}</Link>
          )}
          {step > 0 && (
            <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={reset}>{t("experimentalCreateWizard.zacznij_od_nowa")}</button>
          )}
        </div>
        <button
          type="button"
          className="experimental-v4-btn experimental-wizard-primary"
          data-variant="primary"
          disabled={primary.disabled}
          onClick={primary.onClick}
        >
          {step === 3 ? <Trophy className="h-4 w-4" aria-hidden="true" /> : null}
          {primary.label}
          {step < 3 ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
        </button>
      </div>}
    </div>
  );
}
