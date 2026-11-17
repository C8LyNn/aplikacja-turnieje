import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";

const DEFAULT_DESCRIPTION = "Podaj nazwę i format. Uczestników, etapy i koszyki skonfigurujesz po utworzeniu turnieju.";

/**
 * V5.4: creation screens use `compact` — a slim back link instead of the large module header, because
 * the wizard's own header already says where you are (V5.4-002: the format step fits on one screen).
 */
export function ExperimentalTournamentShell({
  children,
  description = DEFAULT_DESCRIPTION,
  compact = false,
}: {
  children: ReactNode;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className="experimental-tournament-create" data-compact={compact ? "true" : undefined}>
      <ModuleShell>
        {compact ? (
          <nav className="experimental-create-crumbs" aria-label="Nawigacja">
            <Link href="/experimental/tournaments/dashboard" className="experimental-create-back">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Twoje turnieje
            </Link>
          </nav>
        ) : (
          <ModuleHeader
            code="Turnieje"
            title="Nowy turniej"
            description={description}
            accent="primary"
            backHref="/experimental/tournaments/dashboard"
            backLabel="Twoje turnieje"
          />
        )}
        {children}
      </ModuleShell>
    </div>
  );
}
