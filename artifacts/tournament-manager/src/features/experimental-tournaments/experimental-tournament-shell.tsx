import type { ReactNode } from "react";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";

const DEFAULT_DESCRIPTION = "Podaj nazwę i format. Uczestników, etapy i koszyki skonfigurujesz po utworzeniu turnieju.";

export function ExperimentalTournamentShell({
  children,
  description = DEFAULT_DESCRIPTION,
}: {
  children: ReactNode;
  description?: string;
}) {
  return (
    <div className="experimental-tournament-create">
      <ModuleShell>
        <ModuleHeader
          code="Turnieje"
          title="Nowy turniej"
          description={description}
          accent="primary"
          backHref="/experimental/tournaments/dashboard"
          backLabel="Twoje turnieje"
        />
        {children}
      </ModuleShell>
    </div>
  );
}
