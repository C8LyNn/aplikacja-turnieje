import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { getRoleHomePath } from "@/components/app-navigation";
import { useAuth } from "@/context/auth-context";

export function ExperimentalOrganizerGuard({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const [, navigate] = useLocation();

  const redirectTo =
    role === "organizer"
      ? null
      : getRoleHomePath(role, "/experimental/tournaments", true);

  useEffect(() => {
    if (redirectTo !== null) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  if (redirectTo !== null) return null;
  return <>{children}</>;
}
