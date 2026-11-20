import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { PlusCircle, HelpCircle, FlaskConical, Menu, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AppLogoLink, getRoleHomePath, RoleHomeLink, RoleSelectionLink } from "@/components/app-navigation";
import { isExperimentalTournamentPath } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { ExperimentalDensityControl } from "@/features/experimental-tournaments/experimental-density-control";
import { ExperimentalAppearanceControl } from "@/features/experimental-tournaments/experimental-appearance";

export function Layout({ children, deadlockTheme, colorPreset }: { children: React.ReactNode; deadlockTheme?: boolean; colorPreset?: string }) {
  const [location] = useLocation();
  const { role } = useAuth();
  const isExperimentalTournamentView = isExperimentalTournamentPath(location);
  // V5.8 (Experimental, phones): the app links open from one "Menu" button instead of a hidden sideways strip.
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => { setNavOpen(false); }, [location]);
  // Experimental: a new screen starts at its top (the router keeps the previous scroll offset).
  useEffect(() => {
    if (isExperimentalTournamentView) window.scrollTo({ top: 0, left: 0 });
  }, [isExperimentalTournamentView, location]);
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
      data-ui={isExperimentalTournamentView ? undefined : "classic"}
    >
      <a
        href={isExperimentalTournamentView ? "#experimental-main" : "#main-content"}
        className={isExperimentalTournamentView
          ? "experimental-skip-link"
          : "sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus-visible:ring-2 focus-visible:ring-primary"}
      >
        Przejdź do głównej treści
      </a>
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-3">
          {/* QW-01: the group keeps room for the logo and the back arrow (on a phone Stable shows the arrow only), so it
              no longer shrinks under its own content and spills over the navigation. */}
          <div className="flex items-center gap-4">
            <AppLogoLink fallbackHref={fallbackHref} className="text-xl shrink-0" />
            {isExperimentalTournamentView && (
              <span className="experimental-mode-badge">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                Experimental
              </span>
            )}
            {location !== roleHome && !(isExperimentalTournamentView && role === "organizer") && (
              <RoleHomeLink
                fallbackHref={fallbackHref}
                fallbackLabel={fallbackLabel}
                className={`border-l border-border pl-4${isExperimentalTournamentView ? " experimental-role-home" : ""}`}
                labelClassName={isExperimentalTournamentView ? undefined : "sr-only sm:not-sr-only"}
              />
            )}
          </div>
          {isExperimentalTournamentView && (
            <button
              type="button"
              className="experimental-nav-toggle"
              aria-expanded={navOpen}
              aria-controls="experimental-app-nav"
              onClick={() => setNavOpen((open) => !open)}
            >
              {navOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
              Menu
            </button>
          )}
          {/* V5.1: on narrow screens Stable's nav scrolls inside the header instead of widening the page.
              QW-01: its items keep their width (their touch-size min-w-11 let them squash to 44 px and overlap). */}
          <nav id={isExperimentalTournamentView ? "experimental-app-nav" : undefined} data-open={isExperimentalTournamentView && navOpen ? "true" : undefined} className={`flex items-center gap-3 text-sm font-medium text-muted-foreground ${isExperimentalTournamentView ? "experimental-app-nav" : "min-w-0 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&>*]:shrink-0"}`}>{!isExperimentalTournamentView && role && (
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
            {isExperimentalTournamentView && (
              <div className="experimental-nav-tools" role="group" aria-label="Narzędzia widoku">
                <ExperimentalAppearanceControl />
                <ExperimentalDensityControl />
                {role && <RoleSelectionLink className="border border-border rounded-full px-2.5 py-1 text-xs" />}
              </div>
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
                      {/* PORTFOLIO_MAIN_MENU_V9: global navigation */}
            <a
              href={`${(import.meta.env?.BASE_URL ?? "/")}portfolio/`}
              className="px-3 py-1.5 rounded hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              Portfolio
            </a>
</nav>
        </div>
      </header>
      <main id={isExperimentalTournamentView ? "experimental-main" : "main-content"} tabIndex={-1} className="flex-1 container mx-auto px-4 md:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
