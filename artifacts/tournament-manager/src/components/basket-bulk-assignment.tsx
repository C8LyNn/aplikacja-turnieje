import { useEffect, useMemo, useState } from "react";
import type { Player, StageBasket, TournamentStage } from "@workspace/api-client-react";
import { AlertTriangle, ArrowRight, CheckCircle2, Info, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkStageBaskets, inputBasketOf, planBasketMove, type BasketCheck, type BasketMove } from "@/lib/basket-bulk-assignment";

const NO_BASKET = "__none__";
const NEW_BASKET = "__new__";
const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase();

/**
 * V5.9 · select many participants and move them to one start basket in a single, previewed step. Works on the
 * panel's unsaved draft only (Cofnij undoes the last step; "Anuluj" in the panel drops all of them). No dragging.
 */
export function BasketBulkAssignment({
  stages,
  baskets,
  players,
  incomingQuotaByStage,
  labelOf,
  onApply,
  createInputBasket,
}: {
  stages: readonly TournamentStage[];
  baskets: readonly StageBasket[];
  players: readonly Player[];
  incomingQuotaByStage: ReadonlyMap<number, number>;
  labelOf: (basket: StageBasket) => string;
  onApply: (next: StageBasket[]) => void;
  /** A new, empty start basket for the stage (next free letter), or null when the stage already has four. */
  createInputBasket?: (stageId: number, baskets: readonly StageBasket[]) => StageBasket | null;
}) {
  const stagesWithInputs = useMemo(
    () => stages.filter((stage) => baskets.some((basket) => basket.stageId === stage.id && basket.type === "input")),
    [stages, baskets],
  );
  const [stageId, setStageId] = useState<number | null>(stagesWithInputs[0]?.id ?? null);
  useEffect(() => {
    if (stageId == null || !stagesWithInputs.some((stage) => stage.id === stageId)) setStageId(stagesWithInputs[0]?.id ?? null);
  }, [stageId, stagesWithInputs]);
  const stage = stagesWithInputs.find((candidate) => candidate.id === stageId);
  const inputs = useMemo(
    () => baskets.filter((basket) => basket.stageId === stageId && basket.type === "input").sort((a, b) => a.ordinal - b.ordinal),
    [baskets, stageId],
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [target, setTarget] = useState("");
  const [preview, setPreview] = useState<{ baskets: StageBasket[]; moves: BasketMove[]; target: string | null; created: StageBasket | null } | null>(null);
  const [history, setHistory] = useState<StageBasket[][]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { setSelected(new Set()); setPreview(null); setFilter("all"); setTarget(""); }, [stageId]);

  if (!stage) return null;
  const firstStage = stage.id === stages[0]?.id;
  const newBasket = createInputBasket?.(stage.id, baskets) ?? null;
  const labelById = new Map([...inputs, ...(preview?.created ? [preview.created] : [])].map((basket) => [basket.id, labelOf(basket)]));
  const where = (basketId: string | null) => (basketId ? labelById.get(basketId) ?? basketId : "bez koszyka");
  const nameOf = new Map(players.map((player) => [player.id, player.name]));

  const rows = players.map((player) => ({ player, basketId: inputBasketOf(baskets, stage.id, player.id) }));
  const visible = rows.filter(({ player, basketId }) =>
    (filter === "all" || (filter === NO_BASKET ? basketId == null : basketId === filter)) &&
    (!query.trim() || fold(player.name).includes(fold(query.trim()))),
  );
  const counts = new Map<string, number>([[NO_BASKET, rows.filter((row) => row.basketId == null).length]]);
  for (const basket of inputs) counts.set(basket.id, basket.participantIds.length);

  const checksFor = (state: readonly StageBasket[]): BasketCheck[] => checkStageBaskets({
    stage, baskets: state, players, incomingQuota: incomingQuotaByStage.get(stage.id) ?? 0, firstStage, labelOf,
  });
  const currentChecks = checksFor(baskets);

  const toggle = (playerId: number) => {
    setPreview(null);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(playerId)) next.delete(playerId); else next.add(playerId);
      return next;
    });
  };
  const showPreview = () => {
    if (!selected.size || !target) return;
    const created = target === NEW_BASKET ? newBasket : null;
    if (target === NEW_BASKET && !created) return;
    const base = created ? [...baskets, created] : [...baskets];
    const destination = created ? created.id : target === NO_BASKET ? null : target;
    const ordered = players.map((player) => player.id).filter((id) => selected.has(id));
    setPreview({ ...planBasketMove(base, stage.id, ordered, destination), target: destination, created });
    setNotice(null);
  };
  const apply = () => {
    if (!preview || !preview.moves.length) return;
    setHistory((current) => [...current, baskets.map((basket) => ({ ...basket, participantIds: [...basket.participantIds] }))]);
    onApply(preview.baskets);
    setNotice(`${preview.target ? `Przeniesiono do ${where(preview.target)}` : "Usunięto z koszyków"}: ${preview.moves.length}. Zmiana jest w szkicu — „Zapisz konfigurację” ją zapisze, „Anuluj” odrzuci.`);
    setSelected(new Set());
    setPreview(null);
  };
  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    onApply(previous);
    setHistory((current) => current.slice(0, -1));
    setPreview(null);
    setNotice("Cofnięto ostatnią zmianę przypisań.");
  };

  const sizesAfter = preview
    ? [...inputs, ...(preview.created ? [preview.created] : [])].map((basket) => ({
        label: labelOf(basket),
        before: basket.participantIds.length,
        after: preview.baskets.find((candidate) => candidate.id === basket.id)?.participantIds.length ?? 0,
      }))
    : [];
  const previewChecks = preview ? checksFor(preview.baskets) : [];

  return (
    <section aria-labelledby="basket-bulk-heading" className="basket-bulk organizer-basket-bulk space-y-3 rounded-lg border bg-card p-4" data-testid="basket-bulk">
      <div>
        <h4 id="basket-bulk-heading" className="font-semibold">Uczestnicy w koszykach startowych</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          Zaznacz kilku uczestników i przenieś ich naraz do jednego koszyka. Kolejność koszyków to kolejność rozstawienia
          (najpierw Start A). Grup tu nie wybierasz — tworzy je silnik przy starcie etapu.
        </p>
      </div>

      {stagesWithInputs.length > 1 && (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Etap</span>
          <select className="min-h-11 rounded-md border bg-background px-3" value={stage.id} onChange={(event) => setStageId(Number(event.target.value))}>
            {stagesWithInputs.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.position}. {candidate.name}</option>)}
          </select>
        </label>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Pokaż uczestników">
        {[{ id: "all", label: `Wszyscy: ${rows.length}` }, ...inputs.map((basket) => ({ id: basket.id, label: `${labelOf(basket)}: ${counts.get(basket.id) ?? 0}` })), { id: NO_BASKET, label: `Bez koszyka: ${counts.get(NO_BASKET) ?? 0}` }].map((option) => (
          <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}
            className={`basket-bulk-filter min-h-11 rounded-full border px-3 text-sm ${filter === option.id ? "border-primary bg-primary/10 font-semibold" : "text-muted-foreground"}`}>
            {option.label}
          </button>
        ))}
      </div>

      {currentChecks.length > 0 && !preview && (
        <ul className="space-y-1 text-sm" aria-label="Stan koszyków">
          {currentChecks.map((check) => (
            <li key={check.message} className={`flex gap-2 ${check.level === "blocker" ? "text-destructive" : "text-amber-500"}`}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{check.message}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Szukaj uczestnika</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 rounded-md border bg-background px-3" />
        </label>
        <Button type="button" variant="outline" className="min-h-11" disabled={!visible.length}
          onClick={() => { setPreview(null); setSelected((current) => new Set([...current, ...visible.map((row) => row.player.id)])); }}>
          Zaznacz widocznych ({visible.length})
        </Button>
        <Button type="button" variant="ghost" className="min-h-11" disabled={!selected.size} onClick={() => { setSelected(new Set()); setPreview(null); }}>
          Wyczyść zaznaczenie
        </Button>
      </div>

      <ul className="basket-bulk-list grid max-h-80 gap-1 overflow-y-auto sm:grid-cols-2" aria-label={`Uczestnicy etapu ${stage.name}`}>
        {visible.map(({ player, basketId }) => (
          <li key={player.id}>
            <label className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-1.5 text-sm ${selected.has(player.id) ? "border-primary bg-primary/10" : ""}`}>
              <input type="checkbox" className="h-4 w-4" checked={selected.has(player.id)} onChange={() => toggle(player.id)} />
              <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${basketId ? "" : "text-muted-foreground"}`}>{where(basketId)}</span>
            </label>
          </li>
        ))}
        {!visible.length && <li className="py-3 text-sm text-muted-foreground">Nikt nie pasuje do wyszukiwania lub filtra.</li>}
      </ul>

      <div className="basket-bulk-actions flex flex-wrap items-end gap-2 border-t pt-3">
        <p className="min-h-11 flex items-center text-sm font-medium" aria-live="polite">Zaznaczono: {selected.size}</p>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Przenieś zaznaczonych do</span>
          <select className="min-h-11 rounded-md border bg-background px-3" value={target} onChange={(event) => { setTarget(event.target.value); setPreview(null); }}>
            <option value="">Wybierz koszyk…</option>
            {inputs.map((basket) => <option key={basket.id} value={basket.id}>{labelOf(basket)}</option>)}
            {newBasket && <option value={NEW_BASKET}>Nowy koszyk startowy ({labelOf(newBasket)})</option>}
            <option value={NO_BASKET}>Usuń z koszyka (nie zagra w etapie)</option>
          </select>
        </label>
        <Button type="button" className="min-h-11" disabled={!selected.size || !target} onClick={showPreview}>
          Pokaż zmiany <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
        {history.length > 0 && (
          <Button type="button" variant="outline" className="min-h-11" onClick={undo}>
            <Undo2 className="mr-1 h-4 w-4" /> Cofnij ostatnią zmianę
          </Button>
        )}
      </div>

      {preview && (
        <div role="region" aria-label="Podgląd zmian" className="basket-bulk-preview space-y-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
          {preview.moves.length === 0 ? (
            <p className="flex gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Zaznaczeni uczestnicy już są w {where(preview.target)} — nic się nie zmieni.</p>
          ) : (
            <>
              <p className="font-semibold">Zmiana dla {preview.moves.length} {preview.moves.length === 1 ? "uczestnika" : "uczestników"}{preview.created ? ` · powstanie nowy koszyk ${labelOf(preview.created)}` : ""}:</p>
              <ul className="max-h-40 space-y-0.5 overflow-y-auto" aria-label="Przeniesienia">
                {preview.moves.map((move) => (
                  <li key={move.playerId}>{nameOf.get(move.playerId) ?? `#${move.playerId}`}: {where(move.from)} → {where(move.to)}</li>
                ))}
              </ul>
              <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Liczba uczestników w koszykach">
                {sizesAfter.map((size) => (
                  <li key={size.label}>{size.label}: {size.before}{size.after !== size.before ? ` → ${size.after}` : ""}</li>
                ))}
              </ul>
              {previewChecks.length > 0 ? (
                <ul className="space-y-1" aria-label="Po zmianie">
                  {previewChecks.map((check) => (
                    <li key={check.message} className={`flex gap-2 ${check.level === "blocker" ? "text-destructive" : "text-amber-500"}`}>
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{check.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Po zmianie liczby zgadzają się z planem etapu.</p>
              )}
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {preview.moves.length > 0 && <Button type="button" className="min-h-11" onClick={apply}>Zastosuj w szkicu</Button>}
            <Button type="button" variant="ghost" className="min-h-11" onClick={() => setPreview(null)}>Wróć do wyboru</Button>
          </div>
        </div>
      )}

      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    </section>
  );
}
