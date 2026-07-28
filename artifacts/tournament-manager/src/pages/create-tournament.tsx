import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Globe, Eye, EyeOff, Layers3, Lock, Trophy } from "lucide-react";
import {
  setActiveOrganizerToken,
  useCreateTournament,
  type TournamentInput,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { StagePlanEditor } from "@/components/stage-plan-editor";
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
import { apiOrganizerLogin } from "@/lib/auth";
import {
  createStageDraft,
  getApiErrorMessage,
  normalizeStageDrafts,
  type StageDraft,
  validateStageDrafts,
  withOptionalStagePlan,
} from "@/lib/tournament-stages-ui";

const FORMAT_INFO: Record<
  TournamentInput["format"],
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
};

type Visibility = NonNullable<TournamentInput["visibility"]>;

export default function CreateTournament() {
  const [, navigate] = useLocation();
  const { storeOrgToken } = useAuth();
  const createTournament = useCreateTournament();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] =
    useState<TournamentInput["format"]>("single_elimination");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [swissRounds, setSwissRounds] = useState("");
  const [defaultBestOf, setDefaultBestOf] = useState("1");
  const [organizerPassword, setOrganizerPassword] = useState("");
  const [supportPassword, setSupportPassword] = useState("");
  const [viewerPassword, setViewerPassword] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public_online");
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

  const validationErrors = useMemo(
    () => (stageMode ? validateStageDrafts(stages) : []),
    [stageMode, stages],
  );
  const info = FORMAT_INFO[format];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(undefined);
    setShowValidation(true);
    if (stageMode && validationErrors.length > 0) return;
    if (organizerPassword.length < 8) {
      setSubmitError("Hasło organizatora jest wymagane i musi mieć co najmniej 8 znaków.");
      return;
    }
    if (supportPassword.length > 0 && supportPassword.length < 8) {
      setSubmitError("Hasło wsparcia musi mieć co najmniej 8 znaków.");
      return;
    }
    if (visibility === "private_online" && viewerPassword.length < 8) {
      setSubmitError("Hasło widza dla prywatnego turnieju online musi mieć co najmniej 8 znaków.");
      return;
    }

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
    };

    createTournament.mutate(
      { data: withOptionalStagePlan(legacyPayload, stageMode, stages) },
      {
        onSuccess: async (tournament) => {
          try {
            const token = await apiOrganizerLogin(tournament.id, organizerPassword);
            storeOrgToken(tournament.id, token);
            setActiveOrganizerToken(token);
            navigate(`/tournaments/${tournament.id}`);
          } catch {
            setSubmitError(
              `Turniej został utworzony (ID ${tournament.id}), ale automatyczne logowanie nie powiodło się. Otwórz turniej i zaloguj się ustawionym hasłem organizatora.`,
            );
          }
        },
        onError: (error) => setSubmitError(getApiErrorMessage(error)),
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
              Skonfiguruj pojedynczy format albo plan do trzech etapów.
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tournament-name">Nazwa turnieju *</Label>
                <Input
                  id="tournament-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="np. Spring Championship 2026"
                  required
                />
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

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Layers3 className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="stage-mode" className="text-base">
                        Turniej wieloetapowy
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Włącz, aby połączyć 1–3 formaty z osobnymi BO i zasadami
                        awansu.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="stage-mode"
                    checked={stageMode}
                    onCheckedChange={(checked) => {
                      setStageMode(checked);
                      setShowValidation(false);
                    }}
                  />
                </div>
              </div>

              {stageMode ? (
                <StagePlanEditor
                  stages={stages}
                  errors={showValidation ? validationErrors : []}
                  onChange={(next) => {
                    setStages(normalizeStageDrafts(next));
                    setShowValidation(false);
                  }}
                />
              ) : (
                <div className="space-y-5 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label>Format *</Label>
                    <Select
                      value={format}
                      onValueChange={(value) =>
                        setFormat(value as TournamentInput["format"])
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
                  label="Hasło organizatora *"
                  value={organizerPassword}
                  onChange={setOrganizerPassword}
                  visible={showOrgPass}
                  onToggle={() => setShowOrgPass((value) => !value)}
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
                disabled={
                  createTournament.isPending ||
                  !name.trim() ||
                  organizerPassword.length < 8 ||
                  (supportPassword.length > 0 && supportPassword.length < 8) ||
                  (visibility === "private_online" && viewerPassword.length < 8)
                }
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

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={onToggle}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
