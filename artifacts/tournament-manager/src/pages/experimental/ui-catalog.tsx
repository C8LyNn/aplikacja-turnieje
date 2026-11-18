/**
 * V5.8 · component catalog (Experimental only): the shared pieces of the tournament screens in their states,
 * under any appearance set. A preview — switching a set here never saves it; leaving restores your own.
 * Built from the real components (no copies), so a change that breaks a state or a theme shows here first.
 */
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CircleDot, Inbox, Loader2, PenLine, RefreshCw } from "lucide-react";
import type { LiveStageStandings } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LiveTable } from "@/components/stage-live-tables";
import { SetScoreEditor } from "@/components/set-score-editor";
import {
  ExperimentalMetricCard,
  ExperimentalStatePanel,
  ExperimentalStatusPill,
} from "@/features/experimental-tournaments/experimental-ui";
import {
  applyExperimentalAppearance,
  DEFAULT_EXPERIMENTAL_APPEARANCE,
  EXPERIMENTAL_APPEARANCE_FAMILIES,
  EXPERIMENTAL_APPEARANCE_PRESETS,
  normalizeExperimentalAppearance,
  readExperimentalAppearance,
} from "@/features/experimental-tournaments/experimental-appearance";

const SET_RULES = { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 11, winBy: 2 } as const;

const TABLE: LiveStageStandings = {
  stageId: 1, format: "round_robin", status: "active", final: false,
  leagueRules: { version: 1, allowDraws: true, points: { win: 3, draw: 1, loss: 0 }, tieBreakers: ["head_to_head", "score_difference", "scored", "wins"] },
  rulesSummary: "Punktacja: zwycięstwo 3 pkt, remis 1 pkt, porażka 0 pkt.",
  matchRules: null, matchRulesSummary: "Jedna gra; remis możliwy.",
  advancingPlaces: 2,
  tables: [{
    groupId: null, label: "Tabela", matchesPlayed: 6, matchesTotal: 12,
    rows: [
      { playerId: 1, playerName: "Wilki Północy — drużyna o bardzo długiej nazwie", rank: 1, played: 3, wins: 2, draws: 1, losses: 0, points: 7, scoreFor: 6, scoreAgainst: 2, diff: 4, buchholz: null, decidedBy: "points", zone: "advance" },
      { playerId: 2, playerName: "Lwy", rank: 2, played: 3, wins: 2, draws: 0, losses: 1, points: 6, scoreFor: 5, scoreAgainst: 3, diff: 2, buchholz: null, decidedBy: "points", zone: "advance" },
      { playerId: 3, playerName: "Orły", rank: 3, played: 3, wins: 1, draws: 1, losses: 1, points: 4, scoreFor: 3, scoreAgainst: 4, diff: -1, buchholz: null, decidedBy: "points", zone: null },
      { playerId: 4, playerName: "Sokoły", rank: 4, played: 3, wins: 0, draws: 0, losses: 3, points: 0, scoreFor: 1, scoreAgainst: 6, diff: -5, buchholz: null, decidedBy: "points", zone: null },
    ],
  }],
} as unknown as LiveStageStandings;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="experimental-catalog-section rounded-xl border p-4">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function ExperimentalUiCatalog() {
  const { toast } = useToast();
  const [preset, setPreset] = useState<string>("");
  const [sets, setSets] = useState([{ score1: 11, score2: 7 }, { score1: 9, score2: 11 }]);
  // Leaving the catalog restores the user's own appearance (the preview is never saved).
  useEffect(() => () => applyExperimentalAppearance(readExperimentalAppearance()), []);
  const preview = (id: string) => {
    setPreset(id);
    const found = EXPERIMENTAL_APPEARANCE_PRESETS.find((entry) => entry.id === id);
    applyExperimentalAppearance(found ? normalizeExperimentalAppearance({ ...DEFAULT_EXPERIMENTAL_APPEARANCE, ...found.values }) : readExperimentalAppearance());
  };
  return (
    <Layout>
      <div className="organizer-workspace flex flex-col gap-4" data-testid="ui-catalog">
        <div className="organizer-header flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Katalog komponentów</h1>
          <p className="text-sm text-muted-foreground">Stany wspólnych elementów pod każdym zestawem wyglądu. Podgląd — nic nie zapisuje; po wyjściu wraca Twój wygląd.</p>
          <div role="group" aria-label="Podgląd zestawu" className="flex flex-wrap gap-1.5">
            <button type="button" className="experimental-wizard-chip" aria-pressed={preset === ""} onClick={() => preview("")}>Mój wygląd</button>
            {EXPERIMENTAL_APPEARANCE_FAMILIES.flatMap((family) => EXPERIMENTAL_APPEARANCE_PRESETS.filter((entry) => entry.family === family.id)).map((entry) => (
              <button key={entry.id} type="button" className="experimental-wizard-chip" aria-pressed={preset === entry.id} onClick={() => preview(entry.id)}>{entry.label}</button>
            ))}
          </div>
        </div>

        <Section title="Przyciski">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Główna akcja</Button>
            <Button variant="outline">Druga akcja</Button>
            <Button variant="ghost">Ciche działanie</Button>
            <Button disabled>Niedostępne</Button>
            <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Zapisywanie…</Button>
            <Button variant="destructive">Usuń</Button>
            <button type="button" className="experimental-v4-btn">Przycisk panelu</button>
            <button type="button" className="experimental-v4-btn" data-variant="ghost">Przycisk drugorzędny</button>
          </div>
        </Section>

        <Section title="Stany i komunikaty">
          <div className="flex flex-wrap gap-2">
            <ExperimentalStatusPill tone="live">Na żywo</ExperimentalStatusPill>
            <ExperimentalStatusPill tone="warning">Mecze gotowe</ExperimentalStatusPill>
            <ExperimentalStatusPill tone="success">Zakończony</ExperimentalStatusPill>
            <ExperimentalStatusPill tone="danger">Wymaga uwagi</ExperimentalStatusPill>
            <ExperimentalStatusPill tone="neutral">Planowany</ExperimentalStatusPill>
            <Badge>Aktywny</Badge><Badge variant="secondary">Zakończony</Badge><Badge variant="outline">Szkic</Badge>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <p role="status" className="organizer-notice organizer-notice--success rounded-lg border border-primary/30 p-3 text-sm text-primary">Zapisano 18:42: Wilki – Lwy 2:1.</p>
            <div role="alert" className="organizer-notice organizer-notice--error rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <p className="font-semibold">Operacja nie powiodła się</p><p className="mt-1">Sesja wygasła — nic nie zostało zapisane.</p>
            </div>
            <section aria-label="Konflikt zapisu wyniku" className="organizer-notice rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 text-sm">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" aria-hidden="true" /> Wynik nie został zapisany</p>
              <p className="mt-1">Mecz zmienił się w międzyczasie. Twój wynik roboczy został w formularzu.</p>
              <Button variant="outline" size="sm" className="mt-2"><RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Odśwież dane</Button>
            </section>
            <p role="status" className="organizer-notice organizer-notice--pending flex items-center gap-2 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Ładowanie meczów…</p>
            <ExperimentalStatePanel title="Brak meczów" description="Mecze pojawią się po rozpoczęciu etapu." icon={Inbox} />
            <ExperimentalStatePanel title="Nie udało się pobrać danych" description="Sprawdź połączenie i spróbuj ponownie." icon={AlertTriangle} tone="danger" />
          </div>
        </Section>

        <Section title="Liczniki">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ExperimentalMetricCard label="Na żywo" tone="live" value={2} meta="mecze w trakcie" icon={Activity} />
            <ExperimentalMetricCard label="Czeka na wynik" tone="danger" value={1} meta="dzień meczu minął, brak wyniku" icon={PenLine} />
            <ExperimentalMetricCard label="Start minął" tone="warning" value={3} meta="rozpocznij albo przełóż" icon={CircleDot} />
          </div>
        </Section>

        <Section title="Formularz">
          <div className="grid max-w-xl gap-3">
            <label className="grid gap-1 text-sm">Nazwa turnieju<Input defaultValue="Puchar Wiosny" /></label>
            <label className="grid gap-1 text-sm">Pole z błędem<Input aria-invalid="true" defaultValue="" placeholder="Wpisz nazwę" /><span role="alert" className="text-xs text-destructive">Podaj nazwę turnieju.</span></label>
            <label className="grid gap-1 text-sm">Niedostępne<Input disabled defaultValue="tylko do odczytu" /></label>
            <div role="radiogroup" aria-label="Długość meczu" className="experimental-wizard-segments flex flex-wrap gap-1.5">
              <button type="button" role="radio" aria-checked="true" className="experimental-wizard-chip">Jedna gra</button>
              <button type="button" role="radio" aria-checked="false" className="experimental-wizard-chip">Do 2 wygranych</button>
              <button type="button" role="radio" aria-checked="false" className="experimental-wizard-chip">Do 3 wygranych</button>
            </div>
          </div>
        </Section>

        <Section title="Edytor setów">
          <SetScoreEditor rules={SET_RULES} sets={sets} player1Name="Zawodnik z bardzo długą nazwą" player2Name="Ada" onChange={setSets} />
        </Section>

        <Section title="Tabela wyników">
          <LiveTable table={TABLE.tables[0]!} data={TABLE} />
        </Section>

        <Section title="Dialog i powiadomienia">
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild><Button variant="outline">Otwórz dialog</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cofnąć wynik meczu?</DialogTitle>
                  <DialogDescription>Ranking i awans zostaną przeliczone. Kolejne mecze mogą zablokować cofnięcie.</DialogDescription>
                </DialogHeader>
                <DialogFooter><Button variant="outline">Zachowaj wynik</Button><Button>Cofnij wynik</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => toast({ title: "Wynik zapisany!", variant: "success" })}>Powiadomienie: sukces</Button>
            <Button variant="outline" onClick={() => toast({ title: "Wynik niekompletny", description: "Brakuje jednego seta.", variant: "warning" })}>Powiadomienie: uwaga</Button>
            <Button variant="outline" onClick={() => toast({ title: "Operacja nie powiodła się", description: "Sesja wygasła.", variant: "destructive" })}>Powiadomienie: błąd</Button>
          </div>
        </Section>
      </div>
    </Layout>
  );
}
