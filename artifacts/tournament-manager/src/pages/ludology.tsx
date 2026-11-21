import { t } from "@/i18n";
import { Gamepad2, MessagesSquare } from "lucide-react";
import {
  ModuleHeader,
  ModuleShell,
  ProjectCard,
} from "@/components/portfolio-ui";

export default function LudologyPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="LUDO"
        title={t("ludology.ludologia")}
        description={t("ludology.narzedzia_do_porzadkowania_i_analizowani")}
        accent="amber"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ProjectCard
          code="LUDO 01"
          title={t("ludology.kategoryzacja_gier")}
          description={t("ludology.katalog_steam_i_system_pieciu")}
          href="/ludology/game-classification"
          icon={Gamepad2}
          accent="amber"
          status={t("ludology.aktywne")}
        />
        <ProjectCard
          code="LUDO 02"
          title={t("ludology.kategoryzacja_wypowiedzi_i_pogladow")}
          description={t("ludology.zrodlowe_kodowanie_publicznych_wypowiedz")}
          href="/ludology/statement-classification"
          icon={MessagesSquare}
          accent="amber"
          status="fundament"
        />
      </div>
    </ModuleShell>
  );
}
