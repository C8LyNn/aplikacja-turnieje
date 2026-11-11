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
      <h2 id={headingId} className="font-semibold">Zabezpiecz dostęp organizatora</h2>
      <p id={descriptionId} className="text-sm">
        Ten turniej nie ma hasła organizatora. Po utracie tej sesji nie odzyskasz
        dostępu samodzielnie. Ustaw i zachowaj hasło, aby wrócić także z innej przeglądarki.
      </p>
      <Button asChild size="sm"><Link href={tournamentHref(tournamentId, experimental, "?tab=security")}>Ustaw hasło organizatora</Link></Button>
    </section>
  );
}
