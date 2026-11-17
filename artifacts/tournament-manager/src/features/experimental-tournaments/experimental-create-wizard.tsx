import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
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
  buildAdvancedHandoff,
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
  writeAdvancedHandoff,
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
} from "./experimental-create-wizard-model";

const ADVANCED_PATH = "/experimental/tournaments/new/advanced";

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
    const error = new Error(data.error || `Serwer odpowiedział błędem (HTTP ${response.status}).`) as Error & { param?: PresetParamKey };
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
      <legend className="experimental-wizard-legend">Ilu {noun(5)} planujesz?</legend>
      <p className="experimental-wizard-help">Wystarczy przybliżona liczba — zmienisz ją później w podglądzie.</p>
      <div className="experimental-wizard-count">
        <button type="button" className="experimental-wizard-step-btn" aria-label="Mniej" disabled={value <= MIN_PARTICIPANTS} onClick={() => onChange(value - 1)}>
          <Minus className="h-4 w-4" />
        </button>
        <Input
          aria-label={`Liczba: ${noun(5)}`}
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
        <button type="button" className="experimental-wizard-step-btn" aria-label="Więcej" disabled={value >= MAX_PARTICIPANTS} onClick={() => onChange(value + 1)}>
          <Plus className="h-4 w-4" />
        </button>
        <div className="experimental-wizard-count-shortcuts" role="group" aria-label="Szybki wybór">
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
    <nav aria-label="Kroki kreatora" className="experimental-wizard-stepper">
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

function PresetStats({ preview }: { preview: PresetPreview }) {
  const per = preview.totals.matchesPerParticipant;
  return (
    <dl className="experimental-wizard-stats">
      <Stat label="Mecze" value={rangeText(preview.totals.matches)} />
      <Stat label="Rundy" value={rangeText(preview.totals.rounds)} hint="łącznie we wszystkich etapach" />
      <Stat label="Mecze na osobę" value={per.min === per.max ? String(per.min) : `${per.min}–${per.max}`} hint={per.min === per.max ? "tyle samo dla każdego" : "zależnie od wyników"} />
    </dl>
  );
}

function StageFlow({ preview }: { preview: PresetPreview }) {
  return (
    <ol className="experimental-wizard-flow" aria-label="Układ etapów">
      {preview.stages.map((stage) => (
        <li key={stage.key} className="experimental-wizard-flow-stage" data-format={stage.format}>
          <div className="experimental-wizard-flow-head">
            <span className="experimental-wizard-flow-index">{stage.position}</span>
            <div className="min-w-0">
              <p className="experimental-wizard-flow-name">{stage.name}</p>
              <p className="experimental-wizard-flow-format">{stage.formatLabel} · BO{stage.bestOf}</p>
            </div>
          </div>
          <ul className="experimental-wizard-flow-facts">
            <li>{stage.participantCount} {plural(stage.participantCount, "uczestnik", "uczestników", "uczestników")}</li>
            {stage.groupSizes && (
              <li>
                {stage.groupSizes.length} {plural(stage.groupSizes.length, "grupa", "grupy", "grup")}
                {new Set(stage.groupSizes).size === 1 ? ` po ${stage.groupSizes[0]}` : ` (${stage.groupSizes.join(", ")})`}
              </li>
            )}
            <li>{rangeText(stage.matches)} {plural(stage.matches.max, "mecz", "mecze", "meczów")} · {rangeText(stage.rounds)} {plural(stage.rounds.max, "runda", "rundy", "rund")}</li>
            {stage.byes > 0 && <li>{stage.byes} {plural(stage.byes, "wolny los", "wolne losy", "wolnych losów")}</li>}
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

function PreviewPanel({
  preview,
  noun,
  loading,
  stale,
}: {
  preview: PresetPreview | null;
  noun: (n: number) => string;
  loading: boolean;
  stale: boolean;
}) {
  if (!preview) {
    return (
      <aside className="experimental-wizard-preview" aria-label="Podgląd rozgrywek" aria-busy={loading}>
        <p className="experimental-wizard-help">{loading ? "Przygotowuję podgląd…" : "Wybierz format, aby zobaczyć podgląd."}</p>
      </aside>
    );
  }
  const people = preview.participants;
  return (
    <aside className="experimental-wizard-preview" aria-label="Podgląd rozgrywek" aria-busy={loading} data-stale={stale ? "true" : "false"}>
      <div className="experimental-wizard-preview-head">
        <p className="experimental-wizard-eyebrow">Podgląd {loading && <Loader2 className="inline h-3.5 w-3.5 animate-spin" aria-label="Aktualizowanie" />}</p>
        <h3>{preview.label}</h3>
        <p className="experimental-wizard-chip-static" data-mode={people.mode}>
          {people.mode === "exact"
            ? `Dokładnie ${people.count} ${noun(people.count)}`
            : `Od ${people.minimum} do ${people.count} ${noun(people.count)}`}
        </p>
      </div>
      <PresetStats preview={preview} />
      <StageFlow preview={preview} />
      <section className="experimental-wizard-rules">
        <h4><Trophy className="h-4 w-4" aria-hidden="true" /> Zwycięzca</h4>
        <p>{preview.winnerRule}</p>
        <h4><Scale className="h-4 w-4" aria-hidden="true" /> Remisy i równe miejsca</h4>
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
    </aside>
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
          {item.recommended && <span className="experimental-wizard-badge"><Sparkles className="h-3 w-3" aria-hidden="true" /> Polecany</span>}
        </span>
        <span className="experimental-wizard-preset-short">{item.short}</span>
        <span className="experimental-wizard-preset-reasons">{item.reasons.join(" ")}</span>
        <span className="experimental-wizard-preset-meta">
          {rangeText(preview.totals.matches)} {plural(preview.totals.matches.max, "mecz", "mecze", "meczów")} · {rangeText(preview.totals.rounds)} {plural(preview.totals.rounds.max, "runda", "rundy", "rund")}
          {preview.stages.length > 1 ? ` · ${preview.stages.length} etapy` : ""} · min. {preview.totals.matchesPerParticipant.min} {plural(preview.totals.matchesPerParticipant.min, "mecz", "mecze", "meczów")} na osobę
        </span>
      </span>
      <Check className="experimental-wizard-choice-check" aria-hidden="true" />
    </label>
  );
}

function ParamControl({
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
  const index = limit.options.indexOf(limit.value);
  const segmented = isBestOf || limit.options.length <= 6;
  const format = (value: number) => (isBestOf ? `BO${value}` : String(value));
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
          <button type="button" className="experimental-wizard-step-btn" aria-label={`${limit.label}: mniej`} disabled={index <= 0} onClick={() => onChange(limit.options[index - 1])}>
            <Minus className="h-4 w-4" />
          </button>
          <output className="experimental-wizard-count-value" aria-live="polite">{format(limit.value)}</output>
          <button type="button" className="experimental-wizard-step-btn" aria-label={`${limit.label}: więcej`} disabled={index >= limit.options.length - 1} onClick={() => onChange(limit.options[index + 1])}>
            <Plus className="h-4 w-4" />
          </button>
          <span className="experimental-wizard-help">zakres {limit.options[0]}–{limit.options.at(-1)}</span>
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
  const submitInFlight = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
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
    ? `Hasło pomocnika musi mieć co najmniej ${ORGANIZER_PASSWORD_MIN_LENGTH} znaków albo pozostać puste.`
    : null;
  const viewerProblem = draft.visibility === "private_online" && viewerPassword.length < ORGANIZER_PASSWORD_MIN_LENGTH
    ? `Hasło dla widzów musi mieć co najmniej ${ORGANIZER_PASSWORD_MIN_LENGTH} znaków.`
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

  const openAdvanced = () => {
    if (shownPreview) {
      writeAdvancedHandoff(safeSessionStorage(), buildAdvancedHandoff(shownPreview, draft));
    }
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
      setSubmitError("Podgląd rozgrywek nie jest gotowy. Wróć do kroku „Dopasuj” i popraw ustawienia.");
      return;
    }
    if (apiStatus !== "ready") {
      setSubmitError("Serwer turniejowy jest teraz niedostępny. Sprawdź połączenie i spróbuj ponownie.");
      return;
    }
    if (submitInFlight.current) return;
    submitInFlight.current = true;
    createTournament.mutate(
      {
        data: buildCreatePayload(currentPreview, draft, {
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
        return { label: "Pokaż propozycje", disabled: false, onClick: () => goTo(1) };
      case 1:
        return { label: "Dalej: dopasuj", disabled: !presetId || recommendations.status !== "ready", onClick: () => goTo(2) };
      case 2:
        return { label: "Dalej: nazwa i hasło", disabled: !previewValid, onClick: () => goTo(3) };
      default:
        return {
          label: createTournament.isPending ? "Tworzenie…" : apiStatus === "checking" ? "Sprawdzanie serwera…" : "Utwórz turniej",
          disabled: createTournament.isPending || apiStatus === "checking",
          onClick: submit,
        };
    }
  })();

  const title = ["Jakie rozgrywki organizujesz?", "Wybierz format", "Dopasuj szczegóły", "Nazwij turniej i zabezpiecz go"][step];
  const lead = [
    "Odpowiedz na kilka pytań — zaproponujemy pasujące formaty. Domyślne odpowiedzi też są dobre.",
    `Formaty dobrane do ${answers.participantCount} ${noun(answers.participantCount)}. Pokazujemy tylko te, które silnik potrafi w pełni rozegrać.`,
    "Zmiany od razu aktualizują podgląd. Jeśli coś nie pasuje, zobaczysz wyjaśnienie.",
    "Hasło organizatora chroni zarządzanie turniejem. Uczestników dodasz w następnym kroku.",
  ][step];

  return (
    <div className="experimental-wizard" data-step={step}>
      <header className="experimental-wizard-top">
        <div>
          <p className="experimental-wizard-eyebrow">Nowe rozgrywki · krok {step + 1} z {WIZARD_STEPS.length}</p>
          <h2 ref={headingRef} tabIndex={-1} className="experimental-wizard-title">{title}</h2>
          <p className="experimental-wizard-lead">{lead}</p>
        </div>
        <div className="experimental-wizard-top-actions">
          <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={openAdvanced}>
            <Settings2 className="h-4 w-4" aria-hidden="true" /> Tryb zaawansowany
          </button>
        </div>
      </header>

      <Stepper step={step} maxVisited={draft.maxVisitedStep} onGo={goTo} />

      <div className="experimental-wizard-body" data-has-preview={step >= 1 ? "true" : "false"}>
        <section className="experimental-wizard-main" aria-labelledby="experimental-wizard-section">
          <h3 id="experimental-wizard-section" className="experimental-wizard-sr">{WIZARD_STEPS[step].label}</h3>

          {step === 0 && (
            <div className="experimental-wizard-stack">
              <ChoiceGroup
                legend="Co organizujesz?"
                value={answers.kind}
                onChange={(kind) => setAnswers({ kind })}
                options={[
                  { value: "tournament", label: "Turniej", hint: "Jedno wydarzenie, np. na jeden dzień.", icon: <Trophy className="h-5 w-5" /> },
                  { value: "league", label: "Liga", hint: "Tabela i mecze każdy z każdym.", icon: <CalendarDays className="h-5 w-5" /> },
                ]}
              />
              {answers.kind === "league" && (
                <p className="experimental-wizard-note" data-tone="info">
                  <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Liga działa teraz jako tabela „każdy z każdym” (opcjonalnie z play-off). Daty kolejek i rewanże jeszcze nie są dostępne.
                </p>
              )}
              <ChoiceGroup
                legend="Kto bierze udział?"
                value={answers.participantType}
                onChange={(participantType) => setAnswers({ participantType })}
                options={[
                  { value: "players", label: "Gracze", hint: "Każdy gra sam za siebie.", icon: <User className="h-5 w-5" /> },
                  { value: "teams", label: "Drużyny", hint: "Zgłaszasz zespoły.", icon: <Users className="h-5 w-5" /> },
                ]}
              />
              {answers.participantType === "teams" && (
                <p className="experimental-wizard-note" data-tone="info">
                  <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Każda drużyna będzie jedną pozycją na liście (nazwa drużyny). Składy zawodników dodamy w kolejnej wersji.
                </p>
              )}
              <CountField value={answers.participantCount} onChange={(participantCount) => setAnswers({ participantCount })} noun={noun} />
              <ChoiceGroup
                legend="Podzielić na grupy?"
                help="Grupy to małe tabele na start; najlepsi z grup grają potem w drabince."
                columns={3}
                value={answers.grouping}
                onChange={(grouping) => setAnswers({ grouping })}
                options={[
                  { value: "any", label: "Wszystko jedno" },
                  { value: "yes", label: "Tak, z grupami" },
                  { value: "no", label: "Bez grup" },
                ]}
              />
              <ChoiceGroup
                legend="Na czym Ci najbardziej zależy?"
                columns={3}
                value={answers.priority}
                onChange={(priority) => setAnswers({ priority })}
                options={[
                  { value: "short", label: "Krótko", hint: "Jak najmniej meczów.", icon: <Zap className="h-5 w-5" /> },
                  { value: "more_matches", label: "Więcej grania", hint: "Każdy gra kilka razy.", icon: <Swords className="h-5 w-5" /> },
                  { value: "accurate", label: "Pewny zwycięzca", hint: "Mniej przypadku.", icon: <ShieldCheck className="h-5 w-5" /> },
                ]}
              />
            </div>
          )}

          {step === 1 && (
            <div className="experimental-wizard-stack">
              {recommendations.status === "loading" && available.length === 0 && (
                <p className="experimental-wizard-help" role="status"><Loader2 className="inline h-4 w-4 animate-spin" aria-hidden="true" /> Dobieram formaty…</p>
              )}
              {recommendations.status === "error" && (
                <p className="experimental-wizard-note" data-tone="danger" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Nie udało się pobrać propozycji: {recommendations.error}
                </p>
              )}
              {available.length > 0 && (
                <fieldset className="experimental-wizard-field">
                  <legend className="experimental-wizard-sr">Format rozgrywek</legend>
                  <div className="experimental-wizard-presets">
                    {visiblePresets.map((item) => (
                      <PresetCard key={item.presetId} item={item} selected={item.presetId === presetId} onSelect={() => update({ presetId: item.presetId, params: {} })} />
                    ))}
                  </div>
                  {hiddenPresetCount > 0 && (
                    <button type="button" className="experimental-v4-btn experimental-wizard-show-more" data-variant="ghost" onClick={() => setShowAllPresets(true)}>
                      Pokaż pozostałe formaty ({hiddenPresetCount})
                    </button>
                  )}
                </fieldset>
              )}
              <button type="button" className="experimental-wizard-custom" onClick={openAdvanced}>
                <Settings2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="experimental-wizard-choice-label">Własna konfiguracja wieloetapowa</span>
                  <span className="experimental-wizard-choice-hint">Do 10 etapów, rozstawienie i koszyki — w trybie zaawansowanym.</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
              {(unavailable.length > 0 || (recommendations.data?.planned.length ?? 0) > 0) && (
                <details className="experimental-wizard-more">
                  <summary>Dlaczego nie widzę innych formatów?</summary>
                  <ul>
                    {unavailable.map((item) => (
                      <li key={item.presetId}><strong>{item.label}</strong> — {item.unavailableReason}</li>
                    ))}
                    {recommendations.data?.planned.map((item) => (
                      <li key={item.id}><strong>{item.label}</strong> — w przygotowaniu. {item.reason}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="experimental-wizard-stack">
              {shownPreview ? (
                <>
                  <div className="experimental-wizard-param">
                    <div className="experimental-wizard-param-head">
                      <span className="experimental-wizard-legend">Liczba uczestników</span>
                      <span className="experimental-wizard-help">
                        {shownPreview.participants.mode === "exact"
                          ? "Ten format ma stały plan etapów — przed startem lista musi być pełna."
                          : "To limit miejsc. Turniej wystartuje także z mniejszą liczbą osób (min. 2)."}
                      </span>
                    </div>
                    <div className="experimental-wizard-count">
                      <button type="button" className="experimental-wizard-step-btn" aria-label="Mniej uczestników" disabled={answers.participantCount <= MIN_PARTICIPANTS} onClick={() => setAnswers({ participantCount: answers.participantCount - 1 })}>
                        <Minus className="h-4 w-4" />
                      </button>
                      <output className="experimental-wizard-count-value" aria-live="polite">{answers.participantCount}</output>
                      <button type="button" className="experimental-wizard-step-btn" aria-label="Więcej uczestników" disabled={answers.participantCount >= MAX_PARTICIPANTS} onClick={() => setAnswers({ participantCount: answers.participantCount + 1 })}>
                        <Plus className="h-4 w-4" />
                      </button>
                      <span className="experimental-wizard-help">{noun(answers.participantCount)}</span>
                    </div>
                    {preview.status === "error" && preview.param === "participantCount" && (
                      <p role="alert" className="experimental-wizard-error">{preview.error}</p>
                    )}
                  </div>
                  {shownPreview.paramLimits
                    .filter((limit) => limit.key !== "participantCount")
                    .map((limit) => (
                      <ParamControl
                        key={limit.key}
                        limit={{ ...limit, value: params[limit.key] ?? limit.value }}
                        error={preview.status === "error" && preview.param === limit.key ? preview.error ?? undefined : undefined}
                        onChange={(value) => update({ params: { ...params, [limit.key]: value } })}
                      />
                    ))}
                  {preview.status === "error" && !preview.param && (
                    <p role="alert" className="experimental-wizard-note" data-tone="danger">
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{preview.error}
                    </p>
                  )}
                  {preview.status === "error" && preview.param && !shownPreview.paramLimits.some((limit) => limit.key === preview.param) && (
                    <p role="alert" className="experimental-wizard-note" data-tone="danger">
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{preview.error}
                    </p>
                  )}
                  <div className="experimental-wizard-inline-actions">
                    <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => update({ params: {} })} disabled={Object.keys(params).length === 0}>
                      Przywróć proponowane
                    </button>
                    <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={openAdvanced}>
                      <Settings2 className="h-4 w-4" aria-hidden="true" /> Edytuj w trybie zaawansowanym
                    </button>
                  </div>
                </>
              ) : (
                <p className="experimental-wizard-help" role="status"><Loader2 className="inline h-4 w-4 animate-spin" aria-hidden="true" /> Przygotowuję podgląd…</p>
              )}
            </div>
          )}

          {step === 3 && (
            <form
              className="experimental-wizard-stack"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <div className="experimental-wizard-field">
                <Label htmlFor="experimental-wizard-name" className="experimental-wizard-legend">Nazwa turnieju <span className="experimental-wizard-required">wymagane</span></Label>
                <Input
                  id="experimental-wizard-name"
                  ref={nameRef}
                  value={draft.name}
                  autoComplete="off"
                  placeholder="Np. Wiosenny Puchar Klubu"
                  aria-invalid={(touched.name || showValidation) && nameProblem ? true : undefined}
                  onChange={(event) => update({ name: event.target.value })}
                  onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                />
                {(touched.name || showValidation) && nameProblem && <p role="alert" className="experimental-wizard-error">{nameProblem}</p>}
              </div>

              <div className="experimental-wizard-field">
                <PasswordField
                  id="experimental-wizard-organizer-password"
                  label="Hasło organizatora (wymagane)"
                  value={organizerPassword}
                  onChange={setOrganizerPassword}
                  visible={showPassword.organizer}
                  onToggle={() => setShowPassword((current) => ({ ...current, organizer: !current.organizer }))}
                  inputRef={organizerRef}
                  minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
                  description="Potrzebne, aby zarządzać turniejem na innym urządzeniu. Nie zapisujemy go w szkicu."
                  detail={organizerPasswordRemaining(organizerPassword) > 0 ? `Jeszcze ${organizerPasswordRemaining(organizerPassword)} ${plural(organizerPasswordRemaining(organizerPassword), "znak", "znaki", "znaków")}` : undefined}
                  error={touched.organizer || showValidation ? organizerProblem ?? undefined : undefined}
                  onBlur={() => setTouched((current) => ({ ...current, organizer: true }))}
                />
              </div>

              <ChoiceGroup<Visibility>
                legend="Kto może oglądać?"
                columns={3}
                value={draft.visibility}
                onChange={(visibility) => update({ visibility })}
                options={[
                  { value: "public_online", label: "Każdy z linkiem", hint: "Publiczne wyniki.", icon: <Globe className="h-5 w-5" /> },
                  { value: "private_online", label: "Z hasłem", hint: "Widzowie podają hasło.", icon: <Lock className="h-5 w-5" /> },
                  { value: "private_offline", label: "Tylko obsługa", hint: "Bez widoku dla widzów.", icon: <ShieldCheck className="h-5 w-5" /> },
                ]}
              />
              {draft.visibility === "private_online" && (
                <PasswordField
                  id="experimental-wizard-viewer-password"
                  label="Hasło dla widzów (wymagane)"
                  value={viewerPassword}
                  onChange={setViewerPassword}
                  visible={showPassword.viewer}
                  onToggle={() => setShowPassword((current) => ({ ...current, viewer: !current.viewer }))}
                  inputRef={viewerRef}
                  minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
                  error={showValidation ? viewerProblem ?? undefined : undefined}
                />
              )}

              <details className="experimental-wizard-more" open={Boolean(supportPassword || draft.description) || undefined}>
                <summary>Opis i hasło pomocnika (opcjonalnie)</summary>
                <div className="experimental-wizard-stack">
                  <div className="experimental-wizard-field">
                    <Label htmlFor="experimental-wizard-description" className="experimental-wizard-legend">Opis</Label>
                    <Textarea
                      id="experimental-wizard-description"
                      rows={3}
                      value={draft.description}
                      placeholder="Krótka informacja dla uczestników i widzów"
                      onChange={(event) => update({ description: event.target.value })}
                    />
                  </div>
                  <PasswordField
                    id="experimental-wizard-support-password"
                    label="Hasło pomocnika"
                    value={supportPassword}
                    onChange={setSupportPassword}
                    visible={showPassword.support}
                    onToggle={() => setShowPassword((current) => ({ ...current, support: !current.support }))}
                    inputRef={supportRef}
                    minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
                    description="Pomocnik może wpisywać wyniki, ale nie zmieni ustawień."
                    error={showValidation ? supportProblem ?? undefined : undefined}
                  />
                </div>
              </details>

              {shownPreview && (
                <div className="experimental-wizard-summary" aria-label="Podsumowanie">
                  <p className="experimental-wizard-eyebrow">Utworzysz</p>
                  <p className="experimental-wizard-summary-line">
                    <strong>{draft.name.trim() || "Turniej bez nazwy"}</strong> · {shownPreview.label} ·{" "}
                    {shownPreview.participants.mode === "exact" ? "dokładnie" : "do"} {shownPreview.participants.count} {noun(shownPreview.participants.count)}
                  </p>
                  <p className="experimental-wizard-help">Następny krok: dodasz uczestników (możesz wkleić całą listę naraz).</p>
                </div>
              )}

              {apiStatus === "unavailable" && (
                <p className="experimental-wizard-note" data-tone="danger" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Serwer turniejowy jest niedostępny.
                  <button type="button" className="experimental-wizard-link" onClick={() => void checkApiHealth()}>Sprawdź ponownie</button>
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

        {step >= 1 && (
          <PreviewPanel preview={shownPreview} noun={noun} loading={preview.status === "loading" || recommendations.status === "loading"} stale={preview.status === "error"} />
        )}
      </div>

      <div className="experimental-wizard-actions">
        {step >= 1 && shownPreview && (
          <p className="experimental-wizard-actions-summary" aria-live="polite">
            <strong>{shownPreview.label}</strong> · {rangeText(shownPreview.totals.matches)} {plural(shownPreview.totals.matches.max, "mecz", "mecze", "meczów")} · {rangeText(shownPreview.totals.rounds)} {plural(shownPreview.totals.rounds.max, "runda", "rundy", "rund")}
          </p>
        )}
        <div className="experimental-wizard-actions-secondary">
          {step > 0 ? (
            <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => goTo((step - 1) as WizardStepIndex)}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Wstecz
            </button>
          ) : (
            <Link href="/experimental/tournaments/dashboard" className="experimental-v4-btn" data-variant="ghost">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Anuluj
            </Link>
          )}
          {step > 0 && (
            <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={reset}>Zacznij od nowa</button>
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
      </div>
    </div>
  );
}
