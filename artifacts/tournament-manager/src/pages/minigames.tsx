import { t } from "@/i18n";
import { Gamepad2 } from "lucide-react";
import {
  EmptyProjectCard,
  ModuleHeader,
  ModuleShell,
  ProjectCard,
} from "@/components/portfolio-ui";

const EMPTY_SLOTS = Array.from({ length: 2 }, (_, index) => index + 1);

export default function MinigamesPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="GAME"
        title={t("minigames.minigry")}
        description={t("minigames.grywalne_prototypy_i_eksperymenty")}
        accent="emerald"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectCard
          code="PROTO 01"
          title={t("minigames.ewolucja_pojazdow")}
          description={t("minigames.obserwacyjna_minigra_o_kolejnych_generac")}
          href="/minigames/evolution"
          icon={Gamepad2}
          accent="emerald"
        />
        <ProjectCard
          code="PROTO 02"
          title={t("minigames.core_clash")}
          description={t("minigames.taktyczna_gra_fizyczna_z_taliami")}
          href="/minigames/core-clash"
          icon={Gamepad2}
          accent="emerald"
        />
        <ProjectCard
          code="SHOWCASE V149.5"
          title={t("minigames.core_clash_v149_5_showcase")}
          description={t("minigames.oddzielna_tymczasowa_wersja_pokazowa_ory")}
          href="/minigames/core-clash-v149-5"
          icon={Gamepad2}
          accent="emerald"
        />
        <ProjectCard
          code="UNITY WEBGL · V149"
          title={t("minigames.core_clash_unity_migration_demo")}
          description={t("minigames.osobna_migracja_do_unity_c")}
          href="/minigames/core-clash-unity"
          icon={Gamepad2}
          accent="blue"
          status="WORK IN PROGRESS"
          actionLabel={t("minigames.otworz_wersje")}
        />
        {EMPTY_SLOTS.map((slot) => (
          <EmptyProjectCard key={slot} label={t("minigames.kolejna_minigra")} />
        ))}
      </div>
    </ModuleShell>
  );
}
