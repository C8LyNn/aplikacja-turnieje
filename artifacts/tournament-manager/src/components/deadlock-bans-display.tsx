/**
 * Shared components for displaying Deadlock hero bans and per-game picks.
 *
 * Visual distinction:
 *   Bans  → red ring + diagonal slash overlay (🚫 style)
 *   Picks → cyan/primary ring, no overlay
 */
import { useState } from "react";
import { getDeadlockHero, DEADLOCK_HEROES, type DeadlockHeroDefinition } from "@workspace/game-catalog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared: single hero icon
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
          "flex items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground select-none",
          className,
        )}
        style={{ width: size, height: size, fontSize: Math.max(7, size * 0.38) }}
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
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}

// ---------------------------------------------------------------------------
// Ban icon: red ring + diagonal slash
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
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
      title={title ?? `Ban: ${hero.displayName}`}
    >
      <HeroImg
        hero={hero}
        size={size}
        className="ring-1 ring-destructive/70 grayscale-[40%]"
      />
      {/* Diagonal slash */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, transparent 40%, rgba(220,38,38,0.55) 40%, rgba(220,38,38,0.55) 60%, transparent 60%)",
        }}
        aria-hidden
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pick icon: cyan ring, highlighted
// ---------------------------------------------------------------------------

export function PickIcon({
  heroId,
  size = 20,
  title,
}: {
  heroId: string | null | undefined;
  size?: number;
  title?: string;
}) {
  if (!heroId) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-muted/40 border border-dashed border-muted-foreground/30 text-muted-foreground/40 shrink-0"
        style={{ width: size, height: size }}
        title={title ?? "Brak picka"}
        aria-label="Brak picka"
      >
        <span style={{ fontSize: size * 0.4 }}>?</span>
      </span>
    );
  }
  const hero = getDeadlockHero(heroId as never);
  if (!hero) return null;
  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
      title={title ?? hero.displayName}
    >
      <HeroImg
        hero={hero}
        size={size}
        className="ring-1 ring-cyan-500/70"
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compact ban row: up to 5 ban icons with label
// ---------------------------------------------------------------------------

export function PlayerBansRow({
  bannedHeroIds,
  size = 18,
  className,
}: {
  bannedHeroIds: string[];
  size?: number;
  className?: string;
}) {
  if (!bannedHeroIds || bannedHeroIds.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-[10px] font-semibold text-destructive/80 shrink-0 leading-none">
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
// Per-game picks row (for history): "Gra N: [p1icon] vs [p2icon]"
// ---------------------------------------------------------------------------

export function GamePicksRow({
  gameNumber,
  player1HeroId,
  player2HeroId,
  player1Name,
  player2Name,
  size = 16,
  showEmpty = false,
}: {
  gameNumber: number;
  player1HeroId: string | null | undefined;
  player2HeroId: string | null | undefined;
  player1Name?: string | null;
  player2Name?: string | null;
  size?: number;
  /** When true, renders a placeholder row even if no heroes were recorded. */
  showEmpty?: boolean;
}) {
  const hero1 = player1HeroId ? getDeadlockHero(player1HeroId as never) : null;
  const hero2 = player2HeroId ? getDeadlockHero(player2HeroId as never) : null;

  if (!hero1 && !hero2) {
    if (!showEmpty) return null;
    return (
      <span className="flex items-center gap-1">
        <span className="text-[9px] text-muted-foreground/60 font-mono shrink-0">G{gameNumber}</span>
        <span className="text-[9px] text-muted-foreground/30 italic">brak picka</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <span className="text-[9px] text-muted-foreground/60 font-mono shrink-0">G{gameNumber}</span>
      <PickIcon
        heroId={player1HeroId}
        size={size}
        title={hero1 ? `${player1Name ?? "Zawodnik A"}: ${hero1.displayName}` : undefined}
      />
      <span className="text-[8px] text-muted-foreground/40">vs</span>
      <PickIcon
        heroId={player2HeroId}
        size={size}
        title={hero2 ? `${player2Name ?? "Zawodnik B"}: ${hero2.displayName}` : undefined}
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Hero picker grid (for organizer editing bans or picks)
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
              "relative rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isSelected && "ring-2 ring-destructive",
              isDisabled && "opacity-30 cursor-not-allowed",
              !isSelected && !isDisabled && "opacity-70 hover:opacity-100 hover:ring-2 hover:ring-muted-foreground/50",
            )}
            style={{ width: size, height: size }}
          >
            <HeroImg hero={hero} size={size} />
            {isSelected && (
              <span
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 40%, rgba(220,38,38,0.55) 40%, rgba(220,38,38,0.55) 60%, transparent 60%)",
                }}
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single hero selector button (for organizer picking one hero per slot)
// ---------------------------------------------------------------------------

export function HeroSelectorButton({
  heroId,
  onSelect,
  placeholder = "Wybierz postać",
  size = 24,
  variant = "pick",
}: {
  heroId: string | null | undefined;
  onSelect: (heroId: string | null) => void;
  placeholder?: string;
  size?: number;
  variant?: "pick" | "ban";
}) {
  const [open, setOpen] = useState(false);
  const hero = heroId ? getDeadlockHero(heroId as never) : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-colors",
          open
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 bg-background hover:bg-muted/30",
        )}
      >
        {hero ? (
          <>
            {variant === "ban" ? (
              <BanIcon heroId={hero.id} size={size} />
            ) : (
              <PickIcon heroId={hero.id} size={size} />
            )}
            <span className="max-w-[80px] truncate text-foreground">{hero.displayName}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <span className="text-muted-foreground/50 ml-0.5">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 p-2 bg-popover border rounded-lg shadow-xl w-64">
          {hero && (
            <button
              type="button"
              className="w-full text-left text-xs px-2 py-1 mb-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
              onClick={() => { onSelect(null); setOpen(false); }}
            >
              ✕ Wyczyść wybór
            </button>
          )}
          <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
            {DEADLOCK_HEROES.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => { onSelect(h.id); setOpen(false); }}
                title={h.displayName}
                className={cn(
                  "rounded-full transition-all",
                  h.id === heroId
                    ? (variant === "ban" ? "ring-2 ring-destructive" : "ring-2 ring-cyan-500")
                    : "opacity-70 hover:opacity-100 hover:ring-2 hover:ring-muted-foreground/40",
                )}
                style={{ width: 28, height: 28 }}
              >
                <HeroImg hero={h} size={28} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
