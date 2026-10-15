let installed = false;

/* PACK13_FREEZE_HOTFIX */
let pack13FramePending = false;

function schedule(
  callback: () => void,
): void {
  if (pack13FramePending) {
    return;
  }

  pack13FramePending = true;

  requestAnimationFrame(
    () => {
      pack13FramePending = false;
      callback();
    },
  );
}

function fixFilterStructure():
  void {
  const filters =
    document.querySelector<HTMLElement>(
      ".ae-effect-filters",
    );

  const mode =
    document.querySelector<HTMLSelectElement>(
      "#pack06-library-mode",
    );

  const sort =
    document.querySelector<HTMLSelectElement>(
      "#pack06-library-sort",
    );

  if (
    !filters ||
    !mode ||
    !sort
  ) {
    return;
  }

  let row =
    filters.querySelector<HTMLElement>(
      ":scope > .ae-pack13-filter-row",
    );

  if (!row) {
    row =
      document.createElement(
        "div",
      );

    row.className =
      "ae-pack13-filter-row";

    filters.appendChild(
      row,
    );
  }

  if (
    mode.parentElement !==
    row
  ) {
    row.appendChild(
      mode,
    );
  }

  if (
    sort.parentElement !==
    row
  ) {
    row.appendChild(
      sort,
    );
  }
}

function fixCard(
  card: HTMLElement,
): void {
  const preview =
    card.querySelector<HTMLElement>(
      ":scope > .ae-effect-card-preview",
    );

  const favorite =
    card.querySelector<HTMLElement>(
      ":scope > .ae-pack06-favorite",
    );

  const actions =
    card.querySelector<HTMLElement>(
      ":scope > .ae-pack06-card-actions",
    );

  const add =
    card.querySelector<HTMLButtonElement>(
      ".ae-add-icon",
    );

  if (
    !preview ||
    !favorite ||
    !add
  ) {
    return;
  }

  const active =
    card.classList.contains(
      "is-on-scene",
    );

  card.dataset.pack13Card =
    "1";

  card.dataset.pack13Active =
    active
      ? "1"
      : "0";

  if (!active) {
    /*
      Pack06 wraps + in the same action container used by active cards.
      For inactive cards move it back to the card itself, so CSS can
      place it in a true right-hand column instead of a fake second row.
    */
    if (
      add.parentElement !==
      card
    ) {
      card.appendChild(
        add,
      );
    }

    if (
      actions &&
      actions.childElementCount ===
        0
    ) {
      actions.remove();
    }

    return;
  }

  /*
    Active cards genuinely need a control row.
    Ensure all three controls live in one stable container.
  */
  let activeActions =
    actions;

  if (!activeActions) {
    activeActions =
      document.createElement(
        "div",
      );

    activeActions.className =
      "ae-pack06-card-actions ae-pack13-card-actions";

    card.appendChild(
      activeActions,
    );
  } else {
    activeActions.classList.add(
      "ae-pack13-card-actions",
    );
  }

  const minus =
    card.querySelector<HTMLElement>(
      ".ae-pack06-minus",
    );

  const count =
    card.querySelector<HTMLElement>(
      ".ae-pack06-count",
    );

  if (
    minus &&
    minus.parentElement !==
      activeActions
  ) {
    activeActions.appendChild(
      minus,
    );
  }

  if (
    count &&
    count.parentElement !==
      activeActions
  ) {
    activeActions.appendChild(
      count,
    );
  }

  if (
    add.parentElement !==
    activeActions
  ) {
    activeActions.appendChild(
      add,
    );
  }
}

function fixCards():
  void {
  const library =
    document.querySelector<HTMLElement>(
      "#effect-library",
    );

  if (!library) {
    return;
  }

  Array.from(
    library.querySelectorAll<HTMLElement>(
      ":scope > .ae-effect-card",
    ),
  ).forEach(
    fixCard,
  );
}

function runFixes():
  void {
  fixFilterStructure();
  fixCards();
}

export function installPack13StructuralUiFix():
  void {
  if (installed) {
    return;
  }

  installed = true;

  runFixes();

  const filters =
    document.querySelector(
      ".ae-effect-filters",
    );

  if (filters) {
    new MutationObserver(
      () => {
        schedule(
          fixFilterStructure,
        );
      },
    ).observe(
      filters,
      {
        childList: true,
      },
    );
  }

  const library =
    document.querySelector(
      "#effect-library",
    );

  if (library) {
    new MutationObserver(
      () => {
        schedule(
          fixCards,
        );
      },
    ).observe(
      library,
      {
        childList: true,
        subtree: false,
      },
    );

    /*
      Pack06 may update controls inside an existing card without
      replacing the card itself. Re-run once after clicks, but do not
      observe nested child mutations continuously.
    */
    library.addEventListener(
      "click",
      () => {
        schedule(
          fixCards,
        );
      },
      true,
    );
  }
}
