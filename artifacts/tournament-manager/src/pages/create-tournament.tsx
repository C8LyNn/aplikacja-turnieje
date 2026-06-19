import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useCreateTournament } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Trophy, Lock, Eye, EyeOff } from "lucide-react";

const FORMAT_INFO: Record<string, { label: string; desc: string }> = {
  single_elimination: {
    label: "Drabinka eliminacyjna",
    desc: "Przegrana = odpadnięcie. Szybki format, idealny dla dużych grup.",
  },
  swiss: {
    label: "System szwajcarski",
    desc: "Wszyscy grają X rund. Parowanie na podstawie punktów. Dobry dla turniejów bez eliminacji.",
  },
  round_robin: {
    label: "Każdy z każdym",
    desc: "Każdy gracz zmierzy się z każdym. Najdokładniejszy wynik.",
  },
  double_elimination: {
    label: "Podwójna eliminacja",
    desc: "Dwie przegrane = odpadnięcie. Bracket górny i dolny.",
  },
};

export default function CreateTournament() {
  const [, navigate] = useLocation();
  const createTournament = useCreateTournament();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("single_elimination");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [swissRounds, setSwissRounds] = useState("");
  const [allowDraws, setAllowDraws] = useState(false);
  const [defaultBestOf, setDefaultBestOf] = useState("1");
  const [organizerPassword, setOrganizerPassword] = useState("");
  const [supportPassword, setSupportPassword] = useState("");
  const [showOrgPass, setShowOrgPass] = useState(false);
  const [showSupPass, setShowSupPass] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTournament.mutate(
      {
        data: {
          name,
          description: description || undefined,
          format: format as any,
          maxPlayers: maxPlayers ? parseInt(maxPlayers, 10) : undefined,
          swissRounds: format === "swiss" && swissRounds ? parseInt(swissRounds, 10) : undefined,
          allowDraws,
          defaultBestOf: parseInt(defaultBestOf, 10) || 1,
          organizerPassword: organizerPassword || undefined,
          supportPassword: supportPassword || undefined,
        },
      },
      {
        onSuccess: (t) => navigate(`/tournaments/${t.id}`),
      },
    );
  };

  const info = FORMAT_INFO[format];

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="text-primary w-6 h-6" /> Nowy turniej
            </h1>
            <p className="text-sm text-muted-foreground">Wypełnij dane turnieju</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dane turnieju</CardTitle>
            <CardDescription>Podstawowe informacje</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Nazwa turnieju *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Spring Championship 2026"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Opis (opcjonalnie)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Krótki opis turnieju..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Format *</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMAT_INFO).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {info && (
                  <p className="text-xs text-muted-foreground">{info.desc}</p>
                )}
              </div>

              {format === "swiss" && (
                <div className="space-y-2">
                  <Label>Liczba rund (Swiss)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={swissRounds}
                    onChange={(e) => setSwissRounds(e.target.value)}
                    placeholder="Automatycznie (log₂ graczy)"
                  />
                  <p className="text-xs text-muted-foreground">Zostaw puste = automatycznie na podstawie liczby graczy</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Maks. graczy</Label>
                  <Input
                    type="number"
                    min="2"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    placeholder="Bez limitu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Best of (domyślnie)</Label>
                  <Select value={defaultBestOf} onValueChange={setDefaultBestOf}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Best of 1</SelectItem>
                      <SelectItem value="3">Best of 3</SelectItem>
                      <SelectItem value="5">Best of 5</SelectItem>
                      <SelectItem value="7">Best of 7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Remisy dozwolone</p>
                  <p className="text-xs text-muted-foreground">Mecze mogą kończyć się remisem (1 pkt)</p>
                </div>
                <Switch checked={allowDraws} onCheckedChange={setAllowDraws} />
              </div>

              {/* Security passwords */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  Hasła dostępu (opcjonalne)
                </div>
                <div className="space-y-2">
                  <Label>Hasło organizatora</Label>
                  <div className="relative">
                    <Input
                      type={showOrgPass ? "text" : "password"}
                      value={organizerPassword}
                      onChange={(e) => setOrganizerPassword(e.target.value)}
                      placeholder="Hasło do panelu prowadzącego..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowOrgPass((v) => !v)}
                    >
                      {showOrgPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Zastąpi stary system kodu prowadzącego. Możesz ustawić później w zakładce Bezpieczeństwo.</p>
                </div>
                <div className="space-y-2">
                  <Label>Hasło wsparcia</Label>
                  <div className="relative">
                    <Input
                      type={showSupPass ? "text" : "password"}
                      value={supportPassword}
                      onChange={(e) => setSupportPassword(e.target.value)}
                      placeholder="Hasło dla ekipy wsparcia..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowSupPass((v) => !v)}
                    >
                      {showSupPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Umożliwia logowanie z nickiem — organizator widzi kto jest zalogowany.</p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary"
                disabled={createTournament.isPending || !name.trim()}
              >
                {createTournament.isPending ? "Tworzenie..." : "Utwórz turniej"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
