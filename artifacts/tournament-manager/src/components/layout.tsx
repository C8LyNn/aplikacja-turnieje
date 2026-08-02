import { Link, useLocation } from "wouter";
import { PlusCircle, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AppLogoLink, getRoleHomePath, RoleHomeLink, RoleSelectionLink } from "@/components/app-navigation";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { role } = useAuth();
  const isTournamentView = /^\/tournaments\/\d+(?:\/|$)/.test(location);
  const fallbackHref = isTournamentView ? "/fan" : "/";
  const fallbackLabel = isTournamentView ? "Wróć do turniejów" : "Wróć do strony głównej";
  const roleHome = getRoleHomePath(role, fallbackHref);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground dark">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
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
          <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            {role && (
              <RoleSelectionLink className="border border-border rounded-full px-2.5 py-1 text-xs" />
            )}
            {(!role || role === "organizer") && (
              <>
                <Link href="/dashboard" className={`hover:text-foreground transition-colors ${location === "/dashboard" ? "text-foreground" : ""}`}>
                  Dashboard
                </Link>
                <Link href="/tournaments/new" className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  Nowy turniej
                </Link>
              </>
            )}
            <Link
              href="/help"
              className={`flex items-center gap-1 hover:text-foreground transition-colors ${location === "/help" ? "text-foreground" : ""}`}
              title="Instrukcja obsługi"
            >
              <HelpCircle className="w-4 h-4" />
              Pomoc
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
