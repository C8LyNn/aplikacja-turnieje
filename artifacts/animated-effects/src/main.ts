import "./style.css";

import {
  installPack08UiQa,
} from "./pack08/uiQa";
import {
  installPack09Customization,
} from "./pack09/customization";

import {
  installPack09UiPolish,
} from "./pack09/uiPolish";

import {
  applyPack09UiPolishStable,
  installPack09UiPolishStable,
} from "./pack09/uiPolishStable";

import {
  installPack06,
} from "./pack06/install";

import {
  installPack06Polish02,
} from "./pack06/polish02";

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
        <div class="ae-brand-mark">OBS</div>

        <div class="ae-brand-copy">
          <span class="ae-dev-context">OBS / STREAM</span>
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
        <a href="../../stream" class="ae-button ae-button-secondary ae-back-link">← OBS / Stream</a>
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

    <section class="export-profile-config" aria-label="Zapisane konfiguracje StreamElements">
      <div class="export-profile-heading">
        <strong>Zestawy animacji i zdarzeń</strong>
        <span>Nowe · lokalne · przenośne</span>
      </div>
      <p>Zapisz całą scenę, przypisane warstwy i reguły StreamElements. Wczytanie wymaga potwierdzenia.</p>
      <div class="export-profile-actions">
        <label class="export-profile-name">Nazwa zestawu
          <input type="text" data-profile-name value="Mój zestaw" maxlength="64" autocomplete="off" />
        </label>
        <button type="button" data-profile-save>Zapisz aktualny</button>
      </div>
      <div class="export-profile-actions">
        <label class="export-profile-select-label">Zapisane zestawy
          <select data-profile-select><option value="">Wybierz zapisany zestaw</option></select>
        </label>
        <button type="button" data-profile-load disabled>Wczytaj</button>
        <button type="button" data-profile-export disabled>Pobierz JSON</button>
        <button type="button" data-profile-delete disabled>Usuń</button>
      </div>
      <div class="export-profile-actions">
        <button type="button" data-profile-import>Importuj JSON</button>
        <input type="file" data-profile-file accept=".json,application/json" hidden />
        <span class="export-profile-help">Pliki działają także w innej przeglądarce lub na drugim komputerze.</span>
      </div>
      <p class="export-profile-status" data-profile-status role="status" aria-live="polite"></p>
    </section>

    <section class="export-trigger-config" data-single-trigger aria-label="Aktywacja efektów">
      <strong>Uruchamianie animacji</strong>
      <p>Wybierz, kiedy StreamElements ma uruchomić tę scenę. Tryb ciągły zachowuje poprzednie działanie.</p>
      <div class="export-trigger-fields">
        <label>
          Zdarzenie
          <select data-trigger-mode>
            <option value="always">Zawsze aktywna</option>
            <option value="chat-command">Komenda na czacie</option>
            <option value="follower">Nowy obserwujący</option>
            <option value="subscriber">Subskrypcja</option>
            <option value="tip">Donacja</option>
            <option value="cheer">Cheer / Bits</option>
            <option value="raid">Raid</option>
          </select>
        </label>
        <label data-trigger-command-field hidden>
          Komenda (dostępna każdemu widzowi)
          <input type="text" data-trigger-command value="!hype" maxlength="25" spellcheck="false" autocomplete="off" />
        </label>
        <label data-trigger-timing hidden>
          Czas wyświetlania (s)
          <input type="number" data-trigger-duration value="5" min="0.5" max="60" step="0.5" />
        </label>
        <label data-trigger-timing hidden>
          Przerwa między aktywacjami (s)
          <input type="number" data-trigger-cooldown value="10" min="0" max="300" step="1" />
        </label>
      </div>
      <p class="export-trigger-note" data-trigger-info>Efekty startują po załadowaniu widgetu i pozostają aktywne.</p>
    </section>

    <section class="export-route-config" aria-label="Wiele reguł animacji">
      <label class="export-route-toggle">
        <input type="checkbox" data-multi-routes />
        <span><strong>Wiele zdarzeń w jednym widżecie</strong><small>Przypisz różne efekty do komend i alertów bez instalowania kolejnych widgetów.</small></span>
      </label>
      <div data-route-workspace hidden>
        <p class="export-route-description">Reguły są sprawdzane w kolejności od góry. Każda ma własny cooldown; najnowsza aktywowana scena zastępuje poprzednią.</p>
        <div data-route-list class="export-route-list"></div>
        <button type="button" data-add-route>+ Dodaj regułę</button>
        <p class="export-route-note" data-route-warning role="status"></p>
      </div>
    </section>

    <section class="export-simulator-config" aria-label="Symulator StreamElements">
      <div class="export-simulator-heading">
        <strong>Symulator StreamElements</strong>
        <span>Ten sam kod co w eksporcie</span>
      </div>
      <p>Sprawdź działanie wybranej reguły, cooldownu i warstw bez podłączania konta. Podgląd pracuje w odizolowanej ramce — nie zapisuje zmian w scenie.</p>
      <div class="export-simulator-toolbar">
        <label>Zdarzenie do zasymulowania
          <select data-simulator-event aria-label="Zdarzenie testowe"></select>
        </label>
        <button type="button" data-simulator-fire disabled>▶ Symuluj zdarzenie</button>
        <button type="button" data-simulator-reset disabled>↻ Resetuj podgląd</button>
      </div>
      <div class="export-simulator-stage" data-simulator-frame aria-label="Podgląd animacji 16:9"></div>
      <p class="export-simulator-status" data-simulator-status role="status" aria-live="polite">Podgląd uruchomi się po otwarciu eksportu.</p>
    </section>

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

  syncTemporaryPreviewUi();
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

/* AE_LIBRARY_INTERACTION_PACK_22 */

type EffectLibraryVisualAnchor = {
  effectId: string;
  topOffset: number;
  scrollTop: number;
};

function captureEffectLibraryVisualAnchor():
  EffectLibraryVisualAnchor | null {
  const libraryRect =
    effectLibrary.getBoundingClientRect();

  const cards =
    Array.from(
      effectLibrary.querySelectorAll<HTMLElement>(
        ":scope > .ae-effect-card[data-effect-id]",
      ),
    ).filter(
      (card) =>
        !card.hidden &&
        getComputedStyle(card).display !== "none",
    );

  const anchor =
    cards.find(
      (card) =>
        card.getBoundingClientRect().bottom >
        libraryRect.top + 1,
    );

  if (!anchor) {
    return null;
  }

  const effectId =
    anchor.dataset.effectId;

  if (!effectId) {
    return null;
  }

  return {
    effectId,
    topOffset:
      anchor.getBoundingClientRect().top -
      libraryRect.top,
    scrollTop:
      effectLibrary.scrollTop,
  };
}

function restoreEffectLibraryVisualAnchor(
  anchor: EffectLibraryVisualAnchor | null,
): void {
  if (!anchor) {
    return;
  }

  const libraryRect =
    effectLibrary.getBoundingClientRect();

  const card =
    Array.from(
      effectLibrary.querySelectorAll<HTMLElement>(
        ":scope > .ae-effect-card[data-effect-id]",
      ),
    ).find(
      (candidate) =>
        candidate.dataset.effectId ===
        anchor.effectId,
    );

  if (!card) {
    effectLibrary.scrollTop =
      anchor.scrollTop;
    return;
  }

  const currentOffset =
    card.getBoundingClientRect().top -
    libraryRect.top;

  const delta =
    currentOffset -
    anchor.topOffset;

  if (
    Number.isFinite(delta) &&
    Math.abs(delta) > 0.25
  ) {
    effectLibrary.scrollTop +=
      delta;
  }
}

function scheduleEffectLibraryVisualAnchorRestore(
  anchor: EffectLibraryVisualAnchor | null,
): void {
  if (!anchor) {
    return;
  }

  /*
    Pack06 decoration runs in a microtask and cosmetic polish may run
    on the following animation frame. Restore after both have settled.
  */
  requestAnimationFrame(
    () => {
      requestAnimationFrame(
        () => {
          restoreEffectLibraryVisualAnchor(
            anchor,
          );
        },
      );
    },
  );
}

function syncTemporaryPreviewUi(): void {
  Array.from(
    effectLibrary.querySelectorAll<HTMLElement>(
      ":scope > .ae-effect-card[data-effect-id]",
    ),
  ).forEach(
    (card) => {
      const effectId =
        card.dataset.effectId;

      if (!effectId) {
        return;
      }

      const isPreviewing =
        temporaryPreviewEffect
          ?.effectId ===
        effectId;

      card.classList.toggle(
        "is-previewing",
        isPreviewing,
      );

      const button =
        card.querySelector<HTMLButtonElement>(
          ".ae-effect-card-preview",
        );

      if (!button) {
        return;
      }

      button.setAttribute(
        "aria-pressed",
        String(isPreviewing),
      );

      const definition =
        getEffectDefinition(
          effectId,
        );

      if (definition) {
        button.setAttribute(
          "aria-label",
          isPreviewing
            ? `Wyłącz tymczasowy podgląd ${definition.name}`
            : `Podejrzyj tymczasowo ${definition.name}`,
        );
      }
    },
  );
}

function renderEffectLibrary(): void {
  const visualAnchor =
    captureEffectLibraryVisualAnchor();

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
          definition.category,
          ...definition.tags,
          ...getEffectVariants(
            definition.id,
          ).map(
            (variant) =>
              variant.name,
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

      card.dataset.effectId =
        definition.id;

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

            syncTemporaryPreviewUi();
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

            syncTemporaryPreviewUi();

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
  scheduleEffectLibraryVisualAnchorRestore(
    visualAnchor,
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
  syncTemporaryPreviewUi();
  renderPreview();
  renderLayers();
  renderStatus();

  if (!isInspectorRangeDragging) {
    renderInspector(
      inspector,
    );

    applyPack09UiPolishStable();
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

installPack06();
/* AE_STABLE_UI_POLISH_PACK_20 */
installPack09UiPolishStable();

/* AE_DIAGNOSTIC_ISOLATION_PACK_18
   Temporary diagnostic isolation:
   keep imports referenced, but disable DOM-polish/customization modules
   that can observe or rewrite the editor DOM.
*/
const AE_DIAGNOSTIC_ENABLE_PACK06_POLISH02 = true;
const AE_DIAGNOSTIC_ENABLE_PACK08_UI_QA = true;
const AE_DIAGNOSTIC_ENABLE_PACK09_CUSTOMIZATION = true;
const AE_DIAGNOSTIC_ENABLE_PACK09_UI_POLISH = false;

if (AE_DIAGNOSTIC_ENABLE_PACK06_POLISH02) {
  installPack06Polish02();
}

if (AE_DIAGNOSTIC_ENABLE_PACK08_UI_QA) {
  installPack08UiQa();
}

if (AE_DIAGNOSTIC_ENABLE_PACK09_CUSTOMIZATION) {
  installPack09Customization();
}

if (AE_DIAGNOSTIC_ENABLE_PACK09_UI_POLISH) {
  installPack09UiPolish();
}

console.warn(
  "[AE diagnostic] Pack 18 isolation active: " +
  "Pack06Polish02, Pack08UiQa, Pack09Customization and Pack09UiPolish are disabled.",
);
