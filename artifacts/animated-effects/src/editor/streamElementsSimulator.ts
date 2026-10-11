import type { StreamElementsExport } from "../core/types";
import {
  normalizeStreamElementsRoutes,
  normalizeStreamElementsTriggerOptions,
  type StreamElementsRouteInput,
  type StreamElementsTriggerOptions,
} from "../export/triggerOptions";
import { getEditorState } from "./state";

export interface SimulationCase {
  id: string;
  label: string;
  listener: string;
  event: Record<string, unknown>;
}

const EVENT_LISTENERS: Record<string, string> = {
  follower: "follower-latest",
  subscriber: "subscriber-latest",
  tip: "tip-latest",
  cheer: "cheer-latest",
  raid: "raid-latest",
};
const EVENT_LABELS: Record<string, string> = {
  follower: "Nowy obserwujący",
  subscriber: "Subskrypcja",
  tip: "Donacja",
  cheer: "Cheer / Bits",
  raid: "Raid",
};

export function getStreamElementsSimulationCases(
  trigger: Partial<StreamElementsTriggerOptions>,
  routes?: readonly StreamElementsRouteInput[],
  enabledInstanceIds: readonly string[] = [],
): SimulationCase[] {
  const policy = normalizeStreamElementsTriggerOptions(trigger);
  const normalized = routes === undefined
    ? [{ id: "single", ...policy, effectInstanceIds: enabledInstanceIds }]
    : normalizeStreamElementsRoutes(routes, enabledInstanceIds);

  return normalized.map((rule, index) => {
    if (rule.mode === "always") {
      return {
        id: rule.id,
        label: "Zawsze aktywna — start przy ładowaniu",
        listener: "onWidgetLoad",
        event: {},
      };
    }
    if (rule.mode === "chat-command") {
      return {
        id: rule.id,
        label: (routes ? String(index + 1) + ". " : "") + "Czat: " + rule.chatCommand,
        listener: "message",
        event: { data: { text: rule.chatCommand, msgId: "simulation-pending" } },
      };
    }
    return {
      id: rule.id,
      label: (routes ? String(index + 1) + ". " : "") +
        (EVENT_LABELS[rule.mode] ?? rule.mode),
      listener: EVENT_LISTENERS[rule.mode] ?? "",
      event: { name: "Testowy widz" },
    };
  });
}

export function getSimulationEvent(
  selected: SimulationCase,
  messageId: string,
): { listener: string; event: Record<string, unknown> } {
  if (selected.listener === "message") {
    return {
      listener: "message",
      event: {
        data: {
          ...((selected.event.data && typeof selected.event.data === "object") ? selected.event.data : {}),
          msgId: messageId,
        },
      },
    };
  }
  return { listener: selected.listener, event: selected.event };
}

function safeScript(value: string): string {
  return value.replace(/<\/script/gi, "<\\/script");
}

/**
 * A self-contained OBS Custom Widget preview. The iframe is sandboxed without
 * allow-same-origin, so generated widget code cannot reach the editor document.
 */
export function createStreamElementsSimulationHtml(exported: StreamElementsExport): string {
  const init = "(function () {\n  const root = document.getElementById(\"animated-effects-root\");\n  let previousLayerCount = -1;\n  const sendState = function () {\n    // Child particle mutations should not flood the parent with messages.\n    const count = root ? root.children.length : 0;\n    if (count === previousLayerCount) return;\n    previousLayerCount = count;\n    window.parent.postMessage({ type: \"ae-se-simulator-state\", count: count }, \"*\");\n  };\n  if (root) new MutationObserver(sendState).observe(root, { childList: true, subtree: true });\n  window.addEventListener(\"message\", function (message) {\n    const data = message && message.data;\n    if (!data || data.channel !== \"ae-se-simulator\") return;\n    if (data.action === \"event\" && data.detail) {\n      window.dispatchEvent(new CustomEvent(\"onEventReceived\", { detail: data.detail }));\n    } else if (data.action === \"reset\") {\n      window.dispatchEvent(new CustomEvent(\"onWidgetLoad\"));\n      sendState();\n    }\n  });\n  window.dispatchEvent(new CustomEvent(\"onWidgetLoad\"));\n  // Ready must reach the parent before the initial active-layer state.\n  window.parent.postMessage({ type: \"ae-se-simulator-ready\" }, \"*\");\n  sendState();\n})();";
  return "<!doctype html><html lang=\"pl\"><head><meta charset=\"utf-8\">" +
    "<style>" + exported.css.replace(/<\/style/gi, "<\\/style") + "</style></head><body>" +
    exported.html +
    "<script>" + safeScript(exported.javascript) + "</script>" +
    "<script>" + safeScript(init) + "</script>" +
    "</body></html>";
}

export function setupStreamElementsSimulator(
  dialog: HTMLDialogElement,
  getConfig: () => {
    exported: StreamElementsExport;
    trigger: StreamElementsTriggerOptions;
    routes?: StreamElementsRouteInput[];
  },
): { refresh: () => void; destroy: () => void } {
  const host = dialog.querySelector<HTMLElement>("[data-simulator-frame]");
  const selector = dialog.querySelector<HTMLSelectElement>("[data-simulator-event]");
  const fire = dialog.querySelector<HTMLButtonElement>("[data-simulator-fire]");
  const reset = dialog.querySelector<HTMLButtonElement>("[data-simulator-reset]");
  const status = dialog.querySelector<HTMLElement>("[data-simulator-status]");
  if (!host || !selector || !fire || !reset || !status) {
    return { refresh: () => {}, destroy: () => {} };
  }

  let iframe: HTMLIFrameElement | null = null;
  let signature = "";
  let ready = false;
  let counter = 0;
  let cases: SimulationCase[] = [];
  let alive = true;

  const announce = (message: string) => { status.textContent = message; };
  const send = (action: string, detail?: object) => {
    if (!ready || !iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({
      channel: "ae-se-simulator", action, detail,
    }, "*");
  };

  const receive = (event: MessageEvent) => {
    if (!alive || !iframe || event.source !== iframe.contentWindow) return;
    const payload = event.data as { type?: string; count?: number } | null;
    if (!payload || typeof payload !== "object") return;
    if (payload.type === "ae-se-simulator-ready") {
      ready = true;
      fire.disabled = cases.length === 0 || cases[selector.selectedIndex]?.listener === "onWidgetLoad";
      reset.disabled = false;
      announce("Gotowe. Podgląd korzysta z kodu wygenerowanego dla StreamElements.");
    }
    if (payload.type === "ae-se-simulator-state" && ready) {
      const count = typeof payload.count === "number" && Number.isFinite(payload.count) ? payload.count : 0;
      announce(count > 0
        ? "Aktywna animacja · " + count + " warstw. Kolejne zdarzenia respektują cooldown."
        : "Scena ukryta. Można przetestować kolejne zdarzenie.");
    }
  };
  window.addEventListener("message", receive);

  const refresh = () => {
    if (!alive) return;
    const { exported, trigger, routes } = getConfig();
    const previous = selector.value;
    cases = getStreamElementsSimulationCases(
      trigger,
      routes,
      getEditorState().effects.filter((effect) => effect.enabled)
        .map((effect) => effect.instanceId),
    );
    selector.replaceChildren();
    for (const option of cases) {
      const node = document.createElement("option");
      node.value = option.id;
      node.textContent = option.label;
      selector.appendChild(node);
    }
    if (cases.some((item) => item.id === previous)) selector.value = previous;
    fire.disabled = !ready || cases.length === 0 || cases[selector.selectedIndex]?.listener === "onWidgetLoad";

    const nextSignature = JSON.stringify([exported.html, exported.css, exported.javascript]);
    if (nextSignature === signature && iframe) return;
    signature = nextSignature;
    ready = false;
    fire.disabled = reset.disabled = true;
    announce("Ładowanie odizolowanego podglądu StreamElements…");

    iframe?.remove();
    iframe = document.createElement("iframe");
    iframe.className = "export-simulator-iframe";
    iframe.title = "Symulacja animacji StreamElements";
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("referrerpolicy", "no-referrer");
    host.replaceChildren(iframe);
    iframe.srcdoc = createStreamElementsSimulationHtml(exported);
  };

  const run = () => {
    const selected = cases.find((item) => item.id === selector.value);
    if (!selected || !ready || selected.listener === "onWidgetLoad") return;
    counter += 1;
    send("event", getSimulationEvent(selected, "ae-sim-" + counter));
    announce("Wysłano: " + selected.label + ". Oczekiwanie na reakcję widżetu…");
  };
  fire.addEventListener("click", run);
  selector.addEventListener("change", () => {
    fire.disabled = !ready || cases[selector.selectedIndex]?.listener === "onWidgetLoad";
  });
  reset.addEventListener("click", () => {
    send("reset");
    announce("Zresetowano widżet i jego cooldowny.");
  });

  const destroy = () => {
    alive = false;
    window.removeEventListener("message", receive);
    iframe?.remove();
    iframe = null;
  };
  dialog.addEventListener("close", () => {
    // Destroy the active iframe; reopening creates a new clean instance.
    iframe?.remove();
    iframe = null;
    signature = "";
    ready = false;
    fire.disabled = reset.disabled = true;
  });
  return { refresh, destroy };
}
