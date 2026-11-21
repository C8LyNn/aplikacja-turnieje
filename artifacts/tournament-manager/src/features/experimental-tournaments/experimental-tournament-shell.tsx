import { t } from "@/i18n";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";

const defaultDescription = () => t("experimentalTournamentShell.podaj_nazwe_i_format_uczestnikow");

/**
 * V5.4: creation screens use `compact` — a slim back link instead of the large module header, because
 * the wizard's own header already says where you are (V5.4-002: the format step fits on one screen).
 */
export function ExperimentalTournamentShell({
  children,
  description = defaultDescription(),
  compact = false,
}: {
  children: ReactNode;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className="experimental-tournament-create" data-compact={compact ? "true" : undefined}>
      <ModuleShell>
        {compact ? (
          <nav className="experimental-create-crumbs" aria-label={t("experimentalTournamentShell.nawigacja")}>
            <Link href="/experimental/tournaments/dashboard" className="experimental-create-back">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("experimentalTournamentShell.twoje_turnieje")}</Link>
          </nav>
        ) : (
          <ModuleHeader
            code={t("experimentalTournamentShell.turnieje")}
            title={t("experimentalTournamentShell.nowy_turniej")}
            description={description}
            accent="primary"
            backHref="/experimental/tournaments/dashboard"
            backLabel={t("experimentalTournamentShell.twoje_turnieje")}
          />
        )}
        {children}
      </ModuleShell>
    </div>
  );
}
