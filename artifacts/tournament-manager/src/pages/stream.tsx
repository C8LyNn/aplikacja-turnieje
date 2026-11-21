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
      {/* #324-L04: tournament overlays live with the tournament; this page holds the experiments */}
      <p className="mb-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground" data-testid="stream-tournament-note">
        Nakładki turniejowe (wynik, następny mecz, zwycięzca, tabela i drabinka, alerty) ustawisz w swoim turnieju: <strong>Więcej → Transmisja</strong>.
        Tu są eksperymenty: kamerka z czatem (przykładowe wiadomości) i edytor efektów.
      </p>
      <ObsLab />
    </ModuleShell>
  );
}
