let installed = false;

function closeMenus(
  except?: HTMLDetailsElement,
): void {
  document
    .querySelectorAll<HTMLDetailsElement>(
      ".ae-polish02-menu[open]",
    )
    .forEach(
      (menu) => {
        if (
          menu !== except
        ) {
          menu.open =
            false;
        }
      },
    );
}

function updateRangeTone(
  input: HTMLInputElement,
): void {
  const value =
    Number(
      input.value,
    );

  input.classList.toggle(
    "is-boosted",
    value > 100 &&
      value <= 200,
  );

  input.classList.toggle(
    "is-overdrive",
    value > 200,
  );
}

function scanRanges(): void {
  document
    .querySelectorAll<HTMLInputElement>(
      '#inspector input[type="range"]',
    )
    .forEach(
      updateRangeTone,
    );
}

export function installPack08UiQa():
  void {
  if (installed) {
    return;
  }

  installed = true;

  document.addEventListener(
    "toggle",
    (event) => {
      const target =
        event.target;

      if (
        target instanceof
          HTMLDetailsElement &&
        target.matches(
          ".ae-polish02-menu",
        ) &&
        target.open
      ) {
        closeMenus(
          target,
        );
      }
    },
    true,
  );

  document.addEventListener(
    "pointerdown",
    (event) => {
      const target =
        event.target;

      if (
        !(target instanceof
          Element)
      ) {
        return;
      }

      if (
        !target.closest(
          ".ae-polish02-menu",
        )
      ) {
        closeMenus();
      }
    },
  );

  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target;

      if (
        !(target instanceof
          Element)
      ) {
        return;
      }

      if (
        target.closest(
          ".ae-polish02-menu-panel button",
        )
      ) {
        const menu =
          target.closest<HTMLDetailsElement>(
            ".ae-polish02-menu",
          );

        if (menu) {
          menu.open =
            false;
        }
      }
    },
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key ===
        "Escape"
      ) {
        closeMenus();
      }
    },
  );

  document.addEventListener(
    "input",
    (event) => {
      const target =
        event.target;

      if (
        target instanceof
          HTMLInputElement &&
        target.type ===
          "range" &&
        target.closest(
          "#inspector",
        )
      ) {
        updateRangeTone(
          target,
        );
      }
    },
  );

  const inspector =
    document.querySelector(
      "#inspector",
    );

  if (inspector) {
    const observer =
      new MutationObserver(
        () => {
          scanRanges();
        },
      );

    observer.observe(
      inspector,
      {
        childList: true,
        subtree: true,
      },
    );
  }

  for (
    const selector of [
      ".ae-effect-library",
      ".ae-layer-list",
      ".ae-inspector-content",
      ".ae-media-export",
    ]
  ) {
    document
      .querySelectorAll<HTMLElement>(
        selector,
      )
      .forEach(
        (element) => {
          element.addEventListener(
            "wheel",
            (event) => {
              event.stopPropagation();
            },
            {
              passive: true,
            },
          );
        },
      );
  }

  scanRanges();
}
