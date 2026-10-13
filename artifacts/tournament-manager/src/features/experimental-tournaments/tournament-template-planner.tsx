import { useEffect, useRef, useState } from "react";
import type { TournamentInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const TEMPLATE_LABELS = {
  quick_elimination: "Szybka drabinka SE",
  double_chance: "Podwójna eliminacja DE",
  everyone_plays: "Każdy z każdym",
  swiss: "Swiss",
  groups_to_playoffs: "Grupy → play-off",
  swiss_to_playoffs: "Swiss → play-off",
} as const;
export type TournamentTemplateId = keyof typeof TEMPLATE_LABELS;

export type TemplatePlanSelection = {
  stagePlan: NonNullable<TournamentInput["stagePlan"]>;
  templateId: TournamentTemplateId;
  label: string;
  participantCount: number;
  bestOf: 1 | 3 | 5 | 7;
};

type Preview = {
  version: 1;
  templateId: TournamentTemplateId;
  label: string;
  stagePlan: NonNullable<TournamentInput["stagePlan"]>;
  stages: Array<{
    position: number;
    name: string;
    participantCount: number;
    format: string;
    advancingCount: number | null;
    estimatedMatches: number;
  }>;
  estimatedTotalMatches: number;
  estimatedMatchesMaximum: number;
  warnings: string[];
  advisory: true;
  requiresConfirmation: true;
};

/** Intentionally interactive but NEVER creates a tournament or modifies game state. */
export function TournamentTemplatePlanner({ onApply, onClear, selectedPlan }: {
  onApply: (selection: TemplatePlanSelection) => void;
  onClear: () => void;
  selectedPlan: TemplatePlanSelection | null;
}) {
  const [templateId, setTemplateId] = useState<TournamentTemplateId>("groups_to_playoffs");
  const [participantInput, setParticipantInput] = useState("16");
  const [bestOf, setBestOf] = useState<1 | 3 | 5 | 7>(3);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  useEffect(() => () => {
    generation.current += 1;
    activeController.current?.abort();
  }, []);

  function invalidate() {
    onClear();
    generation.current += 1;
    activeController.current?.abort();
    setPreview(null);
    setError("");
    setLoading(false);
  }

  async function requestPreview() {
    const count = Number(participantInput);
    if (!Number.isInteger(count) || count < 2 || count > 128) {
      setError("Podaj liczbę uczestników od 2 do 128.");
      return;
    }
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const myGeneration = ++generation.current;
    setError("");
    setPreview(null);
    setLoading(true);
    try {
      const response = await fetch("/api/tournaments/plan-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ templateId, participantCount: count, bestOf }),
        signal: controller.signal,
      });
      const body: unknown = await response.json();
      if (generation.current !== myGeneration) return;
      if (!response.ok) {
        const fail = body as { error?: string };
        throw new Error(fail.error || `Nie można przygotować planu (HTTP ${response.status}).`);
      }
      const data = body as Preview;
      if (data.version !== 1 || data.advisory !== true || !data.stagePlan?.stages?.length ||
          data.stagePlan.initialParticipantCount !== count || data.templateId !== templateId ||
          !data.requiresConfirmation) {
        throw new Error("Serwer zwrócił niezgodną propozycję planu.");
      }
      setPreview(data);
    } catch (err) {
      if (generation.current === myGeneration) {
        setError(err instanceof Error ? err.message : "Nie udało się pobrać propozycji.");
      }
    } finally {
      if (generation.current === myGeneration) setLoading(false);
    }
  }

  return (
    <section aria-label="Asystent wyboru planu turnieju" className="space-y-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div>
        <h3 className="text-base font-semibold">Zaproponuj strukturę automatycznie</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Wybierz gotowy szablon i zobacz etapy przed utworzeniem turnieju. Propozycja nie zapisuje żadnych danych.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-3">
          <Label htmlFor="template-id">Rodzaj rozgrywek</Label>
          <select id="template-id" value={templateId} onChange={e => {invalidate(); setTemplateId(e.target.value as TournamentTemplateId);}}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {Object.entries(TEMPLATE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="template-count">Liczba uczestników</Label>
          <Input id="template-count" type="number" min={2} max={128} step={1}
            value={participantInput} onChange={e => { invalidate(); setParticipantInput(e.target.value); }} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="template-bestof">Seria</Label>
          <select id="template-bestof" value={bestOf} onChange={e => {invalidate(); setBestOf(Number(e.target.value) as 1 | 3 | 5 | 7);}}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {[1,3,5,7].map(bo => <option key={bo} value={bo}>BO{bo}</option>)}
          </select>
        </div>
      </div>
      <Button type="button" variant="secondary" onClick={() => void requestPreview()} disabled={loading}>
        {loading ? "Analizowanie…" : "Pokaż propozycję"}
      </Button>
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      {preview && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-3" aria-live="polite">
          <h4 className="font-semibold">{preview.label}</h4>
          <ol className="space-y-2">
            {preview.stages.map(stage => (
              <li key={stage.position} className="rounded-md bg-muted/30 p-2 text-sm">
                <strong>{stage.position}. {stage.name}</strong>
                <p className="text-muted-foreground">{stage.participantCount} uczestników · szacunkowo {stage.estimatedMatches} meczów
                  {stage.advancingCount != null ? ` · awans: ${stage.advancingCount}` : ""}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm">Liczba meczów: <strong>{preview.estimatedTotalMatches}
            {preview.estimatedMatchesMaximum !== preview.estimatedTotalMatches ? `–${preview.estimatedMatchesMaximum}` : ""}</strong>
            <span className="text-muted-foreground"> (orientacyjnie, bez czasu trwania)</span>
          </p>
          {preview.warnings.map((warning, index) => <p key={index} className="text-sm text-amber-500">{warning}</p>)}
          <Button type="button" onClick={() => {
            onApply({ stagePlan: preview.stagePlan, templateId: preview.templateId,
              label: preview.label, participantCount: preview.stagePlan.initialParticipantCount, bestOf });
            setPreview(null);
          }}>
            Użyj tego planu w formularzu
          </Button>
        </div>
      )}
      {selectedPlan && (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm" role="status">
          Wybrano: <strong>{selectedPlan.label}</strong> ({selectedPlan.participantCount} uczestników, BO{selectedPlan.bestOf}).
          Turniej powstanie dopiero po zatwierdzeniu całego formularza.
          <button type="button" className="ml-2 underline" onClick={onClear}>Anuluj wybór</button>
        </p>
      )}
    </section>
  );
}
