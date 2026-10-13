import { Link, useLocation } from "wouter";
import { PlusCircle, HelpCircle, FlaskConical } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AppLogoLink, getRoleHomePath, RoleHomeLink, RoleSelectionLink } from "@/components/app-navigation";
import { isExperimentalTournamentPath } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { ExperimentalDensityControl } from "@/features/experimental-tournaments/experimental-density-control";

export function Layout({ children, deadlockTheme, colorPreset }: { children: React.ReactNode; deadlockTheme?: boolean; colorPreset?: string }) {
  const [location] = useLocation();
  const { role } = useAuth();
  const isExperimentalTournamentView = isExperimentalTournamentPath(location);
  const isTournamentView = /^\/(?:experimental\/)?tournaments\/\d+(?:\/|$)/.test(location);
  const fallbackHref = isExperimentalTournamentView
    ? "/experimental/tournaments"
    : isTournamentView
      ? "/fan"
      : "/";
  const fallbackLabel =
    isExperimentalTournamentView || isTournamentView
      ? "Wróć do turniejów"
      : "Wróć do strony głównej";
  const roleHome = getRoleHomePath(role, fallbackHref, isExperimentalTournamentView);

  return (
    <div
      className={`min-h-screen flex flex-col bg-background text-foreground dark transition-colors duration-200 ${isExperimentalTournamentView ? "experimental-tournament-shell" : ""}`}
      data-theme={colorPreset || (deadlockTheme ? "deadlock" : undefined)}
    >
      {isExperimentalTournamentView && (
        <a href="#experimental-main" className="experimental-skip-link">
          Przejdź do głównej treści
        </a>
      )}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AppLogoLink fallbackHref={fallbackHref} className="text-xl" />
            {isExperimentalTournamentView && (
              <span className="experimental-mode-badge">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                Experimental
              </span>
            )}
            {location !== roleHome && (
              <RoleHomeLink
                fallbackHref={fallbackHref}
                fallbackLabel={fallbackLabel}
                className="border-l border-border pl-4"
              />
            )}
          </div>
          <nav className="flex items-center gap-3 text-sm font-medium text-muted-foreground">{isExperimentalTournamentView && <ExperimentalDensityControl />}
            {role && (
              <RoleSelectionLink className="border border-border rounded-full px-2.5 py-1 text-xs" />
            )}
            {role === "organizer" && (
              <>
                <Link href={isExperimentalTournamentView ? "/experimental/tournaments/dashboard" : "/dashboard"} aria-current={location === "/dashboard" || location === "/experimental/tournaments/dashboard" ? "page" : undefined} className={`px-3 py-1.5 rounded hover:text-foreground hover:bg-muted/40 transition-colors ${location === "/dashboard" || location === "/experimental/tournaments/dashboard" ? "text-foreground bg-muted/30" : ""}`}>
                  Dashboard
                </Link>
                <Link href={isExperimentalTournamentView ? "/experimental/tournaments/new" : "/tournaments/create"} className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:text-foreground hover:bg-muted/40 transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  Nowy turniej
                </Link>
              </>
            )}
            <Link
              href="/help"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded hover:text-foreground hover:bg-muted/40 transition-colors ${location === "/help" ? "text-foreground bg-muted/30" : ""}`}
              title="Instrukcja obsługi"
              aria-current={location === "/help" ? "page" : undefined}
            >
              <HelpCircle className="w-4 h-4" />
              Pomoc
            </Link>
          </nav>
        </div>
      </header>
      <main id={isExperimentalTournamentView ? "experimental-main" : undefined} className="flex-1 container mx-auto px-4 md:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
