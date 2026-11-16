import type { ReactNode } from "react";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";

export function ExperimentalTournamentShell({ children }: { children: ReactNode }) {
  return (
    <div className="experimental-tournament-create">
      <ModuleShell>
        <ModuleHeader
          code="Turnieje"
          title="Nowy turniej"
          description="Podaj nazwę i format. Uczestników, etapy i koszyki skonfigurujesz po utworzeniu turnieju."
          accent="primary"
          backHref="/experimental/tournaments/dashboard"
          backLabel="Twoje turnieje"
        />
        {children}
      </ModuleShell>
    </div>
  );
}
