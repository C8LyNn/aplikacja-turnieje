import { ShieldCheck } from "lucide-react";
import { describeSupportPermissions } from "@/lib/organizer-capabilities";

/**
 * #331 · tells a support person, in plain words, what they may do in this tournament. Everything else stays hidden;
 * if a stale screen still offers an action, the server refuses it with "Brak uprawnienia: …".
 */
export function SupportPermissionsNote({
  nick,
  permissions,
  className = "",
}: {
  nick?: string | null;
  permissions: readonly string[] | null | undefined;
  className?: string;
}) {
  const allowed = describeSupportPermissions(permissions);
  return (
    <p
      className={`support-permissions-note flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground ${className}`}
      data-testid="support-permissions-note"
    >
      <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <span>
        {nick ? <>Jesteś wsparciem jako <strong className="text-foreground">{nick}</strong>. </> : "Jesteś wsparciem. "}
        {allowed.length
          ? <>Możesz: {allowed.join(", ")}. Pozostałe działania wykonuje organizator.</>
          : <>Masz tylko podgląd — zmiany wykonuje organizator.</>}
      </span>
    </p>
  );
}
