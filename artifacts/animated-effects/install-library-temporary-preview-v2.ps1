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

$currentMain = [System.IO.File]::ReadAllText($mainPath)

if (
  !$currentMain.Contains("ae-app-shell") -or
  !$currentMain.Contains("ae-effect-card") -or
  !$currentMain.Contains("getEffectVariants")
) {
  throw "Nie rozpoznaje aktualnego UI Animated Effects. Nie nadpisuje plikow."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot ".animated-effects-backup\$stamp"
$mainBackup = Join-Path $backupRoot "src\main.ts"
$styleBackup = Join-Path $backupRoot "src\style.css"

$mainBackupDir = Split-Path $mainBackup -Parent
$styleBackupDir = Split-Path $styleBackup -Parent

New-Item -ItemType Directory -Force -Path $mainBackupDir | Out-Null
New-Item -ItemType Directory -Force -Path $styleBackupDir | Out-Null

Copy-Item $mainPath $mainBackup -Force
Copy-Item $stylePath $styleBackup -Force

Write-Host ""
Write-Host "Animated Effects - Library Temporary Preview" -ForegroundColor Cyan
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

import {
  getEffectVariants,
} from "./effects/variants";

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

          <div class="ae-library-usage-hint">
            <span>
              Kliknij kafelek = podgl\u0105d tymczasowy
            </span>

            <span>
              <strong>+</strong> = dodaj na sta\u0142e
            </span>
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

          <div class="ae-stage-hint" title="Proporcje podgl\u0105du">
            16:9
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
  A library-card click previews one effect temporarily.
  It is intentionally kept outside editor state, so it:
  - does not create a real layer,
  - is not exported,
  - disappears when the card is deselected / user clicks away,
  - becomes permanent only through the + button.
*/
let temporaryPreviewEffect:
  EffectInstance | null = null;

function createTemporaryPreviewEffect(
  effectId: string,
): EffectInstance | null {
  const definition =
    getEffectDefinition(
      effectId,
    );

  if (!definition) {
    return null;
  }

  return {
    instanceId:
      `preview-${crypto.randomUUID()}`,
    effectId:
      definition.id,
    seed:
      Math.floor(
        Math.random() *
        0xffffffff,
      ),
    enabled: true,
    settings: {
      ...definition.defaultSettings,
    },
  };
}

function clearTemporaryPreview(): void {
  if (!temporaryPreviewEffect) {
    return;
  }

  temporaryPreviewEffect = null;

  renderEffectLibrary();
  renderPreview();
}

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
      const card =
        document.createElement(
          "div",
        );

      card.className =
        "ae-effect-card";

      card.dataset.category =
        definition.category;

      const isPreviewing =
        temporaryPreviewEffect
          ?.effectId ===
        definition.id;

      card.classList.toggle(
        "is-previewing",
        isPreviewing,
      );

      card.title =
        definition.description;

      const performanceLabel =
        `Koszt wydajno\u015Bci: ${definition.performanceCost}/5`;

      const variantCount =
        getEffectVariants(
          definition.id,
        ).length;

      const performanceDots =
        Array.from(
          { length: 5 },
          (_, index) => `
            <i class="${
              index < definition.performanceCost
                ? "is-filled"
                : ""
            }"></i>
          `,
        ).join("");

      card.innerHTML = `
        <button
          class="ae-effect-card-preview"
          type="button"
          aria-pressed="${String(
            isPreviewing,
          )}"
          aria-label="${
            isPreviewing
              ? `Wy\u0142\u0105cz tymczasowy podgl\u0105d ${definition.name}`
              : `Podejrzyj tymczasowo ${definition.name}`
          }"
        >
          <span class="ae-effect-card-main">
            <strong>${definition.name}</strong>

            <span class="ae-effect-card-subline">
              <small>
                ${categoryLabel(
                  definition.category,
                )}
              </small>

              <span
                class="ae-performance-dots"
                title="${performanceLabel}"
                aria-label="${performanceLabel}"
              >
                ${performanceDots}
              </span>

              ${
                variantCount > 0
                  ? `
                    <span
                      class="ae-variant-badge"
                      title="${variantCount} warianty efektu"
                    >
                      ${variantCount}V
                    </span>
                  `
                  : ""
              }
            </span>
          </span>
        </button>

        <button
          class="ae-add-icon"
          type="button"
          aria-label="Dodaj ${definition.name} jako sta\u0142\u0105 warstw\u0119"
          title="Dodaj jako sta\u0142\u0105 warstw\u0119"
        >
          +
        </button>
      `;

      card
        .querySelector<HTMLButtonElement>(
          ".ae-effect-card-preview",
        )
        ?.addEventListener(
          "click",
          () => {
            const sameEffect =
              temporaryPreviewEffect
                ?.effectId ===
              definition.id;

            temporaryPreviewEffect =
              sameEffect
                ? null
                : createTemporaryPreviewEffect(
                    definition.id,
                  );

            renderEffectLibrary();
            renderPreview();
          },
        );

      card
        .querySelector<HTMLButtonElement>(
          ".ae-add-icon",
        )
        ?.addEventListener(
          "click",
          () => {
            temporaryPreviewEffect =
              null;

            renderEffectLibrary();

            addEffect(
              definition.id,
            );
          },
        );

      effectLibrary.appendChild(
        card,
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

  if (
    temporaryPreviewEffect
  ) {
    renderEffect(
      preview,
      temporaryPreviewEffect,
    );
  }
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

document.addEventListener(
  "pointerdown",
  (event) => {
    if (!temporaryPreviewEffect) {
      return;
    }

    const target =
      event.target;

    if (
      !(target instanceof Element)
    ) {
      return;
    }

    if (
      target.closest(
        ".ae-effect-card",
      )
    ) {
      return;
    }

    clearTemporaryPreview();
  },
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      temporaryPreviewEffect
    ) {
      clearTemporaryPreview();
    }
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
    () => {
      temporaryPreviewEffect =
        null;

      renderEffectLibrary();
      clearEffects();
    },
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

$uiPatch = @'
/* === AE_LIBRARY_TEMP_PREVIEW_START === */

/*
  Effect library interaction:
  - card body = temporary preview only
  - + button = permanent layer
  - clicking the same card again, clicking elsewhere, or Escape clears preview
*/

.ae-library-usage-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  margin:
    0
    10px
    9px;

  padding:
    7px
    9px;

  border:
    1px solid
    rgba(87, 199, 255, 0.16);

  border-radius: 8px;

  background:
    rgba(87, 199, 255, 0.035);

  color: #9fb0c6;

  font-size: 10px;
  line-height: 1.35;
}

.ae-library-usage-hint strong {
  color: #d8e7ff;
  font-size: 13px;
}

.ae-effect-card {
  cursor: default;
}

.ae-effect-card-preview {
  min-width: 0;
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;

  margin: 0;
  padding: 0;

  border: 0;

  background: transparent;
  color: inherit;

  font: inherit;

  text-align: left;

  cursor: pointer;

  appearance: none;
  -webkit-appearance: none;
}

.ae-effect-card-preview:focus-visible {
  outline:
    3px solid
    #57c7ff;

  outline-offset: 3px;

  border-radius: 7px;
}

.ae-add-icon {
  font-family: inherit;
  cursor: pointer;
}

/*
  Temporary preview state is visually different from a permanent layer.
  Dashed border communicates "audition / not committed".
*/
.ae-effect-card.is-previewing {
  border-style: dashed;
  border-width: 2px;
  border-color:
    rgba(87, 199, 255, 0.9);

  background:
    linear-gradient(
      90deg,
      rgba(87, 199, 255, 0.16),
      rgba(168, 140, 255, 0.06) 48%,
      rgba(21, 29, 42, 0.98)
    );

  box-shadow:
    inset 4px 0 0
    #57c7ff,
    0 0 0 1px
    rgba(87, 199, 255, 0.08);
}

.ae-effect-card.is-previewing
  .ae-effect-card-main strong {
  color: #ffffff;
}

.ae-effect-card.is-previewing
  .ae-add-icon {
  border-color:
    rgba(168, 140, 255, 0.48);

  background:
    rgba(168, 140, 255, 0.12);

  color: #dcd4ff;
}

@media (max-width: 1260px) {
  .ae-library-usage-hint {
    align-items: flex-start;
    flex-direction: column;
  }
}

/* === AE_LIBRARY_TEMP_PREVIEW_END === */
'@

$currentStyle = [System.IO.File]::ReadAllText($stylePath)

$startMarker = "/* === AE_LIBRARY_TEMP_PREVIEW_START === */"
$endMarker = "/* === AE_LIBRARY_TEMP_PREVIEW_END === */"

$start = $currentStyle.IndexOf($startMarker)
$end = $currentStyle.IndexOf($endMarker)

if ($start -ge 0 -and $end -gt $start) {
  $end += $endMarker.Length

  $before = ($currentStyle.Substring(0, $start)).TrimEnd()
  $after = ($currentStyle.Substring($end)).TrimStart()

  $newStyle =
    $before +
    "`r`n`r`n" +
    $uiPatch.Trim() +
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
    $uiPatch.Trim() +
    "`r`n"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

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
  Write-Host "Temporary Preview zainstalowany." -ForegroundColor Green
  Write-Host "Zasady:"
  Write-Host "  - klik kafelka = podglad tymczasowy"
  Write-Host "  - klik tego samego kafelka ponownie = usun podglad"
  Write-Host "  - klik poza kafelkiem = usun podglad"
  Write-Host "  - Escape = usun podglad"
  Write-Host "  - + = dodaj efekt na stale jako warstwe"
  Write-Host "  - podglad tymczasowy nie trafia do warstw i eksportu"
  Write-Host ""
  Write-Host "Odswiez aktywny localhost z Vite."
}
catch {
  Write-Host ""
  Write-Host "Walidacja nie przeszla. Przywracam backup..." -ForegroundColor Red

  Copy-Item $mainBackup $mainPath -Force
  Copy-Item $styleBackup $stylePath -Force

  Write-Host "Przywrocono poprzednie pliki." -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
