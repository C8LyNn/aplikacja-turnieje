import type { ReactNode } from "react";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";

export function ExperimentalTournamentShell({ children }: { children: ReactNode }) {
  return (
    <div className="experimental-tournament-create">
      <ModuleShell>
        <ModuleHeader
          code="TURN EXP"
          title="Nowy turniej"
          description="Uproszczony kreator zgodny z nowym standardem. Po utworzeniu pozostajesz w równoległej ścieżce Experimental."
          accent="primary"
          backHref="/tournaments/create"
          backLabel="Wybór wersji"
          status="experimental"
        />
        {children}
      </ModuleShell>
    </div>
  );
}
