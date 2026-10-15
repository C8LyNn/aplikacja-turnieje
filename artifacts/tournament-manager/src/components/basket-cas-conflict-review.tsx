import React from "react";
import type { BasketCasDraftView } from "@/lib/stage-basket-cas-draft";
import type { BasketCasGraph } from "@/lib/stage-basket-cas-client";

/**
 * Optional R23C presentation ONLY. Not imported by current StageBasketsPanel.
 * A manual button is required to choose a new base; NO automatic save/retry.
 */
export function BasketCasConflictReview({
  view,
  onRefreshRemote,
  onReconcile,
}: {
  view: BasketCasDraftView;
  onRefreshRemote: () => void | Promise<void>;
  onReconcile: (choice: "keep-local" | "use-remote") => void;
}) {
  if (view.phase !== "conflict" && view.phase !== "reviewing") return null;

  return (
    <section aria-label="Konflikt konfiguracji koszyków" className="rounded-md border p-4 space-y-3">
      <h3 className="font-semibold">Wykryto zmianę konfiguracji koszyków</h3>
      <p>
        Twój lokalny szkic pozostaje zachowany. Zapis wymaga ręcznego
        sprawdzenia aktualnej wersji serwerowej; nie ponawiamy zapisu automatycznie.
      </p>
      {view.dependencyMayHaveChanged && (
        <p role="status">
          Mogły zmienić się etapy lub uczestnicy. Zweryfikuj przypisania i trasy,
          nawet gdy lista zmian koszyków jest pusta.
        </p>
      )}
      {view.phase === "conflict" && (
        <button type="button" onClick={() => { void onRefreshRemote(); }}>
          Odśwież wersję serwerową do porównania
        </button>
      )}
      {view.phase === "reviewing" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <section aria-label="Lokalny szkic">
              <h4 className="font-medium">Twój szkic</h4>
              <BasketSummary graph={view.localDraft} />
            </section>
            <section aria-label="Aktualna wersja serwera">
              <h4 className="font-medium">Wersja serwerowa</h4>
              <BasketSummary graph={view.remoteCanonical} />
            </section>
          </div>
          <h4 className="font-medium">Różnice do ręcznej weryfikacji</h4>
          {view.changes.length === 0 ? (
            <p>Brak różnic w przesłanym grafie; sprawdź także stan etapów i rosteru.</p>
          ) : (
            <ul>
              {view.changes.map((item) => (
                <li key={`${item.type}:${item.id}:${item.change}`}>
                  {item.type === "basket" ? "Koszyk" : "Trasa"} {item.id}: {
                    item.change === "modified" ? "różne wartości" :
                      item.change === "added-remote" ? "tylko na serwerze" : "tylko lokalnie"
                  }
                </li>
              ))}
            </ul>
          )}
          <p>
            Wybór poniżej wyłącznie uzgadnia lokalny szkic z nową wersją bazową.
            Żadna opcja nie wykonuje HTTP PUT. Zapis wymaga osobnego zatwierdzenia.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={view.saving}
              onClick={() => onReconcile("keep-local")}>
              Zachowaj mój szkic i uzgodnij ręcznie
            </button>
            <button type="button" disabled={view.saving}
              onClick={() => onReconcile("use-remote")}>
              Odrzuć mój szkic i przyjmij serwerowy
            </button>
            <button type="button" disabled={view.saving}
              onClick={() => { void onRefreshRemote(); }}>
              Odśwież porównanie
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function BasketSummary({ graph }: { graph: BasketCasGraph | null }) {
  if (!graph) return <p>Wersja niedostępna.</p>;
  return (
    <ul>
      {graph.baskets.map((basket) => (
        <li key={basket.id}>
          {basket.id} (etap {basket.stageId}; {basket.type}; kolor {basket.colorId ?? "brak"};
          uczestnicy: {basket.participantIds.join(", ") || "brak"};
          awansuje: {basket.qualifierCount ?? "—"})
        </li>
      ))}
      {graph.routes.map((route) => (
        <li key={route.id}>
          Trasa {route.id}: {route.sourceBasketId} → {route.targetBasketId}
        </li>
      ))}
    </ul>
  );
}
