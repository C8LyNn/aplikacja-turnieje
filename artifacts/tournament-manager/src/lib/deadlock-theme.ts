/**
 * Backward-compatibility shim.
 * New code should import usePresentationTheme / resolvePresentationSettings
 * directly from "@/lib/presentation-theme".
 */
import { usePresentationTheme } from "./presentation-theme";
export { usePresentationTheme, resolvePresentationSettings } from "./presentation-theme";
export type { PresentationSettings } from "./presentation-theme";

/**
 * @deprecated Use usePresentationTheme from presentation-theme instead.
 * Kept so old call-sites (boolean signature) continue to compile without edits.
 */
export function useDeadlockHtmlTheme(active: boolean): void {
  usePresentationTheme(active ? { colorPreset: "deadlock" } : {});
}
