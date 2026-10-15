import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";
import { ToolPanel } from "@/components/tool-ui";
import { DrawLabExtracted } from "@/features/randomizers/draw-lab/DrawLabExtracted";

export default function RandomizerProperPage() {
  return (
    <ModuleShell wide>
      <ModuleHeader
        code="DRAW 01"
        title="Losowanie kart"
        description="Zintegrowane właściwe losowanie."
        accent="primary"
        backHref="/randomizers"
        backLabel="Losowania"
        status="aktywne"
      />
      <ToolPanel title="Losowanie" description="Sam silnik pozostaje bez zmian; ujednolicona jest tylko rama narzędzia." flush>
        <DrawLabExtracted />
      </ToolPanel>
    </ModuleShell>
  );
}
