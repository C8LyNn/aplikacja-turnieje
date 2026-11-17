import { ExperimentalAdvancedEditor } from "@/features/experimental-tournaments/experimental-advanced-editor";
import { ExperimentalOrganizerGuard } from "@/features/experimental-tournaments/experimental-organizer-guard";
import { ExperimentalTournamentShell } from "@/features/experimental-tournaments/experimental-tournament-shell";

/**
 * V5.4 · the advanced editor shares the wizard's draft and preset engine, so the format it shows is
 * always the format that will be saved (V5.4-001).
 */
export default function CreateTournamentExperimentalAdvanced() {
  return (
    <ExperimentalOrganizerGuard>
      <ExperimentalTournamentShell compact>
        <ExperimentalAdvancedEditor />
      </ExperimentalTournamentShell>
    </ExperimentalOrganizerGuard>
  );
}
