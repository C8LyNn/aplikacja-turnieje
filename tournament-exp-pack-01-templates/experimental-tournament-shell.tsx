import type { ReactNode } from "react";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";

export function ExperimentalTournamentShell({ children }: { children: ReactNode }) {
  return (
    <ModuleShell>
      <ModuleHeader
        code="TURN EXP"
        title="Nowy turniej"
        description="Eksperymentalny frontend tworzenia turnieju korzystający z istniejącej infrastruktury aplikacji."
        accent="primary"
        backHref="/tournaments/create"
        backLabel="Wybór wersji"
        status="experimental"
      />
      {children}
    </ModuleShell>
  );
}
