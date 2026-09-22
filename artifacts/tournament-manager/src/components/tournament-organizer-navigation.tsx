import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OrganizerCapabilities } from "@/lib/organizer-capabilities";

export type OrganizerArea =
  | "conducting"
  | "stages"
  | "baskets"
  | "players"
  | "bracket"
  | "standings"
  | "history"
  | "correction"
  | "sharing"
  | "backup"
  | "game-rules"
  | "visuals"
  | "security";

export type TournamentManagementRole = "organizer" | "support";
export type OrganizerDetailTab =
  | "overview"
  | "stages"
  | "baskets"
  | "players"
  | "matches"
  | "bracket"
  | "standings"
  | "history"
  | "sharing"
  | "backup"
  | "game-rules"
  | "visuals"
  | "security";
export type OrganizerHostTab = "prowadzenie" | "wyniki" | "tabela" | "drabinka" | "korekta";

const readOnlyDetailTabs = ["overview", "stages", "baskets", "players", "matches", "bracket", "standings", "history"] as const;
const hostTabs = ["prowadzenie", "wyniki", "tabela", "drabinka", "korekta"] as const;

export function organizerDetailTab(
  search: string,
  capabilities: OrganizerCapabilities,
): OrganizerDetailTab {
  const requested = new URLSearchParams(search).get("tab");
  if (readOnlyDetailTabs.includes(requested as (typeof readOnlyDetailTabs)[number])) {
    return requested as OrganizerDetailTab;
  }
  if (requested === "game-rules" && capabilities.canManageOrganizerSettings) return requested;
  if (requested === "visuals" && capabilities.canManageOrganizerSettings) return requested;
  if (requested === "sharing" && capabilities.canManageSharing) return requested;
  if (requested === "backup" && capabilities.canManageBackup) return requested;
  if (requested === "security" && capabilities.canManageOrganizerSettings) return requested;
  return capabilities.canViewOrganizerNavigation ? "stages" : "overview";
}

export function organizerHostTab(
  search: string,
  capabilities: OrganizerCapabilities,
): OrganizerHostTab {
  const requested = new URLSearchParams(search).get("tab");
  if (!hostTabs.includes(requested as (typeof hostTabs)[number])) return "prowadzenie";
  if (requested === "korekta" && !capabilities.canUndo) return "prowadzenie";
  return requested as OrganizerHostTab;
}

export function legacyMatchesRedirectTarget(
  tournamentId: number,
  search: string,
  capabilities: OrganizerCapabilities,
): string | null {
  return new URLSearchParams(search).get("tab") === "matches" && capabilities.canAccessConducting
    ? `/tournaments/${tournamentId}/host?tab=prowadzenie`
    : null;
}

export function useLegacyMatchesRedirect(
  tournamentId: number,
  search: string,
  capabilities: OrganizerCapabilities,
): void {
  const [, navigate] = useLocation();
  useEffect(() => {
    const target = legacyMatchesRedirectTarget(tournamentId, search, capabilities);
    if (target) navigate(target, { replace: true });
  }, [capabilities, navigate, search, tournamentId]);
}

export function organizerAreaForDetailTab(tab: OrganizerDetailTab): OrganizerArea {
  if (tab === "overview") return "stages";
  if (tab === "matches") return "conducting";
  return tab as OrganizerArea;
}

export function organizerAreaForHostTab(tab: OrganizerHostTab): OrganizerArea {
  if (tab === "tabela") return "standings";
  if (tab === "drabinka") return "bracket";
  if (tab === "korekta") return "correction";
  return "conducting";
}

export function organizerNavigationItems(tournamentId: number) {
  return [
    { area: "conducting" as const, label: "Prowadzenie", href: `/tournaments/${tournamentId}/host?tab=prowadzenie` },
    { area: "stages" as const, label: "Etapy", href: `/tournaments/${tournamentId}?tab=stages` },
    { area: "baskets" as const, label: "Koszyki", href: `/tournaments/${tournamentId}?tab=baskets` },
    { area: "players" as const, label: "Gracze", href: `/tournaments/${tournamentId}?tab=players` },
    { area: "bracket" as const, label: "Drabinka", href: `/tournaments/${tournamentId}?tab=bracket` },
    { area: "standings" as const, label: "Tabela", href: `/tournaments/${tournamentId}?tab=standings` },
  ];
}

export function organizerMoreItems(
  tournamentId: number,
  capabilities: OrganizerCapabilities,
) {
  const items: Array<{ area: OrganizerArea; label: string; href: string }> = [
    { area: "history", label: "Historia", href: `/tournaments/${tournamentId}?tab=history` },
  ];
  if (capabilities.canManageOrganizerSettings) {
    items.push({ area: "game-rules", label: "Reguły gry", href: `/tournaments/${tournamentId}?tab=game-rules` });
    items.push({ area: "visuals", label: "Wizualia", href: `/tournaments/${tournamentId}?tab=visuals` });
  }
  if (capabilities.canUndo) {
    items.push({ area: "correction", label: "Korekta", href: `/tournaments/${tournamentId}/host?tab=korekta` });
  }
  if (capabilities.canManageSharing) {
    items.push({ area: "sharing", label: "Udostępnianie", href: `/tournaments/${tournamentId}?tab=sharing` });
  }
  if (capabilities.canManageBackup) {
    items.push({ area: "backup", label: "Backup", href: `/tournaments/${tournamentId}?tab=backup` });
  }
  if (capabilities.canManageOrganizerSettings) {
    items.push({ area: "security", label: "Bezpieczeństwo", href: `/tournaments/${tournamentId}?tab=security` });
  }
  return items;
}

export function TournamentOrganizerNavigation({
  tournamentId,
  active,
  capabilities,
}: {
  tournamentId: number;
  active: OrganizerArea;
  capabilities: OrganizerCapabilities;
}) {
  const mainActiveRef = useRef<HTMLAnchorElement>(null);
  const moreActiveRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    (moreActiveRef.current ?? mainActiveRef.current)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);
  const main = organizerNavigationItems(tournamentId);
  const more = organizerMoreItems(tournamentId, capabilities);
  const moreActive = more.some((item) => item.area === active);
  return (
    <nav aria-label="Nawigacja organizatora turnieju" className="organizer-navigation rounded-lg border bg-card">
      <div className="flex items-stretch overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
        {main.map((item) => (
          <Link
            key={item.area}
            href={item.href}
            ref={item.area === active ? mainActiveRef : undefined}
            aria-current={item.area === active ? "page" : undefined}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary ${
              item.area === active
                ? "border-primary bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
        {more.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                ref={moreActive ? moreActiveRef : undefined}
                variant="ghost"
                className={`h-auto shrink-0 rounded-none border-b-2 px-4 py-3 ${moreActive ? "border-primary bg-primary/10 text-primary" : "border-transparent"}`}
                aria-label="Więcej obszarów turnieju"
                aria-current={moreActive ? "page" : undefined}
              >
                Więcej <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {more.map((item) => (
                <DropdownMenuItem key={item.area} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}
