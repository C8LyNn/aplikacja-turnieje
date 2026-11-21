import { t } from "@/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Globe, Layers3, Lock, Shuffle, Trophy } from "lucide-react";
import {
  setActiveOrganizerToken,
  useCreateTournament,
  type TournamentInput,
} from "@workspace/api-client-react";
import { calculateMarvelRoundParticipantCounts } from "@workspace/game-catalog";
import { Layout } from "@/components/layout";
import { StagePlanEditor } from "@/components/stage-plan-editor";
import { ClassicQuickPresets } from "@/components/classic-quick-presets";
import { quickPresetPayload, type QuickBestOf } from "@/lib/classic-quick-presets";
import type { PresetId, PresetPreview } from "@/features/experimental-tournaments/experimental-create-wizard-model";
import { GameConfigPicker } from "@/components/deadlock-game-config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/password-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import {
  buildSingleStageSeedingPlan,
  createStageDraft,
  getApiErrorMessage,
  normalizeStageDrafts,
  type RandomRevealOrder,
  type SingleStageEntrySeedingMethod,
  SINGLE_STAGE_SEEDING_LABELS,
  type StageDraft,
  validateStageDrafts,
  withOptionalStagePlan,
} from "@/lib/tournament-stages-ui";
import {
  focusInvalidCreateTournamentField,
  ORGANIZER_PASSWORD_MIN_LENGTH,
  organizerPasswordError,
  organizerPasswordRemaining,
  tournamentNameError,
} from "@/lib/create-tournament-validation";

type SingleStageTournamentFormat = Exclude<
  TournamentInput["format"],
  "group_stage"
>;

const FORMAT_INFO: Record<
  SingleStageTournamentFormat,
  { label: string; desc: string }
> = {
  single_elimination: {
    get label() { return t("createTournament.drabinka_eliminacyjna"); },
    get desc() { return t("createTournament.przegrana_oznacza_odpadniecie_z_turnieju"); },
  },
  swiss: {
    get label() { return t("createTournament.system_szwajcarski"); },
    get desc() { return t("createTournament.wszyscy_graja_ustalona_liczbe_rund"); },
  },
  round_robin: {
    get label() { return t("createTournament.kazdy_z_kazdym"); },
    get desc() { return t("createTournament.kazdy_uczestnik_rozgrywa_mecz_z"); },
  },
  double_elimination: {
    get label() { return t("createTournament.podwojna_eliminacja"); },
    get desc() { return t("createTournament.przegrana_nie_eliminuje_kazdy_ma"); },
  },
};

type Visibility = NonNullable<TournamentInput["visibility"]>;

/**
 * Maps a role value to its redirect target.
 * Returns null when the role is "organizer" (no redirect needed).
 */
function redirectTargetForRole(role: string | null | undefined): string | null {
  if (role === "organizer") return null;
  if (role === "fan") return "/fan";
  if (role === "support") return "/support";
  if (role === "developer") return "/developer";
  return "/"; // null / unknown → landing
}

/**
 * Route guard wrapper.
 *
 * All hooks here are called unconditionally on every render — there is no
 * early return before any hook call. The navigate side-effect is deferred to
 * a useEffect so it never runs during the render phase.
 *
 * When the role is not "organizer" the guard renders null and the effect fires
 * a replace-navigation. When the role IS "organizer" the inner form component
 * is rendered; if the role later changes (e.g. session expiry), the guard
 * unmounts the form and fires the redirect — React never observes a change in
 * the number of hooks called by any single component.
 */
export default function CreateTournament() {
  const { role } = useAuth();
  const [, navigate] = useLocation();

  const redirectTo = redirectTargetForRole(role);

  useEffect(() => {
    if (redirectTo !== null) {
      navigate(redirectTo, { replace: true });
    }
  }, [redirectTo, navigate]);

  if (redirectTo !== null) return null;
  return <CreateTournamentForm />;
}

/**
 * Inner form component.
 *
 * Only mounted after the guard confirms organizer role. All form hooks live
 * here and are therefore always called in the same order — they are never
 * skipped or called conditionally.
 */
function CreateTournamentForm() {
  const [, navigate] = useLocation();
  const { storeOrgToken } = useAuth();
  const createTournament = useCreateTournament();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] =
    useState<SingleStageTournamentFormat>("single_elimination");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [swissRounds, setSwissRounds] = useState("");
  const [defaultBestOf, setDefaultBestOf] = useState("1");
  const [organizerPassword, setOrganizerPassword] = useState("");
  const [supportPassword, setSupportPassword] = useState("");
  const [viewerPassword, setViewerPassword] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public_online");
  const [gameConfig, setGameConfig] = useState<
    NonNullable<TournamentInput["gameConfig"]> | null
  >(null);
  const [showOrgPass, setShowOrgPass] = useState(false);
  const [showSupPass, setShowSupPass] = useState(false);
  const [showViewerPass, setShowViewerPass] = useState(false);
  const [entrySeedingMethod, setEntrySeedingMethod] =
    useState<SingleStageEntrySeedingMethod>("registration_order");
  const [randomRevealOrder, setRandomRevealOrder] =
    useState<RandomRevealOrder>("sequential");
  const [stageMode, setStageMode] = useState(false);
  const [stages, setStages] = useState<StageDraft[]>([
    createStageDraft(1, "swiss"),
    {
      ...createStageDraft(2, "single_elimination"),
      participantCount: 4,
      bestOf: 3,
    },
  ]);
  // QW-03b: a quick preset replaces the manual format section; the payload comes from the server preview.
  const [quickPresetId, setQuickPresetId] = useState<PresetId | null>(null);
  const [quickCount, setQuickCount] = useState("");
  const [quickBestOf, setQuickBestOf] = useState<QuickBestOf>(1);
  const [quickPreview, setQuickPreview] = useState<PresetPreview | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [nameTouched, setNameTouched] = useState(false);
  const [organizerPasswordTouched, setOrganizerPasswordTouched] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const organizerPasswordInputRef = useRef<HTMLInputElement>(null);
  const submitInFlightRef = useRef(false);

  const validationErrors = useMemo(
    () => (stageMode ? validateStageDrafts(stages) : []),
    [stageMode, stages],
  );
  const info = FORMAT_INFO[format];
  const marvelConfig =
    gameConfig?.gameId === "marvel" ? gameConfig.config : null;

  const quickPresetActive = quickPresetId !== null && !marvelConfig;

  const submitPayload = (payload: TournamentInput) => {
    createTournament.mutate(
      { data: payload },
      {
        onSuccess: (response) => {
          submitInFlightRef.current = false;
          // useCreateTournament returns TournamentCreationResponse (Tournament + organizerToken)
          const { id, organizerToken } = response;
          storeOrgToken(id, organizerToken);
          setActiveOrganizerToken(organizerToken);
          navigate(`/tournaments/${id}`);
        },
        onError: (error) => { submitInFlightRef.current = false; setSubmitError(getApiErrorMessage(error)); },
      },
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(undefined);
    setShowValidation(true);
    const invalidField = focusInvalidCreateTournamentField({
      name,
      organizerPassword,
      nameElement: nameInputRef.current,
      organizerPasswordElement: organizerPasswordInputRef.current,
    });
    if (invalidField) {
      if (invalidField === "name") setNameTouched(true);
      if (invalidField === "organizerPassword") setOrganizerPasswordTouched(true);
      return;
    }
    if (quickPresetActive) {
      if (!quickPreview) {
        setSubmitError(t("createTournament.uklad_z_szybkiego_wyboru_nie"));
        return;
      }
      if (submitInFlightRef.current) return;
      submitInFlightRef.current = true;
      submitPayload(quickPresetPayload(
        quickPreview,
        { name, description, visibility },
        { organizerPassword, supportPassword, viewerPassword },
        gameConfig,
      ));
      return;
    }
    if (stageMode && validationErrors.length > 0) return;
    const marvelParticipantCount = Number.parseInt(maxPlayers, 10);
    if (marvelConfig) {
      try {
        calculateMarvelRoundParticipantCounts(
          marvelParticipantCount,
          marvelConfig.groupSize,
          marvelConfig.advancingCount,
        );
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? t("createTournament.nieprawidlowy_przeplyw_marvel_message", { message: error.message })
            : t("createTournament.nieprawidlowy_przeplyw_marvel"),
        );
        return;
      }
    }
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;

    const legacyPayload: TournamentInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      format,
      maxPlayers: maxPlayers ? Number.parseInt(maxPlayers, 10) : undefined,
      swissRounds:
        format === "swiss" && swissRounds
          ? Number.parseInt(swissRounds, 10)
          : undefined,
      defaultBestOf: Number.parseInt(defaultBestOf, 10) || 1,
      organizerPassword,
      supportPassword: supportPassword || undefined,
      viewerPassword:
        visibility === "private_online"
          ? viewerPassword || undefined
          : undefined,
      visibility,
      gameConfig: gameConfig ?? undefined,
    };

    // Only generate a stagePlan for non-default seeding methods.
    // "registration_order" uses the legacy path which needs no plan.
    // maxPlayers is optional — the DB trigger keeps stage.participant_count
    // in sync with the actual registered player count, so the lifecycle
    // always starts with the real number regardless of the plan's value.
    let singleStagePlan: import("@workspace/api-client-react").TournamentStagePlanInput | undefined;
    if (!stageMode && !marvelConfig && entrySeedingMethod !== "registration_order") {
      const parsedMaxPlayers = maxPlayers ? Number.parseInt(maxPlayers, 10) : undefined;
      singleStagePlan = buildSingleStageSeedingPlan(format, {
        maxPlayers: parsedMaxPlayers,
        bestOf: (Number.parseInt(defaultBestOf, 10) || 1) as 1 | 3 | 5 | 7,
        swissRounds: format === "swiss" && swissRounds ? Number.parseInt(swissRounds, 10) : undefined,
        entrySeedingMethod,
        randomRevealOrder,
      });
    }

    const payload: TournamentInput = marvelConfig
      ? {
          ...legacyPayload,
          format: "round_robin",
          maxPlayers: marvelParticipantCount,
          defaultBestOf: 1,
          stagePlan: {
            initialParticipantCount: marvelParticipantCount,
            stages: [
              {
                key: "stage_1",
                position: 1,
                name: t("createTournament.marvel_eliminacyjne_grupy"),
                format: "group_stage",
                participantCount: marvelParticipantCount,
                bestOf: 1,
                groupCount: Math.ceil(
                  marvelParticipantCount / marvelConfig.groupSize,
                ),
                participantsPerGroup: Math.min(
                  marvelParticipantCount,
                  marvelConfig.groupSize,
                ),
                qualifiersPerGroup: marvelConfig.advancingCount,
                entrySeedingMethod: "preserve",
                placementMethod: "snake",
                seedingMethod: "snake",
                resultSeedingMethod: "rank_bands",
                randomRevealOrder: "instant",
              },
            ],
          },
        }
      : stageMode
        ? withOptionalStagePlan(legacyPayload, stageMode, stages)
        : { ...legacyPayload, stagePlan: singleStagePlan };

    submitPayload(payload);
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Trophy className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t("createTournament.nowy_turniej")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("createTournament.skonfiguruj_pojedynczy_format_albo_plan")}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("createTournament.dane_turnieju")}</CardTitle>
            <CardDescription>
              {t("createTournament.podstawowe_informacje_i_przebieg_rozgryw")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tournament-name">{t("createTournament.nazwa_turnieju")}</Label>
                <Input
                  id="tournament-name"
                  ref={nameInputRef}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => setNameTouched(true)}
                  placeholder={t("createTournament.np_spring_championship_2026")}
                  aria-describedby={(nameTouched || showValidation) && tournamentNameError(name) ? "tournament-name-error" : undefined}
                  aria-invalid={(nameTouched || showValidation) && !!tournamentNameError(name) ? true : undefined}
                  required
                />
                {(nameTouched || showValidation) && tournamentNameError(name) && (
                  <p id="tournament-name-error" role="alert" className="text-sm font-medium text-destructive">
                    <span aria-hidden="true">⚠ </span>{tournamentNameError(name)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tournament-description">
                  {t("createTournament.opis_opcjonalnie")}</Label>
                <Textarea
                  id="tournament-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={t("createTournament.krotki_opis_turnieju")}
                  rows={2}
                />
              </div>

              <GameConfigPicker
                value={gameConfig}
                onChange={(next) => {
                  setGameConfig(next);
                  if (next?.gameId === "marvel") {
                    setQuickPresetId(null);
                    setStageMode(false);
                    setMaxPlayers((current) => current || "32");
                    setDefaultBestOf("1");
                  }
                }}
              />

              {!marvelConfig && (
                <ClassicQuickPresets
                  presetId={quickPresetId}
                  count={quickCount}
                  bestOf={quickBestOf}
                  onSelect={(next) => { setQuickPresetId(next); setSubmitError(undefined); }}
                  onCountChange={setQuickCount}
                  onBestOfChange={setQuickBestOf}
                  onPreview={setQuickPreview}
                />
              )}

              {!quickPresetActive && (<>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Layers3 className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="stage-mode" className="text-base">
                        {t("createTournament.turniej_wieloetapowy")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {marvelConfig
                          ? t("createTournament.marvel_uzywa_jednej_fazy_z")
                          : t("createTournament.wlacz_aby_polaczyc_1_10")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="stage-mode"
                    checked={stageMode}
                    disabled={marvelConfig != null}
                    onCheckedChange={(checked) => {
                      setStageMode(checked);
                      setShowValidation(false);
                    }}
                  />
                </div>
              </div>

              {stageMode && !marvelConfig ? (
                <StagePlanEditor
                  stages={stages}
                  errors={showValidation ? validationErrors : []}
                  deadlockEnabled={gameConfig?.gameId === "deadlock"}
                  onChange={(next) => {
                    setStages(normalizeStageDrafts(next));
                    setShowValidation(false);
                  }}
                />
              ) : marvelConfig ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div>
                    <Label>{t("createTournament.format")}</Label>
                    <p className="font-semibold">{t("createTournament.marvel_eliminacyjne_grupy")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("createTournament.jedna_faza_grupowa_zawierajaca_kolejne")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-players">{t("createTournament.liczba_graczy")}</Label>
                    <Input
                      id="max-players"
                      type="number"
                      min="2"
                      value={maxPlayers}
                      onChange={(event) => setMaxPlayers(event.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("createTournament.kazda_runda_przed_finalem_musi")}{" "}{marvelConfig.groupSize}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label>{t("createTournament.format_2")}</Label>
                    <Select
                      value={format}
                      onValueChange={(value) =>
                        setFormat(value as SingleStageTournamentFormat)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FORMAT_INFO).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{info.desc}</p>
                  </div>
                  {format === "swiss" && (
                    <div className="space-y-2">
                      <Label htmlFor="swiss-rounds">{t("createTournament.liczba_rund_swiss")}</Label>
                      <Input
                        id="swiss-rounds"
                        type="number"
                        min="1"
                        max="20"
                        value={swissRounds}
                        onChange={(event) => setSwissRounds(event.target.value)}
                        placeholder={t("createTournament.automatycznie")}
                      />
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="max-players">{t("createTournament.maks_graczy")}</Label>
                      <Input
                        id="max-players"
                        type="number"
                        min="2"
                        value={maxPlayers}
                        onChange={(event) => setMaxPlayers(event.target.value)}
                        placeholder={t("createTournament.bez_limitu")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("createTournament.best_of")}</Label>
                      <Select
                        value={defaultBestOf}
                        onValueChange={setDefaultBestOf}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 3, 5, 7].map((bestOf) => (
                            <SelectItem key={bestOf} value={String(bestOf)}>
                              {t("createTournament.best_of")}{" "}{bestOf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Seeding section */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Shuffle className="h-4 w-4 text-primary" />
                      {t("createTournament.seedowanie_uczestnikow")}</div>
                    <div className="space-y-2">
                      <Label htmlFor="entry-seeding-method">{t("createTournament.metoda_seedowania")}</Label>
                      <Select
                        value={entrySeedingMethod}
                        onValueChange={(value) =>
                          setEntrySeedingMethod(value as SingleStageEntrySeedingMethod)
                        }
                      >
                        <SelectTrigger id="entry-seeding-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(SINGLE_STAGE_SEEDING_LABELS) as [SingleStageEntrySeedingMethod, string][]).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {entrySeedingMethod === "random" && (
                      <div className="space-y-2">
                        <Label>{t("createTournament.typ_ceremonii_losowania")}</Label>
                        <div className="flex flex-col gap-2">
                          {(
                            [
                              { value: "sequential", label: t("createTournament.sekwencyjne_jeden_losowany_seed_po") },
                              { value: "instant", label: t("createTournament.natychmiastowe_wszystkie_seedy_od_razu") },
                            ] as { value: RandomRevealOrder; label: string }[]
                          ).map((option) => (
                            <label
                              key={option.value}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${randomRevealOrder === option.value ? "border-primary bg-primary/5" : "hover:bg-muted/20"}`}
                            >
                              <input
                                type="radio"
                                name="random-reveal-order"
                                value={option.value}
                                checked={randomRevealOrder === option.value}
                                onChange={() => setRandomRevealOrder(option.value)}
                                className="mt-0.5 accent-primary"
                              />
                              {option.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {entrySeedingMethod === "manual" && (
                      <p className="text-xs text-muted-foreground">
                        {t("createTournament.ustaw_numery_seedow_dla_graczy")}</p>
                    )}
                    {entrySeedingMethod === "random" && (
                      <p className="text-xs text-muted-foreground">
                        {t("createTournament.po_utworzeniu_turnieju_i_dodaniu")}</p>
                    )}
                  </div>
                </div>
              )}
              </>)}

              <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">
                    {t("createTournament.wynik_oznacza_wygrane_gry_lub")}</strong>
                </p>
                <p className="mt-1">
                  {t("createTournament.bo3_wymaga_2_wygranych_bo5")}</p>
              </div>

              <div className="space-y-3 border-t pt-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4" />
                  {t("createTournament.widocznosc_turnieju")}</div>
                {[
                  {
                    value: "public_online",
                    label: t("createTournament.publiczny_online"),
                    description: t("createTournament.kibic_moze_wejsc_bez_hasla"),
                  },
                  {
                    value: "private_online",
                    label: t("createTournament.prywatny_online"),
                    description: t("createTournament.kibic_musi_podac_haslo_widza"),
                  },
                  {
                    value: "private_offline",
                    label: t("createTournament.ukryty_prywatny_offline"),
                    description: t("createTournament.niewidoczny_dla_widzow_az_go"),
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${visibility === option.value ? "border-primary bg-primary/5" : "hover:bg-muted/20"}`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={visibility === option.value}
                      onChange={() => setVisibility(option.value as Visibility)}
                      className="mt-1 accent-primary"
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {option.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="space-y-4 border-t pt-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4" />
                  {t("createTournament.hasla_dostepu")}</div>
                <PasswordField
                  id="organizer-password"
                  label={t("createTournament.haslo_organizatora")}
                  value={organizerPassword}
                  onChange={setOrganizerPassword}
                  visible={showOrgPass}
                  onToggle={() => setShowOrgPass((value) => !value)}
                  inputRef={organizerPasswordInputRef}
                  minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
                  description={t("createTournament.wymagane_minimum_8_znakow_zachowaj")}
                  detail={organizerPasswordRemaining(organizerPassword) > 0
                    ? t("createTournament.brakuje_jeszcze_v0_znakow", { v0: organizerPasswordRemaining(organizerPassword) })
                    : undefined}
                  error={(organizerPasswordTouched || showValidation)
                    ? organizerPasswordError(organizerPassword) ?? undefined
                    : undefined}
                  onBlur={() => setOrganizerPasswordTouched(true)}
                />
                <PasswordField
                  id="support-password"
                  label={t("createTournament.haslo_wsparcia")}
                  value={supportPassword}
                  onChange={setSupportPassword}
                  visible={showSupPass}
                  onToggle={() => setShowSupPass((value) => !value)}
                />
                {visibility === "private_online" && (
                  <PasswordField
                    id="viewer-password"
                    label={t("createTournament.haslo_widza")}
                    value={viewerPassword}
                    onChange={setViewerPassword}
                    visible={showViewerPass}
                    onToggle={() => setShowViewerPass((value) => !value)}
                  />
                )}
              </div>

              {submitError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {submitError}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={createTournament.isPending}
              >
                {createTournament.isPending ? t("createTournament.tworzenie") : t("createTournament.utworz_turniej")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
