import { getEditorState } from "./state";
import { getEffectDefinition } from "../effects/registry";
import {
  MAX_STREAM_ELEMENTS_ROUTES,
  normalizeStreamElementsRoutes,
  type StreamElementsRouteInput,
  type StreamElementsTriggerMode,
} from "../export/triggerOptions";

const MODES: ReadonlyArray<[StreamElementsTriggerMode, string]> = [
  ["chat-command", "Komenda czatu"],
  ["follower", "Nowy obserwujący"],
  ["subscriber", "Subskrypcja"],
  ["tip", "Donacja"],
  ["cheer", "Cheer / Bits"],
  ["raid", "Raid"],
];
let nextRouteId = 0;

function activeEffects() {
  return getEditorState().effects.filter((effect) => effect.enabled);
}

function createRoute(): HTMLFieldSetElement {
  const id = ++nextRouteId;
  const card = document.createElement("fieldset");
  card.className = "export-route-card";
  card.dataset.routeId = "route-" + id;
  // All HTML markup is static; effect names are written with textContent below.
  card.innerHTML = `
    <legend>Reguła</legend>
    <button type="button" data-remove-route aria-label="Usuń regułę">Usuń</button>
    <div class="export-route-fields">
      <label>Zdarzenie<select data-route-mode></select></label>
      <label data-route-command-field>Komenda<input data-route-command value="!hype" maxlength="25" autocomplete="off" spellcheck="false"></label>
      <label>Czas (s)<input type="number" data-route-duration value="5" min=".5" max="60" step=".5"></label>
      <label>Cooldown (s)<input type="number" data-route-cooldown value="10" min="0" max="300" step="1"></label>
    </div>
    <div class="export-route-effect-list" data-route-effects role="group" aria-label="Efekty przypisane do reguły"></div>
  `;
  const selector = card.querySelector<HTMLSelectElement>("[data-route-mode]")!;
  for (const [value, label] of MODES) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    selector.appendChild(option);
  }
  card.querySelector<HTMLInputElement>("[data-route-command]")!.value =
    id === 1 ? "!hype" : "!hype" + id;
  syncRouteEffects(card, true);
  return card;
}

function syncRouteEffects(card: HTMLFieldSetElement, newRoute = false): void {
  const region = card.querySelector<HTMLElement>("[data-route-effects]");
  if (!region) return;
  const active = activeEffects();
  const signature = JSON.stringify(active.map((effect) => [effect.instanceId, effect.label, effect.effectId]));
  if (!newRoute && card.dataset.effectsSignature === signature) return;
  const checked = new Set(
    Array.from(region.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked"), (input) => input.value),
  );
  region.replaceChildren();
  active.forEach((effect, index) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = effect.instanceId;
    input.checked = newRoute ? index === 0 : checked.has(effect.instanceId);
    const name = document.createElement("span");
    const definition = getEffectDefinition(effect.effectId);
    name.textContent = effect.label || definition?.name || effect.effectId;
    label.append(input, name);
    region.append(label);
  });
  card.dataset.effectsSignature = signature;
}

function syncRouteCard(card: HTMLFieldSetElement): void {
  const mode = card.querySelector<HTMLSelectElement>("[data-route-mode]")?.value;
  const commandField = card.querySelector<HTMLElement>("[data-route-command-field]");
  if (commandField) commandField.hidden = mode !== "chat-command";
  syncRouteEffects(card);
}

export function readExportRoutes(dialog: HTMLDialogElement): StreamElementsRouteInput[] | undefined {
  if (!dialog.querySelector<HTMLInputElement>("[data-multi-routes]")?.checked) return undefined;
  const list = dialog.querySelector<HTMLElement>("[data-route-list]");
  if (!list) return [];
  return Array.from(list.querySelectorAll<HTMLFieldSetElement>("[data-route-id]"), (card) => {
    const field = (selector: string) => card.querySelector<HTMLInputElement>(selector)?.value ?? "";
    return {
      id: card.dataset.routeId ?? "",
      mode: card.querySelector<HTMLSelectElement>("[data-route-mode]")?.value as StreamElementsTriggerMode,
      chatCommand: field("[data-route-command]"),
      activeDurationMs: Number(field("[data-route-duration]")) * 1000,
      cooldownMs: Number(field("[data-route-cooldown]")) * 1000,
      effectInstanceIds: Array.from(
        card.querySelectorAll<HTMLInputElement>("[data-route-effects] input:checked"),
        (input) => input.value,
      ),
    };
  });
}

/**
 * Replace only export rule UI; the actual scene is restored by the profile controller.
 * Values are assigned via input.value/textContent, never interpolated as markup.
 */
export function applyExportRoutes(
  dialog: HTMLDialogElement,
  routes: readonly StreamElementsRouteInput[] | null,
): void {
  const toggle = dialog.querySelector<HTMLInputElement>("[data-multi-routes]");
  const list = dialog.querySelector<HTMLElement>("[data-route-list]");
  if (!toggle || !list) return;
  toggle.checked = routes !== null;
  list.replaceChildren();
  list.dataset.preserveEmpty = String(routes !== null && routes.length === 0);
  if (routes !== null) {
    const activeIds = activeEffects().map((effect) => effect.instanceId);
    const checkedRoutes = normalizeStreamElementsRoutes(routes, activeIds);
    for (const route of checkedRoutes) {
      const card = createRoute();
      card.dataset.routeId = route.id;
      const match = /^route-(\d+)$/.exec(route.id);
      if (match) nextRouteId = Math.max(nextRouteId, Number(match[1]));
      card.querySelector<HTMLSelectElement>("[data-route-mode]")!.value = route.mode;
      card.querySelector<HTMLInputElement>("[data-route-command]")!.value = route.chatCommand;
      card.querySelector<HTMLInputElement>("[data-route-duration]")!.value = String(route.activeDurationMs / 1000);
      card.querySelector<HTMLInputElement>("[data-route-cooldown]")!.value = String(route.cooldownMs / 1000);
      const ids = new Set(route.effectInstanceIds);
      card.querySelectorAll<HTMLInputElement>("[data-route-effects] input").forEach((input) => {
        input.checked = ids.has(input.value);
      });
      list.appendChild(card);
    }
  }
  syncExportRoutes(dialog);
}

export function syncExportRoutes(dialog: HTMLDialogElement): void {
  const multi = dialog.querySelector<HTMLInputElement>("[data-multi-routes]")?.checked ?? false;
  const single = dialog.querySelector<HTMLElement>("[data-single-trigger]");
  const workspace = dialog.querySelector<HTMLElement>("[data-route-workspace]");
  if (single) single.hidden = multi;
  if (workspace) workspace.hidden = !multi;
  if (!multi) return;

  const list = dialog.querySelector<HTMLElement>("[data-route-list]");
  if (!list) return;
  if (list.children.length === 0 && list.dataset.preserveEmpty !== "true") list.appendChild(createRoute());
  list.querySelectorAll<HTMLFieldSetElement>("[data-route-id]").forEach(syncRouteCard);
  const add = dialog.querySelector<HTMLButtonElement>("[data-add-route]");
  if (add) add.disabled = list.children.length >= MAX_STREAM_ELEMENTS_ROUTES;

  const all = readExportRoutes(dialog) ?? [];
  const valid = normalizeStreamElementsRoutes(all, activeEffects().map((effect) => effect.instanceId));
  const status = dialog.querySelector<HTMLElement>("[data-route-warning]");
  if (status) {
    status.textContent = activeEffects().length === 0
      ? "Dodaj i włącz przynajmniej jeden efekt w edytorze."
      : valid.length < all.length
        ? "Reguły bez zaznaczonych efektów są pomijane w eksporcie."
        : `Gotowe: ${valid.length} reguł w jednym widżecie.`;
  }
}

export function setupExportRoutes(dialog: HTMLDialogElement, onUpdate: () => void): void {
  const toggle = dialog.querySelector<HTMLInputElement>("[data-multi-routes]");
  const list = dialog.querySelector<HTMLElement>("[data-route-list]");
  const add = dialog.querySelector<HTMLButtonElement>("[data-add-route]");
  if (!toggle || !list || !add) return;

  toggle.addEventListener("change", () => { list.dataset.preserveEmpty = "false"; syncExportRoutes(dialog); onUpdate(); });
  add.addEventListener("click", () => {
    if (list.children.length >= MAX_STREAM_ELEMENTS_ROUTES) return;
    list.dataset.preserveEmpty = "false";
    list.appendChild(createRoute());
    syncExportRoutes(dialog);
    onUpdate();
  });
  list.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>("[data-remove-route]");
    if (!button) return;
    button.closest("[data-route-id]")?.remove();
    syncExportRoutes(dialog);
    onUpdate();
  });
  list.addEventListener("change", () => {
    syncExportRoutes(dialog);
    onUpdate();
  });
  syncExportRoutes(dialog);
}
