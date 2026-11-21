import { t } from "@/i18n";
import { FlaskConical, ShieldCheck } from "lucide-react";
import { ModuleHeader, ModuleShell, ProjectCard } from "@/components/portfolio-ui";

export default function TournamentInterfaceChoice() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="TURN"
        title={t("tournamentInterfaceChoice.turnieje")}
        description={t("tournamentInterfaceChoice.wybierz_interfejs_turniejowy_obie_wersje")}
        accent="primary"
        backHref="/"
        backLabel={t("tournamentInterfaceChoice.wszystkie_kategorie")}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ProjectCard
          code="TURN STABLE"
          title={t("tournamentInterfaceChoice.stabilny_interfejs")}
          description={t("tournamentInterfaceChoice.wersja_awaryjna_prostsza_i_sprawdzona")}
          href="/tournaments/stable"
          icon={ShieldCheck}
          accent="primary"
          status={t("tournamentInterfaceChoice.stabilna")}
          actionLabel={t("tournamentInterfaceChoice.otworz_stabilny_interfejs")}
        />

        <ProjectCard
          code="TURN EXP"
          title={t("tournamentInterfaceChoice.nowy_interfejs")}
          description={t("tournamentInterfaceChoice.zalecany_na_start_kreator_krok")}
          href="/experimental/tournaments"
          icon={FlaskConical}
          accent="primary"
          status="experimental"
          actionLabel={t("tournamentInterfaceChoice.otworz_nowy_interfejs")}
        />
      </div>
    </ModuleShell>
  );
}
