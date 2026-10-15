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
          description="Wybierz interfejs tworzenia. Obie wersje prowadzą do tego samego systemu turniejowego."
          accent="primary"
          backHref="/dashboard"
          backLabel="Wróć do dashboardu"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <ProjectCard
            code="TURN STABLE"
            title="Stabilna wersja"
            description="Pełny, dotychczasowy interfejs ze wszystkimi obecnymi opcjami konfiguracji."
            href="/tournaments/new"
            icon={ShieldCheck}
            accent="primary"
            status="stabilna"
            actionLabel="Otwórz stabilną wersję →"
          />

          <ProjectCard
            code="TURN EXP"
            title="Nowa wersja"
            description="Nowy, prostszy interfejs tworzenia podstawowych formatów turnieju. Jest rozwijany równolegle."
            href="/experimental/tournaments/new"
            icon={FlaskConical}
            accent="primary"
            status="experimental"
            actionLabel="Otwórz nową wersję →"
          />
        </div>
      </ModuleShell>
    </ExperimentalOrganizerGuard>
  );
}
