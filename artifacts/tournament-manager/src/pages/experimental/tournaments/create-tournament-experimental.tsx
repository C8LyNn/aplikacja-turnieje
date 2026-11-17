import { ExperimentalCreateWizard } from "@/features/experimental-tournaments/experimental-create-wizard";
import { ExperimentalOrganizerGuard } from "@/features/experimental-tournaments/experimental-organizer-guard";
import { ExperimentalTournamentShell } from "@/features/experimental-tournaments/experimental-tournament-shell";

/** V5 · Experimental creation starts with the guided wizard; the full form lives at /new/advanced. */
export default function CreateTournamentExperimental() {
  return (
    <ExperimentalOrganizerGuard>
      <ExperimentalTournamentShell compact>
        <ExperimentalCreateWizard />
      </ExperimentalTournamentShell>
    </ExperimentalOrganizerGuard>
  );
}
