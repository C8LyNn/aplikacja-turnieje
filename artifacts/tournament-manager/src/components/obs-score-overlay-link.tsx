import { ExternalLink, MonitorPlay } from "lucide-react";
import { CopyLinkButton } from "./copy-link-button";
import { OVERLAY_DEFAULTS, overlayUrl } from "@/lib/broadcast-overlay";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

/** The address of the existing score overlay (overlay.html) that follows the current match on its own. */
export function obsScoreOverlayUrl(origin: string, basePath: string, tournamentId: number): string {
  return overlayUrl(origin, basePath, { ...OVERLAY_DEFAULTS, tournamentId, match: "auto" });
}

/**
 * QW-07 · Classic gets the score overlay that Modern has had since V5.9 ("Transmisja"): one ready address for an
 * OBS Browser Source, nothing to configure. It is the same overlay page, not a second one; the full set of
 * options (look, table and bracket, upcoming card) stays in Modern → Więcej → Transmisja.
 */
export function ObsScoreOverlayLink({ tournamentId, visibility }: { tournamentId: number; visibility: string }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const local = typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname);
  const url = obsScoreOverlayUrl(origin, import.meta.env?.BASE_URL ?? "/", tournamentId);
  const isPublic = visibility === "public_online";
  return (
    <div className="space-y-1.5" data-testid="obs-score-overlay">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MonitorPlay className="w-3.5 h-3.5" />
        Nakładka wyniku OBS (Browser Source)
      </div>
      <div className="flex flex-wrap items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 border border-border/50">
        <span className="text-xs text-foreground/80 truncate flex-1 min-w-0 font-mono" data-testid="obs-score-overlay-url">{url}</span>
        <CopyLinkButton text={url} label="Kopiuj adres nakładki wyniku" />
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <ExternalLink className="w-3 h-3" /> Podgląd
        </a>
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Pokazuje aktualny mecz, wynik i rundę na przezroczystym tle i odświeża się sama. W OBS: Źródła → + → Przeglądarka →
        wklej adres, szerokość 1920, wysokość 1080.
      </p>
      {!isPublic && (
        <p role="status" className="text-[11px] leading-snug text-amber-500">
          Nakładka działa tylko dla turniejów publicznych — przy obecnej widoczności pokaże komunikat zamiast wyniku.
        </p>
      )}
      {local && (
        <p className="text-[11px] leading-snug text-muted-foreground">
          Ten adres działa tylko na tym komputerze (OBS musi być uruchomiony tutaj).
        </p>
      )}
    </div>
  );
}
