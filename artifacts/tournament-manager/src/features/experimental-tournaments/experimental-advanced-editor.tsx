/**
 * V5.4 · advanced creation editor.
 *
 * The same model as the simple wizard (one persisted draft, one preset engine on the server), so the
 * format shown, the summary and the saved tournament can never disagree. Everything is on one screen,
 * grouped into sections that open one at a time; each closed section shows its current values.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Layers,
  ListOrdered,
  Loader2,
  Lock,
  Scale,
  Swords,
  Trophy,
  Users,
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
import { LEAGUE_PARAM_KEYS, LeagueOptions } from "./experimental-league-options";
import { ParamControl, PreviewPanel } from "./experimental-create-wizard";
import { MATCH_PARAM_KEYS, MatchRulesChoice } from "./experimental-match-rules-choice";
import {
  ALL_PRESET_IDS,
  PRESET_LABELS,
  PRESET_PARAM_KEYS_BY_PRESET,
  WIZARD_DRAFT_KEY,
  bestOfLabel,
  buildCreatePayload,
  participantNoun,
  plural,
  readWizardDraft,
  requestParams,
  resumeStep,
  scheduleTargetStage,
  writeWizardDraft,
  type PresetId,
  type PresetParamKey,
  type PresetParamLimit,
  type PresetParams,
  type PresetPreview,
  type Visibility,
  type WizardDraft,
} from "./experimental-create-wizard-model";

type SectionId = "structure" | "matches" | "scoring" | "seeding" | "participants" | "access";

const SECTION_PARAMS: Record<SectionId, readonly PresetParamKey[]> = {
  structure: ["participantCount", "groupCount", "qualifiersPerGroup", "advancingCount", "swissRounds", "legs"],
  // V5.7: the match rules (length, sets, draws) live together in "Mecze"; the table keeps points and dates.
  matches: MATCH_PARAM_KEYS,
  scoring: LEAGUE_PARAM_KEYS.filter((key) => !MATCH_PARAM_KEYS.includes(key)),
  seeding: ["entrySeeding", "groupPlacement", "qualifierSeeding"],
  participants: [],
  access: [],
};

const VISIBILITY_TEXT: Record<Visibility, { label: string; hint: string }> = {
  public_online: { label: "Każdy z linkiem", hint: "Publiczne wyniki." },
  private_online: { label: "Z hasłem", hint: "Widzowie podają hasło." },
  private_offline: { label: "Tylko obsługa", hint: "Bez widoku dla widzów." },
};

const WIZARD_PATH = "/experimental/tournaments/new";

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

type PreviewState = { status: "idle" | "loading" | "ready" | "error"; data: PresetPreview | null; error: string | null; param?: PresetParamKey };

function sectionOfParam(key: PresetParamKey | undefined): SectionId | null {
  if (!key) return null;
  return (Object.keys(SECTION_PARAMS) as SectionId[]).find((id) => SECTION_PARAMS[id].includes(key)) ?? null;
}

function limitText(limit: PresetParamLimit | undefined): string | null {
  if (!limit) return null;
  if (limit.optionLabels) return limit.optionLabels[limit.options.indexOf(limit.value)] ?? null;
  if (limit.key === "bestOf" || limit.key === "playoffBestOf") return bestOfLabel(limit.value);
  if (limit.key === "legs") return limit.value === 2 ? "mecz i rewanż" : "jeden mecz";
  return `${limit.label.toLowerCase()}: ${limit.value}`;
}

/** V5.11: own settings of a section (keys the organizer set explicitly; the rest are the preset's defaults). */
export function sectionOverrides(id: SectionId, params: PresetParams, tunable: readonly PresetParamKey[]): PresetParamKey[] {
  return SECTION_PARAMS[id].filter((key) => key !== "participantCount" && tunable.includes(key) && params[key] != null);
}

function Section({
  id,
  title,
  icon,
  summary,
  open,
  invalid,
  overrides,
  onReset,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  icon: ReactNode;
  summary: string;
  open: boolean;
  invalid?: boolean;
  /** V5.11: undefined = the section has no preset defaults to compare with. */
  overrides?: number;
  onReset?: () => void;
  onToggle: (id: SectionId) => void;
  children: ReactNode;
}) {
  const bodyId = `experimental-advanced-${id}`;
  return (
    <section className="experimental-advanced-section" data-open={open ? "true" : "false"} data-invalid={invalid ? "true" : undefined}>
      <h3>
        <button type="button" className="experimental-advanced-section-head" aria-expanded={open} aria-controls={bodyId} onClick={() => onToggle(id)}>
          <span className="experimental-advanced-section-icon" aria-hidden="true">{icon}</span>
          <span className="experimental-advanced-section-title">{title}</span>
          <span className="experimental-advanced-section-summary">{summary}</span>
          {overrides !== undefined && (
            <span className="experimental-advanced-section-tag" data-changed={overrides > 0 ? "true" : "false"}>
              {overrides > 0 ? `zmienione: ${overrides}` : "domyślne"}
            </span>
          )}
          {invalid && <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-label="Wymaga poprawy" />}
          <ChevronDown className="experimental-advanced-section-chevron h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
      </h3>
      {open && (
        <div id={bodyId} className="experimental-advanced-section-body">
          {children}
          {onReset && overrides !== undefined && overrides > 0 && (
            <p className="experimental-advanced-section-reset">
              <button type="button" className="experimental-wizard-link" onClick={onReset}>Przywróć domyślne w tej sekcji</button>
              <span> — zdejmuje tylko Twoje zmiany z tej sekcji; reszta ustawień zostaje.</span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export function ExperimentalAdvancedEditor() {
  const [, navigate] = useLocation();
  const { storeOrgToken } = useAuth();
  const createTournament = useCreateTournament();
  const [draft, setDraft] = useState<WizardDraft>(() => {
    const stored = readWizardDraft(safeSessionStorage());
    return stored.presetId || stored.custom ? stored : { ...stored, presetId: "single_elimination" };
  });
  const [open, setOpen] = useState<SectionId>("structure");
  const [preview, setPreview] = useState<PreviewState>({ status: "idle", data: null, error: null });
  const [confirmReplace, setConfirmReplace] = useState<PresetId | null>(null);
  const [organizerPassword, setOrganizerPassword] = useState("");
  const [supportPassword, setSupportPassword] = useState("");
  const [viewerPassword, setViewerPassword] = useState("");
  const [showPassword, setShowPassword] = useState({ organizer: false, support: false, viewer: false });
  const [showValidation, setShowValidation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"checking" | "ready" | "unavailable">("checking");
  const submitInFlight = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const organizerRef = useRef<HTMLInputElement>(null);
  const supportRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<HTMLInputElement>(null);

  const { answers, presetId, params, custom } = draft;
  const noun = useCallback((n: number) => participantNoun(answers.participantType, n), [answers.participantType]);
  const update = useCallback((patch: Partial<WizardDraft>) => setDraft((current) => ({ ...current, ...patch })), []);
  useEffect(() => writeWizardDraft(safeSessionStorage(), draft), [draft]);

  const requestKey = presetId && !custom ? JSON.stringify(requestParams(presetId, answers, params)) : "";
  useEffect(() => {
    if (!presetId || custom) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPreview((current) => ({ ...current, status: "loading" }));
      fetch("/api/tournaments/presets/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ presetId, params: requestParams(presetId, answers, params), priority: answers.priority }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const body = (await response.json().catch(() => ({}))) as PresetPreview & { error?: string; param?: PresetParamKey };
          if (!response.ok) {
            setPreview((current) => ({ status: "error", data: current.data, error: body.error ?? `HTTP ${response.status}`, param: body.param }));
            return;
          }
          setPreview({ status: "ready", data: body, error: null });
        })
        .catch(() => {
          if (!controller.signal.aborted) setPreview((current) => ({ status: "error", data: current.data, error: "Nie udało się pobrać podglądu." }));
        });
    }, 120);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId, requestKey, custom]);

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
    void checkApiHealth();
  }, [checkApiHealth]);

  const shown: PresetPreview | null = custom
    ? ({ ...custom.preview, presetId: "groups_playoff", version: 1, family: "multi_stage", params: { participantCount: custom.preview.participants.count, bestOf: custom.preview.creation.defaultBestOf }, paramLimits: [], stagePlan: custom.preview.creation.stagePlan!, tieRules: [], leagueRules: null, schedule: null } as PresetPreview)
    : preview.data && preview.data.presetId === presetId ? preview.data : null;
  const previewValid = custom ? true : shown != null && preview.status !== "error";
  const limits = useMemo(() => new Map((custom ? [] : shown?.paramLimits ?? []).map((limit) => [limit.key, limit])), [custom, shown]);
  const errorSection = preview.status === "error" ? sectionOfParam(preview.param) ?? "structure" : null;
  const hasTable = shown != null && scheduleTargetStage(shown) != null && !custom;

  const setParam = (key: PresetParamKey, value: number) => {
    if (key === "participantCount") {
      setDraft((current) => ({ ...current, answers: { ...current.answers, participantCount: value } }));
      return;
    }
    update({ params: { ...params, [key]: value } });
  };

  // V5.11: per-section "own settings" against the preset's defaults, and a reset that removes only those.
  const tunable = custom || !presetId ? [] : PRESET_PARAM_KEYS_BY_PRESET[presetId];
  const overridesOf = (id: SectionId) => (custom ? undefined : sectionOverrides(id, params, tunable).length);
  const resetSection = (id: SectionId) => {
    const next = { ...params };
    for (const key of sectionOverrides(id, params, tunable)) delete next[key];
    update({ params: next });
  };

  const choosePreset = (next: PresetId) => {
    if (custom && confirmReplace !== next) {
      setConfirmReplace(next);
      return;
    }
    setConfirmReplace(null);
    update({ presetId: next, params: {}, custom: null });
  };

  const paramControls = (keys: readonly PresetParamKey[]) =>
    keys
      .map((key) => limits.get(key))
      .filter((limit): limit is PresetParamLimit => Boolean(limit))
      .map((limit) => (
        <ParamControl
          key={limit.key}
          limit={{ ...limit, value: limit.key === "participantCount" ? answers.participantCount : params[limit.key] ?? limit.value }}
          error={preview.status === "error" && preview.param === limit.key ? preview.error ?? undefined : undefined}
          onChange={(value) => setParam(limit.key, value)}
        />
      ));

  const nameProblem = tournamentNameError(draft.name);
  const organizerProblem = organizerPasswordError(organizerPassword);
  const supportProblem = supportPassword.length > 0 && supportPassword.length < ORGANIZER_PASSWORD_MIN_LENGTH
    ? `Hasło pomocnika musi mieć co najmniej ${ORGANIZER_PASSWORD_MIN_LENGTH} znaków albo pozostać puste.`
    : null;
  const viewerProblem = draft.visibility === "private_online" && viewerPassword.length < ORGANIZER_PASSWORD_MIN_LENGTH
    ? `Hasło dla widzów musi mieć co najmniej ${ORGANIZER_PASSWORD_MIN_LENGTH} znaków.`
    : null;
  const accessInvalid = showValidation && Boolean(nameProblem || organizerProblem || supportProblem || viewerProblem);

  const blockers = [
    !previewValid ? { text: preview.error ?? "Podgląd rozgrywek nie jest gotowy.", section: errorSection ?? "structure" as SectionId } : null,
    nameProblem ? { text: "Wpisz nazwę turnieju.", section: "access" as SectionId } : null,
    organizerProblem ? { text: "Ustaw hasło organizatora.", section: "access" as SectionId } : null,
    viewerProblem ? { text: "Ustaw hasło dla widzów.", section: "access" as SectionId } : null,
    supportProblem ? { text: "Hasło pomocnika jest za krótkie.", section: "access" as SectionId } : null,
    apiStatus === "unavailable" ? { text: "Serwer turniejowy jest niedostępny.", section: null } : null,
  ].filter((item): item is { text: string; section: SectionId | null } => item != null);

  const backToWizard = () => {
    writeWizardDraft(safeSessionStorage(), { ...draft, step: resumeStep(draft), maxVisitedStep: Math.max(draft.maxVisitedStep, resumeStep(draft)) as WizardDraft["maxVisitedStep"] });
    navigate(WIZARD_PATH);
  };

  const submit = () => {
    setSubmitError(null);
    setShowValidation(true);
    const firstInvalid = nameProblem ? nameRef : organizerProblem ? organizerRef : supportProblem ? supportRef : viewerProblem ? viewerRef : null;
    if (firstInvalid) {
      setOpen("access");
      window.setTimeout(() => firstInvalid.current?.focus(), 0);
      return;
    }
    if (!shown || !previewValid) {
      if (errorSection) setOpen(errorSection);
      setSubmitError("Popraw ustawienia rozgrywek — podgląd zgłasza błąd.");
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
        data: buildCreatePayload(custom ? custom.preview : shown, { ...draft, participantType: answers.participantType }, {
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

  const toggle = (id: SectionId) => setOpen((current) => (current === id ? current : id));
  const structureSummary = custom
    ? `${custom.label} · ${custom.preview.stages.length} ${plural(custom.preview.stages.length, "etap", "etapy", "etapów")}`
    : [presetId ? PRESET_LABELS[presetId] : null, `${answers.participantCount} ${noun(answers.participantCount)}`, limitText(limits.get("groupCount")), limitText(limits.get("advancingCount")), limitText(limits.get("swissRounds"))]
        .filter(Boolean).join(" · ");
  const setRules = shown?.matchRules?.kind === "sets" ? shown.matchRules : null;
  const matchesSummary = setRules
    ? [`do ${setRules.setsToWin} wygranych setów`, `set do ${setRules.pointsPerSet}`, setRules.winBy > 1 ? `przewaga ${setRules.winBy}` : null].filter(Boolean).join(" · ")
    : [limitText(limits.get("bestOf")),
        // V5.8: a play-off with its own length is an exception, and the summary says so.
        limits.get("playoffBestOf") && (params.playoffBestOf ?? limits.get("playoffBestOf")!.value) !== (params.bestOf ?? limits.get("bestOf")?.value)
          ? `play-off inaczej: ${limitText(limits.get("playoffBestOf"))?.toLowerCase()}` : null,
        shown?.leagueRules?.allowDraws ? "remisy" : null].filter(Boolean).join(" · ");
  const scoringSummary = shown?.leagueRules
    ? [`zwycięstwo ${shown.leagueRules.points.win}`, shown.leagueRules.allowDraws ? `remis ${shown.leagueRules.points.draw}` : "bez remisów", `porażka ${shown.leagueRules.points.loss}`, draft.schedule ? "terminarz" : null].filter(Boolean).join(" · ")
    : "—";
  const advancement = shown && shown.stages.length > 1 ? shown.stages[0]?.advancementText ?? null : null;
  const seedingSummary = custom ? "według planu z pliku" : [limitText(limits.get("entrySeeding")), limitText(limits.get("groupPlacement")), advancement].filter(Boolean).join(" · ");
  const participantsSummary = answers.participantType === "teams"
    ? `Drużyny${draft.rosterMin != null ? ` · min. ${draft.rosterMin} w podstawie` : ""}`
    : "Gracze";
  const accessSummary = `${draft.name.trim() || "bez nazwy"} · ${VISIBILITY_TEXT[draft.visibility].label}`;

  return (
    <div className="experimental-wizard experimental-advanced" data-step="advanced">
      <header className="experimental-wizard-top">
        <div>
          <p className="experimental-wizard-eyebrow">Nowe rozgrywki · tryb zaawansowany</p>
          <h2 className="experimental-wizard-title">Wszystkie ustawienia</h2>
        </div>
        <div className="experimental-wizard-top-actions">
          <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={backToWizard}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Prosty kreator
          </button>
        </div>
      </header>

      <div className="experimental-wizard-body" data-has-preview="true">
        <div className="experimental-wizard-main experimental-advanced-sections">
          <Section id="structure" overrides={overridesOf("structure")} onReset={() => resetSection("structure")} title="Format i etapy" icon={<Layers className="h-4 w-4" />} summary={structureSummary} open={open === "structure"} invalid={errorSection === "structure"} onToggle={toggle}>
            <fieldset className="experimental-wizard-field">
              <legend className="experimental-wizard-legend">Format</legend>
              <div className="experimental-advanced-formats" role="radiogroup" aria-label="Format">
                {ALL_PRESET_IDS.map((id) => (
                  <button key={id} type="button" role="radio" aria-checked={!custom && presetId === id} className="experimental-wizard-chip" onClick={() => choosePreset(id)}>
                    {PRESET_LABELS[id]}
                  </button>
                ))}
              </div>
            </fieldset>
            {custom && (
              <p className="experimental-wizard-note" data-tone="info" role="status">
                <Layers className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Używasz własnego planu <strong>{custom.label}</strong>. Etapy, awanse i rozstawienie pochodzą z pliku i zostaną zapisane bez zmian.
                </span>
              </p>
            )}
            {confirmReplace && custom && (
              <div className="experimental-wizard-note" data-tone="danger" role="alert">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  „{PRESET_LABELS[confirmReplace]}” zastąpi własny plan z pliku ({custom.preview.stages.length} {plural(custom.preview.stages.length, "etap", "etapy", "etapów")}). Jego etapy i rozstawienie nie zostaną zachowane.
                  {" "}<button type="button" className="experimental-wizard-link" onClick={() => choosePreset(confirmReplace)}>Zastąp plan</button>
                  {" "}<button type="button" className="experimental-wizard-link" onClick={() => setConfirmReplace(null)}>Zostaw plan</button>
                </span>
              </div>
            )}
            {!custom && paramControls(SECTION_PARAMS.structure)}
          </Section>

          {!custom && (
            <Section id="matches" overrides={overridesOf("matches")} onReset={() => resetSection("matches")} title="Mecze" icon={<Swords className="h-4 w-4" />} summary={matchesSummary} open={open === "matches"} invalid={errorSection === "matches"} onToggle={toggle}>
              {shown && (
                <MatchRulesChoice
                  preview={shown}
                  params={params}
                  onParams={(next) => update({ params: next })}
                  error={preview.status === "error" ? { param: preview.param, message: preview.error } : null}
                />
              )}
            </Section>
          )}

          {hasTable && shown && (
            <Section id="scoring" overrides={overridesOf("scoring")} onReset={() => resetSection("scoring")} title="Punktacja i terminy" icon={<Scale className="h-4 w-4" />} summary={scoringSummary} open={open === "scoring"} invalid={errorSection === "scoring"} onToggle={toggle}>
              <LeagueOptions
                preview={shown}
                params={params}
                onParams={(next) => update({ params: next })}
                schedule={draft.schedule}
                onSchedule={(schedule) => update({ schedule })}
                error={preview.status === "error" ? { param: preview.param, message: preview.error } : null}
              />
            </Section>
          )}

          <Section id="seeding" overrides={overridesOf("seeding")} onReset={() => resetSection("seeding")} title="Rozstawienie i awanse" icon={<ListOrdered className="h-4 w-4" />} summary={seedingSummary} open={open === "seeding"} invalid={errorSection === "seeding"} onToggle={toggle}>
            {shown && <FlowSteps preview={shown} noun={noun} />}
            {!custom && paramControls(SECTION_PARAMS.seeding)}
            <p className="experimental-wizard-help">
              Liczby awansów zmienisz w sekcji „Format i etapy”. Koszyki i nietypowe połączenia etapów ustawisz po utworzeniu, w zakładce Etapy.
            </p>
          </Section>

          <Section id="participants" title="Uczestnicy" icon={<Users className="h-4 w-4" />} summary={participantsSummary} open={open === "participants"} onToggle={toggle}>
            <div className="experimental-wizard-segments" role="radiogroup" aria-label="Kto bierze udział">
              {(["players", "teams"] as const).map((type) => (
                <button key={type} type="button" role="radio" aria-checked={answers.participantType === type} className="experimental-wizard-chip"
                  onClick={() => setDraft((current) => ({ ...current, answers: { ...current.answers, participantType: type } }))}>
                  {type === "players" ? "Gracze" : "Drużyny"}
                </button>
              ))}
            </div>
            {answers.participantType === "teams" && (
              <div className="experimental-wizard-inline-actions">
                <label className="experimental-wizard-roster-limit">
                  <span>Minimum w podstawie</span>
                  <select aria-label="Minimum zawodników w podstawie" value={draft.rosterMin ?? ""} onChange={(event) => update({ rosterMin: event.target.value ? Number(event.target.value) : null })}>
                    <option value="">bez limitu</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                <label className="experimental-wizard-roster-limit">
                  <span>Maksimum w składzie</span>
                  <select aria-label="Maksimum osób w składzie" value={draft.rosterMax ?? ""} onChange={(event) => update({ rosterMax: event.target.value ? Number(event.target.value) : null })}>
                    <option value="">bez limitu</option>
                    {[2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
              </div>
            )}
            {draft.rosterMin != null && draft.rosterMax != null && draft.rosterMax < draft.rosterMin && (
              <p role="alert" className="experimental-wizard-error">Maksimum nie może być mniejsze od minimum — maksimum zostanie pominięte.</p>
            )}
            <p className="experimental-wizard-help">Dodatkowe pola uczestników (np. ranga, Discord) włączysz po utworzeniu, na liście uczestników.</p>
          </Section>

          <Section id="access" title="Nazwa i dostęp" icon={<Lock className="h-4 w-4" />} summary={accessSummary} open={open === "access"} invalid={accessInvalid} onToggle={toggle}>
            <div className="experimental-wizard-field">
              <Label htmlFor="experimental-advanced-name" className="experimental-wizard-legend">Nazwa turnieju <span className="experimental-wizard-required">wymagane</span></Label>
              <Input id="experimental-advanced-name" ref={nameRef} value={draft.name} autoComplete="off" placeholder="Np. Wiosenny Puchar Klubu"
                aria-invalid={showValidation && nameProblem ? true : undefined} onChange={(event) => update({ name: event.target.value })} />
              {showValidation && nameProblem && <p role="alert" className="experimental-wizard-error">{nameProblem}</p>}
            </div>
            <PasswordField
              id="experimental-advanced-organizer-password"
              label="Hasło organizatora (wymagane)"
              value={organizerPassword}
              onChange={setOrganizerPassword}
              visible={showPassword.organizer}
              onToggle={() => setShowPassword((current) => ({ ...current, organizer: !current.organizer }))}
              inputRef={organizerRef}
              minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
              detail={organizerPasswordRemaining(organizerPassword) > 0 ? `Jeszcze ${organizerPasswordRemaining(organizerPassword)} ${plural(organizerPasswordRemaining(organizerPassword), "znak", "znaki", "znaków")}` : undefined}
              error={showValidation ? organizerProblem ?? undefined : undefined}
            />
            <div className="experimental-wizard-segments" role="radiogroup" aria-label="Kto może oglądać">
              {(Object.keys(VISIBILITY_TEXT) as Visibility[]).map((value) => (
                <button key={value} type="button" role="radio" aria-checked={draft.visibility === value} className="experimental-wizard-chip" title={VISIBILITY_TEXT[value].hint} onClick={() => update({ visibility: value })}>
                  {VISIBILITY_TEXT[value].label}
                </button>
              ))}
            </div>
            {draft.visibility === "private_online" && (
              <PasswordField
                id="experimental-advanced-viewer-password"
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
                  <Label htmlFor="experimental-advanced-description" className="experimental-wizard-legend">Opis</Label>
                  <Textarea id="experimental-advanced-description" rows={3} value={draft.description} placeholder="Krótka informacja dla uczestników i widzów" onChange={(event) => update({ description: event.target.value })} />
                </div>
                <PasswordField
                  id="experimental-advanced-support-password"
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
          </Section>
        </div>

        <div className="experimental-advanced-side">
          <PreviewPanel preview={shown} noun={noun} loading={preview.status === "loading"} stale={preview.status === "error"} schedule={draft.schedule} compact />
          <section className="experimental-advanced-ready" aria-label="Gotowość">
            {blockers.length === 0 ? (
              <p className="experimental-advanced-ready-ok"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Gotowe do utworzenia</p>
            ) : (
              <ul>
                {blockers.map((item) => (
                  <li key={item.text}>
                    <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.section ? (
                      <button type="button" className="experimental-wizard-link" onClick={() => setOpen(item.section!)}>{item.text}</button>
                    ) : (
                      <span>
                        {item.text} <button type="button" className="experimental-wizard-link" onClick={() => void checkApiHealth()}>Sprawdź ponownie</button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {submitError && (
              <p className="experimental-wizard-note" data-tone="danger" role="alert">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{submitError}
              </p>
            )}
            <button type="button" className="experimental-v4-btn experimental-wizard-primary" data-variant="primary" disabled={createTournament.isPending || apiStatus === "checking"} onClick={submit}>
              <Trophy className="h-4 w-4" aria-hidden="true" />
              {createTournament.isPending ? "Tworzenie…" : apiStatus === "checking" ? "Sprawdzanie serwera…" : "Utwórz turniej"}
            </button>
            <Link href="/experimental/tournaments/dashboard" className="experimental-v4-btn" data-variant="ghost">Anuluj</Link>
          </section>
        </div>
      </div>
    </div>
  );
}

/** V5.4-004: the participant flow in plain words, built from the engine's own stage summaries. */
export function FlowSteps({ preview, noun }: { preview: Pick<PresetPreview, "stages">; noun: (n: number) => string }) {
  if (preview.stages.length === 0) return null;
  return (
    <ol className="experimental-flow-steps" aria-label="Przepływ uczestników">
      {preview.stages.map((stage, index) => {
        const next = preview.stages[index + 1];
        const groups = stage.groupSizes;
        return (
          <li key={stage.key} className="experimental-flow-step">
            <p className="experimental-flow-step-name">
              <span className="experimental-flow-step-index">{stage.position}</span> {stage.name}
            </p>
            <p className="experimental-flow-step-facts">
              {stage.participantCount} {noun(stage.participantCount)}
              {groups && groups.length > 0 ? ` → ${groups.length} ${plural(groups.length, "grupa", "grupy", "grup")} po ${[...new Set(groups)].join("–")}` : ""}
            </p>
            {next && stage.advancingCount != null && (
              <p className="experimental-flow-step-advance">
                Awans: {stage.advancingCount} → {next.name}
                {next.participantCount !== stage.advancingCount && (
                  <strong className="experimental-flow-step-mismatch"> (etap czeka na {next.participantCount})</strong>
                )}
              </p>
            )}
            {!next && <p className="experimental-flow-step-advance"><Trophy className="inline h-3.5 w-3.5" aria-hidden="true" /> {stage.advancementText}</p>}
          </li>
        );
      })}
    </ol>
  );
}
