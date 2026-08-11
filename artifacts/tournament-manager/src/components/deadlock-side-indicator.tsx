import { useState } from "react";
import { cn } from "@/lib/utils";
import { gameAssetUrl } from "@/components/deadlock-game-config";

export type DeadlockSide = "archmother" | "hidden_king";

interface SideIndicatorProps {
  side: DeadlockSide | null;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_PX: Record<NonNullable<SideIndicatorProps["size"]>, number> = {
  sm: 20,
  md: 32,
  lg: 48,
};

const SIDE_LABELS: Record<DeadlockSide, string> = {
  archmother: "Archmother",
  hidden_king: "Hidden King",
};

const SIDE_IMG: Record<DeadlockSide, string> = {
  archmother: "game-assets/deadlock/sides/archmother.png",
  hidden_king: "game-assets/deadlock/sides/hidden-king.png",
};

/** Colour pill / dot that visually identifies a Deadlock side. */
export function SideIndicator({
  side,
  showLabel = true,
  size = "sm",
  className,
}: SideIndicatorProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!side) return null;

  const px = SIZE_PX[size];
  const label = SIDE_LABELS[side];
  const color =
    side === "archmother"
      ? "var(--deadlock-archmother)"
      : "var(--deadlock-hidden-king)";

  if (!showLabel) {
    // Compact dot — image preferred, colour dot fallback
    return (
      <span
        className={cn("inline-flex items-center justify-center rounded-full shrink-0", className)}
        style={{ width: px, height: px, background: imgFailed ? color : undefined }}
        title={label}
      >
        {!imgFailed ? (
          <img
            src={gameAssetUrl(SIDE_IMG[side])}
            alt={label}
            style={{ width: px, height: px }}
            className="rounded-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : null}
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-white font-semibold shrink-0", className)}
      style={{ background: color, fontSize: px * 0.45, lineHeight: 1.4 }}
      title={label}
    >
      {!imgFailed ? (
        <img
          src={gameAssetUrl(SIDE_IMG[side])}
          alt={label}
          style={{ width: px * 0.7, height: px * 0.7 }}
          className="rounded-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span
          className="rounded-full inline-block shrink-0"
          style={{ width: px * 0.5, height: px * 0.5, background: "rgba(255,255,255,0.3)" }}
        />
      )}
      {label}
    </span>
  );
}
