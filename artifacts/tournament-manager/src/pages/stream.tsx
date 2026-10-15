import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";
import { ObsLab } from "@/features/streaming/obs-lab/ObsLab";

export default function StreamPage() {
  return (
    <ModuleShell wide>
      <ModuleHeader
        code="OBS"
        title="OBS / Stream"
        description="Overlaye, browser source'y i narzędzia transmisyjne."
        accent="fuchsia"
      />
      <ObsLab />
    </ModuleShell>
  );
}
