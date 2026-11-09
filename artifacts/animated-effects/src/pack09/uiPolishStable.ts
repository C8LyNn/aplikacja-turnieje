let installed = false;

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

export function applyPack09UiPolishStable():
  void {
  const inspector =
    document.querySelector<HTMLElement>(
      "#inspector",
    );

  if (!inspector) {
    return;
  }

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

  /*
    No MutationObserver.
    This function is called immediately after the editor performs
    its own render, so it cannot recursively trigger itself.
  */
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
}

function updateViewportVariable():
  void {
  document
    .documentElement
    .style
    .setProperty(
      "--ae-ui10-vh",
      `${window.innerHeight}px`,
    );
}

export function installPack09UiPolishStable():
  void {
  if (installed) {
    return;
  }

  installed = true;

  updateViewportVariable();

  window.addEventListener(
    "resize",
    updateViewportVariable,
    {
      passive: true,
    },
  );
}
