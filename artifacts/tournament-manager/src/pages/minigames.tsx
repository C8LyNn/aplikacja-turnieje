import { Gamepad2 } from "lucide-react";
import {
  EmptyProjectCard,
  ModuleHeader,
  ModuleShell,
  ProjectCard,
} from "@/components/portfolio-ui";

const EMPTY_SLOTS = Array.from({ length: 4 }, (_, index) => index + 1);

export default function MinigamesPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="GAME"
        title="Minigry"
        description="Grywalne prototypy i eksperymenty."
        accent="emerald"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectCard
          code="PROTO 01"
          title="Ewolucja pojazdów"
          description="Obserwacyjna minigra o kolejnych generacjach pojazdów."
          href="/minigames/evolution"
          icon={Gamepad2}
          accent="emerald"
        />
        <ProjectCard
          code="PROTO 02"
          title="Core Clash"
          description="Taktyczna gra fizyczna z taliami, specjalnymi kulkami i wieloma archetypami."
          href="/minigames/core-clash"
          icon={Gamepad2}
          accent="emerald"
        />
        {EMPTY_SLOTS.map((slot) => (
          <EmptyProjectCard key={slot} label="Kolejna minigra" />
        ))}
      </div>
    </ModuleShell>
  );
}
