import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  type Role,
  getStoredRole, setStoredRole, clearStoredRole,
  getOrganizerToken, setOrganizerToken, clearOrganizerToken,
  getSupportSession, setSupportSession, clearSupportSession,
} from "@/lib/auth";

interface AuthContextValue {
  role: Role | null;
  setRole: (role: Role) => void;
  clearRole: () => void;
  isOrganizer: (tournamentId: number) => boolean;
  isSupport: (tournamentId: number) => boolean;
  isOrganizerOrSupport: (tournamentId: number) => boolean;
  getOrgToken: (tournamentId: number) => string | null;
  storeOrgToken: (tournamentId: number, token: string) => void;
  removeOrgToken: (tournamentId: number) => void;
  getSupSession: (tournamentId: number) => { token: string; nick: string } | null;
  storeSupSession: (tournamentId: number, token: string, nick: string) => void;
  removeSupSession: (tournamentId: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(() => getStoredRole());
  const [, forceUpdate] = useState(0);

  const setRole = useCallback((r: Role) => {
    setStoredRole(r);
    setRoleState(r);
  }, []);

  const clearRole = useCallback(() => {
    clearStoredRole();
    setRoleState(null);
  }, []);

  const getOrgToken = useCallback((id: number) => getOrganizerToken(id), []);

  const storeOrgToken = useCallback((id: number, token: string) => {
    setOrganizerToken(id, token);
    forceUpdate((n) => n + 1);
  }, []);

  const removeOrgToken = useCallback((id: number) => {
    clearOrganizerToken(id);
    forceUpdate((n) => n + 1);
  }, []);

  const getSupSession = useCallback((id: number) => getSupportSession(id), []);

  const storeSupSession = useCallback((id: number, token: string, nick: string) => {
    setSupportSession(id, token, nick);
    forceUpdate((n) => n + 1);
  }, []);

  const removeSupSession = useCallback((id: number) => {
    clearSupportSession(id);
    forceUpdate((n) => n + 1);
  }, []);

  const isOrganizer = useCallback((id: number) => !!getOrganizerToken(id), []);
  const isSupport = useCallback((id: number) => !!getSupportSession(id), []);
  const isOrganizerOrSupport = useCallback((id: number) => !!getOrganizerToken(id) || !!getSupportSession(id), []);

  return (
    <AuthContext.Provider value={{
      role, setRole, clearRole,
      isOrganizer, isSupport, isOrganizerOrSupport,
      getOrgToken, storeOrgToken, removeOrgToken,
      getSupSession, storeSupSession, removeSupSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
