import { Database } from "lucide-react";
import {
  EmptyProjectCard,
  ModuleHeader,
  ModuleShell,
  ProjectCard,
} from "@/components/portfolio-ui";

export default function ResearchPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="RES"
        title="Projekty badawcze"
        description="Bazy źródłowe i narzędzia wspierające badania."
        accent="cyan"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ProjectCard
          code="RES 01"
          title="Wenedowie"
          description="Projekt badawczy: baza danych i wizualizacje."
          href="/research/venedi"
          icon={Database}
          accent="cyan"
          status="aktywne"
          actionLabel="Otwórz →"
        />
        {[1, 2, 3, 4].map((slot) => (
          <EmptyProjectCard key={slot} label="Kolejny projekt" />
        ))}
      </div>
    </ModuleShell>
  );
}
