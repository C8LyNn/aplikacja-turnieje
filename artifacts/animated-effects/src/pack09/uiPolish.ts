let installed = false;
let inspectorObserver: MutationObserver | null = null;
let organizing = false;
let queued = false;

function normalizeText(
  value: string | null,
): string {
  return (
    value ??
    ""
  )
    .trim()
    .toLocaleLowerCase(
      "pl",
    );
}

function findInspectorGroup(
  inspector: HTMLElement,
  title: string,
): HTMLElement | null {
  const target =
    normalizeText(
      title,
    );

  return (
    Array.from(
      inspector.querySelectorAll<HTMLElement>(
        ":scope > .inspector-group",
      ),
    ).find(
      (group) => {
        if (
          group.matches(
            ".ae-pack06-inspector",
          )
        ) {
          return false;
        }

        const heading =
          group.querySelector(
            ".inspector-group-heading strong",
          ) ??
          group.querySelector(
            "strong",
          );

        return (
          normalizeText(
            heading?.textContent ??
            null,
          ) ===
          target
        );
      },
    ) ??
    null
  );
}

function organizeInspector():
  void {
  if (organizing) {
    return;
  }

  const inspector =
    document.querySelector<HTMLElement>(
      "#inspector",
    );

  if (!inspector) {
    return;
  }

  organizing = true;
  inspectorObserver?.disconnect();

  try {
    const title =
      inspector.querySelector<HTMLElement>(
        ":scope > .inspector-title",
      );

    const variant =
      inspector.querySelector<HTMLElement>(
        ":scope > .inspector-variant-panel",
      );

    const character =
      inspector.querySelector<HTMLElement>(
        ":scope > [data-pack09-character]",
      );

    const randomness =
      inspector.querySelector<HTMLElement>(
        ":scope > .ae-pack06-inspector",
      );

    const color =
      inspector.querySelector<HTMLElement>(
        ":scope > .inspector-color-panel",
      );

    const primary =
      findInspectorGroup(
        inspector,
        "Podstawowe",
      );

    const transform =
      findInspectorGroup(
        inspector,
        "Transformacja",
      );

    const appearance =
      findInspectorGroup(
        inspector,
        "Wygląd",
      );

    const composition =
      findInspectorGroup(
        inspector,
        "Kompozycja",
      );

    const ordered = [
      title,
      variant,
      character,
      primary,
      color,
      randomness,
      transform,
      appearance,
      composition,
    ].filter(
      (
        item,
      ): item is HTMLElement =>
        Boolean(
          item,
        ),
    );

    for (
      const item of
        ordered
    ) {
      inspector.appendChild(
        item,
      );
    }

    inspector.classList.add(
      "ae-ui10-inspector-ordered",
    );
  } finally {
    inspectorObserver?.observe(
      inspector,
      {
        childList: true,
        subtree: false,
      },
    );

    organizing = false;
  }
}

function queueOrganize():
  void {
  if (queued) {
    return;
  }

  queued = true;

  queueMicrotask(
    () => {
      queued = false;
      organizeInspector();
    },
  );
}

function markLibraryCards():
  void {
  document
    .querySelectorAll<HTMLElement>(
      ".ae-effect-card",
    )
    .forEach(
      (card) => {
        const actions =
          card.querySelector(
            ".ae-pack06-card-actions",
          );

        card.classList.toggle(
          "has-pack06-actions",
          Boolean(
            actions,
          ),
        );

        const isActive =
          card.classList.contains(
            "is-on-scene",
          );

        card.dataset
          .sceneState =
          isActive
            ? "active"
            : "inactive";
      },
    );
}

function installLibraryObserver():
  void {
  const library =
    document.querySelector(
      "#effect-library",
    );

  if (!library) {
    return;
  }

  const observer =
    new MutationObserver(
      () => {
        queueMicrotask(
          markLibraryCards,
        );
      },
    );

  observer.observe(
    library,
    {
      childList: true,
      subtree: true,
    },
  );

  markLibraryCards();
}

export function installPack09UiPolish():
  void {
  if (installed) {
    return;
  }

  installed = true;

  const inspector =
    document.querySelector(
      "#inspector",
    );

  if (inspector) {
    inspectorObserver =
      new MutationObserver(
        () => {
          if (!organizing) {
            queueOrganize();
          }
        },
      );

    inspectorObserver.observe(
      inspector,
      {
        childList: true,
        subtree: false,
      },
    );

    organizeInspector();
  }

  installLibraryObserver();

  window.addEventListener(
    "resize",
    () => {
      document
        .documentElement
        .style
        .setProperty(
          "--ae-ui10-vh",
          `${window.innerHeight}px`,
        );
    },
    {
      passive: true,
    },
  );

  document
    .documentElement
    .style
    .setProperty(
      "--ae-ui10-vh",
      `${window.innerHeight}px`,
    );
}
