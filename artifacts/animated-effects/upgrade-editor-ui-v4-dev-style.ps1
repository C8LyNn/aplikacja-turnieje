param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson = Join-Path $ProjectRoot "package.json"
$mainPath = Join-Path $ProjectRoot "src\main.ts"
$stylePath = Join-Path $ProjectRoot "src\style.css"

if (
  !(Test-Path $packageJson) -or
  !(Test-Path $mainPath) -or
  !(Test-Path $stylePath)
) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$currentMain =
  [System.IO.File]::ReadAllText($mainPath)

if (
  !$currentMain.Contains(
    'class="ae-app-shell"'
  )
) {
  throw "Nie rozpoznaje aktualnego UI Animated Effects."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot =
  Join-Path $ProjectRoot ".animated-effects-backup\$stamp"

$mainBackup =
  Join-Path $backupRoot "src\main.ts"

$styleBackup =
  Join-Path $backupRoot "src\style.css"

New-Item -ItemType Directory -Force -Path (
  Split-Path $mainBackup -Parent
) | Out-Null

New-Item -ItemType Directory -Force -Path (
  Split-Path $styleBackup -Parent
) | Out-Null

Copy-Item $mainPath $mainBackup -Force
Copy-Item $stylePath $styleBackup -Force

Write-Host ""
Write-Host "Animated Effects - Dev UI visual pass v4" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

$newMain = @'
import "./style.css";

import type {
  EffectInstance,
} from "./core/types";

import {
  createPreview,
  renderEffect,
} from "./editor/preview";

import {
  renderInspector,
} from "./editor/inspector";

import {
  openExportPanel,
  setupExportPanel,
} from "./editor/exportPanel";

import {
  addEffect,
  clearEffects,
  getEditorState,
  moveEffectDown,
  moveEffectUp,
  removeEffect,
  selectEffect,
  subscribe,
  toggleEffect,
} from "./editor/state";

import {
  getAllEffectDefinitions,
  getEffectDefinition,
} from "./effects/registry";

const app =
  document.querySelector<HTMLDivElement>(
    "#app",
  );

if (!app) {
  throw new Error(
    "Nie znaleziono elementu #app.",
  );
}

app.innerHTML = `
  <main class="ae-app-shell">
    <header class="ae-app-header">
      <div class="ae-brand">
        <div class="ae-brand-mark">DEV</div>

        <div class="ae-brand-copy">
          <span class="ae-dev-context">DEV / NARZ\u0118DZIA</span>
          <h1>Animated Effects</h1>
        </div>
      </div>

      <div class="ae-header-status">
        <span
          id="library-summary"
          class="ae-status-pill"
        ></span>

        <span
          id="active-summary"
          class="ae-status-pill"
        ></span>
      </div>

      <div class="ae-header-actions">
        <button
          id="clear-preview"
          class="ae-button ae-button-secondary"
          type="button"
        >
          Wyczy\u015B\u0107 scen\u0119
        </button>

        <button
          id="export-stream-elements"
          class="ae-button ae-button-primary"
          type="button"
        >
          Eksportuj
        </button>
      </div>
    </header>

    <div class="ae-editor-grid">
      <aside class="ae-left-panel">
        <div class="ae-sidebar-tabs" role="tablist">
          <button
            class="ae-sidebar-tab is-active"
            type="button"
            data-sidebar-tab="effects"
            aria-selected="true"
          >
            Efekty
          </button>

          <button
            class="ae-sidebar-tab"
            type="button"
            data-sidebar-tab="layers"
            aria-selected="false"
          >
            Warstwy
            <span id="layer-count" class="ae-tab-count">0</span>
          </button>
        </div>

        <section
          id="effects-sidebar"
          class="ae-sidebar-view is-active"
          data-sidebar-view="effects"
        >
          <div class="ae-sidebar-heading">
            <div>
              <strong>Biblioteka efekt\u00F3w</strong>
              <span id="effect-result-count"></span>
            </div>
          </div>

          <div class="ae-effect-filters">
            <label class="ae-search-wrap">
              <span aria-hidden="true">\u2315</span>
              <input
                id="effect-search"
                type="search"
                placeholder="Szukaj efektu..."
                autocomplete="off"
              >
            </label>

            <select
              id="effect-category"
              class="ae-category-select"
              aria-label="Kategoria efektu"
            ></select>
          </div>

          <div
            id="effect-library"
            class="ae-effect-library"
          ></div>
        </section>

        <section
          id="layers-sidebar"
          class="ae-sidebar-view"
          data-sidebar-view="layers"
          hidden
        >
          <div class="ae-sidebar-heading">
            <div>
              <strong>Warstwy sceny</strong>
              <span>Najwy\u017Csza warstwa jest na g\u00F3rze listy</span>
            </div>
          </div>

          <div
            id="layers-list"
            class="ae-layer-list"
          ></div>
        </section>
      </aside>

      <section class="ae-stage-panel">
        <div class="ae-stage-toolbar">
          <div>
            <strong>Podgl\u0105d</strong>
            <span id="preview-meta"></span>
          </div>

          <div class="ae-stage-hint">
            Format 16:9
          </div>
        </div>

        <div class="ae-preview-shell">
          <div id="preview-host"></div>
        </div>
      </section>

      <aside class="ae-inspector-panel">
        <div class="ae-panel-heading">
          <div>
            <strong>Ustawienia</strong>
            <span>Parametry zaznaczonej warstwy</span>
          </div>
        </div>

        <div
          id="inspector"
          class="ae-inspector-content"
        ></div>
      </aside>
    </div>
  </main>

  <dialog
    id="stream-elements-export"
    class="export-dialog"
  >
    <div class="export-header">
      <div>
        <strong>StreamElements</strong>
        <span data-export-metrics></span>
      </div>

      <button
        type="button"
        data-export-close
      >
        \u00D7
      </button>
    </div>

    <div class="export-section">
      <div class="export-section-header">
        <strong>HTML</strong>
        <button type="button" data-copy="html">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="html"
        readonly
      ></textarea>
    </div>

    <div class="export-section">
      <div class="export-section-header">
        <strong>CSS</strong>
        <button type="button" data-copy="css">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="css"
        readonly
      ></textarea>
    </div>

    <div class="export-section">
      <div class="export-section-header">
        <strong>JavaScript</strong>
        <button type="button" data-copy="javascript">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="javascript"
        readonly
      ></textarea>
    </div>
  </dialog>
`;

function getRequiredElement<
  T extends HTMLElement
>(
  selector: string,
): T {
  const element =
    document.querySelector<T>(
      selector,
    );

  if (!element) {
    throw new Error(
      `Nie znaleziono elementu: ${selector}`,
    );
  }

  return element;
}

const previewHost =
  getRequiredElement<HTMLElement>(
    "#preview-host",
  );

const layersList =
  getRequiredElement<HTMLElement>(
    "#layers-list",
  );

const layerCount =
  getRequiredElement<HTMLElement>(
    "#layer-count",
  );

const inspector =
  getRequiredElement<HTMLElement>(
    "#inspector",
  );

const effectLibrary =
  getRequiredElement<HTMLElement>(
    "#effect-library",
  );

const effectSearch =
  getRequiredElement<HTMLInputElement>(
    "#effect-search",
  );

const effectCategory =
  getRequiredElement<HTMLSelectElement>(
    "#effect-category",
  );

const effectResultCount =
  getRequiredElement<HTMLElement>(
    "#effect-result-count",
  );

const librarySummary =
  getRequiredElement<HTMLElement>(
    "#library-summary",
  );

const activeSummary =
  getRequiredElement<HTMLElement>(
    "#active-summary",
  );

const previewMeta =
  getRequiredElement<HTMLElement>(
    "#preview-meta",
  );

const exportDialog =
  getRequiredElement<HTMLDialogElement>(
    "#stream-elements-export",
  );

setupExportPanel(
  exportDialog,
);

const preview =
  createPreview(
    previewHost,
  );

const effectDefinitions =
  getAllEffectDefinitions();

let searchQuery = "";
let selectedCategory = "all";

/*
  Range inputs emit "input" many times while dragging.
  State updates re-render the whole editor, so without this guard
  the inspector DOM would be replaced after the first movement and
  the thumb could no longer be dragged continuously.
*/
let isInspectorRangeDragging = false;

const categoryLabels: Record<
  string,
  string
> = {
  calm: "Spokojne",
  energy: "Energia",
  "sci-fi": "Sci-Fi",
  fantasy: "Fantasy",
  steampunk: "Steampunk",
  botanical: "Natura",
  urban: "Urban",
  cosmic: "Kosmos",
  tech: "Tech",
  solar: "Solar",
  retro: "Retro",
  weather: "Pogoda",
  cinematic: "Filmowe",
  abstract: "Abstrakcyjne",
  other: "Inne",
};

function categoryLabel(
  category: string,
): string {
  return (
    categoryLabels[category] ??
    category
  );
}

function effectNumber(
  current: EffectInstance,
): number {
  const sameType =
    getEditorState().effects.filter(
      (effect) =>
        effect.effectId ===
        current.effectId,
    );

  return (
    sameType.findIndex(
      (effect) =>
        effect.instanceId ===
        current.instanceId,
    ) + 1
  );
}

function renderCategoryOptions(): void {
  const categories = [
    ...new Set(
      effectDefinitions.map(
        (definition) =>
          definition.category,
      ),
    ),
  ].sort(
    (a, b) =>
      categoryLabel(a)
        .localeCompare(
          categoryLabel(b),
          "pl",
        ),
  );

  effectCategory.innerHTML = `
    <option value="all">
      Wszystkie kategorie
    </option>

    ${categories
      .map(
        (category) => `
          <option value="${category}">
            ${categoryLabel(category)}
          </option>
        `,
      )
      .join("")}
  `;

  effectCategory.value =
    selectedCategory;
}

function renderEffectLibrary(): void {
  const normalizedQuery =
    searchQuery
      .trim()
      .toLocaleLowerCase("pl");

  const filtered =
    effectDefinitions.filter(
      (definition) => {
        const matchesCategory =
          selectedCategory === "all" ||
          definition.category ===
            selectedCategory;

        if (!matchesCategory) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const searchable = [
          definition.name,
          definition.id,
          definition.description,
          ...definition.tags,
          categoryLabel(
            definition.category,
          ),
        ]
          .join(" ")
          .toLocaleLowerCase("pl");

        return searchable.includes(
          normalizedQuery,
        );
      },
    );

  effectResultCount.textContent =
    `${filtered.length} z ${effectDefinitions.length}`;

  effectLibrary.replaceChildren();

  if (filtered.length === 0) {
    effectLibrary.innerHTML = `
      <div class="ae-empty-state">
        Nie znaleziono efekt\u00F3w dla tych filtr\u00F3w.
      </div>
    `;

    return;
  }

  filtered.forEach(
    (definition) => {
      const button =
        document.createElement(
          "button",
        );

      button.type = "button";
      button.className =
        "ae-effect-card";

      button.title =
        definition.description;

      const performanceLabel =
        `Koszt ${definition.performanceCost}/5`;

      button.innerHTML = `
        <span class="ae-effect-card-main">
          <strong>${definition.name}</strong>
          <small>
            ${categoryLabel(
              definition.category,
            )}
          </small>
        </span>

        <span class="ae-effect-card-meta">
          <span
            class="ae-performance-badge"
            title="Szacunkowy koszt wydajno\u015Bci"
          >
            ${performanceLabel}
          </span>

          <span class="ae-add-icon">
            + Dodaj
          </span>
        </span>
      `;

      button.addEventListener(
        "click",
        () => {
          addEffect(
            definition.id,
          );
        },
      );

      effectLibrary.appendChild(
        button,
      );
    },
  );
}

function renderPreview(): void {
  preview.replaceChildren();

  const state =
    getEditorState();

  state.effects.forEach(
    (effect) => {
      if (!effect.enabled) {
        return;
      }

      renderEffect(
        preview,
        effect,
      );
    },
  );
}

function renderLayers(): void {
  const state =
    getEditorState();

  layersList.replaceChildren();

  layerCount.textContent =
    String(
      state.effects.length,
    );

  if (
    state.effects.length === 0
  ) {
    layersList.innerHTML = `
      <div class="ae-empty-state">
        Brak warstw.
        <br>
        Przejd\u017A do zak\u0142adki Efekty i dodaj pierwszy efekt.
      </div>
    `;

    return;
  }

  [...state.effects]
    .reverse()
    .forEach(
      (instance) => {
        const definition =
          getEffectDefinition(
            instance.effectId,
          );

        if (!definition) {
          return;
        }

        const row =
          document.createElement(
            "div",
          );

        row.className =
          "ae-layer-row";

        if (!instance.enabled) {
          row.classList.add(
            "is-disabled",
          );
        }

        if (
          state
            .selectedEffectInstanceId ===
          instance.instanceId
        ) {
          row.classList.add(
            "is-selected",
          );
        }

        const number =
          effectNumber(
            instance,
          );

        row.innerHTML = `
          <button
            class="ae-layer-select"
            type="button"
          >
            <span class="ae-layer-color-dot"></span>

            <span class="ae-layer-copy">
              <strong>
                ${definition.name} #${number}
              </strong>

              <small>
                ${categoryLabel(
                  definition.category,
                )}
              </small>
            </span>
          </button>

          <div class="ae-layer-actions">
            <button
              class="ae-icon-button ae-toggle-button layer-toggle"
              type="button"
              title="W\u0142\u0105cz / wy\u0142\u0105cz"
              aria-label="W\u0142\u0105cz lub wy\u0142\u0105cz warstw\u0119"
            >
              ${instance.enabled ? "ON" : "OFF"}
            </button>

            <button
              class="ae-icon-button layer-up"
              type="button"
              title="Przenie\u015B wy\u017Cej"
              aria-label="Przenie\u015B warstw\u0119 wy\u017Cej"
            >
              &#8593;
            </button>

            <button
              class="ae-icon-button layer-down"
              type="button"
              title="Przenie\u015B ni\u017Cej"
              aria-label="Przenie\u015B warstw\u0119 ni\u017Cej"
            >
              &#8595;
            </button>

            <button
              class="ae-icon-button ae-icon-danger layer-remove"
              type="button"
              title="Usu\u0144"
              aria-label="Usu\u0144 warstw\u0119"
            >
              &#215;
            </button>
          </div>
        `;

        row
          .querySelector(
            ".ae-layer-select",
          )
          ?.addEventListener(
            "click",
            () => {
              selectEffect(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-toggle",
          )
          ?.addEventListener(
            "click",
            () => {
              toggleEffect(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-up",
          )
          ?.addEventListener(
            "click",
            () => {
              moveEffectUp(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-down",
          )
          ?.addEventListener(
            "click",
            () => {
              moveEffectDown(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-remove",
          )
          ?.addEventListener(
            "click",
            () => {
              removeEffect(
                instance.instanceId,
              );
            },
          );

        layersList.appendChild(
          row,
        );
      },
    );
}

function renderStatus(): void {
  const state =
    getEditorState();

  const activeCount =
    state.effects.filter(
      (effect) => effect.enabled,
    ).length;

  librarySummary.textContent =
    `${effectDefinitions.length} efekt\u00F3w`;

  activeSummary.textContent =
    `Aktywne: ${activeCount} \u00B7 Warstwy: ${state.effects.length}`;

  previewMeta.textContent =
    `${state.resolution.width} \u00D7 ${state.resolution.height} \u00B7 aktywne: ${activeCount}`;
}

function renderEditor(): void {
  renderPreview();
  renderLayers();
  renderStatus();

  if (!isInspectorRangeDragging) {
    renderInspector(
      inspector,
    );
  }
}

function setSidebarTab(
  tab: "effects" | "layers",
): void {
  document
    .querySelectorAll<HTMLButtonElement>(
      "[data-sidebar-tab]",
    )
    .forEach(
      (button) => {
        const isActive =
          button.dataset.sidebarTab ===
          tab;

        button.classList.toggle(
          "is-active",
          isActive,
        );

        button.setAttribute(
          "aria-selected",
          String(isActive),
        );
      },
    );

  document
    .querySelectorAll<HTMLElement>(
      "[data-sidebar-view]",
    )
    .forEach(
      (view) => {
        const isActive =
          view.dataset.sidebarView ===
          tab;

        view.hidden = !isActive;
        view.classList.toggle(
          "is-active",
          isActive,
        );
      },
    );
}

renderCategoryOptions();
renderEffectLibrary();

subscribe(
  renderEditor,
);

/*
  Keep the actual <input type="range"> alive for the whole pointer gesture.
  updateEffectSettings() may re-render preview/layers/status on every "input",
  but the inspector itself is not replaced until pointerup/pointercancel.
*/
inspector.addEventListener(
  "pointerdown",
  (event) => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement &&
      target.type === "range"
    ) {
      isInspectorRangeDragging = true;
    }
  },
);

const finishInspectorRangeDrag = (): void => {
  if (!isInspectorRangeDragging) {
    return;
  }

  isInspectorRangeDragging = false;

  /*
    One final inspector render synchronizes its markup with state
    after the continuous drag has finished.
  */
  renderInspector(
    inspector,
  );
};

window.addEventListener(
  "pointerup",
  finishInspectorRangeDrag,
);

window.addEventListener(
  "pointercancel",
  finishInspectorRangeDrag,
);

effectSearch.addEventListener(
  "input",
  () => {
    searchQuery =
      effectSearch.value;

    renderEffectLibrary();
  },
);

effectCategory.addEventListener(
  "change",
  () => {
    selectedCategory =
      effectCategory.value;

    renderEffectLibrary();
  },
);

document
  .querySelectorAll<HTMLButtonElement>(
    "[data-sidebar-tab]",
  )
  .forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          const tab =
            button.dataset.sidebarTab;

          if (
            tab === "effects" ||
            tab === "layers"
          ) {
            setSidebarTab(tab);
          }
        },
      );
    },
  );

document
  .querySelector<HTMLButtonElement>(
    "#clear-preview",
  )
  ?.addEventListener(
    "click",
    clearEffects,
  );

document
  .querySelector<HTMLButtonElement>(
    "#export-stream-elements",
  )
  ?.addEventListener(
    "click",
    () => {
      openExportPanel(
        exportDialog,
      );
    },
  );

addEffect(
  "rainfall",
);

'@

$devCss = @'
/* === AE_EDITOR_UI_V4_DEV_START === */

/*
  Dev-style visual pass:
  - flatter surfaces, less "standalone app" decoration
  - 280 / fluid / 320 workspace like the other Dev tools
  - compact tool header and panel headers
  - same dark surface hierarchy used across Dev
  - restrained purple accent only for active/selected states
*/

:root {
  --ae-bg: #0c1018;
  --ae-panel: #0d121c;
  --ae-panel-soft: #111722;
  --ae-panel-raised: #151b27;
  --ae-field: #151b27;
  --ae-field-deep: #070b12;

  --ae-line: rgba(255, 255, 255, 0.08);
  --ae-line-strong: rgba(255, 255, 255, 0.12);

  --ae-text: #ffffff;
  --ae-muted: #b9c5d8;
  --ae-muted-2: #70809a;

  --ae-accent: #7c5cff;
  --ae-accent-strong: #8d73ff;
  --ae-accent-soft: rgba(124, 92, 255, 0.12);
  --ae-accent-line: rgba(124, 92, 255, 0.42);
}

body {
  background: var(--ae-bg);
}

.ae-app-shell {
  grid-template-rows: 58px minmax(0, 1fr);
  background: var(--ae-bg);
}

/* Header ----------------------------------------------------- */

.ae-app-header {
  min-height: 58px;
  gap: 14px;
  padding: 0 14px;

  border-bottom: 1px solid var(--ae-line);

  background:
    linear-gradient(
      180deg,
      rgba(17, 23, 34, 0.98),
      rgba(13, 18, 28, 0.98)
    );
}

.ae-brand {
  gap: 10px;
}

.ae-brand-mark {
  width: 34px;
  height: 30px;

  border:
    1px solid
    rgba(124, 92, 255, 0.34);

  border-radius: 8px;

  background:
    rgba(124, 92, 255, 0.10);

  color: #c8beff;

  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.ae-brand-copy {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.ae-dev-context {
  color: #66758c;

  font-size: 8px;
  font-weight: 800;

  letter-spacing: 0.10em;
  line-height: 1;
}

.ae-brand h1 {
  margin: 0;

  color: #f7f9ff;

  font-size: 13px;
  font-weight: 780;

  line-height: 1.1;
}

.ae-header-status {
  gap: 6px;
}

.ae-status-pill {
  min-height: 28px;
  display: inline-flex;
  align-items: center;

  padding: 0 9px;

  border: 1px solid var(--ae-line);
  border-radius: 8px;

  background: #111722;

  color: #8f9db2;

  font-size: 9px;
  font-weight: 700;
}

.ae-header-actions {
  gap: 7px;
}

.ae-button {
  min-height: 34px;
  padding: 0 12px;

  border-radius: 8px;

  font-size: 10px;
  font-weight: 760;
}

.ae-button-secondary {
  border-color: var(--ae-line);
  background: #111722;
}

.ae-button-secondary:hover {
  border-color: rgba(255, 255, 255, 0.16);
  background: #151b27;
}

.ae-button-primary {
  background: #6f52e8;
}

.ae-button-primary:hover {
  background: #7c5cff;
}

/* Main workspace --------------------------------------------- */

.ae-editor-grid {
  grid-template-columns:
    280px
    minmax(0, 1fr)
    320px;

  background: var(--ae-bg);
}

.ae-left-panel,
.ae-inspector-panel {
  background: #0d121c;
}

.ae-left-panel {
  border-right: 1px solid var(--ae-line);
}

.ae-inspector-panel {
  border-left: 1px solid var(--ae-line);
}

/* Left navigation -------------------------------------------- */

.ae-sidebar-tabs {
  min-height: 46px;

  gap: 4px;
  padding: 7px 8px;

  border-bottom: 1px solid var(--ae-line);

  background: #0d121c;
}

.ae-sidebar-tab {
  min-height: 31px;

  border: 1px solid transparent;
  border-radius: 7px;

  background: transparent;

  color: #78869b;

  font-size: 9.5px;
  font-weight: 760;
}

.ae-sidebar-tab:hover {
  color: #c4cedc;
  background: rgba(255, 255, 255, 0.025);
}

.ae-sidebar-tab.is-active {
  border-color: rgba(124, 92, 255, 0.30);

  background: rgba(124, 92, 255, 0.09);

  box-shadow: none;

  color: #e7e2ff;
}

.ae-tab-count {
  min-width: 18px;
  height: 18px;

  border-radius: 6px;

  background: rgba(124, 92, 255, 0.13);

  font-size: 8px;
}

.ae-sidebar-heading,
.ae-panel-heading {
  padding: 13px 12px 10px;
}

.ae-sidebar-heading strong,
.ae-panel-heading strong,
.ae-stage-toolbar strong {
  font-size: 10.5px;
  font-weight: 780;
}

.ae-sidebar-heading span,
.ae-panel-heading span,
.ae-stage-toolbar span {
  color: #66758c;

  font-size: 8.5px;
  line-height: 1.35;
}

/* Search / filters ------------------------------------------- */

.ae-effect-filters {
  grid-template-columns: minmax(0, 1fr) 112px;

  gap: 6px;
  padding: 0 8px 9px;
}

.ae-search-wrap,
.ae-category-select {
  height: 34px;

  border-color: var(--ae-line);
  border-radius: 8px;

  background: #111722;
}

.ae-search-wrap:focus-within,
.ae-category-select:focus {
  border-color: rgba(124, 92, 255, 0.44);
  box-shadow: 0 0 0 2px rgba(124, 92, 255, 0.08);
}

.ae-search-wrap input,
.ae-category-select {
  font-size: 9.5px;
}

/* Effect library / layers ------------------------------------ */

.ae-effect-library,
.ae-layer-list {
  gap: 5px;
  padding: 0 8px 12px;
}

.ae-effect-card,
.ae-layer-row {
  border: 1px solid var(--ae-line);
  border-radius: 9px;

  background: #111722;

  box-shadow: none;
}

.ae-effect-card {
  min-height: 54px;

  gap: 8px;
  padding: 8px 8px 8px 10px;
}

.ae-effect-card:hover {
  transform: none;

  border-color: rgba(124, 92, 255, 0.27);

  background: #141b28;

  box-shadow: none;
}

.ae-effect-card-main {
  gap: 3px;
}

.ae-effect-card-main strong {
  color: #e7edf7;

  font-size: 10px;
  font-weight: 740;
}

.ae-effect-card-main small {
  color: #66758c;

  font-size: 8px;
  letter-spacing: 0.02em;
}

.ae-effect-card-meta {
  gap: 5px;
}

.ae-performance-badge {
  padding: 3px 5px;

  border-color: rgba(255, 255, 255, 0.06);
  border-radius: 6px;

  background: #0d121c;

  color: #63728a;

  font-size: 7.5px;
}

.ae-add-icon {
  min-width: 46px;
  height: 26px;

  border:
    1px solid
    rgba(124, 92, 255, 0.22);

  border-radius: 7px;

  background:
    rgba(124, 92, 255, 0.08);

  color: #bfb4ff;

  font-size: 8.5px;
}

.ae-layer-row {
  gap: 6px;
  padding: 6px;
}

.ae-layer-row.is-selected {
  border-color: rgba(124, 92, 255, 0.44);

  background:
    linear-gradient(
      90deg,
      rgba(124, 92, 255, 0.10),
      #111722 38%
    );
}

.ae-layer-select {
  gap: 8px;
  padding: 5px;
}

.ae-layer-color-dot {
  width: 3px;
  height: 30px;

  border-radius: 999px;

  background: #7c5cff;
}

.ae-layer-copy strong {
  font-size: 9.5px;
}

.ae-layer-copy small {
  font-size: 8px;
}

.ae-layer-actions {
  grid-template-columns: repeat(2, 28px);
  gap: 4px;
}

.ae-icon-button {
  width: 28px;
  height: 28px;

  border-radius: 7px;

  background: #151b27;

  color: #9ca9bb;

  font-size: 10px;
}

.ae-icon-button:hover {
  border-color: rgba(124, 92, 255, 0.30);
  background: #1a2230;
}

/* Stage ------------------------------------------------------- */

.ae-stage-panel {
  grid-template-rows: 44px minmax(0, 1fr);

  background:
    radial-gradient(
      circle at 50% 42%,
      rgba(80, 94, 135, 0.07),
      transparent 44%
    ),
    #0c1018;
}

.ae-stage-toolbar {
  padding: 0 12px;

  border-bottom: 1px solid var(--ae-line);

  background: #0d121c;

  backdrop-filter: none;
}

.ae-stage-hint {
  padding: 4px 7px;

  border: 1px solid var(--ae-line);
  border-radius: 6px;

  background: #111722;

  color: #66758c;

  font-size: 8px;
}

.ae-preview-shell {
  padding: 16px;
}

#preview-host {
  width: min(1360px, 100%);
}

.effect-preview {
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;

  box-shadow:
    0 22px 60px rgba(0, 0, 0, 0.34);
}

/* Inspector --------------------------------------------------- */

.ae-panel-heading {
  min-height: 44px;

  padding: 9px 12px;

  border-bottom: 1px solid var(--ae-line);

  background: #0d121c;
}

.ae-inspector-content {
  padding: 9px 9px 14px;
}

.ae-inspector-content .inspector-title {
  min-height: 56px;

  margin: 0 0 8px;
  padding: 10px;

  border-color: rgba(124, 92, 255, 0.31);
  border-radius: 9px;

  background: #111722;
}

.inspector-title-copy strong {
  font-size: 11px;
}

.inspector-title-copy span {
  color: #66758c;
  font-size: 8px;
}

.inspector-reset-button {
  min-height: 27px;
  padding: 0 8px;

  border-radius: 7px;

  background: #151b27;

  font-size: 8.5px;
}

.inspector-group {
  margin-bottom: 7px;
  padding: 10px 10px 2px;

  border-color: rgba(255, 255, 255, 0.065);
  border-radius: 9px;

  background: #111722;
}

.inspector-group-heading {
  gap: 2px;
  margin-bottom: 8px;
}

.inspector-group-heading strong {
  color: #cfd8e5;
  font-size: 9px;
}

.inspector-group-heading span {
  color: #607089;
  font-size: 7.5px;
}

.ae-inspector-content .inspector-field {
  gap: 5px;
  margin-bottom: 9px;
}

.ae-inspector-content .inspector-label {
  color: #b9c5d8;

  font-size: 9px;
  font-weight: 680;
}

.ae-inspector-content .inspector-label output {
  min-width: 46px;

  padding: 2px 6px;

  border-color: rgba(255, 255, 255, 0.065);
  border-radius: 6px;

  background: #151b27;

  font-size: 8px;
}

.ae-inspector-content .inspector-field select {
  height: 32px;

  border-color: var(--ae-line);
  border-radius: 7px;

  background-color: #151b27;

  font-size: 9px;
}

.ae-inspector-content .inspector-field input[type="range"] {
  height: 16px;
}

.ae-inspector-content
  .inspector-field
  input[type="range"]
  ::-webkit-slider-runnable-track {
  height: 5px;
}

/* Empty states ------------------------------------------------ */

.ae-empty-state {
  margin: 0;
  padding: 20px 12px;

  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 8px;

  background: rgba(255, 255, 255, 0.012);

  color: #66758c;

  font-size: 9px;
  line-height: 1.5;
}

/* Responsive -------------------------------------------------- */

@media (max-width: 1220px) {
  .ae-editor-grid {
    grid-template-columns:
      260px
      minmax(0, 1fr)
      300px;
  }

  .ae-effect-filters {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .ae-header-status {
    display: none;
  }

  .ae-editor-grid {
    grid-template-columns:
      238px
      minmax(0, 1fr)
      284px;
  }
}

/* === AE_EDITOR_UI_V4_DEV_END === */
'@

$currentStyle =
  [System.IO.File]::ReadAllText($stylePath)

$startMarker =
  "/* === AE_EDITOR_UI_V4_DEV_START === */"

$endMarker =
  "/* === AE_EDITOR_UI_V4_DEV_END === */"

$start =
  $currentStyle.IndexOf($startMarker)

$end =
  $currentStyle.IndexOf($endMarker)

if (
  $start -ge 0 -and
  $end -gt $start
) {
  $end += $endMarker.Length

  $before = (
    $currentStyle.Substring(
      0,
      $start
    )
  ).TrimEnd()

  $after = (
    $currentStyle.Substring(
      $end
    )
  ).TrimStart()

  $newStyle =
    $before +
    "`r`n`r`n" +
    $devCss.Trim() +
    "`r`n"

  if ($after.Length -gt 0) {
    $newStyle +=
      "`r`n" +
      $after
  }
}
else {
  $newStyle =
    $currentStyle.TrimEnd() +
    "`r`n`r`n" +
    $devCss.Trim() +
    "`r`n"
}

$utf8NoBom =
  New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
  $mainPath,
  $newMain,
  $utf8NoBom
)

[System.IO.File]::WriteAllText(
  $stylePath,
  $newStyle,
  $utf8NoBom
)

Push-Location $ProjectRoot

try {
  Write-Host "Uruchamiam TypeScript check..." -ForegroundColor Cyan
  & npx.cmd tsc --noEmit

  if ($LASTEXITCODE -ne 0) {
    throw "TypeScript check failed"
  }

  Write-Host "TypeScript: PASS" -ForegroundColor Green
  Write-Host "Uruchamiam build..." -ForegroundColor Cyan

  & npm.cmd run build

  if ($LASTEXITCODE -ne 0) {
    throw "Build failed"
  }

  Write-Host ""
  Write-Host "BUILD: PASS" -ForegroundColor Green
  Write-Host ""
  Write-Host "Dev UI visual pass v4 zainstalowany." -ForegroundColor Green
  Write-Host "Zmiany:"
  Write-Host "  - workspace 280 / fluid / 320 jak pozostale narzedzia Dev"
  Write-Host "  - bardziej plaskie panele i karty"
  Write-Host "  - kompaktowy naglowek DEV / NARZEDZIA"
  Write-Host "  - ten sam system tla, obramowan i promieni"
  Write-Host "  - spokojniejszy fiolet tylko dla aktywnych stanow"
  Write-Host "  - kompaktowe zakladki, filtry i akcje"
  Write-Host "  - bardziej techniczny wyglad podgladu i Inspectora"
  Write-Host ""
  Write-Host "Odswiez aktywny localhost z Vite."
}
catch {
  Write-Host ""
  Write-Host "Walidacja nie przeszla. Przywracam backup..." -ForegroundColor Red

  Copy-Item $mainBackup $mainPath -Force
  Copy-Item $styleBackup $stylePath -Force

  Write-Host "Przywrocono poprzednie main.ts i style.css." -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
