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
        title="Ludologia"
        description="Narzędzia do porządkowania i analizowania informacji o grach."
        accent="amber"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ProjectCard
          code="LUDO 01"
          title="Kategoryzacja gier"
          description="Katalog Steam i system pięciu perspektyw."
          href="/ludology/game-classification"
          icon={Gamepad2}
          accent="amber"
          status="aktywne"
        />
        <ProjectCard
          code="LUDO 02"
          title="Kategoryzacja wypowiedzi i poglądów"
          description="Źródłowe kodowanie publicznych wypowiedzi, tez i stanowisk."
          href="/ludology/statement-classification"
          icon={MessagesSquare}
          accent="amber"
          status="fundament"
        />
      </div>
    </ModuleShell>
  );
}
