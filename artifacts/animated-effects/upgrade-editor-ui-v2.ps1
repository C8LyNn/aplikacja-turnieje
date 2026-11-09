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
Write-Host "Animated Effects - Editor UI v2" -ForegroundColor Cyan
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
        <div class="ae-brand-mark">AE</div>

        <div>
          <h1>Animated Effects</h1>
          <p>Edytor efektów streamowych</p>
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
          Wyczyść scenę
        </button>

        <button
          id="export-stream-elements"
          class="ae-button ae-button-primary"
          type="button"
        >
          Eksport StreamElements
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
              <strong>Biblioteka efektów</strong>
              <span id="effect-result-count"></span>
            </div>
          </div>

          <div class="ae-effect-filters">
            <label class="ae-search-wrap">
              <span aria-hidden="true">⌕</span>
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
              <span>Najwyższa warstwa jest na górze listy</span>
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
            <strong>Podgląd</strong>
            <span id="preview-meta"></span>
          </div>

          <div class="ae-stage-hint">
            Podgląd 16:9
          </div>
        </div>

        <div class="ae-preview-shell">
          <div id="preview-host"></div>
        </div>
      </section>

      <aside class="ae-inspector-panel">
        <div class="ae-panel-heading">
          <div>
            <strong>Inspector</strong>
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
        ×
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
        Nie znaleziono efektów dla tych filtrów.
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

      const performanceDots =
        Array.from(
          { length: 5 },
          (_, index) =>
            index <
            definition.performanceCost
              ? "●"
              : "○",
        ).join("");

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
            class="ae-performance-dots"
            title="Koszt wydajności ${definition.performanceCost}/5"
          >
            ${performanceDots}
          </span>

          <span class="ae-add-icon">+</span>
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
        Przejdź do zakładki Efekty i dodaj pierwszy efekt.
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
              class="ae-icon-button layer-toggle"
              type="button"
              title="Włącz / wyłącz"
            >
              ${instance.enabled ? "●" : "○"}
            </button>

            <button
              class="ae-icon-button layer-up"
              type="button"
              title="Wyżej"
            >
              ↑
            </button>

            <button
              class="ae-icon-button layer-down"
              type="button"
              title="Niżej"
            >
              ↓
            </button>

            <button
              class="ae-icon-button ae-icon-danger layer-remove"
              type="button"
              title="Usuń"
            >
              ×
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
    `${effectDefinitions.length} efektów`;

  activeSummary.textContent =
    `Aktywne: ${activeCount} · Warstwy: ${state.effects.length}`;

  previewMeta.textContent =
    `${state.resolution.width} × ${state.resolution.height} · aktywne: ${activeCount}`;
}

function renderEditor(): void {
  renderPreview();
  renderLayers();
  renderStatus();

  renderInspector(
    inspector,
  );
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

$uiCss = @'
/* === AE_EDITOR_UI_V2_START === */

:root {
  --ae-bg: #070a11;
  --ae-panel: #0d111a;
  --ae-panel-soft: #111722;
  --ae-panel-raised: #151c29;
  --ae-line: rgba(255, 255, 255, 0.08);
  --ae-line-strong: rgba(255, 255, 255, 0.13);
  --ae-text: #f3f6ff;
  --ae-muted: #8090a9;
  --ae-muted-2: #5e6c82;
  --ae-accent: #7c5cff;
  --ae-accent-soft: rgba(124, 92, 255, 0.14);
  --ae-accent-line: rgba(124, 92, 255, 0.48);
  --ae-danger: #ff667a;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  min-height: 0;
}

body {
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  background: var(--ae-bg);
}

.ae-app-shell {
  height: 100vh;
  min-height: 0;
  display: grid;
  grid-template-rows: 74px minmax(0, 1fr);
  overflow: hidden;
  background:
    radial-gradient(
      circle at 45% 15%,
      rgba(61, 81, 144, 0.08),
      transparent 34%
    ),
    var(--ae-bg);
}

.ae-app-header {
  min-width: 0;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
  border-bottom: 1px solid var(--ae-line);
  background: rgba(11, 15, 23, 0.94);
  backdrop-filter: blur(16px);
}

.ae-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.ae-brand-mark {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid var(--ae-accent-line);
  border-radius: 12px;
  background:
    linear-gradient(
      145deg,
      rgba(124, 92, 255, 0.3),
      rgba(0, 217, 255, 0.08)
    );
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.05em;
  box-shadow:
    inset 0 0 20px rgba(124, 92, 255, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.24);
}

.ae-brand h1 {
  margin: 0;
  font-size: 17px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.ae-brand p {
  margin: 4px 0 0;
  color: var(--ae-muted);
  font-size: 10px;
}

.ae-header-status {
  min-width: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
}

.ae-status-pill {
  flex: 0 0 auto;
  padding: 6px 10px;
  border: 1px solid var(--ae-line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.025);
  color: #9ba9bd;
  font-size: 10px;
  white-space: nowrap;
}

.ae-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ae-button {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 750;
  white-space: nowrap;
}

.ae-button-secondary {
  border-color: var(--ae-line-strong);
  background: #141a25;
  color: #d7dfed;
}

.ae-button-secondary:hover {
  background: #1b2332;
}

.ae-button-primary {
  border-color: rgba(124, 92, 255, 0.65);
  background:
    linear-gradient(
      135deg,
      #7658f0,
      #6747df
    );
  color: white;
  box-shadow: 0 8px 24px rgba(79, 54, 190, 0.22);
}

.ae-button-primary:hover {
  background:
    linear-gradient(
      135deg,
      #866aff,
      #7354e8
    );
}

.ae-editor-grid {
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-columns:
    330px
    minmax(0, 1fr)
    330px;
  overflow: hidden;
}

.ae-left-panel,
.ae-inspector-panel {
  min-height: 0;
  background: rgba(11, 15, 23, 0.94);
}

.ae-left-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border-right: 1px solid var(--ae-line);
  overflow: hidden;
}

.ae-sidebar-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid var(--ae-line);
}

.ae-sidebar-tab {
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: #78879e;
  font-size: 11px;
  font-weight: 750;
}

.ae-sidebar-tab:hover {
  background: rgba(255, 255, 255, 0.035);
  color: #c6d0df;
}

.ae-sidebar-tab.is-active {
  border-color: rgba(124, 92, 255, 0.3);
  background: var(--ae-accent-soft);
  color: #ece8ff;
}

.ae-tab-count {
  min-width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 9px;
}

.ae-sidebar-view {
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  overflow: hidden;
}

.ae-sidebar-view[hidden] {
  display: none !important;
}

#layers-sidebar {
  grid-template-rows: auto minmax(0, 1fr);
}

.ae-sidebar-heading,
.ae-panel-heading {
  padding: 15px 16px 11px;
}

.ae-sidebar-heading > div,
.ae-panel-heading > div {
  display: grid;
  gap: 4px;
}

.ae-sidebar-heading strong,
.ae-panel-heading strong,
.ae-stage-toolbar strong {
  color: #eaf0fb;
  font-size: 11px;
  font-weight: 800;
}

.ae-sidebar-heading span,
.ae-panel-heading span,
.ae-stage-toolbar span {
  color: var(--ae-muted-2);
  font-size: 9px;
}

.ae-effect-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 118px;
  gap: 8px;
  padding: 0 12px 12px;
}

.ae-search-wrap {
  min-width: 0;
  height: 36px;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border: 1px solid var(--ae-line);
  border-radius: 10px;
  background: #0a0e16;
  color: #64738a;
}

.ae-search-wrap:focus-within {
  border-color: var(--ae-accent-line);
  box-shadow: 0 0 0 3px rgba(124, 92, 255, 0.08);
}

.ae-search-wrap input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #eef3ff;
  font: inherit;
  font-size: 10px;
}

.ae-search-wrap input::placeholder {
  color: #58677c;
}

.ae-category-select {
  min-width: 0;
  height: 36px;
  padding: 0 8px;
  border: 1px solid var(--ae-line);
  border-radius: 10px;
  background: #111722;
  color: #c4cede;
  font-size: 9px;
}

.ae-effect-library {
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 7px;
  padding: 0 12px 14px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.ae-effect-card {
  width: 100%;
  min-height: 58px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 9px 10px 9px 12px;
  border: 1px solid var(--ae-line);
  border-radius: 11px;
  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.028),
      rgba(255, 255, 255, 0.01)
    );
  text-align: left;
}

.ae-effect-card:hover {
  border-color: rgba(124, 92, 255, 0.42);
  background:
    linear-gradient(
      145deg,
      rgba(124, 92, 255, 0.12),
      rgba(255, 255, 255, 0.02)
    );
  transform: translateY(-1px);
}

.ae-effect-card-main {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.ae-effect-card-main strong {
  overflow: hidden;
  color: #edf2fc;
  font-size: 10px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ae-effect-card-main small {
  color: #67768d;
  font-size: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ae-effect-card-meta {
  display: flex;
  align-items: center;
  gap: 9px;
}

.ae-performance-dots {
  color: #59677b;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 7px;
  letter-spacing: 1px;
}

.ae-add-icon {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(124, 92, 255, 0.34);
  border-radius: 8px;
  background: rgba(124, 92, 255, 0.12);
  color: #b9aaff;
  font-size: 15px;
  line-height: 1;
}

.ae-layer-list {
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 7px;
  padding: 0 12px 14px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.ae-layer-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--ae-line);
  border-radius: 11px;
  background: #101621;
}

.ae-layer-row.is-selected {
  border-color: var(--ae-accent-line);
  background:
    linear-gradient(
      135deg,
      rgba(124, 92, 255, 0.15),
      rgba(0, 217, 255, 0.025)
    );
}

.ae-layer-row.is-disabled {
  opacity: 0.48;
}

.ae-layer-select {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  padding: 5px 6px;
  border: 0;
  background: transparent;
  text-align: left;
}

.ae-layer-select:hover {
  background: rgba(255, 255, 255, 0.025);
}

.ae-layer-color-dot {
  width: 7px;
  height: 30px;
  border-radius: 999px;
  background:
    linear-gradient(
      180deg,
      #8467ff,
      #35bce8
    );
}

.ae-layer-copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.ae-layer-copy strong {
  overflow: hidden;
  color: #e9eef8;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ae-layer-copy small {
  color: #637188;
  font-size: 8px;
}

.ae-layer-actions {
  display: grid;
  grid-template-columns: repeat(2, 28px);
  gap: 4px;
}

.ae-icon-button {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  padding: 0;
  border-radius: 8px;
  background: #171e2b;
  color: #a9b5c7;
  font-size: 10px;
}

.ae-icon-button:hover {
  background: #202a3b;
  color: white;
}

.ae-icon-danger:hover {
  border-color: rgba(255, 102, 122, 0.35);
  background: rgba(255, 102, 122, 0.1);
  color: #ff8091;
}

.ae-empty-state {
  padding: 28px 16px;
  border: 1px dashed rgba(255, 255, 255, 0.09);
  border-radius: 12px;
  color: #64738a;
  font-size: 10px;
  line-height: 1.6;
  text-align: center;
}

.ae-stage-panel {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: 48px minmax(0, 1fr);
  overflow: hidden;
  background:
    radial-gradient(
      circle at 50% 42%,
      rgba(43, 57, 96, 0.11),
      transparent 40%
    ),
    #080b12;
}

.ae-stage-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(8, 11, 18, 0.72);
}

.ae-stage-toolbar > div:first-child {
  display: flex;
  align-items: baseline;
  gap: 9px;
}

.ae-stage-hint {
  padding: 5px 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 7px;
  color: #5d6a7e;
  font-size: 8px;
}

.ae-preview-shell {
  min-height: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 24px 28px;
}

#preview-host {
  width: min(1280px, 100%);
  max-height: 100%;
  aspect-ratio: 16 / 9;
}

.effect-preview {
  border-radius: 14px;
  border-color: rgba(255, 255, 255, 0.085);
  box-shadow:
    0 26px 80px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(255, 255, 255, 0.015);
}

.ae-inspector-panel {
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border-left: 1px solid var(--ae-line);
  overflow: hidden;
}

.ae-panel-heading {
  border-bottom: 1px solid var(--ae-line);
  padding-bottom: 14px;
}

.ae-inspector-content {
  min-height: 0;
  padding: 15px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.ae-inspector-content .inspector-title {
  margin-bottom: 16px;
}

.ae-inspector-content .inspector-field {
  margin-bottom: 14px;
}

.export-dialog {
  width: min(1040px, 92vw);
  max-height: 88vh;
  border-radius: 18px;
  box-shadow: 0 28px 100px rgba(0, 0, 0, 0.58);
}

.export-dialog::backdrop {
  background: rgba(2, 4, 8, 0.78);
  backdrop-filter: blur(4px);
}

@media (max-width: 1250px) {
  .ae-editor-grid {
    grid-template-columns:
      285px
      minmax(0, 1fr)
      300px;
  }

  .ae-effect-filters {
    grid-template-columns: 1fr;
  }

  .ae-header-status {
    display: none;
  }

  .ae-app-header {
    grid-template-columns: auto 1fr;
  }

  .ae-header-actions {
    justify-self: end;
  }
}

@media (max-width: 960px) {
  .ae-editor-grid {
    grid-template-columns:
      250px
      minmax(0, 1fr);
  }

  .ae-inspector-panel {
    display: none;
  }
}

/* === AE_EDITOR_UI_V2_END === */

'@

$currentStyle =
  [System.IO.File]::ReadAllText($stylePath)

$startMarker =
  "/* === AE_EDITOR_UI_V2_START === */"

$endMarker =
  "/* === AE_EDITOR_UI_V2_END === */"

$start =
  $currentStyle.IndexOf($startMarker)

$end =
  $currentStyle.IndexOf($endMarker)

if (
  $start -ge 0 -and
  $end -gt $start
) {
  $end += $endMarker.Length

  $before =
    $currentStyle
      .Substring(0, $start)
      .TrimEnd()

  $after =
    $currentStyle
      .Substring($end)
      .TrimStart()

  $newStyle =
    $before +
    "`r`n`r`n" +
    $uiCss.Trim() +
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
    $uiCss.Trim() +
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
  Write-Host "Editor UI v2 zainstalowany." -ForegroundColor Green
  Write-Host "Najwazniejsze zmiany:"
  Write-Host "  - osobna biblioteka efektow"
  Write-Host "  - wyszukiwarka efektow"
  Write-Host "  - filtrowanie kategoriami"
  Write-Host "  - zakladki Efekty / Warstwy"
  Write-Host "  - czytelniejsza lista warstw"
  Write-Host "  - status aktywnych warstw"
  Write-Host "  - uporzadkowany naglowek i preview"
  Write-Host "  - Inspector pozostaje po prawej"
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
