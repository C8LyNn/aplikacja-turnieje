import { t } from "@/i18n";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";
import { ObsLab } from "@/features/streaming/obs-lab/ObsLab";

export default function StreamPage() {
  return (
    <ModuleShell wide>
      <ModuleHeader
        code="OBS"
        title={t("stream.obs_stream")}
        description={t("stream.overlaye_browser_source_y_i")}
        accent="fuchsia"
      />
      {/* #324-L04: tournament overlays live with the tournament; this page holds the experiments */}
      <p className="mb-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground" data-testid="stream-tournament-note">{t("stream.nakladki_turniejowe_wynik_nastepny_mecz")}{" "}<strong>{t("stream.wiecej_transmisja")}</strong>{t("stream.tu_sa_eksperymenty_kamerka_z")}</p>
      <ObsLab />
    </ModuleShell>
  );
}
