import { Link, useLocation } from "wouter";
import { Trophy, PlusCircle, HelpCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const ROLE_LABELS: Record<string, string> = {
  organizer: "Organizator",
  support: "Wsparcie",
  fan: "Kibic",
  developer: "Developer",
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { role } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground dark">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={role ? (role === "organizer" ? "/dashboard" : role === "support" ? "/support" : role === "fan" ? "/fan" : "/") : "/"} className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <Trophy className="w-6 h-6" />
            <span>TM_SYS</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            {role && (
              <Link href="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-full px-2.5 py-1">
                <ArrowLeft className="w-3 h-3" />
                {ROLE_LABELS[role] ?? role}
              </Link>
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
