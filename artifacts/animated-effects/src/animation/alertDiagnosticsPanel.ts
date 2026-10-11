import type { EffectInstance, EffectTriggerEvent } from "../core/types";
import { STREAM_EVENTS } from "./triggers";
import { AlertDiagnosticEngine, type DiagnosticAlert } from "./alertDiagnosticEngine";
import { AlertStressRunner } from "./alertStressRunner";
import type { StressScenario } from "./alertStress";

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
  const stressRunner = new AlertStressRunner(engine);
  const fingerprint = (): string => JSON.stringify(getEffects().map((effect) => [
    effect.instanceId, effect.enabled, effect.trigger ?? null,
  ]));
  let lastFingerprint = fingerprint();
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

  const currentHeading = node("h4", "", "Aktywny alert w trybie kolejki");
  const current = node("div", "ae-diagnostics-current");
  content.append(currentHeading, current);
  const waitingHeading = node("h4", "", "Oczekujące alerty");
  const waiting = node("ol", "ae-diagnostics-queue");
  content.append(waitingHeading, waiting);
  const logHeading = node("h4", "", "Historia decyzji (ostatnie 60)");
  const log = node("ol", "ae-diagnostics-log");
  content.append(logHeading, log);

  const stressHeading = node("h4", "", "Test obciążeniowy transmisji (czas rzeczywisty)");
  const stressHint = node("p", "ae-diagnostics-hint",
    "Scenariusze wysyłają syntetyczne zdarzenia do lokalnej kolejki. Mierzone są odstępy requestAnimationFrame, nie obciążenie GPU ani serwerów StreamElements. Wynik zależy od komputera i przeglądarki.");
  const stressControls = node("div", "ae-diagnostics-stress-controls");
  const stressScenario = node("select") as HTMLSelectElement;
  stressScenario.setAttribute("aria-label", "Scenariusz obciążenia");
  for (const [value, label] of [
    ["steady", "Zwykła transmisja"],
    ["burst", "Nagły wzrost ruchu"],
    ["chat-flood", "Intensywny czat"],
  ] as const) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    stressScenario.appendChild(option);
  }
  const stressDuration = node("select") as HTMLSelectElement;
  stressDuration.setAttribute("aria-label", "Czas trwania testu");
  for (const [ms, label] of [[12000, "12 sekund"], [30000, "30 sekund"]] as const) {
    const option = document.createElement("option");
    option.value = String(ms);
    option.textContent = label;
    stressDuration.appendChild(option);
  }
  const stressStart = node("button", "ae-button ae-button-primary", "Uruchom test") as HTMLButtonElement;
  stressStart.type = "button";
  const stressStop = node("button", "ae-button ae-button-secondary", "Zatrzymaj test") as HTMLButtonElement;
  stressStop.type = "button";
  stressStop.disabled = true;
  stressControls.append(stressScenario, stressDuration, stressStart, stressStop);
  const stressProgress = node("progress", "ae-diagnostics-progress") as HTMLProgressElement;
  stressProgress.value = 0;
  stressProgress.max = 100;
  stressProgress.setAttribute("aria-label", "Postęp testu obciążeniowego");
  const stressStatus = node("p", "ae-diagnostics-stress-status",
    "Test nie został uruchomiony. Wybierz scenariusz i kliknij Uruchom test.");
  stressStatus.setAttribute("role", "status");
  const stressReport = node("div", "ae-diagnostics-report");
  content.append(stressHeading, stressHint, stressControls, stressProgress, stressStatus, stressReport);

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
    next.disabled = stressRunner.isRunning() || (!snapshot.current && snapshot.waiting.length === 0);
    simulate.disabled = stressRunner.isRunning();
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

  stressStart.addEventListener("click", () => {
    if (stressRunner.isRunning()) return;
    const scenario = stressScenario.value as StressScenario;
    const durationMs = Number(stressDuration.value);
    const effects = getEffects();
    if (!effects.some((effect) => effect.enabled && effect.trigger?.source === "event")) {
      stressStatus.textContent = "Dodaj co najmniej jedną włączoną warstwę z wyzwalaczem StreamElements.";
      return;
    }
    document.dispatchEvent(new Event("animated-effects:diagnostics-clear-preview"));
    stressStart.disabled = true;
    stressStop.disabled = false;
    stressScenario.disabled = true;
    stressDuration.disabled = true;
    stressReport.replaceChildren();
    stressProgress.value = 0;
    stressStatus.textContent = "Test wystartował; symulowane zdarzenia pojawiają się w czasie rzeczywistym.";
    stressRunner.start(scenario, durationMs, effects, {
      onPlay: play,
      onProgress: (progress) => {
        stressProgress.value = Math.round(progress.elapsedMs / progress.durationMs * 100);
        const snap = engine.getSnapshot();
        stressStatus.textContent = "Odtworzono " + progress.dispatched + "/" + progress.planned +
          " zdarzeń; kolejka: " + progress.currentQueueSize +
          "; odrzucenia: " + snap.counters.dropped +
          "; maksimum oczekujących: " + progress.waitingPeak + ".";
        render();
      },
      onFinish: (report, state) => {
        stressStart.disabled = false;
        stressStop.disabled = true;
        stressScenario.disabled = false;
        stressDuration.disabled = false;
        stressProgress.value = Math.round(report.durationMs / durationMs * 100);
        const statusMessage = state === "completed" ? "Zakończono scenariusz."
          : state === "hidden" ? "Test przerwany: karta przeszła w tło (pomiar niemiarodajny)."
            : "Zatrzymano test przed końcem.";
        stressStatus.textContent = statusMessage + " Przetworzono " + report.dispatched + "/" + report.total + " zdarzeń.";
        stressReport.replaceChildren();
        const frame = report.frame;
        stressReport.appendChild(node("p", "", "Oczekujące maksimum: " + report.waitingPeak +
          "/16 · odrzucenia: " + report.dropped + " · wyparcia: " + report.evicted +
          " · przyjęte: " + report.accepted));
        stressReport.appendChild(node("p", "", "Rytm klatek rAF: " +
          (frame.approximateFps === null ? "brak danych" : "~" + frame.approximateFps + " FPS") +
          " · p95 odstępu: " + (frame.p95FrameMs ?? "brak") + " ms" +
          " · klatki >33 ms: " + (frame.slowFramesPercent ?? "brak") + "% · próbek: " + frame.samples));
        const findings = node("ul", "ae-diagnostics-findings");
        for (const warning of report.warnings) findings.appendChild(node("li", "", warning));
        stressReport.appendChild(findings);
        render();
      },
    });
    render();
  });
  stressStop.addEventListener("click", () => stressRunner.stop("stopped"));

  simulate.addEventListener("click", () => {
    if (stressRunner.isRunning()) return;
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
    if (stressRunner.isRunning()) return;
    const item = engine.finishCurrent();
    if (item) play(item);
    else document.dispatchEvent(new Event("animated-effects:diagnostics-clear-preview"));
    render(item ? "Odtwarzanie następnego alertu z symulowanej kolejki." : "Symulowana kolejka zakończona.");
  });
  reset.addEventListener("click", () => {
    stressRunner.stop("stopped");
    engine.reset();
    document.dispatchEvent(new Event("animated-effects:diagnostics-clear-preview"));
    render("Wyczyszczono stan lokalnego symulatora.");
  });
  eventSelect.addEventListener("change", () => render());
  render();

  return {
    refresh: () => {
      const nextFingerprint = fingerprint();
      if (lastFingerprint !== nextFingerprint) {
        lastFingerprint = nextFingerprint;
        stressRunner.stop("stopped");
        engine.reset();
        render("Zmieniono konfigurację sceny — symulacja została wyzerowana.");
      } else {
        render();
      }
    },
  };
}
