import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";
import { ToolEmptyState, ToolPanel } from "@/components/tool-ui";

export default function VenediMapPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="RES 01 / MAP"
        title="Wenedowie — wizualizacja mapy"
        description="Przestrzeń pod przyszłą wizualizację geograficzną projektu."
        accent="cyan"
        backHref="/research/venedi"
        backLabel="Wenedowie"
        status="puste"
      />

      <ToolPanel>
        <ToolEmptyState
          title="Mapa nie została jeszcze zbudowana"
          description="Na razie ta część projektu pozostaje pusta."
        />
      </ToolPanel>
    </ModuleShell>
  );
}
