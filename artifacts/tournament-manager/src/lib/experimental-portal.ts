import { useEffect, useState } from "react";

/**
 * V5.4 · dialogs, popovers, menus and tooltips opened on an Experimental page mount inside the
 * Experimental root, so they inherit the chosen theme (tokens, skin, appearance attributes).
 * Stable pages have no such root: the container stays undefined and Radix uses document.body.
 */
const EXPERIMENTAL_ROOTS = ".experimental-tournament-shell, .experimental-tournament-public, .experimental-tournament-create, .experimental-tournament-entry, .experimental-tournament-stage-view";

function findRoot(): HTMLElement | undefined {
  if (typeof document === "undefined") return undefined;
  return document.querySelector<HTMLElement>(EXPERIMENTAL_ROOTS) ?? undefined;
}

export function useExperimentalPortalContainer(): HTMLElement | undefined {
  const [container, setContainer] = useState<HTMLElement | undefined>(findRoot);
  useEffect(() => {
    const root = findRoot();
    if (root !== container) setContainer(root);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return container;
}
