import { t } from "@/i18n";
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
          title={t("tournamentCreateChoice.utworz_turniej")}
          description={t("tournamentCreateChoice.wybierz_wersje_kreatora_stabilna_pozosta")}
          accent="primary"
          backHref="/dashboard"
          backLabel={t("tournamentCreateChoice.wroc_do_dashboardu")}
        />

        <div className="experimental-create-choice-grid grid gap-4 md:grid-cols-2">
          <ProjectCard
            code="TURN STABLE"
            title={t("tournamentCreateChoice.stabilna_wersja")}
            description={t("tournamentCreateChoice.pelny_dotychczasowy_interfejs_ze_wszystk")}
            href="/tournaments/new"
            icon={ShieldCheck}
            accent="primary"
            status={t("tournamentCreateChoice.stabilna")}
            actionLabel={t("tournamentCreateChoice.otworz_stabilna_wersje")}
          />

          <ProjectCard
            code="TURN EXP"
            title={t("tournamentCreateChoice.nowa_wersja")}
            description={t("tournamentCreateChoice.pelna_rownolegla_sciezka_role_dashboard")}
            href="/experimental/tournaments/new"
            icon={FlaskConical}
            accent="primary"
            status="experimental · Pack 02 audited"
            actionLabel={t("tournamentCreateChoice.otworz_nowa_wersje")}
          />
        </div>
      </ModuleShell>
    </ExperimentalOrganizerGuard>
  );
}
