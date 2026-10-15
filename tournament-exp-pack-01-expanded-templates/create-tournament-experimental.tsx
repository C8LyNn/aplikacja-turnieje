import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Info, KeyRound, Shuffle, Users } from "lucide-react";
import {
  setActiveOrganizerToken,
  useCreateTournament,
  type TournamentInput,
} from "@workspace/api-client-react";
import { ExperimentalOrganizerGuard } from "@/features/experimental-tournaments/experimental-organizer-guard";
import { ExperimentalTournamentShell } from "@/features/experimental-tournaments/experimental-tournament-shell";
import { PasswordField } from "@/components/password-field";
import { ToolNotice, ToolPanel, ToolSection } from "@/components/tool-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import {
  focusInvalidCreateTournamentField,
  ORGANIZER_PASSWORD_MIN_LENGTH,
  organizerPasswordError,
  organizerPasswordRemaining,
  tournamentNameError,
} from "@/lib/create-tournament-validation";
import {
  buildSingleStageSeedingPlan,
  getApiErrorMessage,
  type RandomRevealOrder,
  type SingleStageEntrySeedingMethod,
  SINGLE_STAGE_SEEDING_LABELS,
} from "@/lib/tournament-stages-ui";

type ExperimentalFormat = Exclude<TournamentInput["format"], "group_stage">;
type Visibility = NonNullable<TournamentInput["visibility"]>;

type DraftState = {
  name?: string;
  description?: string;
  format?: ExperimentalFormat;
  maxPlayers?: string;
  swissRounds?: string;
  defaultBestOf?: string;
  visibility?: Visibility;
  entrySeedingMethod?: SingleStageEntrySeedingMethod;
  randomRevealOrder?: RandomRevealOrder;
};

const DRAFT_KEY = "tm_exp_create_draft_v1";

const FORMAT_INFO: Record<
  ExperimentalFormat,
  { label: string; description: string }
> = {
  single_elimination: {
    label: "Drabinka eliminacyjna",
    description: "Jedna porażka eliminuje uczestnika.",
  },
  double_elimination: {
    label: "Podwójna eliminacja",
    description: "Uczestnik odpada po drugiej porażce.",
  },
  swiss: {
    label: "System szwajcarski",
    description: "Uczestnicy rozgrywają ustaloną liczbę rund.",
  },
  round_robin: {
    label: "Każdy z każdym",
    description: "Każdy uczestnik gra z każdym pozostałym.",
  },
};

const VISIBILITY_LABELS: Record<Visibility, string> = {
  public_online: "Publiczny online",
  private_online: "Prywatny online",
  private_offline: "Prywatny offline",
};

function readDraft(): DraftState {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DraftState;
  } catch {
    return {};
  }
}

function ExperimentalCreateForm() {
  const [, navigate] = useLocation();
  const { storeOrgToken } = useAuth();
  const createTournament = useCreateTournament();
  const [initialDraft] = useState<DraftState>(() => readDraft());

  const [name, setName] = useState(initialDraft.name ?? "");
  const [description, setDescription] = useState(initialDraft.description ?? "");
  const [format, setFormat] = useState<ExperimentalFormat>(
    initialDraft.format ?? "single_elimination",
  );
  const [maxPlayers, setMaxPlayers] = useState(initialDraft.maxPlayers ?? "");
  const [swissRounds, setSwissRounds] = useState(initialDraft.swissRounds ?? "");
  const [defaultBestOf, setDefaultBestOf] = useState(initialDraft.defaultBestOf ?? "1");
  const [visibility, setVisibility] = useState<Visibility>(
    initialDraft.visibility ?? "public_online",
  );
  const [entrySeedingMethod, setEntrySeedingMethod] =
    useState<SingleStageEntrySeedingMethod>(
      initialDraft.entrySeedingMethod ?? "registration_order",
    );
  const [randomRevealOrder, setRandomRevealOrder] =
    useState<RandomRevealOrder>(initialDraft.randomRevealOrder ?? "sequential");

  const [organizerPassword, setOrganizerPassword] = useState("");
  const [supportPassword, setSupportPassword] = useState("");
  const [viewerPassword, setViewerPassword] = useState("");
  const [showOrganizerPassword, setShowOrganizerPassword] = useState(false);
  const [showSupportPassword, setShowSupportPassword] = useState(false);
  const [showViewerPassword, setShowViewerPassword] = useState(false);

  const [showValidation, setShowValidation] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [organizerPasswordTouched, setOrganizerPasswordTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const nameInputRef = useRef<HTMLInputElement>(null);
  const organizerPasswordInputRef = useRef<HTMLInputElement>(null);
  const viewerPasswordInputRef = useRef<HTMLInputElement>(null);
  const maxPlayersInputRef = useRef<HTMLInputElement>(null);
  const swissRoundsInputRef = useRef<HTMLInputElement>(null);
  const submitInFlightRef = useRef(false);

  useEffect(() => {
    const draft: DraftState = {
      name,
      description,
      format,
      maxPlayers,
      swissRounds,
      defaultBestOf,
      visibility,
      entrySeedingMethod,
      randomRevealOrder,
    };
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    name,
    description,
    format,
    maxPlayers,
    swissRounds,
    defaultBestOf,
    visibility,
    entrySeedingMethod,
    randomRevealOrder,
  ]);

  const formatInfo = FORMAT_INFO[format];
  const parsedMaxPlayers = maxPlayers.trim()
    ? Number.parseInt(maxPlayers, 10)
    : undefined;
  const parsedSwissRounds = swissRounds.trim()
    ? Number.parseInt(swissRounds, 10)
    : undefined;

  const maxPlayersError =
    maxPlayers.trim() &&
    (!Number.isInteger(parsedMaxPlayers) || (parsedMaxPlayers ?? 0) < 2)
      ? "Maksymalna liczba graczy musi wynosić co najmniej 2."
      : null;

  const swissRoundsError =
    format === "swiss" &&
    swissRounds.trim() &&
    (!Number.isInteger(parsedSwissRounds) ||
      (parsedSwissRounds ?? 0) < 1 ||
      (parsedSwissRounds ?? 0) > 20)
      ? "Liczba rund Swiss musi wynosić od 1 do 20."
      : null;

  const viewerPasswordError =
    visibility === "private_online" && !viewerPassword.trim()
      ? "Prywatny turniej online wymaga hasła widza."
      : null;

  const bestOf = (Number.parseInt(defaultBestOf, 10) || 1) as 1 | 3 | 5 | 7;

  const handleReset = () => {
    setName("");
    setDescription("");
    setFormat("single_elimination");
    setMaxPlayers("");
    setSwissRounds("");
    setDefaultBestOf("1");
    setVisibility("public_online");
    setEntrySeedingMethod("registration_order");
    setRandomRevealOrder("sequential");
    setOrganizerPassword("");
    setSupportPassword("");
    setViewerPassword("");
    setShowValidation(false);
    setNameTouched(false);
    setOrganizerPasswordTouched(false);
    setSubmitError(undefined);
    window.sessionStorage.removeItem(DRAFT_KEY);
    nameInputRef.current?.focus();
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

    if (maxPlayersError) {
      maxPlayersInputRef.current?.focus();
      return;
    }

    if (swissRoundsError) {
      swissRoundsInputRef.current?.focus();
      return;
    }

    if (viewerPasswordError) {
      viewerPasswordInputRef.current?.focus();
      return;
    }

    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;

    const stagePlan =
      entrySeedingMethod === "registration_order"
        ? undefined
        : buildSingleStageSeedingPlan(format, {
            maxPlayers: parsedMaxPlayers,
            bestOf,
            swissRounds: format === "swiss" ? parsedSwissRounds : undefined,
            entrySeedingMethod,
            randomRevealOrder,
          });

    const payload: TournamentInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      format,
      maxPlayers: parsedMaxPlayers,
      swissRounds:
        format === "swiss" ? parsedSwissRounds : undefined,
      defaultBestOf: bestOf,
      organizerPassword,
      supportPassword: supportPassword.trim() || undefined,
      viewerPassword:
        visibility === "private_online"
          ? viewerPassword.trim() || undefined
          : undefined,
      visibility,
      ...(stagePlan ? { stagePlan } : {}),
    };

    createTournament.mutate(
      { data: payload },
      {
        onSuccess: (response) => {
          submitInFlightRef.current = false;
          const { id, organizerToken } = response;
          window.sessionStorage.removeItem(DRAFT_KEY);
          storeOrgToken(id, organizerToken);
          setActiveOrganizerToken(organizerToken);
          navigate(`/tournaments/${id}`);
        },
        onError: (error) => {
          submitInFlightRef.current = false;
          setSubmitError(getApiErrorMessage(error));
        },
      },
    );
  };

  return (
    <ExperimentalTournamentShell>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.85fr)]">
          <ToolPanel
            title="Ustawienia turnieju"
            description="Skonfiguruj podstawowe zasady rozgrywek. Zaawansowane etapy będzie można dodać później."
          >
            <div className="space-y-7">
              <ToolSection
                title="Informacje"
                description="Nazwa i opis widoczne dla uczestników i widzów."
              >
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experimental-tournament-name">Nazwa turnieju *</Label>
                    <Input
                      id="experimental-tournament-name"
                      ref={nameInputRef}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      onBlur={() => setNameTouched(true)}
                      aria-invalid={
                        (nameTouched || showValidation) && tournamentNameError(name)
                          ? true
                          : undefined
                      }
                      placeholder="Np. Marvel Rivals Cup"
                      autoComplete="off"
                    />
                    {(nameTouched || showValidation) && tournamentNameError(name) && (
                      <p role="alert" className="text-sm font-medium text-destructive">
                        ⚠ {tournamentNameError(name)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experimental-tournament-description">Opis</Label>
                    <Textarea
                      id="experimental-tournament-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Krótki opis turnieju"
                      rows={3}
                    />
                  </div>
                </div>
              </ToolSection>

              <ToolSection
                title="Format"
                description="Sposób rozgrywania meczów i podstawowe limity."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="experimental-tournament-format">Format</Label>
                    <Select
                      value={format}
                      onValueChange={(value) => setFormat(value as ExperimentalFormat)}
                    >
                      <SelectTrigger id="experimental-tournament-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FORMAT_INFO).map(([value, info]) => (
                          <SelectItem key={value} value={value}>
                            {info.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formatInfo.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experimental-max-players">Maks. graczy</Label>
                    <Input
                      id="experimental-max-players"
                      ref={maxPlayersInputRef}
                      type="number"
                      min={2}
                      value={maxPlayers}
                      onChange={(event) => setMaxPlayers(event.target.value)}
                      placeholder="Bez limitu"
                      aria-invalid={showValidation && maxPlayersError ? true : undefined}
                    />
                    {showValidation && maxPlayersError && (
                      <p role="alert" className="text-sm font-medium text-destructive">
                        ⚠ {maxPlayersError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experimental-best-of">Best of</Label>
                    <Select value={defaultBestOf} onValueChange={setDefaultBestOf}>
                      <SelectTrigger id="experimental-best-of">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 3, 5, 7].map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            Best of {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {format === "swiss" && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="experimental-swiss-rounds">Liczba rund Swiss</Label>
                      <Input
                        id="experimental-swiss-rounds"
                        ref={swissRoundsInputRef}
                        type="number"
                        min={1}
                        max={20}
                        value={swissRounds}
                        onChange={(event) => setSwissRounds(event.target.value)}
                        placeholder="Automatycznie"
                        aria-invalid={showValidation && swissRoundsError ? true : undefined}
                      />
                      {showValidation && swissRoundsError && (
                        <p role="alert" className="text-sm font-medium text-destructive">
                          ⚠ {swissRoundsError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </ToolSection>

              <ToolSection
                title="Seedowanie"
                description="Ustal sposób nadawania pozycji startowych uczestnikom."
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="experimental-seeding-method">Metoda seedowania</Label>
                    <Select
                      value={entrySeedingMethod}
                      onValueChange={(value) =>
                        setEntrySeedingMethod(value as SingleStageEntrySeedingMethod)
                      }
                    >
                      <SelectTrigger id="experimental-seeding-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(SINGLE_STAGE_SEEDING_LABELS) as [
                            SingleStageEntrySeedingMethod,
                            string,
                          ][]
                        ).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {entrySeedingMethod === "random" && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          {
                            value: "sequential",
                            label: "Sekwencyjnie",
                            description: "Losowanie ujawnia kolejne pozycje po jednej.",
                          },
                          {
                            value: "instant",
                            label: "Natychmiast",
                            description: "Wszystkie pozycje są ujawniane od razu.",
                          },
                        ] as const
                      ).map((option) => (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                            randomRevealOrder === option.value
                              ? "border-primary/60 bg-primary/5"
                              : "border-border bg-background/20 hover:bg-muted/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="experimental-random-reveal"
                            value={option.value}
                            checked={randomRevealOrder === option.value}
                            onChange={() => setRandomRevealOrder(option.value)}
                            className="mt-1 accent-primary"
                          />
                          <span>
                            <span className="block text-sm font-semibold">{option.label}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {entrySeedingMethod === "manual" && (
                    <ToolNotice>
                      Po dodaniu uczestników ustawisz ich numery seedów przed uruchomieniem turnieju.
                    </ToolNotice>
                  )}
                </div>
              </ToolSection>

              <ToolSection
                title="Widoczność"
                description="Określ, kto może oglądać turniej."
              >
                <div className="grid gap-2">
                  {(
                    [
                      {
                        value: "public_online",
                        label: "Publiczny online",
                        description: "Widzowie mogą otworzyć turniej bez hasła.",
                      },
                      {
                        value: "private_online",
                        label: "Prywatny online",
                        description: "Dostęp dla widzów wymaga hasła.",
                      },
                      {
                        value: "private_offline",
                        label: "Prywatny offline",
                        description: "Dostęp ograniczony do obsługi turnieju.",
                      },
                    ] as const
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        visibility === option.value
                          ? "border-primary/60 bg-primary/5"
                          : "border-border bg-background/20 hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="experimental-visibility"
                        value={option.value}
                        checked={visibility === option.value}
                        onChange={() => setVisibility(option.value)}
                        className="mt-1 accent-primary"
                      />
                      <span>
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </ToolSection>

              <ToolSection
                title="Dostęp"
                description="Hasło organizatora jest wymagane. Hasła nie są zapisywane w szkicu formularza."
              >
                <div className="grid gap-4">
                  <PasswordField
                    id="experimental-organizer-password"
                    label="Hasło organizatora *"
                    value={organizerPassword}
                    onChange={setOrganizerPassword}
                    visible={showOrganizerPassword}
                    onToggle={() => setShowOrganizerPassword((value) => !value)}
                    inputRef={organizerPasswordInputRef}
                    minLength={ORGANIZER_PASSWORD_MIN_LENGTH}
                    detail={
                      organizerPasswordRemaining(organizerPassword) > 0
                        ? `Brakuje jeszcze ${organizerPasswordRemaining(organizerPassword)} znaków`
                        : undefined
                    }
                    error={
                      organizerPasswordTouched || showValidation
                        ? organizerPasswordError(organizerPassword) ?? undefined
                        : undefined
                    }
                    onBlur={() => setOrganizerPasswordTouched(true)}
                  />

                  <PasswordField
                    id="experimental-support-password"
                    label="Hasło wsparcia"
                    value={supportPassword}
                    onChange={setSupportPassword}
                    visible={showSupportPassword}
                    onToggle={() => setShowSupportPassword((value) => !value)}
                  />

                  {visibility === "private_online" && (
                    <PasswordField
                      id="experimental-viewer-password"
                      label="Hasło widza *"
                      value={viewerPassword}
                      onChange={setViewerPassword}
                      visible={showViewerPassword}
                      onToggle={() => setShowViewerPassword((value) => !value)}
                      inputRef={viewerPasswordInputRef}
                      error={showValidation ? viewerPasswordError ?? undefined : undefined}
                    />
                  )}
                </div>
              </ToolSection>

              {submitError && <ToolNotice tone="danger">{submitError}</ToolNotice>}

              <ToolNotice>
                Ustawienia formularza są zachowywane po odświeżeniu tej karty. Hasła pozostają tylko w bieżącej sesji formularza i nie trafiają do szkicu.
              </ToolNotice>

              <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/tournaments/create">Wstecz</Link>
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleReset}>
                    Wyczyść
                  </Button>
                </div>
                <Button type="submit" disabled={createTournament.isPending}>
                  {createTournament.isPending ? "Tworzenie…" : "Utwórz turniej"}
                </Button>
              </div>
            </div>
          </ToolPanel>

          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <ToolPanel
              title="Podsumowanie"
              description="Konfiguracja, z którą utworzysz turniej."
              actions={<Badge variant="outline">experimental</Badge>}
            >
              <dl className="grid gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nazwa
                  </dt>
                  <dd className="mt-1 break-words font-semibold">
                    {name.trim() || "Bez nazwy"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Format
                  </dt>
                  <dd className="mt-1 font-semibold">{formatInfo.label}</dd>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Gracze
                    </dt>
                    <dd className="mt-1 font-semibold">{parsedMaxPlayers ?? "bez limitu"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Seria
                    </dt>
                    <dd className="mt-1 font-semibold">BO{defaultBestOf}</dd>
                  </div>
                </div>

                {format === "swiss" && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Rundy Swiss
                    </dt>
                    <dd className="mt-1 font-semibold">{parsedSwissRounds ?? "automatycznie"}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Seedowanie
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {SINGLE_STAGE_SEEDING_LABELS[entrySeedingMethod]}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Widoczność
                  </dt>
                  <dd className="mt-1 font-semibold">{VISIBILITY_LABELS[visibility]}</dd>
                </div>
              </dl>
            </ToolPanel>

            <ToolPanel title="Po utworzeniu">
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>Przejdziesz do istniejącego panelu zarządzania i dodasz uczestników.</p>
                </div>
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>Dostęp organizatora zostanie zapisany tak samo jak w stabilnej wersji.</p>
                </div>
                {entrySeedingMethod === "random" && (
                  <div className="flex items-start gap-3">
                    <Shuffle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p>Po dodaniu graczy uruchomisz ceremonię losowania seedów.</p>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>Wieloetapowe formaty i konfiguracje specyficzne dla gier będą rozwijane w następnych iteracjach nowego UI.</p>
                </div>
              </div>
            </ToolPanel>
          </div>
        </div>
      </form>
    </ExperimentalTournamentShell>
  );
}

export default function CreateTournamentExperimental() {
  return (
    <ExperimentalOrganizerGuard>
      <ExperimentalCreateForm />
    </ExperimentalOrganizerGuard>
  );
}
