import { Link } from "wouter";
import { Button } from "@/components/ui/button";

/** Existing passwordless owners must establish a durable credential while they still have access. */
export function OrganizerRecoveryNotice({ tournamentId }: { tournamentId: number }) {
  return (
    <section aria-label="Zabezpiecz dostęp organizatora" className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-2">
      <p className="font-semibold">Zabezpiecz dostęp organizatora</p>
      <p className="text-sm">
        Ten turniej nie ma hasła organizatora. Po utracie tej sesji nie odzyskasz
        dostępu samodzielnie. Ustaw i zachowaj hasło, aby wrócić także z innej przeglądarki.
      </p>
      <Button asChild size="sm"><Link href={`/tournaments/${tournamentId}?tab=security`}>Ustaw hasło organizatora</Link></Button>
    </section>
  );
}
