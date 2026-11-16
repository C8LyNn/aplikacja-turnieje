import { Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Per-viewer appearance for Experimental screens: background style and accent colour
 * system. Both are derived from the active colour preset (theme), so every choice works
 * with all 12 themes. Stored only in this browser; Stable screens never read it.
 */
export const EXPERIMENTAL_SKINS = [
  { value: "tournament", label: "Według turnieju", color: "" },
  { value: "classic", label: "Klasyczna", color: "hsl(199 89% 48%)" },
  { value: "deadlock", label: "Deadlock", color: "hsl(148 35% 40%)" },
  { value: "obsidian", label: "Obsydian", color: "hsl(220 12% 60%)" },
  { value: "crimson-vault", label: "Szkarłatny skarbiec", color: "hsl(355 65% 48%)" },
  { value: "abyssal", label: "Głębina", color: "hsl(210 80% 60%)" },
  { value: "iron-citadel", label: "Żelazna cytadela", color: "hsl(200 22% 55%)" },
  { value: "ember", label: "Żar", color: "hsl(24 72% 52%)" },
  { value: "void", label: "Pustka", color: "hsl(270 58% 62%)" },
  { value: "copper-age", label: "Epoka miedzi", color: "hsl(28 62% 50%)" },
  { value: "glacier", label: "Lodowiec", color: "hsl(192 78% 55%)" },
  { value: "midnight-rose", label: "Nocna róża", color: "hsl(332 58% 58%)" },
  { value: "toxic", label: "Toksyczny", color: "hsl(100 68% 46%)" },
  { value: "sandstorm", label: "Burza piaskowa", color: "hsl(43 68% 52%)" },
] as const;

export const EXPERIMENTAL_BACKGROUNDS = [
  { value: "theme", label: "Motyw", hint: "Charakterystyczne tło wybranej skórki" },
  { value: "aura", label: "Aura", hint: "Miękka poświata w kolorze motywu" },
  { value: "nebula", label: "Mgławica", hint: "Wielobarwna, najbardziej wyrazista" },
  { value: "grid", label: "Siatka areny", hint: "Futurystyczna siatka na całej stronie" },
  { value: "carbon", label: "Karbon", hint: "Neutralna czerń, najwyższy kontrast" },
  { value: "solid", label: "Jednolite", hint: "Spokojne tło bez efektów" },
] as const;

export const EXPERIMENTAL_PALETTES = [
  { value: "theme", label: "Motyw", hint: "Kolory dobrane do skórki" },
  { value: "harmony", label: "Harmonia", hint: "Zrównoważone akcenty sekcji" },
  { value: "analog", label: "Analogiczny", hint: "Odcienie bliskie motywowi" },
  { value: "triad", label: "Triada", hint: "Trzy mocne, różne kolory" },
  { value: "contrast", label: "Kontrast", hint: "Kolor przeciwny do motywu" },
  { value: "mono", label: "Monochrom", hint: "Jeden kolor w kilku jasnościach" },
] as const;

export type ExperimentalBackground = (typeof EXPERIMENTAL_BACKGROUNDS)[number]["value"];
export type ExperimentalPalette = (typeof EXPERIMENTAL_PALETTES)[number]["value"];
export type ExperimentalSkin = (typeof EXPERIMENTAL_SKINS)[number]["value"];
export interface ExperimentalAppearance {
  skin: ExperimentalSkin;
  background: ExperimentalBackground;
  palette: ExperimentalPalette;
}

export const DEFAULT_EXPERIMENTAL_APPEARANCE: ExperimentalAppearance = { skin: "tournament", background: "theme", palette: "theme" };
export const EXPERIMENTAL_APPEARANCE_STORAGE_KEY = "tm_exp_appearance_v1";

const isBackground = (value: unknown): value is ExperimentalBackground =>
  EXPERIMENTAL_BACKGROUNDS.some((option) => option.value === value);
const isPalette = (value: unknown): value is ExperimentalPalette =>
  EXPERIMENTAL_PALETTES.some((option) => option.value === value);
const isSkin = (value: unknown): value is ExperimentalSkin =>
  EXPERIMENTAL_SKINS.some((option) => option.value === value);

export function readExperimentalAppearance(): ExperimentalAppearance {
  try {
    const raw = window.localStorage.getItem(EXPERIMENTAL_APPEARANCE_STORAGE_KEY);
    if (!raw) return DEFAULT_EXPERIMENTAL_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<ExperimentalAppearance>;
    return {
      skin: isSkin(parsed.skin) ? parsed.skin : DEFAULT_EXPERIMENTAL_APPEARANCE.skin,
      background: isBackground(parsed.background) ? parsed.background : DEFAULT_EXPERIMENTAL_APPEARANCE.background,
      palette: isPalette(parsed.palette) ? parsed.palette : DEFAULT_EXPERIMENTAL_APPEARANCE.palette,
    };
  } catch {
    return DEFAULT_EXPERIMENTAL_APPEARANCE;
  }
}

/**
 * Mirrors the choice on <html> as data-x-skin / data-x-bg / data-x-palette. The attributes stay set across
 * navigation so Experimental roots outside the shared layout (entry, create, public views)
 * use the same choice. Styles key off these attributes only inside Experimental roots.
 */
export function applyExperimentalAppearance(appearance: ExperimentalAppearance) {
  if (typeof document === "undefined") return;
  if (appearance.skin === "tournament") document.documentElement.removeAttribute("data-x-skin");
  else document.documentElement.setAttribute("data-x-skin", appearance.skin);
  document.documentElement.setAttribute("data-x-bg", appearance.background);
  document.documentElement.setAttribute("data-x-palette", appearance.palette);
}

if (typeof window !== "undefined") applyExperimentalAppearance(readExperimentalAppearance());

export function ExperimentalAppearanceControl() {
  const [appearance, setAppearance] = useState<ExperimentalAppearance>(() => readExperimentalAppearance());

  useEffect(() => {
    applyExperimentalAppearance(appearance);
    try {
      window.localStorage.setItem(EXPERIMENTAL_APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
    } catch {
      // Presentation preference only; failure to persist must not block the UI.
    }
  }, [appearance]);

  const isDefault =
    appearance.skin === DEFAULT_EXPERIMENTAL_APPEARANCE.skin &&
    appearance.background === DEFAULT_EXPERIMENTAL_APPEARANCE.background &&
    appearance.palette === DEFAULT_EXPERIMENTAL_APPEARANCE.palette;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="experimental-appearance-trigger" aria-label="Wygląd: tło i kolory">
          <Palette className="h-4 w-4" aria-hidden="true" />
          <span className="experimental-appearance-trigger-label">Wygląd</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="experimental-appearance-panel">
        <p className="experimental-appearance-title">Wygląd</p>
        <p className="experimental-appearance-note">
          Skórka, tło i kolory tylko dla Ciebie, w tej przeglądarce. Nie zmienia ustawień turnieju.
        </p>

        <fieldset className="experimental-appearance-group">
          <legend>Skórka</legend>
          <div className="experimental-appearance-skins">
            {EXPERIMENTAL_SKINS.map((option) => (
              <label key={option.value} className="experimental-appearance-skin" title={option.label}>
                <input
                  type="radio"
                  name="experimental-appearance-skin"
                  value={option.value}
                  checked={appearance.skin === option.value}
                  onChange={() => setAppearance((current) => ({ ...current, skin: option.value }))}
                />
                <span
                  className="experimental-appearance-skin-chip"
                  aria-hidden="true"
                  style={option.color ? { background: option.color } : undefined}
                />
                <span className="experimental-appearance-skin-label">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="experimental-appearance-group">
          <legend>Tło</legend>
          <div className="experimental-appearance-options">
            {EXPERIMENTAL_BACKGROUNDS.map((option) => (
              <label key={option.value} className="experimental-appearance-option" data-x-bg-option={option.value}>
                <input
                  type="radio"
                  name="experimental-appearance-background"
                  value={option.value}
                  checked={appearance.background === option.value}
                  onChange={() => setAppearance((current) => ({ ...current, background: option.value }))}
                />
                <span className="experimental-appearance-swatch" aria-hidden="true" />
                <span className="experimental-appearance-text">
                  <span>{option.label}</span>
                  <small>{option.hint}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="experimental-appearance-group">
          <legend>System kolorów</legend>
          <div className="experimental-appearance-options">
            {EXPERIMENTAL_PALETTES.map((option) => (
              <label key={option.value} className="experimental-appearance-option" data-x-palette-option={option.value}>
                <input
                  type="radio"
                  name="experimental-appearance-palette"
                  value={option.value}
                  checked={appearance.palette === option.value}
                  onChange={() => setAppearance((current) => ({ ...current, palette: option.value }))}
                />
                <span className="experimental-appearance-dots" aria-hidden="true">
                  <i /><i /><i />
                </span>
                <span className="experimental-appearance-text">
                  <span>{option.label}</span>
                  <small>{option.hint}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          className="experimental-appearance-reset"
          disabled={isDefault}
          onClick={() => setAppearance(DEFAULT_EXPERIMENTAL_APPEARANCE)}
        >
          Przywróć domyślne
        </button>
      </PopoverContent>
    </Popover>
  );
}
