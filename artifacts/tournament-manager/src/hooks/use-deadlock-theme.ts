import { useState, useCallback, useEffect } from "react";

function storageKey(id: number) {
  return `tm:deadlock-theme:${id}`;
}

/**
 * Persists the Deadlock visual theme preference per tournament via localStorage.
 *
 * When Task #15 (presentationSettings API) is merged, replace this hook with one that
 * reads `tournament.presentationSettings?.deadlockTheme` and writes via the PATCH mutation.
 * The call-site signature `const [deadlockTheme, setDeadlockTheme] = useDeadlockTheme(id)`
 * stays the same, so only this file needs to change.
 */
export function useDeadlockTheme(
  tournamentId: number | undefined,
): [boolean, (value: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (!tournamentId) return false;
    try {
      return localStorage.getItem(storageKey(tournamentId)) === "true";
    } catch {
      return false;
    }
  });

  // Re-sync when navigating between tournaments
  useEffect(() => {
    if (!tournamentId) {
      setEnabled(false);
      return;
    }
    try {
      setEnabled(localStorage.getItem(storageKey(tournamentId)) === "true");
    } catch {
      setEnabled(false);
    }
  }, [tournamentId]);

  const set = useCallback(
    (value: boolean) => {
      if (!tournamentId) return;
      try {
        if (value) {
          localStorage.setItem(storageKey(tournamentId), "true");
        } else {
          localStorage.removeItem(storageKey(tournamentId));
        }
      } catch {
        // storage blocked (e.g. private browsing with strict settings)
      }
      setEnabled(value);
    },
    [tournamentId],
  );

  return [enabled, set];
}
