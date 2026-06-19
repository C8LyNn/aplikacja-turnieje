import { useEffect, useState, useCallback } from "react";
import { setActiveHostCode } from "@workspace/api-client-react";

const storageKey = (id: number) => `hostCode_${id}`;

export function useHostAuth(tournamentId: number, hasHostCode: boolean | undefined) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (hasHostCode === undefined) return;
    if (!hasHostCode) {
      setActiveHostCode(null);
      setIsAuthenticated(true);
      setIsReady(true);
      return;
    }
    const stored = sessionStorage.getItem(storageKey(tournamentId));
    if (stored) {
      setActiveHostCode(stored);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsReady(true);
  }, [tournamentId, hasHostCode]);

  const authenticate = useCallback((code: string) => {
    sessionStorage.setItem(storageKey(tournamentId), code);
    setActiveHostCode(code);
    setIsAuthenticated(true);
  }, [tournamentId]);

  const clearAuth = useCallback(() => {
    sessionStorage.removeItem(storageKey(tournamentId));
    setActiveHostCode(null);
    setIsAuthenticated(false);
  }, [tournamentId]);

  const updateStoredCode = useCallback((newCode: string) => {
    if (newCode) {
      sessionStorage.setItem(storageKey(tournamentId), newCode);
      setActiveHostCode(newCode);
    } else {
      sessionStorage.removeItem(storageKey(tournamentId));
      setActiveHostCode(null);
    }
  }, [tournamentId]);

  return { isAuthenticated, isReady, authenticate, clearAuth, updateStoredCode };
}
