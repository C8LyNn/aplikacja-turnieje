import { Link, useLocation } from "wouter";
import { PlusCircle, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AppLogoLink, getRoleHomePath, RoleHomeLink, RoleSelectionLink } from "@/components/app-navigation";

export function Layout({ children, deadlockTheme, colorPreset }: { children: React.ReactNode; deadlockTheme?: boolean; colorPreset?: string }) {
  const [location] = useLocation();
  const { role } = useAuth();
  const isTournamentView = /^\/tournaments\/\d+(?:\/|$)/.test(location);
  const fallbackHref = isTournamentView ? "/fan" : "/";
  const fallbackLabel = isTournamentView ? "Wróć do turniejów" : "Wróć do strony głównej";
  const roleHome = getRoleHomePath(role, fallbackHref);

  return (
    <div
      className="min-h-screen flex flex-col bg-background text-foreground dark transition-colors duration-200"
      data-theme={colorPreset || (deadlockTheme ? "deadlock" : undefined)}
    >
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AppLogoLink fallbackHref={fallbackHref} className="text-xl" />
            {location !== roleHome && (
              <RoleHomeLink
                fallbackHref={fallbackHref}
                fallbackLabel={fallbackLabel}
                className="border-l border-border pl-4"
              />
            )}
          </div>
          <nav className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            {role && (
              <RoleSelectionLink className="border border-border rounded-full px-2.5 py-1 text-xs" />
            )}
            {role === "organizer" && (
              <>
                <Link href="/dashboard" className={`px-3 py-1.5 rounded hover:text-foreground hover:bg-muted/40 transition-colors ${location === "/dashboard" ? "text-foreground bg-muted/30" : ""}`}>
                  Dashboard
                </Link>
                <Link href="/tournaments/create" className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:text-foreground hover:bg-muted/40 transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  Nowy turniej
                </Link>
              </>
            )}
            <Link
              href="/help"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded hover:text-foreground hover:bg-muted/40 transition-colors ${location === "/help" ? "text-foreground bg-muted/30" : ""}`}
              title="Instrukcja obsługi"
            >
              <HelpCircle className="w-4 h-4" />
              Pomoc
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 md:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
