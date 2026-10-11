import type { EffectInstance, EffectTriggerEvent } from "../core/types";
import { STREAM_EVENTS } from "./triggers";
import { AlertDiagnosticEngine, type DiagnosticAlert } from "./alertDiagnosticEngine";

const reasonLabels: Record<string, string> = {
  accepted: "Dodano do kolejki",
  "queue-full": "Odrzucono — kolejka pełna",
  cooldown: "Odrzucono — cooldown",
  "below-threshold": "Odrzucono — próg kwoty",
  "lower-priority": "Usunięto — niższy priorytet",
  started: "Rozpoczęto",
  completed: "Zakończono",
  replaced: "Zastąpiono",
};
const eventLabels = new Map(STREAM_EVENTS.map((event) => [event.value, event.label]));

function node(tag: string, className?: string, content?: string): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

/** A safe local-only queue workbench. Nothing is sent to StreamElements. */
export function installAlertDiagnostics(
  stagePanel: HTMLElement,
  getEffects: () => EffectInstance[],
): { refresh: () => void } {
  const engine = new AlertDiagnosticEngine();
  const section = node("details", "ae-diagnostics");
  const summary = node("summary", "", "Diagnostyka alertów — symulator kolejki");
  section.appendChild(summary);
  const content = node("div", "ae-diagnostics-content");
  const intro = node("p", "ae-diagnostics-hint", "Test lokalny bez połączenia ze StreamElements. Po uruchomieniu zdarzenia możesz przejść do następnego alertu i zobaczyć kolejność oraz powody odrzucenia.");
  content.appendChild(intro);

  const controls = node("div", "ae-diagnostics-controls");
  const eventSelect = node("select") as HTMLSelectElement;
  eventSelect.setAttribute("aria-label", "Rodzaj zdarzenia testowego");
  for (const event of STREAM_EVENTS) {
    const option = document.createElement("option");
    option.value = event.value;
    option.textContent = event.label;
    eventSelect.appendChild(option);
  }
  const amount = node("input") as HTMLInputElement;
  amount.type = "number";
  amount.value = "50";
  amount.min = "0";
  amount.max = "1000000";
  amount.setAttribute("aria-label", "Testowa kwota donacji lub liczba widzów");
  const count = node("select") as HTMLSelectElement;
  count.setAttribute("aria-label", "Liczba symulowanych zdarzeń");
  for (const n of [1, 5, 20]) {
    const option = document.createElement("option");
    option.value = String(n);
    option.textContent = n === 1 ? "1 zdarzenie" : n + " zdarzeń";
    count.appendChild(option);
  }
  const simulate = node("button", "ae-button ae-button-primary", "Symuluj") as HTMLButtonElement;
  simulate.type = "button";
  const next = node("button", "ae-button ae-button-secondary", "Następny alert") as HTMLButtonElement;
  next.type = "button";
  const reset = node("button", "ae-button ae-button-secondary", "Wyczyść") as HTMLButtonElement;
  reset.type = "button";
  controls.append(eventSelect, amount, count, simulate, next, reset);
  content.appendChild(controls);

  const status = node("p", "ae-diagnostics-status");
  status.setAttribute("role", "status");
  content.appendChild(status);
  const metrics = node("div", "ae-diagnostics-metrics");
  content.appendChild(metrics);

  const currentHeading = node("h4", "", "Aktualny alert");
  const current = node("div", "ae-diagnostics-current");
  content.append(currentHeading, current);
  const waitingHeading = node("h4", "", "Oczekujące alerty");
  const waiting = node("ol", "ae-diagnostics-queue");
  content.append(waitingHeading, waiting);
  const logHeading = node("h4", "", "Historia decyzji (ostatnie 60)");
  const log = node("ol", "ae-diagnostics-log");
  content.append(logHeading, log);
  section.appendChild(content);
  stagePanel.appendChild(section);

  const format = (item: { instanceId: string; event: string; priority: number }): string => {
    const name = getEffects().find((effect) => effect.instanceId === item.instanceId)?.label?.slice(0, 80)
      ?? item.instanceId.slice(0, 24);
    return (eventLabels.get(item.event as EffectTriggerEvent) ?? item.event) + " · P" + item.priority + " · " + name;
  };

  function render(message = ""): void {
    const snapshot = engine.getSnapshot();
    const eventType = eventSelect.value;
    const available = getEffects().some((effect) => effect.enabled && effect.trigger?.event === eventType);
    status.textContent = message || (available
      ? "Gotowy do symulacji wybranego zdarzenia."
      : "Brak włączonej warstwy reagującej na to zdarzenie.");
    metrics.replaceChildren();
    for (const [key, value] of [
      ["Przyjęte", snapshot.counters.accepted],
      ["Uruchomione", snapshot.counters.started],
      ["Zakończone", snapshot.counters.completed],
      ["Odrzucone", snapshot.counters.dropped],
      ["Wyparte", snapshot.counters.evicted],
    ] as const) {
      const stat = node("span", "", key + ": " + value);
      metrics.appendChild(stat);
    }

    current.textContent = snapshot.current ? format(snapshot.current) : "Brak aktywnej symulowanej animacji.";
    next.disabled = !snapshot.current && snapshot.waiting.length === 0;
    waiting.replaceChildren();
    if (!snapshot.waiting.length) waiting.appendChild(node("li", "", "Kolejka jest pusta."));
    for (const item of snapshot.waiting) waiting.appendChild(node("li", "", format(item)));
    log.replaceChildren();
    if (!snapshot.lines.length) log.appendChild(node("li", "", "Brak zdarzeń diagnostycznych."));
    for (const item of snapshot.lines) {
      const reason = reasonLabels[item.reason] ?? item.reason;
      log.appendChild(node("li", "", "#" + item.sequence + " · " + reason + " · " + format(item)));
    }
  }

  const play = (item: DiagnosticAlert): void => {
    document.dispatchEvent(new CustomEvent("animated-effects:test-trigger", {
      detail: { instanceId: item.instanceId, diagnostic: true },
    }));
  };

  simulate.addEventListener("click", () => {
    const event = eventSelect.value as EffectTriggerEvent;
    const n = Number(count.value);
    const numericAmount = Number(amount.value);
    const numberOfEvents = Number.isFinite(n) ? Math.max(1, Math.min(20, n)) : 1;
    const testAmount = Number.isFinite(numericAmount) ? Math.max(0, Math.min(1000000, numericAmount)) : 0;
    const effects = getEffects();
    const hasConfigured = effects.some((effect) => effect.enabled && effect.trigger?.event === event);
    if (!hasConfigured) {
      render("Brak aktywnych warstw dla wybranego zdarzenia — ustaw wyzwalacz w Inspektorze.");
      return;
    }
    const now = Date.now();
    for (let i = 0; i < numberOfEvents; i++) {
      for (const started of engine.dispatch(effects, event, testAmount, now)) play(started);
    }
    render("Symulowano " + numberOfEvents + " zdarzeń. Przycisk Następny alert przesuwa kolejkę ręcznie.");
  });

  next.addEventListener("click", () => {
    const item = engine.finishCurrent();
    if (item) play(item);
    render(item ? "Odtwarzanie następnego alertu z symulowanej kolejki." : "Symulowana kolejka zakończona.");
  });
  reset.addEventListener("click", () => {
    engine.reset();
    render("Wyczyszczono stan lokalnego symulatora.");
  });
  eventSelect.addEventListener("change", () => render());
  render();

  return { refresh: () => render() };
}
