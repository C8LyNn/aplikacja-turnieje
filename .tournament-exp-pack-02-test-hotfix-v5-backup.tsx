import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { getRoleHomePath } from "@/components/app-navigation";
import { useAuth } from "@/context/auth-context";

export function ExperimentalOrganizerGuard({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const [location, navigate] = useLocation();

  const isExperimentalRoute = location.startsWith("/experimental/tournaments");
  const redirectTo =
    role === "organizer"
      ? null
      : getRoleHomePath(
          role,
          isExperimentalRoute ? "/experimental/tournaments" : "/",
          isExperimentalRoute,
        );

  useEffect(() => {
    if (redirectTo !== null) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  if (redirectTo !== null) return null;
  return <>{children}</>;
}
