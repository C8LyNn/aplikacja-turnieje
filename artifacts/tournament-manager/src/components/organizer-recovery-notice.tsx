import { t } from "@/i18n";
import { useId } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { tournamentHref, useExperimentalTournamentMode } from "@/features/experimental-tournaments/experimental-tournament-routing";

/** Existing passwordless owners must establish a durable credential while they still have access. */
export function OrganizerRecoveryNotice({ tournamentId }: { tournamentId: number }) {
  const experimental = useExperimentalTournamentMode();
  const headingId = useId();
  const descriptionId = useId();
  return (
    <section aria-labelledby={headingId} aria-describedby={descriptionId} className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-2">
      <h2 id={headingId} className="font-semibold">{t("organizerRecoveryNotice.zabezpiecz_dostep_organizatora")}</h2>
      <p id={descriptionId} className="text-sm">{t("organizerRecoveryNotice.ten_turniej_nie_ma_hasla")}</p>
      <Button asChild size="sm"><Link href={tournamentHref(tournamentId, experimental, "?tab=security")}>{t("organizerRecoveryNotice.ustaw_haslo_organizatora")}</Link></Button>
    </section>
  );
}
