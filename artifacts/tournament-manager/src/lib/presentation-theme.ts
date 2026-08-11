import { useEffect } from "react";

export interface PresentationSettings {
  colorPreset?: string | null;
  fontPreset?: string | null;
  frameStyle?: string | null;
  /** @deprecated legacy field; use colorPreset: "deadlock" instead */
  deadlockTheme?: boolean;
}

/**
 * Converts raw presentationSettings (possibly containing only the legacy
 * deadlockTheme boolean) into a fully-resolved PresentationSettings object.
 * Consumers call this once and pass the result to usePresentationTheme.
 */
export function resolvePresentationSettings(
  raw: PresentationSettings | null | undefined,
): PresentationSettings {
  if (!raw) return {};
  // Shim: if the legacy boolean is set and no colorPreset is present yet
  if (raw.deadlockTheme && !raw.colorPreset) {
    return { ...raw, colorPreset: "deadlock" };
  }
  return raw;
}

/**
 * Applies data-theme / data-font / data-frame to <html> so that Radix UI
 * portals (Dialog, Dropdown, Select, Tooltip, Sheet, etc.) rendered outside
 * the page root div also inherit the active presentation settings.
 *
 * Must be called before any early returns in every page component so that
 * React's rules-of-hooks order stays stable.
 *
 * Cleanup removes all attributes on unmount / settings change so navigating
 * away resets the global theme.
 */
export function usePresentationTheme(settings: PresentationSettings): void {
  const { colorPreset, fontPreset, frameStyle } = settings;

  useEffect(() => {
    const html = document.documentElement;

    if (colorPreset) {
      html.setAttribute("data-theme", colorPreset);
    } else {
      html.removeAttribute("data-theme");
    }

    if (fontPreset && fontPreset !== "inter") {
      html.setAttribute("data-font", fontPreset);
    } else {
      html.removeAttribute("data-font");
    }

    if (frameStyle && frameStyle !== "rounded") {
      html.setAttribute("data-frame", frameStyle);
    } else {
      html.removeAttribute("data-frame");
    }

    return () => {
      html.removeAttribute("data-theme");
      html.removeAttribute("data-font");
      html.removeAttribute("data-frame");
    };
  }, [colorPreset, fontPreset, frameStyle]);
}
