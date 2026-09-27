let queued = false;
let restoreScroll: number | null = null;

function compactHeader(): void {
  const group =
    document.querySelector<HTMLElement>(
      ".ae-pack06-header-group",
    );

  if (
    !group ||
    document.querySelector(
      ".ae-polish02-header",
    )
  ) {
    return;
  }

  const get = (
    selector: string,
  ): HTMLElement | null =>
    group.querySelector<HTMLElement>(
      selector,
    );

  const undo = get("#pack06-undo");
  const redo = get("#pack06-redo");
  const pause = get("#pack06-pause");
  const preset = get("#pack06-preset");
  const save = get("#pack06-save");
  const load = get("#pack06-load");
  const recover = get("#pack06-recover");
  const reroll = get("#pack06-reroll-all");
  const media = get("#pack06-media");

  if (
    !undo || !redo || !pause ||
    !preset || !save || !load ||
    !recover || !reroll || !media
  ) {
    return;
  }

  recover.textContent =
    "Przywróć autozapis";

  const shell =
    document.createElement("div");
  shell.className =
    "ae-polish02-header";

  const direct =
    document.createElement("div");
  direct.className =
    "ae-polish02-direct";
  direct.append(
    undo,
    redo,
    pause,
  );

  const makeMenu = (
    title: string,
    nodes: HTMLElement[],
  ): HTMLDetailsElement => {
    const details =
      document.createElement("details");
    details.className =
      "ae-polish02-menu";

    const summary =
      document.createElement("summary");
    summary.innerHTML =
      `${title} <span>▾</span>`;

    const panel =
      document.createElement("div");
    panel.className =
      "ae-polish02-menu-panel";
    panel.append(...nodes);

    details.append(
      summary,
      panel,
    );

    return details;
  };

  shell.append(
    direct,
    makeMenu(
      "Scena",
      [
        preset,
        save,
        load,
        recover,
      ],
    ),
    makeMenu(
      "Narzędzia",
      [
        reroll,
        media,
      ],
    ),
  );

  group.replaceWith(shell);
}

function polishFilters(): void {
  const mode =
    document.querySelector<HTMLSelectElement>(
      "#pack06-library-mode",
    );

  const sort =
    document.querySelector<HTMLSelectElement>(
      "#pack06-library-sort",
    );

  const modeLabels = [
    "Widok: Wszystkie",
    "Widok: ★ Ulubione",
    "Widok: ● Na scenie",
  ];

  const sortLabels = [
    "Sortuj: Nazwa",
    "Sortuj: Kategoria",
    "Sortuj: Najczęściej używane",
    "Sortuj: Ostatnio używane",
    "Sortuj: Najlżejsze",
    "Sortuj: Najcięższe",
  ];

  if (mode) {
    Array.from(
      mode.options,
    ).forEach(
      (option, index) => {
        option.textContent =
          modeLabels[index] ??
          option.textContent;
      },
    );
  }

  if (sort) {
    Array.from(
      sort.options,
    ).forEach(
      (option, index) => {
        option.textContent =
          sortLabels[index] ??
          option.textContent;
      },
    );
  }
}

function polishCards(): void {
  const library =
    document.querySelector<HTMLElement>(
      "#effect-library",
    );

  if (!library) {
    return;
  }

  library
    .querySelectorAll(
      ".ae-pack06-scene-badge",
    )
    .forEach(
      (badge) => badge.remove(),
    );

  Array.from(
    library.querySelectorAll<HTMLElement>(
      ".ae-effect-card",
    ),
  ).forEach(
    (card) => {
      card.classList.add(
        "ae-polish02-card",
      );

      const count =
        card.querySelector<HTMLElement>(
          ".ae-pack06-count",
        );

      if (count) {
        const numeric =
          count.textContent
            ?.replace(
              /[^0-9]/g,
              "",
            ) || "1";

        count.textContent =
          numeric;

        count.title =
          `${numeric} warstw(y) · przejdź do Warstw`;
      }

      const favorite =
        card.querySelector<HTMLElement>(
          ".ae-pack06-favorite",
        );

      if (favorite) {
        favorite.title =
          favorite.textContent === "★"
            ? "Usuń z ulubionych"
            : "Dodaj do ulubionych";
      }
    },
  );

  if (
    restoreScroll !== null
  ) {
    const value =
      restoreScroll;

    restoreScroll = null;

    requestAnimationFrame(
      () => {
        const current =
          document.querySelector<HTMLElement>(
            "#effect-library",
          );

        if (current) {
          current.scrollTop =
            value;
        }
      },
    );
  }
}

function polishInspector(): void {
  const panel =
    document.querySelector<HTMLElement>(
      ".ae-inspector-panel",
    );

  if (!panel) {
    return;
  }

  panel.classList.add(
    "ae-polish02-inspector",
  );

  const title =
    panel.querySelector<HTMLElement>(
      ".ae-pack06-inspector-title strong",
    );

  if (title) {
    title.textContent =
      "Losowość";
  }
}

function updateMediaSummary(
  dialog: HTMLDialogElement,
): void {
  const n = (
    selector: string,
    fallback: number,
  ): number => {
    const value =
      Number(
        dialog
          .querySelector<HTMLInputElement>(
            selector,
          )
          ?.value ??
        fallback,
      );

    return Number.isFinite(value)
      ? value
      : fallback;
  };

  const width =
    n(
      "[data-media-width]",
      1280,
    );
  const height =
    n(
      "[data-media-height]",
      720,
    );
  const seconds =
    n(
      "[data-gif-seconds]",
      5,
    );
  const fps =
    n(
      "[data-gif-fps]",
      15,
    );
  const frames =
    Math.max(
      1,
      Math.round(
        seconds * fps,
      ),
    );

  const work =
    width *
    height *
    frames;

  const level =
    work > 300_000_000
      ? "WYSOKIE"
      : work > 120_000_000
        ? "ŚREDNIE"
        : "NISKIE";

  const summary =
    dialog.querySelector<HTMLElement>(
      "[data-polish02-summary]",
    );

  if (summary) {
    summary.innerHTML = `
      <strong>${frames} klatek</strong>
      <span>${width} × ${height} · ${fps} FPS · obciążenie: ${level}</span>
    `;
  }

  const background =
    dialog.querySelector<HTMLSelectElement>(
      "[data-media-background]",
    );

  const color =
    dialog.querySelector<HTMLInputElement>(
      "[data-media-color]",
    );

  if (
    background &&
    color
  ) {
    color.disabled =
      background.value !==
      "custom";
  }
}

function polishMedia(): void {
  const dialog =
    document.querySelector<HTMLDialogElement>(
      ".ae-media-dialog",
    );

  if (
    !dialog ||
    dialog.dataset
      .polish02 ===
      "1"
  ) {
    return;
  }

  dialog.dataset.polish02 =
    "1";

  const root =
    dialog.querySelector<HTMLElement>(
      ".ae-media-export",
    );

  if (!root) {
    return;
  }

  const firstGrid =
    root.querySelector<HTMLElement>(
      ":scope > .ae-media-grid",
    );

  if (firstGrid) {
    const card =
      document.createElement("section");
    card.className =
      "ae-polish02-output";

    const heading =
      document.createElement("div");
    heading.className =
      "ae-polish02-card-heading";
    heading.innerHTML = `
      <strong>Ustawienia wyjścia</strong>
      <span>Rozdzielczość i tło eksportowanej sceny</span>
    `;

    const presets =
      document.createElement("div");
    presets.className =
      "ae-polish02-presets";

    const values = [
      ["720p", 1280, 720],
      ["1080p", 1920, 1080],
      ["1:1", 1080, 1080],
      ["9:16", 1080, 1920],
    ] as const;

    values.forEach(
      ([label, width, height]) => {
        const button =
          document.createElement("button");

        button.type = "button";
        button.textContent =
          label;

        button.addEventListener(
          "click",
          () => {
            const w =
              dialog.querySelector<HTMLInputElement>(
                "[data-media-width]",
              );
            const h =
              dialog.querySelector<HTMLInputElement>(
                "[data-media-height]",
              );

            if (w) {
              w.value =
                String(width);
            }

            if (h) {
              h.value =
                String(height);
            }

            updateMediaSummary(
              dialog,
            );
          },
        );

        presets.appendChild(
          button,
        );
      },
    );

    card.append(
      heading,
      presets,
      firstGrid,
    );

    root.prepend(card);
  }

  const sections =
    Array.from(
      root.querySelectorAll<HTMLElement>(
        ".ae-media-section",
      ),
    );

  sections.forEach(
    (section) => {
      section.classList.add(
        "ae-polish02-media-card",
      );

      const h3 =
        section.querySelector(
          "h3",
        );

      if (
        h3 &&
        !section.querySelector(
          ".ae-polish02-description",
        )
      ) {
        const p =
          document.createElement("p");
        p.className =
          "ae-polish02-description";
        p.textContent =
          h3.textContent === "PNG"
            ? "Pojedyncza klatka sceny w wybranym momencie animacji."
            : "Animowana pętla. Więcej klatek oznacza dłuższe generowanie i większy plik.";

        h3.insertAdjacentElement(
          "afterend",
          p,
        );
      }
    },
  );

  const gif =
    sections.find(
      (section) =>
        section
          .querySelector("h3")
          ?.textContent ===
        "GIF",
    );

  if (
    gif &&
    !gif.querySelector(
      "[data-polish02-summary]",
    )
  ) {
    const summary =
      document.createElement("div");
    summary.className =
      "ae-polish02-summary";
    summary.dataset
      .polish02Summary =
      "1";

    gif
      .querySelector(
        ".ae-media-actions",
      )
      ?.insertAdjacentElement(
        "beforebegin",
        summary,
      );
  }

  const cancel =
    dialog.querySelector<HTMLButtonElement>(
      "[data-cancel-gif]",
    );

  if (cancel) {
    cancel.hidden = true;
  }

  dialog
    .querySelector(
      "[data-generate-gif]",
    )
    ?.addEventListener(
      "click",
      () => {
        if (cancel) {
          cancel.hidden = false;
        }

        const preview =
          dialog.querySelector<HTMLImageElement>(
            "[data-gif-preview]",
          );

        if (preview) {
          preview.hidden = true;
        }
      },
    );

  dialog.addEventListener(
    "input",
    () => {
      updateMediaSummary(
        dialog,
      );
    },
  );

  dialog.addEventListener(
    "change",
    () => {
      updateMediaSummary(
        dialog,
      );
    },
  );

  updateMediaSummary(
    dialog,
  );
}

function apply(): void {
  compactHeader();
  polishFilters();
  polishCards();
  polishInspector();
  polishMedia();
}

export function installPack06Polish02():
  void {
  document
    .querySelector<HTMLElement>(
      "#effect-library",
    )
    ?.addEventListener(
      "click",
      (event) => {
        const target =
          event.target;

        if (
          target instanceof
            Element &&
          target.closest(
            ".ae-add-icon, .ae-pack06-minus",
          )
        ) {
          restoreScroll =
            document
              .querySelector<HTMLElement>(
                "#effect-library",
              )
              ?.scrollTop ??
            0;
        }
      },
      true,
    );

  apply();

  const observer =
    new MutationObserver(
      () => {
        if (queued) {
          return;
        }

        queued = true;

        requestAnimationFrame(
          () => {
            /*
              Polish modifies labels/classes itself. While it is applying,
              disconnect the observer so those cosmetic mutations cannot
              schedule another polish pass forever and starve browser input.
            */
            observer.disconnect();

            try {
              apply();
            } finally {
              queued = false;

              observer.observe(
                document.body,
                {
                  childList: true,
                  subtree: true,
                },
              );
            }
          },
        );
      },
    );

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true,
    },
  );
}
