import { t } from "@/i18n";
import { CircleDot, Dices, FlaskConical, Layers3, Workflow } from "lucide-react";
import {
  EmptyProjectCard,
  ModuleHeader,
  ModuleShell,
  ProjectCard,
  SectionHeader,
} from "@/components/portfolio-ui";

const prototypes = [
  { code: "PROTO 01", get title() { return t("randomizers.kolo"); }, href: "/randomizers/prototypes/wheel", icon: CircleDot },
  { code: "PROTO 02", title: "Pinball / Marbles", href: "/randomizers/prototypes/pinball", icon: Workflow },
  { code: "PROTO 03", get title() { return t("randomizers.talia_kart"); }, href: "/randomizers/prototypes/cards", icon: Layers3 },
] as const;

export default function RandomizersPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="DRAW"
        title={t("randomizers.losowania")}
        description={t("randomizers.gotowe_narzedzia_oraz_niezalezne_prototy")}
        accent="blue"
      />

      <div className="space-y-10">
        <section>
          <SectionHeader
            eyebrow={t("randomizers.wlasciwe")}
            title={t("randomizers.losowania_w_aplikacji")}
            accent="primary"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProjectCard
              code="DRAW 01"
              title={t("randomizers.losowanie_kart")}
              description={t("randomizers.obecny_zintegrowany_draw_lab")}
              href="/randomizers/cards"
              icon={Dices}
              accent="primary"
              status={t("randomizers.aktywne")}
            />
            <ProjectCard
              code="LAB"
              title={t("randomizers.laboratorium")}
              description={t("randomizers.porownaj_prezentacje_losowan_na_danych")}
              href="/laboratorium"
              icon={FlaskConical}
              accent="primary"
              status={t("randomizers.eksperymenty")}
            />
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <SectionHeader
            eyebrow={t("randomizers.prototypy")}
            title={t("randomizers.eksperymenty_html")}
            accent="blue"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prototypes.map((prototype) => (
              <ProjectCard
                key={prototype.href}
                {...prototype}
                description={t("randomizers.samodzielny_prototyp_html")}
                accent="blue"
                status="HTML"
              />
            ))}
            {[1, 2, 3].map((slot) => (
              <EmptyProjectCard key={slot} label={t("randomizers.kolejny_prototyp")} />
            ))}
          </div>
        </section>
      </div>
    </ModuleShell>
  );
}
