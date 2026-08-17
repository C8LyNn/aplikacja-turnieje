import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Globe, Layers3, Lock, Trophy } from "lucide-react";
import {
  setActiveOrganizerToken,
  useCreateTournament,
  type TournamentInput,
} from "@workspace/api-client-react";
import { calculateMarvelRoundParticipantCounts } from "@workspace/game-catalog";
import { Layout } from "@/components/layout";
import { StagePlanEditor } from "@/components/stage-plan-editor";
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
  createStageDraft,
  getApiErrorMessage,
  normalizeStageDrafts,
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
    label: "Drabinka eliminacyjna",
    desc: "Przegrana oznacza odpadnięcie z turnieju.",
  },
  swiss: {
    label: "System szwajcarski",
    desc: "Wszyscy grają ustaloną liczbę rund, a ranking uwzględnia bilans i Buchholza.",
  },
  round_robin: {
    label: "Każdy z każdym",
    desc: "Każdy uczestnik rozgrywa mecz z każdym pozostałym.",
  },
  double_elimination: {
    label: "Podwójna eliminacja",
    desc: "Przegrana nie eliminuje — każdy ma drugą szansę w drabince przegranych.",
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
  const [stageMode, setStageMode] = useState(false);
  const [stages, setStages] = useState<StageDraft[]>([
    createStageDraft(1, "swiss"),
    {
      ...createStageDraft(2, "single_elimination"),
      participantCount: 4,
      bestOf: 3,
    },
  ]);
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
            ? `Nieprawidłowy przepływ Marvel: ${error.message}`
            : "Nieprawidłowy przepływ Marvel.",
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
      organizerPassword: organizerPassword || undefined,
      supportPassword: supportPassword || undefined,
      viewerPassword:
        visibility === "private_online"
          ? viewerPassword || undefined
          : undefined,
      visibility,
      gameConfig: gameConfig ?? undefined,
    };

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
                name: "Marvel — Eliminacyjne grupy",
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
      : withOptionalStagePlan(legacyPayload, stageMode, stages);

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

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Trophy className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Nowy turniej</h1>
            <p className="text-sm text-muted-foreground">
              Skonfiguruj pojedynczy format albo plan do dziesięciu etapów.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dane turnieju</CardTitle>
            <CardDescription>
              Podstawowe informacje i przebieg rozgrywek
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tournament-name">Nazwa turnieju *</Label>
                <Input
                  id="tournament-name"
                  ref={nameInputRef}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => setNameTouched(true)}
                  placeholder="np. Spring Championship 2026"
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
                  Opis (opcjonalnie)
                </Label>
                <Textarea
                  id="tournament-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Krótki opis turnieju…"
                  rows={2}
                />
              </div>

              <GameConfigPicker
                value={gameConfig}
                onChange={(next) => {
                  setGameConfig(next);
                  if (next?.gameId === "marvel") {
                    setStageMode(false);
                    setMaxPlayers((current) => current || "32");
                    setDefaultBestOf("1");
                  }
                }}
              />

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Layers3 className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="stage-mode" className="text-base">
                        Turniej wieloetapowy
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {marvelConfig
                          ? "Marvel używa jednej fazy z wewnętrznymi rundami grup FFA."
                          : "Włącz, aby połączyć 1–10 formatów z osobnymi BO i zasadami awansu."}
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
                    <Label>Format</Label>
                    <p className="font-semibold">Marvel — Eliminacyjne grupy</p>
                    <p className="text-xs text-muted-foreground">
                      Jedna faza grupowa zawierająca kolejne rundy FFA aż do
                      finału.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-players">Liczba graczy *</Label>
                    <Input
                      id="max-players"
                      type="number"
                      min="2"
                      value={maxPlayers}
                      onChange={(event) => setMaxPlayers(event.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Każda runda przed finałem musi dzielić się na pełne grupy
                      po {marvelConfig.groupSize}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label>Format *</Label>
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
                      <Label htmlFor="swiss-rounds">Liczba rund Swiss</Label>
                      <Input
                        id="swiss-rounds"
                        type="number"
                        min="1"
                        max="20"
                        value={swissRounds}
                        onChange={(event) => setSwissRounds(event.target.value)}
                        placeholder="Automatycznie"
                      />
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="max-players">Maks. graczy</Label>
                      <Input
                        id="max-players"
                        type="number"
                        min="2"
                        value={maxPlayers}
                        onChange={(event) => setMaxPlayers(event.target.value)}
                        placeholder="Bez limitu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Best of</Label>
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
                              Best of {bestOf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">
                    Wynik oznacza wygrane gry lub mapy.
                  </strong>
                </p>
                <p className="mt-1">
                  BO3 wymaga 2 wygranych, BO5 wymaga 3. Wynik 2:1 jest wynikiem
                  serii, nie liczbą goli.
                </p>
              </div>

              <div className="space-y-3 border-t pt-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4" />
                  Widoczność turnieju
                </div>
                {[
                  {
                    value: "public_online",
                    label: "Publiczny online",
                    description: "Kibic może wejść bez hasła.",
                  },
                  {
                    value: "private_online",
                    label: "Prywatny online",
                    description: "Kibic musi podać hasło widza.",
                  },
                  {
                    value: "private_offline",
                    label: "Prywatny offline",
                    description: "Dostęp tylko dla organizatora i wsparcia.",
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
                  Hasła dostępu
                </div>
                <PasswordField
                  id="organizer-password"
                  label="Hasło organizatora (opcjonalne)"
                  value={organizerPassword}
                  onChange={setOrganizerPassword}
                  visible={showOrgPass}
                  onToggle={() => setShowOrgPass((value) => !value)}
                  inputRef={organizerPasswordInputRef}
                  minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
                  description="Opcjonalne. Jeśli ustawisz hasło, musi mieć co najmniej 8 znaków."
                  detail={organizerPasswordRemaining(organizerPassword) > 0
                    ? `Brakuje jeszcze ${organizerPasswordRemaining(organizerPassword)} znaków`
                    : undefined}
                  error={(organizerPasswordTouched || showValidation)
                    ? organizerPasswordError(organizerPassword) ?? undefined
                    : undefined}
                  onBlur={() => setOrganizerPasswordTouched(true)}
                />
                <PasswordField
                  id="support-password"
                  label="Hasło wsparcia"
                  value={supportPassword}
                  onChange={setSupportPassword}
                  visible={showSupPass}
                  onToggle={() => setShowSupPass((value) => !value)}
                />
                {visibility === "private_online" && (
                  <PasswordField
                    id="viewer-password"
                    label="Hasło widza *"
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
                {createTournament.isPending ? "Tworzenie…" : "Utwórz turniej"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
