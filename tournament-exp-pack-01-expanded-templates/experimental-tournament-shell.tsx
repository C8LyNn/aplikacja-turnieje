import type { ReactNode } from "react";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";

export function ExperimentalTournamentShell({ children }: { children: ReactNode }) {
  return (
    <ModuleShell>
      <ModuleHeader
        code="TURN EXP"
        title="Nowy turniej"
        description="Nowy układ tworzenia turnieju. Po utworzeniu korzystasz z tego samego panelu zarządzania i danych co wcześniej."
        accent="primary"
        backHref="/tournaments/create"
        backLabel="Wybór wersji"
        status="experimental"
      />
      {children}
    </ModuleShell>
  );
}
