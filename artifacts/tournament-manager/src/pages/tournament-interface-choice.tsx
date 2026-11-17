import { FlaskConical, ShieldCheck } from "lucide-react";
import { ModuleHeader, ModuleShell, ProjectCard } from "@/components/portfolio-ui";

export default function TournamentInterfaceChoice() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="TURN"
        title="Turnieje"
        description="Wybierz interfejs turniejowy. Obie wersje korzystają z tego samego backendu."
        accent="primary"
        backHref="/"
        backLabel="Wszystkie kategorie"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ProjectCard
          code="TURN STABLE"
          title="Stabilny interfejs"
          description="Wersja awaryjna: prostsza i sprawdzona. Użyj jej, jeśli w nowym interfejsie coś nie działa — oba pokazują te same turnieje."
          href="/tournaments/stable"
          icon={ShieldCheck}
          accent="primary"
          status="stabilna"
          actionLabel="Otwórz stabilny interfejs →"
        />

        <ProjectCard
          code="TURN EXP"
          title="Nowy interfejs"
          description="Zalecany na start: kreator krok po kroku, panel prowadzenia meczów, ligi i drużyny."
          href="/experimental/tournaments"
          icon={FlaskConical}
          accent="primary"
          status="experimental"
          actionLabel="Otwórz nowy interfejs →"
        />
      </div>
    </ModuleShell>
  );
}
