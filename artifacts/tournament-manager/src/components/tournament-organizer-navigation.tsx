import { t } from "@/i18n";
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
import { isExperimentalTournamentPath, tournamentModeHref } from "@/features/experimental-tournaments/experimental-tournament-routing";

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
  | "security"
  | "broadcast";

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
  | "security"
  | "broadcast";
export type OrganizerHostTab = "prowadzenie" | "wyniki" | "tabela" | "drabinka" | "korekta";

const readOnlyDetailTabs = ["overview", "stages", "baskets", "players", "matches", "bracket", "standings", "history"] as const;
const hostTabs = ["prowadzenie", "wyniki", "tabela", "drabinka", "korekta"] as const; // i18n-ignore: tab ids in links

export function organizerDetailTab(
  search: string,
  capabilities: OrganizerCapabilities,
  options: { experimental?: boolean } = {},
): OrganizerDetailTab {
  const requested = new URLSearchParams(search).get("tab");
  if (readOnlyDetailTabs.includes(requested as (typeof readOnlyDetailTabs)[number])) {
    return requested as OrganizerDetailTab;
  }
  if (requested === "game-rules" && capabilities.canManageOrganizerSettings) return requested;
  if (requested === "visuals" && (capabilities.canManageOrganizerSettings || capabilities.canEditPresentation)) return requested;
  if (requested === "sharing" && capabilities.canManageSharing) return requested;
  if (requested === "backup" && capabilities.canManageBackup) return requested;
  if (requested === "security" && capabilities.canManageOrganizerSettings) return requested;
  // V5.9 · optional broadcast overlays. #324-L04: in both views (one shared panel; Classic got only a single link before).
  if (requested === "broadcast" && capabilities.canAccessConducting) return requested;
  return capabilities.canViewOrganizerNavigation ? "stages" : "overview";
}

export function organizerHostTab(
  search: string,
  capabilities: OrganizerCapabilities,
): OrganizerHostTab {
  const requested = new URLSearchParams(search).get("tab");
  if (!hostTabs.includes(requested as (typeof hostTabs)[number])) return "prowadzenie";  // i18n-ignore
  if (requested === "korekta" && !capabilities.canUndo) return "prowadzenie";  // i18n-ignore
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
  const [location, navigate] = useLocation();
  useEffect(() => {
    const target = legacyMatchesRedirectTarget(tournamentId, search, capabilities);
    if (target) {
      navigate(
        tournamentModeHref(
          target,
          isExperimentalTournamentPath(location),
        ),
        { replace: true },
      );
    }
  }, [capabilities, location, navigate, search, tournamentId]);
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
    { area: "conducting" as const, label: t("tournamentOrganizerNavigation.prowadzenie"), href: `/tournaments/${tournamentId}/host?tab=prowadzenie` },
    { area: "stages" as const, label: t("tournamentOrganizerNavigation.etapy"), href: `/tournaments/${tournamentId}?tab=stages` },
    { area: "baskets" as const, label: t("tournamentOrganizerNavigation.koszyki"), href: `/tournaments/${tournamentId}?tab=baskets` },
    { area: "players" as const, label: t("tournamentOrganizerNavigation.gracze"), href: `/tournaments/${tournamentId}?tab=players` },
    { area: "bracket" as const, label: t("tournamentOrganizerNavigation.drabinka"), href: `/tournaments/${tournamentId}?tab=bracket` },
    { area: "standings" as const, label: t("tournamentOrganizerNavigation.tabela"), href: `/tournaments/${tournamentId}?tab=standings` },
  ];
}

export function organizerMoreItems(
  tournamentId: number,
  capabilities: OrganizerCapabilities,
  options: { broadcast?: boolean } = {},
) {
  const items: Array<{ area: OrganizerArea; label: string; href: string }> = [
    { area: "history", label: t("tournamentOrganizerNavigation.historia"), href: `/tournaments/${tournamentId}?tab=history` },
  ];
  if (capabilities.canManageOrganizerSettings) {
    items.push({ area: "game-rules", label: t("tournamentOrganizerNavigation.reguly_gry"), href: `/tournaments/${tournamentId}?tab=game-rules` });
  }
  // #331: the look of the broadcast can be delegated ("presentation.settings").
  if (capabilities.canManageOrganizerSettings || capabilities.canEditPresentation) {
    items.push({ area: "visuals", label: t("tournamentOrganizerNavigation.wizualia"), href: `/tournaments/${tournamentId}?tab=visuals` });
  }
  if (capabilities.canUndo) {
    items.push({ area: "correction", label: t("tournamentOrganizerNavigation.korekta"), href: `/tournaments/${tournamentId}/host?tab=korekta` });
  }
  if (capabilities.canManageSharing) {
    items.push({ area: "sharing", label: t("tournamentOrganizerNavigation.udostepnianie"), href: `/tournaments/${tournamentId}?tab=sharing` });
  }
  if (options.broadcast && capabilities.canAccessConducting) {
    items.push({ area: "broadcast", label: t("tournamentOrganizerNavigation.transmisja"), href: `/tournaments/${tournamentId}?tab=broadcast` });
  }
  if (capabilities.canManageBackup) {
    items.push({ area: "backup", label: t("tournamentOrganizerNavigation.backup"), href: `/tournaments/${tournamentId}?tab=backup` });
  }
  if (capabilities.canManageOrganizerSettings) {
    items.push({ area: "security", label: t("tournamentOrganizerNavigation.bezpieczenstwo"), href: `/tournaments/${tournamentId}?tab=security` });
  }
  return items;
}

const BRACKET_FORMATS = new Set(["single_elimination", "double_elimination", "swiss"]);
const TABLE_FORMATS = new Set(["round_robin", "group_stage", "swiss"]);

/**
 * V5.8 (Experimental): only the areas that mean something for this tournament's stages. A cup has no table,
 * a league has no bracket, a one-stage event has no baskets between stages. The area the user is on always stays
 * visible, and every address keeps working (Stable shows every area, as before).
 */
export function relevantOrganizerAreas(stages: ReadonlyArray<{ format: string }> | null | undefined): Set<OrganizerArea> | null {
  if (!stages || stages.length === 0) return null;
  const areas = new Set<OrganizerArea>(["conducting", "stages", "players"]);
  if (stages.some((stage) => BRACKET_FORMATS.has(stage.format))) areas.add("bracket");
  if (stages.some((stage) => TABLE_FORMATS.has(stage.format))) areas.add("standings");
  if (stages.length > 1) areas.add("baskets");
  return areas;
}

/** V5.11 (Experimental): the bracket area is named after what it shows for this tournament's stages. */
export function bracketAreaLabel(stages: ReadonlyArray<{ format: string }> | null | undefined): string {
  const formats = new Set((stages ?? []).map((stage) => stage.format));
  const bracket = formats.has("single_elimination") || formats.has("double_elimination");
  if (formats.has("group_stage")) return bracket ? t("tournamentOrganizerNavigation.grupy_i_drabinka") : t("tournamentOrganizerNavigation.grupy");
  if (formats.has("swiss")) return bracket ? t("tournamentOrganizerNavigation.rundy_i_drabinka") : t("tournamentOrganizerNavigation.rundy");
  return t("tournamentOrganizerNavigation.drabinka");
}

export function TournamentOrganizerNavigation({
  tournamentId,
  active,
  capabilities,
  stages,
}: {
  tournamentId: number;
  active: OrganizerArea;
  capabilities: OrganizerCapabilities;
  /** V5.8: the tournament's stages; Experimental hides areas that do not apply to them. */
  stages?: ReadonlyArray<{ format: string }> | null;
}) {
  const [location] = useLocation();
  const isExperimental = isExperimentalTournamentPath(location);
  const mainActiveRef = useRef<HTMLAnchorElement>(null);
  const moreActiveRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    (moreActiveRef.current ?? mainActiveRef.current)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);
  const relevant = isExperimental ? relevantOrganizerAreas(stages) : null;
  const main = organizerNavigationItems(tournamentId)
    .filter((item) => !relevant || relevant.has(item.area) || item.area === active)
    .map((item) => ({
      ...item,
      // V5.8: players and teams are both "Uczestnicy" in Experimental.
      label: isExperimental && item.area === "players" ? t("tournamentOrganizerNavigation.uczestnicy")
        : isExperimental && item.area === "bracket" ? bracketAreaLabel(stages) : item.label,
      href: tournamentModeHref(item.href, isExperimental),
    }));
  const more = organizerMoreItems(tournamentId, capabilities, { broadcast: true }).map((item) => ({
    ...item,
    href: tournamentModeHref(item.href, isExperimental),
  }));
  const moreActiveItem = more.find((item) => item.area === active);
  const moreActive = Boolean(moreActiveItem);
  return (
    <nav aria-label={t("tournamentOrganizerNavigation.nawigacja_organizatora_turnieju")} className="organizer-navigation rounded-lg border bg-card">
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
                className={`min-h-11 shrink-0 rounded-none border-b-2 px-4 py-3 focus-visible:ring-2 focus-visible:ring-primary ${moreActive ? "border-primary bg-primary/10 text-primary" : "border-transparent"}`}
                aria-current={moreActive ? "page" : undefined}
                aria-label={moreActiveItem ? t("tournamentOrganizerNavigation.wiecej_obszarow_turnieju_aktywny_obszar", { label: moreActiveItem.label }) : t("tournamentOrganizerNavigation.wiecej_obszarow_turnieju")}
              >
                {t("tournamentOrganizerNavigation.wiecej")}{" "}<ChevronDown aria-hidden="true" className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {more.map((item) => (
                <DropdownMenuItem key={item.area} asChild>
                  <Link href={item.href} aria-current={item.area === active ? "page" : undefined} className="flex min-h-11 items-center">{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}
