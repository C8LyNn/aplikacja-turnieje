import { useEffect, useRef, useState } from "react";
import { Check, Palette, Save, Sparkles, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Experimental appearance — a viewer-local preference (this browser only). It never
 * changes tournament settings. V5 · Stage E adds typography, shape, card style, effect
 * intensity, motion and contrast on top of skin/background/palette, ready-made sets,
 * a live preview that is only kept after "Zastosuj", and user-saved sets.
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

export const EXPERIMENTAL_TYPOGRAPHY = [
  { value: "arena", label: "Arena", hint: "Domyślny, nowoczesny krój" },
  { value: "classic", label: "Systemowy", hint: "Krój Twojego systemu" },
  { value: "technical", label: "Techniczny", hint: "Cyfry i nagłówki jak na tablicy wyników" },
  { value: "readable", label: "Czytelny", hint: "Większy tekst i odstępy" },
  { value: "display", label: "Sportowy", hint: "Wąskie, wersalikowe nagłówki jak na stadionie" },
  { value: "elegant", label: "Elegancki", hint: "Szeryfowe tytuły, spokojny tekst" },
] as const;

export const EXPERIMENTAL_SHAPES = [
  { value: "arena", label: "Arena", hint: "Łagodne zaokrąglenia" },
  { value: "sharp", label: "Ostre", hint: "Proste, techniczne krawędzie" },
  { value: "round", label: "Okrągłe", hint: "Miękkie, duże zaokrąglenia" },
  { value: "cut", label: "Ścięte", hint: "Ścięte narożniki jak w interfejsie gry" },
] as const;

// V5.4 · more categories. Every option changes the look of real components, not only colours.
export const EXPERIMENTAL_DENSITY = [
  { value: "comfortable", label: "Wygodna", hint: "Domyślne odstępy" },
  { value: "compact", label: "Zwarta", hint: "Więcej treści na ekranie" },
  { value: "spacious", label: "Przestronna", hint: "Duże odstępy, spokojny układ" },
] as const;

export const EXPERIMENTAL_BUTTONS = [
  { value: "arena", label: "Arena", hint: "Gradient i miękki blask" },
  { value: "solid", label: "Pełne", hint: "Jednolity kolor, bez efektów" },
  { value: "outline", label: "Kontur", hint: "Przezroczyste z wyraźną ramką" },
  { value: "pill", label: "Pigułki", hint: "W pełni zaokrąglone" },
  { value: "beveled", label: "Ścięte", hint: "Ścięte rogi, wersaliki" },
] as const;

export const EXPERIMENTAL_CONTROLS = [
  { value: "arena", label: "Arena", hint: "Ciemne pola z ramką" },
  { value: "filled", label: "Wypełnione", hint: "Jasne tło pola, bez ramki" },
  { value: "underline", label: "Podkreślone", hint: "Tylko linia pod polem" },
  { value: "outlined", label: "Grube ramki", hint: "Wyraźne, kontrastowe obramowanie" },
] as const;

export const EXPERIMENTAL_BORDERS = [
  { value: "arena", label: "Arena", hint: "Cienkie linie i miękkie cienie" },
  { value: "none", label: "Bez ramek", hint: "Panele oddzielone tylko tłem" },
  { value: "bold", label: "Wyraźne", hint: "Grube linie w kolorze akcentu" },
  { value: "deep", label: "Głębokie cienie", hint: "Panele unoszą się nad tłem" },
] as const;

export const EXPERIMENTAL_GLOW = [
  { value: "soft", label: "Delikatne", hint: "Lekka poświata akcentów" },
  { value: "neon", label: "Neon", hint: "Świecące tytuły i ramki" },
  { value: "none", label: "Bez światła", hint: "Bez poświat" },
] as const;

export const EXPERIMENTAL_NAV = [
  { value: "arena", label: "Arena", hint: "Zakładki w panelu" },
  { value: "underline", label: "Podkreślenie", hint: "Linia pod aktywną zakładką" },
  { value: "blocks", label: "Bloki", hint: "Wyraźne, pełne przyciski" },
  { value: "pills", label: "Pigułki", hint: "Zaokrąglone zakładki" },
] as const;

export const EXPERIMENTAL_TABLES = [
  { value: "arena", label: "Arena", hint: "Delikatne linie" },
  { value: "striped", label: "Pasy", hint: "Naprzemienne tło wierszy" },
  { value: "lined", label: "Linie", hint: "Mocne linie, wersalikowe nagłówki" },
  { value: "spacious", label: "Przestronne", hint: "Wyższe wiersze, łatwe na telefonie" },
] as const;

export const EXPERIMENTAL_BRACKETS = [
  { value: "arena", label: "Arena", hint: "Spokojne linie i karty" },
  { value: "neon", label: "Neon", hint: "Świecące połączenia" },
  { value: "minimal", label: "Minimalna", hint: "Cienkie linie, bez tła kart" },
  { value: "broadcast", label: "Transmisja", hint: "Grube linie, kontrastowe karty" },
] as const;

export const EXPERIMENTAL_MATCH_CARDS = [
  { value: "arena", label: "Arena", hint: "Domyślne karty" },
  { value: "scoreboard", label: "Tablica wyników", hint: "Duże cyfry, ciemny pas wyniku" },
  { value: "compact", label: "Zwarte", hint: "Mniej miejsca na mecz" },
] as const;

export const EXPERIMENTAL_DECOR = [
  { value: "none", label: "Brak", hint: "Bez dodatków" },
  { value: "corners", label: "Narożniki", hint: "Znaczniki w rogach paneli" },
  { value: "scanlines", label: "Linie ekranu", hint: "Delikatny efekt monitora" },
  { value: "noise", label: "Ziarno", hint: "Subtelna faktura tła" },
] as const;

export const EXPERIMENTAL_CARD_STYLES = [
  { value: "glass", label: "Szkło", hint: "Półprzezroczyste panele" },
  { value: "solid", label: "Pełne", hint: "Nieprzezroczyste, spokojne" },
  { value: "outline", label: "Kontur", hint: "Lekkie panele z wyraźną linią" },
] as const;

export const EXPERIMENTAL_EFFECTS = [
  { value: "full", label: "Pełne", hint: "Poświaty i głębia" },
  { value: "subtle", label: "Delikatne", hint: "Mniej cieni i blasku" },
  { value: "off", label: "Wyłączone", hint: "Bez cieni i poświat" },
] as const;

export const EXPERIMENTAL_MOTION = [
  { value: "system", label: "Jak w systemie", hint: "Szanuje ustawienie ograniczonego ruchu" },
  { value: "reduced", label: "Ograniczony", hint: "Bez animacji i przejść" },
] as const;

export const EXPERIMENTAL_CONTRAST = [
  { value: "standard", label: "Standardowy", hint: "Zrównoważony" },
  { value: "high", label: "Wysoki", hint: "Mocniejszy tekst i linie" },
] as const;

type Values<T extends readonly { value: string }[]> = T[number]["value"];
export type ExperimentalBackground = Values<typeof EXPERIMENTAL_BACKGROUNDS>;
export type ExperimentalPalette = Values<typeof EXPERIMENTAL_PALETTES>;
export type ExperimentalSkin = Values<typeof EXPERIMENTAL_SKINS>;
export type ExperimentalTypography = Values<typeof EXPERIMENTAL_TYPOGRAPHY>;
export type ExperimentalShape = Values<typeof EXPERIMENTAL_SHAPES>;
export type ExperimentalCardStyle = Values<typeof EXPERIMENTAL_CARD_STYLES>;
export type ExperimentalEffects = Values<typeof EXPERIMENTAL_EFFECTS>;
export type ExperimentalMotion = Values<typeof EXPERIMENTAL_MOTION>;
export type ExperimentalContrast = Values<typeof EXPERIMENTAL_CONTRAST>;
export type ExperimentalDensity = Values<typeof EXPERIMENTAL_DENSITY>;
export type ExperimentalButtons = Values<typeof EXPERIMENTAL_BUTTONS>;
export type ExperimentalControls = Values<typeof EXPERIMENTAL_CONTROLS>;
export type ExperimentalBorders = Values<typeof EXPERIMENTAL_BORDERS>;
export type ExperimentalGlow = Values<typeof EXPERIMENTAL_GLOW>;
export type ExperimentalNav = Values<typeof EXPERIMENTAL_NAV>;
export type ExperimentalTables = Values<typeof EXPERIMENTAL_TABLES>;
export type ExperimentalBrackets = Values<typeof EXPERIMENTAL_BRACKETS>;
export type ExperimentalMatchCards = Values<typeof EXPERIMENTAL_MATCH_CARDS>;
export type ExperimentalDecor = Values<typeof EXPERIMENTAL_DECOR>;

export interface ExperimentalAppearance {
  skin: ExperimentalSkin;
  background: ExperimentalBackground;
  palette: ExperimentalPalette;
  typography: ExperimentalTypography;
  shape: ExperimentalShape;
  cards: ExperimentalCardStyle;
  effects: ExperimentalEffects;
  motion: ExperimentalMotion;
  contrast: ExperimentalContrast;
  density: ExperimentalDensity;
  buttons: ExperimentalButtons;
  controls: ExperimentalControls;
  borders: ExperimentalBorders;
  glow: ExperimentalGlow;
  nav: ExperimentalNav;
  tables: ExperimentalTables;
  brackets: ExperimentalBrackets;
  matchCards: ExperimentalMatchCards;
  decor: ExperimentalDecor;
}

export const DEFAULT_EXPERIMENTAL_APPEARANCE: ExperimentalAppearance = {
  skin: "tournament", background: "theme", palette: "theme",
  typography: "arena", shape: "arena", cards: "glass", effects: "full", motion: "system", contrast: "standard",
  density: "comfortable", buttons: "arena", controls: "arena", borders: "arena", glow: "soft",
  nav: "arena", tables: "arena", brackets: "arena", matchCards: "arena", decor: "none",
};
export const EXPERIMENTAL_APPEARANCE_STORAGE_KEY = "tm_exp_appearance_v1";
export const EXPERIMENTAL_APPEARANCE_CUSTOM_KEY = "tm_exp_appearance_custom_v1";
export const MAX_CUSTOM_APPEARANCES = 5;

const CATEGORY_OPTIONS = {
  skin: EXPERIMENTAL_SKINS,
  background: EXPERIMENTAL_BACKGROUNDS,
  palette: EXPERIMENTAL_PALETTES,
  typography: EXPERIMENTAL_TYPOGRAPHY,
  shape: EXPERIMENTAL_SHAPES,
  cards: EXPERIMENTAL_CARD_STYLES,
  effects: EXPERIMENTAL_EFFECTS,
  motion: EXPERIMENTAL_MOTION,
  contrast: EXPERIMENTAL_CONTRAST,
  density: EXPERIMENTAL_DENSITY,
  buttons: EXPERIMENTAL_BUTTONS,
  controls: EXPERIMENTAL_CONTROLS,
  borders: EXPERIMENTAL_BORDERS,
  glow: EXPERIMENTAL_GLOW,
  nav: EXPERIMENTAL_NAV,
  tables: EXPERIMENTAL_TABLES,
  brackets: EXPERIMENTAL_BRACKETS,
  matchCards: EXPERIMENTAL_MATCH_CARDS,
  decor: EXPERIMENTAL_DECOR,
} as const;
type Category = keyof typeof CATEGORY_OPTIONS;
const CATEGORIES = Object.keys(CATEGORY_OPTIONS) as Category[];

/** Ready-made sets: one click for beginners, a starting point for tinkering. */
export const EXPERIMENTAL_APPEARANCE_PRESETS: Array<{ id: string; label: string; hint: string; values: Partial<ExperimentalAppearance> }> = [
  { id: "arena", label: "Arena", hint: "Domyślny wygląd turnieju", values: {} },
  { id: "stage", label: "Scena turniejowa", hint: "Wyraziste kolory do pokazów i transmisji", values: { background: "nebula", palette: "triad", shape: "round", effects: "full", typography: "technical" } },
  { id: "readable", label: "Czytelny", hint: "Duży tekst, wysoki kontrast, spokojne tło", values: { background: "carbon", contrast: "high", typography: "readable", cards: "solid", effects: "subtle" } },
  { id: "pro", label: "Minimal pro", hint: "Ostre krawędzie, bez efektów", values: { background: "solid", palette: "mono", shape: "sharp", cards: "outline", effects: "off" } },
  { id: "neon", label: "Neon", hint: "Siatka areny i mocny kontrast kolorów", values: { background: "grid", palette: "contrast", cards: "glass", effects: "full" } },
  { id: "calm", label: "Spokojny", hint: "Miękkie barwy, bez animacji", values: { background: "aura", palette: "analog", motion: "reduced", effects: "subtle" } },
  // V5.4 · styles that differ in shape, type, buttons, tables and brackets — not only in colour.
  { id: "esport", label: "Futurystyczny e-sport", hint: "Siatka, ścięte rogi, neonowa drabinka", values: { skin: "abyssal", background: "grid", palette: "triad", typography: "technical", shape: "cut", cards: "glass", effects: "full", glow: "neon", buttons: "beveled", nav: "pills", tables: "lined", brackets: "neon", matchCards: "scoreboard", decor: "corners" } },
  { id: "minimal", label: "Minimalistyczny profesjonalny", hint: "Zwarty, ostry, bez efektów", values: { skin: "obsidian", background: "solid", palette: "mono", typography: "classic", shape: "sharp", cards: "outline", effects: "off", glow: "none", density: "compact", buttons: "outline", controls: "underline", nav: "underline", tables: "lined", brackets: "minimal", matchCards: "compact", borders: "arena" } },
  { id: "arcade", label: "Energetyczny arcade", hint: "Pigułki, grube ramki, linie ekranu", values: { skin: "toxic", background: "grid", palette: "triad", typography: "display", shape: "round", cards: "solid", effects: "full", glow: "neon", buttons: "pill", controls: "outlined", borders: "bold", nav: "pills", tables: "striped", matchCards: "scoreboard", decor: "scanlines" } },
  { id: "cyberpunk", label: "Cyberpunk", hint: "Róż i cyjan, ścięte panele, neon", values: { skin: "midnight-rose", background: "nebula", palette: "contrast", typography: "technical", shape: "cut", cards: "outline", effects: "full", glow: "neon", buttons: "beveled", controls: "outlined", borders: "bold", nav: "blocks", tables: "lined", brackets: "neon", matchCards: "scoreboard", decor: "scanlines" } },
  { id: "sport", label: "Klasyczny sport", hint: "Tablica wyników, pasy w tabeli", values: { skin: "classic", background: "solid", palette: "harmony", typography: "display", shape: "sharp", cards: "solid", effects: "subtle", glow: "none", buttons: "solid", controls: "filled", borders: "arena", nav: "blocks", tables: "striped", brackets: "arena", matchCards: "scoreboard", decor: "none" } },
  { id: "broadcast", label: "Transmisja TV", hint: "Mocny kontrast, duże wyniki, przestrzeń", values: { skin: "crimson-vault", background: "carbon", palette: "contrast", typography: "display", shape: "sharp", cards: "solid", effects: "subtle", glow: "soft", density: "spacious", buttons: "solid", nav: "underline", tables: "spacious", brackets: "broadcast", matchCards: "scoreboard", borders: "deep", decor: "corners" } },
  { id: "premium", label: "Elegancki premium", hint: "Złoto, szeryfy, dużo powietrza", values: { skin: "sandstorm", background: "aura", palette: "analog", typography: "elegant", shape: "round", cards: "glass", effects: "subtle", glow: "soft", density: "spacious", buttons: "outline", controls: "underline", borders: "deep", nav: "underline", tables: "spacious", brackets: "minimal", matchCards: "arena", decor: "noise" } },
  { id: "scifi", label: "Techniczny sci-fi", hint: "Chłodne kolory, siatka, znaczniki", values: { skin: "glacier", background: "grid", palette: "analog", typography: "technical", shape: "cut", cards: "outline", effects: "subtle", glow: "soft", density: "compact", buttons: "outline", controls: "outlined", borders: "bold", nav: "underline", tables: "lined", brackets: "minimal", matchCards: "compact", decor: "corners" } },
];

function optionValues(category: Category): readonly string[] {
  return CATEGORY_OPTIONS[category].map((option) => option.value);
}

/**
 * Readability guard: high contrast turns translucent glass into solid cards and caps
 * effects at "subtle", so no combination ends up with low-contrast text on busy layers.
 */
export function normalizeExperimentalAppearance(input: Partial<Record<Category, unknown>> | null | undefined): ExperimentalAppearance {
  const result = { ...DEFAULT_EXPERIMENTAL_APPEARANCE } as Record<Category, string>;
  for (const category of CATEGORIES) {
    const value = input?.[category];
    if (typeof value === "string" && optionValues(category).includes(value)) result[category] = value;
  }
  if (result.contrast === "high") {
    if (result.cards === "glass") result.cards = "solid";
    if (result.effects === "full") result.effects = "subtle";
    if (result.glow === "neon") result.glow = "soft";
    if (result.decor === "scanlines" || result.decor === "noise") result.decor = "none";
  }
  return result as unknown as ExperimentalAppearance;
}

export function readExperimentalAppearance(): ExperimentalAppearance {
  try {
    const raw = window.localStorage.getItem(EXPERIMENTAL_APPEARANCE_STORAGE_KEY);
    if (!raw) return DEFAULT_EXPERIMENTAL_APPEARANCE;
    return normalizeExperimentalAppearance(JSON.parse(raw) as Partial<Record<Category, unknown>>);
  } catch {
    return DEFAULT_EXPERIMENTAL_APPEARANCE;
  }
}

function persistAppearance(appearance: ExperimentalAppearance): void {
  try {
    window.localStorage.setItem(EXPERIMENTAL_APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    // Presentation preference only; failure to persist must not block the UI.
  }
}

export interface CustomAppearance { id: string; label: string; values: ExperimentalAppearance }

export function readCustomAppearances(): CustomAppearance[] {
  try {
    const raw = window.localStorage.getItem(EXPERIMENTAL_APPEARANCE_CUSTOM_KEY);
    const parsed = raw ? JSON.parse(raw) as unknown : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is { id: string; label: string; values: unknown } =>
        !!item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string" && typeof (item as { label?: unknown }).label === "string")
      .slice(0, MAX_CUSTOM_APPEARANCES)
      .map((item) => ({ id: item.id, label: item.label.slice(0, 40), values: normalizeExperimentalAppearance(item.values as Record<Category, unknown>) }));
  } catch {
    return [];
  }
}

function writeCustomAppearances(list: CustomAppearance[]): void {
  try {
    window.localStorage.setItem(EXPERIMENTAL_APPEARANCE_CUSTOM_KEY, JSON.stringify(list.slice(0, MAX_CUSTOM_APPEARANCES)));
  } catch {
    // ignore
  }
}

const ATTRIBUTES: Record<Exclude<Category, "skin">, string> = {
  background: "data-x-bg",
  palette: "data-x-palette",
  typography: "data-x-type",
  shape: "data-x-shape",
  cards: "data-x-cards",
  effects: "data-x-fx",
  motion: "data-x-motion",
  contrast: "data-x-contrast",
  density: "data-x-density",
  buttons: "data-x-buttons",
  controls: "data-x-controls",
  borders: "data-x-borders",
  glow: "data-x-glow",
  nav: "data-x-nav",
  tables: "data-x-tables",
  brackets: "data-x-brackets",
  matchCards: "data-x-matchcards",
  decor: "data-x-decor",
};

/**
 * Mirrors the choice on <html> as data attributes. The attributes stay set across
 * navigation so Experimental roots outside the shared layout (entry, create, public views)
 * use the same choice. Styles key off these attributes only inside Experimental roots.
 */
export function applyExperimentalAppearance(appearance: ExperimentalAppearance) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (appearance.skin === "tournament") root.removeAttribute("data-x-skin");
  else root.setAttribute("data-x-skin", appearance.skin);
  for (const [category, attribute] of Object.entries(ATTRIBUTES) as Array<[Exclude<Category, "skin">, string]>) {
    root.setAttribute(attribute, appearance[category]);
  }
}

if (typeof window !== "undefined") applyExperimentalAppearance(readExperimentalAppearance());

const same = (left: ExperimentalAppearance, right: ExperimentalAppearance) => CATEGORIES.every((category) => left[category] === right[category]);

function OptionGroup<C extends Exclude<Category, "skin">>({
  category, legend, value, onChange, swatch,
}: {
  category: C;
  legend: string;
  value: ExperimentalAppearance[C];
  onChange: (value: ExperimentalAppearance[C]) => void;
  swatch?: "bg" | "palette";
}) {
  const options = CATEGORY_OPTIONS[category] as readonly { value: string; label: string; hint: string }[];
  return (
    <fieldset className="experimental-appearance-group">
      <legend>{legend}</legend>
      <div className="experimental-appearance-options">
        {options.map((option) => (
          <label
            key={option.value}
            className="experimental-appearance-option"
            {...(swatch === "bg" ? { "data-x-bg-option": option.value } : swatch === "palette" ? { "data-x-palette-option": option.value } : {})}
          >
            <input
              type="radio"
              name={`experimental-appearance-${category}`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value as ExperimentalAppearance[C])}
            />
            {swatch === "bg" && <span className="experimental-appearance-swatch" aria-hidden="true" />}
            {swatch === "palette" && <span className="experimental-appearance-dots" aria-hidden="true"><i /><i /><i /></span>}
            <span className="experimental-appearance-text">
              <span>{option.label}</span>
              <small>{option.hint}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ExperimentalAppearanceControl() {
  const [saved, setSaved] = useState<ExperimentalAppearance>(() => readExperimentalAppearance());
  const [draft, setDraft] = useState<ExperimentalAppearance>(saved);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"sets" | "details">("sets");
  const [custom, setCustom] = useState<CustomAppearance[]>(() => readCustomAppearances());
  const [customName, setCustomName] = useState("");
  const savedRef = useRef(saved);
  savedRef.current = saved;

  // Live preview: the draft is applied immediately, but only "Zastosuj" keeps it.
  useEffect(() => {
    applyExperimentalAppearance(draft);
  }, [draft]);

  const dirty = !same(draft, saved);
  const update = (patch: Partial<ExperimentalAppearance>) => setDraft((current) => normalizeExperimentalAppearance({ ...current, ...patch }));
  const apply = () => {
    persistAppearance(draft);
    setSaved(draft);
  };
  const cancel = () => setDraft(savedRef.current);
  const onOpenChange = (next: boolean) => {
    if (!next) setDraft(savedRef.current); // closing without "Zastosuj" reverts the preview
    setOpen(next);
  };
  const saveCustom = () => {
    const label = customName.trim().slice(0, 40) || `Mój zestaw ${custom.length + 1}`;
    const next = [{ id: `c${Date.now().toString(36)}`, label, values: draft }, ...custom].slice(0, MAX_CUSTOM_APPEARANCES);
    setCustom(next);
    writeCustomAppearances(next);
    setCustomName("");
  };
  const removeCustom = (id: string) => {
    const next = custom.filter((item) => item.id !== id);
    setCustom(next);
    writeCustomAppearances(next);
  };
  const highContrastNote = draft.contrast === "high";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className="experimental-appearance-trigger" aria-label="Wygląd: tło i kolory" title="Wygląd: zestawy, skórka, tło, kolory i więcej">
          <Palette className="h-4 w-4" aria-hidden="true" />
          <span className="experimental-appearance-trigger-label">Wygląd</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="experimental-appearance-panel">
        <p className="experimental-appearance-title">Wygląd</p>
        <p className="experimental-appearance-note">
          Tylko dla Ciebie, w tej przeglądarce. Nie zmienia ustawień turnieju ani tego, co widzą inni.
        </p>
        <div className="experimental-appearance-tabs" role="tablist" aria-label="Rodzaj ustawień">
          <button type="button" role="tab" aria-selected={tab === "sets"} onClick={() => setTab("sets")}>Zestawy</button>
          <button type="button" role="tab" aria-selected={tab === "details"} onClick={() => setTab("details")}>Szczegóły</button>
        </div>

        {tab === "sets" && (
          <div role="tabpanel" aria-label="Zestawy">
            <fieldset className="experimental-appearance-group">
              <legend>Gotowe zestawy</legend>
              <div className="experimental-appearance-presets">
                {EXPERIMENTAL_APPEARANCE_PRESETS.map((preset) => {
                  const values = normalizeExperimentalAppearance({ ...DEFAULT_EXPERIMENTAL_APPEARANCE, skin: draft.skin, ...preset.values });
                  // (a preset with its own skin overrides the current one; others keep it)
                  const active = same(values, draft);
                  return (
                    <button key={preset.id} type="button" className="experimental-appearance-preset" aria-pressed={active} data-x-bg-option={values.background} onClick={() => setDraft(values)}>
                      <span className="experimental-appearance-swatch" aria-hidden="true" />
                      <span className="experimental-appearance-text">
                        <span>{preset.label}{active && <Check className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />}</span>
                        <small>{preset.hint}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset className="experimental-appearance-group">
              <legend>Twoje zestawy</legend>
              {custom.length === 0 && <p className="experimental-appearance-note">Dopasuj szczegóły i zapisz własny zestaw (do {MAX_CUSTOM_APPEARANCES}).</p>}
              <ul className="experimental-appearance-custom">
                {custom.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="experimental-appearance-custom-apply" aria-pressed={same(item.values, draft)} onClick={() => setDraft(item.values)}>
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {item.label}
                    </button>
                    <button type="button" className="experimental-appearance-custom-remove" aria-label={`Usuń zestaw ${item.label}`} onClick={() => removeCustom(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="experimental-appearance-save">
                <input aria-label="Nazwa własnego zestawu" placeholder="Nazwa zestawu" maxLength={40} value={customName} onChange={(event) => setCustomName(event.target.value)} />
                <button type="button" onClick={saveCustom}><Save className="h-3.5 w-3.5" aria-hidden="true" /> Zapisz obecny</button>
              </div>
            </fieldset>
          </div>
        )}

        {tab === "details" && (
          <div role="tabpanel" aria-label="Szczegóły">
            <fieldset className="experimental-appearance-group">
              <legend>Skórka</legend>
              <div className="experimental-appearance-skins">
                {EXPERIMENTAL_SKINS.map((option) => (
                  <label key={option.value} className="experimental-appearance-skin" title={option.label}>
                    <input
                      type="radio"
                      name="experimental-appearance-skin"
                      value={option.value}
                      checked={draft.skin === option.value}
                      onChange={() => update({ skin: option.value })}
                    />
                    <span className="experimental-appearance-skin-chip" aria-hidden="true" style={option.color ? { background: option.color } : undefined} />
                    <span className="experimental-appearance-skin-label">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <details className="experimental-appearance-section" open>
              <summary>Kolory, tło i faktura</summary>
              <OptionGroup category="background" legend="Tło" value={draft.background} onChange={(background) => update({ background })} swatch="bg" />
              <OptionGroup category="palette" legend="System kolorów" value={draft.palette} onChange={(palette) => update({ palette })} swatch="palette" />
              <OptionGroup category="decor" legend="Dodatki" value={draft.decor} onChange={(decor) => update({ decor })} />
            </details>
            <details className="experimental-appearance-section">
              <summary>Tekst, układ i kształty</summary>
              <OptionGroup category="typography" legend="Typografia" value={draft.typography} onChange={(typography) => update({ typography })} />
              <OptionGroup category="density" legend="Gęstość" value={draft.density} onChange={(density) => update({ density })} />
              <OptionGroup category="shape" legend="Kształty" value={draft.shape} onChange={(shape) => update({ shape })} />
              <OptionGroup category="cards" legend="Karty i panele" value={draft.cards} onChange={(cards) => update({ cards })} />
              <OptionGroup category="borders" legend="Obramowania i cienie" value={draft.borders} onChange={(borders) => update({ borders })} />
            </details>
            <details className="experimental-appearance-section">
              <summary>Przyciski, pola i nawigacja</summary>
              <OptionGroup category="buttons" legend="Przyciski" value={draft.buttons} onChange={(buttons) => update({ buttons })} />
              <OptionGroup category="controls" legend="Pola formularzy" value={draft.controls} onChange={(controls) => update({ controls })} />
              <OptionGroup category="nav" legend="Nawigacja" value={draft.nav} onChange={(nav) => update({ nav })} />
            </details>
            <details className="experimental-appearance-section">
              <summary>Tabele, drabinki i mecze</summary>
              <OptionGroup category="tables" legend="Tabele" value={draft.tables} onChange={(tables) => update({ tables })} />
              <OptionGroup category="brackets" legend="Drabinki" value={draft.brackets} onChange={(brackets) => update({ brackets })} />
              <OptionGroup category="matchCards" legend="Karty meczów i wyniki" value={draft.matchCards} onChange={(matchCards) => update({ matchCards })} />
            </details>
            <details className="experimental-appearance-section">
              <summary>Światło, ruch i kontrast</summary>
              <OptionGroup category="effects" legend="Efekty" value={draft.effects} onChange={(effects) => update({ effects })} />
              <OptionGroup category="glow" legend="Efekty świetlne" value={draft.glow} onChange={(glow) => update({ glow })} />
              <OptionGroup category="contrast" legend="Kontrast" value={draft.contrast} onChange={(contrast) => update({ contrast })} />
              {highContrastNote && <p className="experimental-appearance-note" role="status">Wysoki kontrast zamienia szkło na pełne karty, ogranicza efekty i dodatki — tak tekst zawsze pozostaje czytelny.</p>}
              <OptionGroup category="motion" legend="Ruch" value={draft.motion} onChange={(motion) => update({ motion })} />
            </details>
            <p className="experimental-appearance-note">Barwy i logo turnieju ustala organizator (skórka „Według turnieju”). Te ustawienia zmieniają tylko Twój widok.</p>
          </div>
        )}

        <div className="experimental-appearance-footer">
          {dirty && <p className="experimental-appearance-note" role="status">Podgląd — kliknij „Zastosuj”, aby zachować.</p>}
          <div className="experimental-appearance-actions">
            <button type="button" className="experimental-appearance-reset" disabled={same(draft, DEFAULT_EXPERIMENTAL_APPEARANCE)} onClick={() => setDraft(DEFAULT_EXPERIMENTAL_APPEARANCE)}>
              Przywróć domyślne
            </button>
            <button type="button" className="experimental-appearance-cancel" disabled={!dirty} onClick={cancel}>Anuluj</button>
            <button type="button" className="experimental-appearance-apply" disabled={!dirty} onClick={apply}>Zastosuj</button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
