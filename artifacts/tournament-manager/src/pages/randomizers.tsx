import { CircleDot, Dices, Layers3, Workflow } from "lucide-react";
import {
  EmptyProjectCard,
  ModuleHeader,
  ModuleShell,
  ProjectCard,
  SectionHeader,
} from "@/components/portfolio-ui";

const prototypes = [
  { code: "PROTO 01", title: "Koło", href: "/randomizers/prototypes/wheel", icon: CircleDot },
  { code: "PROTO 02", title: "Pinball / Marbles", href: "/randomizers/prototypes/pinball", icon: Workflow },
  { code: "PROTO 03", title: "Talia kart", href: "/randomizers/prototypes/cards", icon: Layers3 },
] as const;

export default function RandomizersPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="DRAW"
        title="Losowania"
        description="Gotowe narzędzia oraz niezależne prototypy."
        accent="blue"
      />

      <div className="space-y-10">
        <section>
          <SectionHeader
            eyebrow="Właściwe"
            title="Losowania w aplikacji"
            accent="primary"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProjectCard
              code="DRAW 01"
              title="Losowanie kart"
              description="Obecny zintegrowany Draw Lab."
              href="/randomizers/cards"
              icon={Dices}
              accent="primary"
              status="aktywne"
            />
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <SectionHeader
            eyebrow="Prototypy"
            title="Eksperymenty HTML"
            accent="blue"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prototypes.map((prototype) => (
              <ProjectCard
                key={prototype.href}
                {...prototype}
                description="Samodzielny prototyp HTML."
                accent="blue"
                status="HTML"
              />
            ))}
            {[1, 2, 3].map((slot) => (
              <EmptyProjectCard key={slot} label="Kolejny prototyp" />
            ))}
          </div>
        </section>
      </div>
    </ModuleShell>
  );
}
