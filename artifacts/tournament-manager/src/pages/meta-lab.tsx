import { Sparkles } from "lucide-react";
import { EmptyProjectCard, ModuleHeader, ModuleShell } from "@/components/portfolio-ui";
import { ToolEmptyState, ToolPanel } from "@/components/tool-ui";

export default function MetaLabPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="META"
        title="Meta Lab / Teamcomp Builder"
        description="Analiza mety i eksperymentalne narzędzia kompozycji drużyn."
        accent="rose"
        status="plan"
      />

      <div className="space-y-4">
        <ToolPanel
          title="Teamcomp Builder"
          description="Pierwsze właściwe narzędzie Meta Lab będzie korzystać ze wspólnego interfejsu roboczego."
          actions={<Sparkles className="h-5 w-5 text-rose-400" />}
        >
          <ToolEmptyState
            title="Moduł jest przygotowany, ale jeszcze pusty"
            description="Docelowo tutaj pojawi się wybór bohaterów, profil drużyny, synergie i kompromisy."
          />
        </ToolPanel>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <EmptyProjectCard label="Kolejne narzędzie" />
          <EmptyProjectCard label="Kolejne narzędzie" />
          <EmptyProjectCard label="Kolejne narzędzie" />
        </div>
      </div>
    </ModuleShell>
  );
}
