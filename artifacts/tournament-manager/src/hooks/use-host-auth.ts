import { useEffect, useState, useCallback, useRef } from "react";
import { setActiveHostCode, verifyHostCode } from "@workspace/api-client-react";

const storageKey = (id: number) => `hostCode_${id}`;

export function useHostAuth(tournamentId: number, hasHostCode: boolean | undefined) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const requestGeneration = useRef(0);
  const activeTournamentId = useRef(tournamentId);
  activeTournamentId.current = tournamentId;

  useEffect(() => {
    const generation = ++requestGeneration.current;
    const isCurrent = () =>
      requestGeneration.current === generation &&
      activeTournamentId.current === tournamentId;
    if (hasHostCode === undefined) {
      return () => {
        requestGeneration.current += 1;
        setActiveHostCode(null);
      };
    }
    setIsReady(false);
    setIsAuthenticated(false);
    setActiveHostCode(null);
    if (!hasHostCode) {
      setIsAuthenticated(true);
      setIsReady(true);
      return () => {
        requestGeneration.current += 1;
        setActiveHostCode(null);
      };
    }
    const stored = sessionStorage.getItem(storageKey(tournamentId));
    if (!stored) {
      setIsReady(true);
      return () => {
        requestGeneration.current += 1;
        setActiveHostCode(null);
      };
    }

    void verifyHostCode(tournamentId, { code: stored })
      .then((result) => {
        if (!isCurrent()) return;
        if (!result.valid) throw new Error("HOST_CODE_INVALID");
        setActiveHostCode(stored);
        setIsAuthenticated(true);
      })
      .catch(() => {
        if (!isCurrent()) return;
        sessionStorage.removeItem(storageKey(tournamentId));
        setActiveHostCode(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (isCurrent()) setIsReady(true);
      });

    return () => {
      requestGeneration.current += 1;
      setActiveHostCode(null);
    };
  }, [tournamentId, hasHostCode]);

  const authenticate = useCallback(async (code: string): Promise<boolean> => {
    const generation = ++requestGeneration.current;
    const isCurrent = () =>
      requestGeneration.current === generation &&
      activeTournamentId.current === tournamentId;
    setIsReady(false);
    setIsAuthenticated(false);
    setActiveHostCode(null);
    try {
      const result = await verifyHostCode(tournamentId, { code });
      if (!isCurrent()) return false;
      if (!result.valid) {
        sessionStorage.removeItem(storageKey(tournamentId));
        return false;
      }
      sessionStorage.setItem(storageKey(tournamentId), code);
      setActiveHostCode(code);
      setIsAuthenticated(true);
      return true;
    } catch {
      if (!isCurrent()) return false;
      sessionStorage.removeItem(storageKey(tournamentId));
      return false;
    } finally {
      if (isCurrent()) setIsReady(true);
    }
  }, [tournamentId]);

  const clearAuth = useCallback(() => {
    requestGeneration.current += 1;
    sessionStorage.removeItem(storageKey(tournamentId));
    setActiveHostCode(null);
    setIsAuthenticated(false);
  }, [tournamentId]);

  const updateStoredCode = useCallback((newCode: string) => {
    requestGeneration.current += 1;
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
