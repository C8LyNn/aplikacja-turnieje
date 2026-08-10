/**
 * Shared components for displaying Deadlock hero bans and per-game picks.
 *
 * Visual distinction (intentional shape + colour difference):
 *   Bans  → rounded-rect (square-ish) frame with solid RED ring  — no slash, portrait fully visible
 *   Picks → circular frame with CYAN ring
 */
import { useState } from "react";
import { getDeadlockHero, DEADLOCK_HEROES, type DeadlockHeroDefinition } from "@workspace/game-catalog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Internal hero image — shape controlled by parent wrapper
// ---------------------------------------------------------------------------

function HeroImg({
  hero,
  size = 20,
  className,
}: {
  hero: DeadlockHeroDefinition;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const base = import.meta.env?.BASE_URL ?? "/";
  const url = `${base.replace(/\/$/, "")}/${hero.iconKey.replace(/^\//, "")}`;

  if (failed) {
    return (
      <span
        className={cn(
          "flex items-center justify-center bg-muted font-bold text-muted-foreground select-none w-full h-full",
          className,
        )}
        style={{ fontSize: Math.max(7, size * 0.38) }}
        aria-label={hero.displayName}
      >
        {hero.displayName.substring(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={hero.displayName}
      className={cn("w-full h-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}

// ---------------------------------------------------------------------------
// BAN ICON — rounded-rect RED ring, portrait fully visible, no slash
// ---------------------------------------------------------------------------

export function BanIcon({
  heroId,
  size = 20,
  title,
}: {
  heroId: string;
  size?: number;
  title?: string;
}) {
  const hero = getDeadlockHero(heroId as never);
  if (!hero) return null;

  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden rounded-[4px] ring-2 ring-destructive"
      style={{ width: size, height: size }}
      title={title ?? `Ban: ${hero.displayName}`}
      aria-label={`Zbanowany: ${hero.displayName}`}
    >
      <HeroImg hero={hero} size={size} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// PICK ICON — circular CYAN ring, no slash
// ---------------------------------------------------------------------------

export function PickIcon({
  heroId,
  size = 20,
  title,
  invalid = false,
}: {
  heroId: string | null | undefined;
  size?: number;
  title?: string;
  /** true = this pick violates opponent bans — show red ring + warning badge */
  invalid?: boolean;
}) {
  if (!heroId) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-muted/40 border border-dashed border-muted-foreground/30 text-muted-foreground/40 shrink-0"
        style={{ width: size, height: size }}
        title={title ?? "Brak picka"}
        aria-label="Brak picka"
      >
        <span style={{ fontSize: Math.max(6, size * 0.4) }}>?</span>
      </span>
    );
  }
  const hero = getDeadlockHero(heroId as never);
  if (!hero) return null;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full",
        invalid ? "ring-2 ring-destructive" : "ring-1 ring-cyan-500/70",
      )}
      style={{ width: size, height: size }}
      title={title ?? hero.displayName}
    >
      <HeroImg hero={hero} size={size} />
      {invalid && (
        <span
          className="absolute -top-0.5 -right-0.5 bg-destructive text-white rounded-full flex items-center justify-center font-bold leading-none pointer-events-none z-10"
          style={{
            width: Math.max(8, Math.round(size * 0.38)),
            height: Math.max(8, Math.round(size * 0.38)),
            fontSize: Math.max(5, Math.round(size * 0.26)),
          }}
          aria-hidden
        >
          !
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// PLAYER BANS ROW — compact row of up to 5 ban icons with label
// ---------------------------------------------------------------------------

export function PlayerBansRow({
  bannedHeroIds,
  size = 20,
  className,
}: {
  bannedHeroIds: string[];
  size?: number;
  className?: string;
}) {
  if (!bannedHeroIds || bannedHeroIds.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span
        className="text-[10px] font-semibold text-destructive/80 shrink-0 leading-none"
        aria-label="Zbanowane postacie"
      >
        Bany:
      </span>
      <div className="flex items-center gap-0.5">
        {bannedHeroIds.slice(0, 5).map((id) => (
          <BanIcon key={id} heroId={id} size={size} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GAME PICKS ROW — "Gn: [p1icon] vs [p2icon]" for history / match summary
// Pass ban arrays to flag illegal picks (e.g. pre-existing invalid data).
//   player1BannedByOpponent = p2's bans (p1 must not pick these)
//   player2BannedByOpponent = p1's bans (p2 must not pick these)
// ---------------------------------------------------------------------------

export function GamePicksRow({
  gameNumber,
  player1HeroId,
  player2HeroId,
  player1Name,
  player2Name,
  size = 20,
  showEmpty = false,
  player1BannedByOpponent,
  player2BannedByOpponent,
}: {
  gameNumber: number;
  player1HeroId: string | null | undefined;
  player2HeroId: string | null | undefined;
  player1Name?: string | null;
  player2Name?: string | null;
  size?: number;
  /** Render a placeholder row even when no heroes are recorded. */
  showEmpty?: boolean;
  /** Bans held by player 2 — player 1 cannot legally pick these. */
  player1BannedByOpponent?: string[];
  /** Bans held by player 1 — player 2 cannot legally pick these. */
  player2BannedByOpponent?: string[];
}) {
  const hero1 = player1HeroId ? getDeadlockHero(player1HeroId as never) : null;
  const hero2 = player2HeroId ? getDeadlockHero(player2HeroId as never) : null;

  const p1Invalid =
    !!player1HeroId &&
    !!player1BannedByOpponent &&
    player1BannedByOpponent.includes(player1HeroId);
  const p2Invalid =
    !!player2HeroId &&
    !!player2BannedByOpponent &&
    player2BannedByOpponent.includes(player2HeroId);

  if (!hero1 && !hero2) {
    if (!showEmpty) return null;
    return (
      <span className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground/60 font-mono w-5 shrink-0">G{gameNumber}</span>
        <span className="text-[10px] text-muted-foreground/30 italic">brak picka</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground/60 font-mono w-5 shrink-0">G{gameNumber}</span>
      <PickIcon
        heroId={player1HeroId}
        size={size}
        invalid={p1Invalid}
        title={
          hero1
            ? `${player1Name ?? "Zawodnik A"}: ${hero1.displayName}${p1Invalid ? " ⚠️ ZBANOWANA przez przeciwnika!" : ""}`
            : undefined
        }
      />
      <span className="text-[9px] text-muted-foreground/40">vs</span>
      <PickIcon
        heroId={player2HeroId}
        size={size}
        invalid={p2Invalid}
        title={
          hero2
            ? `${player2Name ?? "Zawodnik B"}: ${hero2.displayName}${p2Invalid ? " ⚠️ ZBANOWANA przez przeciwnika!" : ""}`
            : undefined
        }
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// HERO PICKER GRID — multi-select for setting tournament bans
// Selected heroes use rounded-rect + red ring to match BanIcon style.
// ---------------------------------------------------------------------------

export function HeroPickerGrid({
  selectedIds,
  maxSelect,
  onToggle,
  size = 32,
  className,
}: {
  selectedIds: string[];
  maxSelect: number;
  onToggle: (heroId: string) => void;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 p-2 bg-muted/20 rounded border border-border/40",
        className,
      )}
    >
      {DEADLOCK_HEROES.map((hero) => {
        const isSelected = selectedIds.includes(hero.id);
        const isDisabled = !isSelected && selectedIds.length >= maxSelect;
        return (
          <button
            key={hero.id}
            type="button"
            onClick={() => onToggle(hero.id)}
            disabled={isDisabled}
            title={hero.displayName}
            className={cn(
              "relative overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0",
              isSelected
                ? "rounded-[4px] ring-2 ring-destructive"
                : "rounded-full",
              isDisabled && "opacity-30 cursor-not-allowed",
              !isSelected && !isDisabled && "opacity-70 hover:opacity-100 hover:ring-1 hover:ring-muted-foreground/50",
            )}
            style={{ width: size, height: size }}
          >
            <HeroImg hero={hero} size={size} />
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HERO SELECTOR BUTTON — single pick slot (organizer picks hero per game)
// bannedByOpponent: hero IDs banned by opponent — these are disabled in the list
// opponentName: used in tooltip/notice for clarity
// No auto-default: if heroId is null/undefined, shows placeholder text only
// ---------------------------------------------------------------------------

export function HeroSelectorButton({
  heroId,
  onSelect,
  placeholder = "Wybierz postać",
  size = 24,
  variant = "pick",
  bannedByOpponent = [],
  opponentName,
}: {
  heroId: string | null | undefined;
  onSelect: (heroId: string | null) => void;
  placeholder?: string;
  size?: number;
  variant?: "pick" | "ban";
  /** Hero IDs banned by the opponent — these are blocked in the dropdown. */
  bannedByOpponent?: string[];
  /** Opponent's display name for tooltip messages. */
  opponentName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const hero = heroId ? getDeadlockHero(heroId as never) : null;
  const currentIsBanned = !!heroId && bannedByOpponent.includes(heroId);
  const banLabel = opponentName
    ? `Zbanowana przez ${opponentName}`
    : "Zbanowana przez przeciwnika";

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={currentIsBanned ? `⚠️ ${banLabel}` : undefined}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-colors",
          currentIsBanned
            ? "border-destructive/70 bg-destructive/10 text-destructive"
            : open
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 bg-background hover:bg-muted/30",
        )}
      >
        {hero ? (
          <>
            {variant === "ban" ? (
              <BanIcon heroId={hero.id} size={size} />
            ) : (
              <PickIcon heroId={hero.id} size={size} invalid={currentIsBanned} />
            )}
            <span className="max-w-[80px] truncate text-foreground">{hero.displayName}</span>
            {currentIsBanned && (
              <span className="text-[9px] font-bold text-destructive leading-none ml-0.5">
                BAN!
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground italic text-xs">{placeholder}</span>
        )}
        <span className="text-muted-foreground/50 ml-0.5">▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 p-2 bg-popover border rounded-lg shadow-xl w-72">
          {/* Clear button — only when a hero is selected */}
          {hero && (
            <button
              type="button"
              className="w-full text-left text-xs px-2 py-1 mb-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
              onClick={() => { onSelect(null); setOpen(false); }}
            >
              ✕ Wyczyść wybór
            </button>
          )}
          {/* Ban notice */}
          {bannedByOpponent.length > 0 && (
            <p className="text-[10px] text-destructive/70 px-1 mb-1.5 leading-snug border-b border-destructive/20 pb-1.5">
              🚫 Postaci zbanowane przez{opponentName ? ` ${opponentName}` : " przeciwnika"} są
              zablokowane i nie mogą być wybrane
            </p>
          )}
          {/* Hero grid */}
          <div className="flex flex-wrap gap-1 max-h-52 overflow-y-auto">
            {DEADLOCK_HEROES.map((h) => {
              const isBanned = bannedByOpponent.includes(h.id);
              const isSelected = h.id === heroId;
              return (
                <button
                  key={h.id}
                  type="button"
                  disabled={isBanned}
                  onClick={() => { onSelect(h.id); setOpen(false); }}
                  title={isBanned ? `${h.displayName} — ${banLabel}` : h.displayName}
                  className={cn(
                    "relative overflow-hidden transition-all shrink-0",
                    // Selected picks are cyan-circular; selected bans are red-rect
                    isSelected && variant !== "ban" && "rounded-full ring-2 ring-cyan-500",
                    isSelected && variant === "ban" && "rounded-[4px] ring-2 ring-destructive",
                    // Banned by opponent: red-rect dim, not clickable
                    isBanned && !isSelected && "rounded-[4px] ring-1 ring-destructive/40 opacity-35 cursor-not-allowed",
                    // Normal unselected
                    !isSelected && !isBanned && "rounded-full opacity-70 hover:opacity-100 hover:ring-1 hover:ring-muted-foreground/40",
                  )}
                  style={{ width: 28, height: 28 }}
                >
                  <HeroImg hero={h} size={28} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
