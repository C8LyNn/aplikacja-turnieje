import { useState } from "react";
import { Link } from "wouter";
import { FlaskConical, Info, LockKeyhole } from "lucide-react";
import { ExperimentalOrganizerGuard } from "@/features/experimental-tournaments/experimental-organizer-guard";
import { ExperimentalTournamentShell } from "@/features/experimental-tournaments/experimental-tournament-shell";
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

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Drabinka eliminacyjna",
  double_elimination: "Podwójna eliminacja",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
};

export default function CreateTournamentExperimental() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("single_elimination");

  return (
    <ExperimentalOrganizerGuard>
      <ExperimentalTournamentShell>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <ToolPanel
            title="Podstawowe informacje"
            description="Pierwszy ekran nowego workflow. Dane z tego formularza pozostają lokalne w Pack 01."
          >
            <div className="space-y-6">
              <ToolSection
                title="Turniej"
                description="Ustal podstawową tożsamość i format rozgrywek."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="experimental-tournament-name">Nazwa turnieju</Label>
                    <Input
                      id="experimental-tournament-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Np. Marvel Rivals Cup"
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="experimental-tournament-description">Opis</Label>
                    <Textarea
                      id="experimental-tournament-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Krótki opis turnieju"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experimental-tournament-format">Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger id="experimental-tournament-format">
                        <SelectValue placeholder="Wybierz format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_elimination">Drabinka eliminacyjna</SelectItem>
                        <SelectItem value="double_elimination">Podwójna eliminacja</SelectItem>
                        <SelectItem value="swiss">System szwajcarski</SelectItem>
                        <SelectItem value="round_robin">Każdy z każdym</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </ToolSection>

              <ToolNotice>
                Pack 01 nie wysyła jeszcze tego formularza do API. Dzięki temu nowy frontend można
                rozwijać bez ryzyka zapisania niepełnej konfiguracji do wspólnej bazy.
              </ToolNotice>

              <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" asChild>
                  <Link href="/tournaments/create">Wstecz</Link>
                </Button>
                <Button type="button" disabled title="Pełne tworzenie turnieju zostanie podłączone po przeniesieniu kompletnego kontraktu tworzenia.">
                  Utwórz — w przygotowaniu
                </Button>
              </div>
            </div>
          </ToolPanel>

          <div className="space-y-4">
            <ToolPanel
              title="Experimental"
              description="Ta wersja jest rozwijana równolegle do stabilnego frontendu."
              actions={<Badge variant="outline">experimental</Badge>}
            >
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="font-semibold">Oddzielny frontend</div>
                    <p className="mt-1 text-muted-foreground">
                      Możemy zmieniać układ i UX bez przebudowy starego formularza.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="font-semibold">Wspólna infrastruktura</div>
                    <p className="mt-1 text-muted-foreground">
                      Docelowo Experimental używa tego samego API, autoryzacji i bazy co stabilna wersja.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="font-semibold">Podgląd konfiguracji</div>
                    <dl className="mt-2 grid gap-2 text-muted-foreground">
                      <div>
                        <dt className="text-xs uppercase tracking-wide">Nazwa</dt>
                        <dd className="mt-0.5 break-words text-foreground">
                          {name.trim() || "Bez nazwy"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide">Format</dt>
                        <dd className="mt-0.5 text-foreground">
                          {FORMAT_LABELS[format] ?? format}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </ToolPanel>
          </div>
        </div>
      </ExperimentalTournamentShell>
    </ExperimentalOrganizerGuard>
  );
}
