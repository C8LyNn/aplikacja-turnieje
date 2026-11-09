import { FlaskConical, ShieldCheck } from "lucide-react";
import {
  ModuleHeader,
  ModuleShell,
  ProjectCard,
} from "@/components/portfolio-ui";
import { ExperimentalOrganizerGuard } from "@/features/experimental-tournaments/experimental-organizer-guard";

export default function TournamentCreateChoice() {
  return (
    <ExperimentalOrganizerGuard>
      <ModuleShell>
        <ModuleHeader
          code="TURN"
          title="Utwórz turniej"
          description="Wybierz interfejs tworzenia. Stabilna wersja pozostaje dostępna bez zmian, a Experimental rozwijamy równolegle."
          accent="primary"
          backHref="/dashboard"
          backLabel="Wróć do dashboardu"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <ProjectCard
            code="TURN STABLE"
            title="Stabilna wersja"
            description="Obecny interfejs tworzenia turnieju. Zachowuje dotychczasowy workflow i zachowanie."
            href="/tournaments/new"
            icon={ShieldCheck}
            accent="primary"
            status="stabilna"
            actionLabel="Otwórz stabilną wersję →"
          />

          <ProjectCard
            code="TURN EXP"
            title="Experimental"
            description="Nowy frontend rozwijany niezależnie, ale korzystający z tego samego systemu turniejowego."
            href="/experimental/tournaments/new"
            icon={FlaskConical}
            accent="primary"
            status="experimental"
            actionLabel="Otwórz Experimental →"
          />
        </div>
      </ModuleShell>
    </ExperimentalOrganizerGuard>
  );
}
