import { Database, Map } from "lucide-react";
import { ModuleHeader, ModuleShell, ProjectCard } from "@/components/portfolio-ui";

export default function VenediResearchPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="RES 01"
        title="Wenedowie"
        description="Materiały i narzędzia projektu badawczego."
        accent="cyan"
        backHref="/research"
        backLabel="Projekty badawcze"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ProjectCard
          code="DATA"
          title="Baza danych"
          description="Istniejąca baza badawcza w Google Sheets — tylko do przeglądania."
          href="/research/venedi/database"
          icon={Database}
          accent="cyan"
          status="tylko odczyt"
          actionLabel="Przeglądaj →"
        />
        <ProjectCard
          code="MAP"
          title="Wizualizacja mapy"
          description="Miejsce przygotowane pod późniejszą wizualizację danych geograficznych."
          href="/research/venedi/map"
          icon={Map}
          accent="cyan"
          status="puste"
          actionLabel="Otwórz →"
        />
      </div>
    </ModuleShell>
  );
}
