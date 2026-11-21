import { t } from "@/i18n";
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
  { value: "tournament", get label() { return t("experimentalAppearance.wedlug_turnieju"); }, color: "" },
  { value: "classic", get label() { return t("experimentalAppearance.klasyczna"); }, color: "hsl(199 89% 48%)" },
  { value: "deadlock", label: "Deadlock", color: "hsl(148 35% 40%)" },
  { value: "obsidian", get label() { return t("experimentalAppearance.obsydian"); }, color: "hsl(220 12% 60%)" },
  { value: "crimson-vault", get label() { return t("experimentalAppearance.szkarlatny_skarbiec"); }, color: "hsl(355 65% 48%)" },
  { value: "abyssal", get label() { return t("experimentalAppearance.glebina"); }, color: "hsl(210 80% 60%)" },
  { value: "iron-citadel", get label() { return t("experimentalAppearance.zelazna_cytadela"); }, color: "hsl(200 22% 55%)" },
  { value: "ember", get label() { return t("experimentalAppearance.zar"); }, color: "hsl(24 72% 52%)" },
  { value: "void", get label() { return t("experimentalAppearance.pustka"); }, color: "hsl(270 58% 62%)" },
  { value: "copper-age", get label() { return t("experimentalAppearance.epoka_miedzi"); }, color: "hsl(28 62% 50%)" },
  { value: "glacier", get label() { return t("experimentalAppearance.lodowiec"); }, color: "hsl(192 78% 55%)" },
  { value: "midnight-rose", get label() { return t("experimentalAppearance.nocna_roza"); }, color: "hsl(332 58% 58%)" },
  { value: "toxic", get label() { return t("experimentalAppearance.toksyczny"); }, color: "hsl(100 68% 46%)" },
  { value: "sandstorm", get label() { return t("experimentalAppearance.burza_piaskowa"); }, color: "hsl(43 68% 52%)" },
] as const;

export const EXPERIMENTAL_BACKGROUNDS = [
  { value: "theme", get label() { return t("experimentalAppearance.motyw"); }, get hint() { return t("experimentalAppearance.charakterystyczne_tlo_wybranej_skorki"); } },
  { value: "aura", label: "Aura", get hint() { return t("experimentalAppearance.miekka_poswiata_w_kolorze_motywu"); } },
  { value: "nebula", get label() { return t("experimentalAppearance.mglawica"); }, get hint() { return t("experimentalAppearance.wielobarwna_najbardziej_wyrazista"); } },
  { value: "grid", get label() { return t("experimentalAppearance.siatka_areny"); }, get hint() { return t("experimentalAppearance.futurystyczna_siatka_na_calej_stronie"); } },
  { value: "carbon", get label() { return t("experimentalAppearance.karbon"); }, get hint() { return t("experimentalAppearance.neutralna_czern_najwyzszy_kontrast"); } },
  { value: "solid", get label() { return t("experimentalAppearance.jednolite"); }, get hint() { return t("experimentalAppearance.spokojne_tlo_bez_efektow"); } },
] as const;

export const EXPERIMENTAL_PALETTES = [
  { value: "theme", get label() { return t("experimentalAppearance.motyw"); }, get hint() { return t("experimentalAppearance.kolory_dobrane_do_skorki"); } },
  { value: "harmony", get label() { return t("experimentalAppearance.harmonia"); }, get hint() { return t("experimentalAppearance.zrownowazone_akcenty_sekcji"); } },
  { value: "analog", get label() { return t("experimentalAppearance.analogiczny"); }, get hint() { return t("experimentalAppearance.odcienie_bliskie_motywowi"); } },
  { value: "triad", get label() { return t("experimentalAppearance.triada"); }, get hint() { return t("experimentalAppearance.trzy_mocne_rozne_kolory"); } },
  { value: "contrast", get label() { return t("experimentalAppearance.kontrast"); }, get hint() { return t("experimentalAppearance.kolor_przeciwny_do_motywu"); } },
  { value: "mono", get label() { return t("experimentalAppearance.monochrom"); }, get hint() { return t("experimentalAppearance.jeden_kolor_w_kilku_jasnosciach"); } },
] as const;

export const EXPERIMENTAL_TYPOGRAPHY = [
  { value: "arena", label: "Arena", get hint() { return t("experimentalAppearance.domyslny_nowoczesny_kroj"); } },
  { value: "classic", get label() { return t("experimentalAppearance.systemowy"); }, get hint() { return t("experimentalAppearance.kroj_twojego_systemu"); } },
  { value: "technical", get label() { return t("experimentalAppearance.techniczny"); }, get hint() { return t("experimentalAppearance.cyfry_i_naglowki_jak_na"); } },
  { value: "readable", get label() { return t("experimentalAppearance.czytelny"); }, get hint() { return t("experimentalAppearance.wiekszy_tekst_i_odstepy"); } },
  { value: "display", get label() { return t("experimentalAppearance.sportowy"); }, get hint() { return t("experimentalAppearance.waskie_wersalikowe_naglowki_jak_na"); } },
  { value: "elegant", get label() { return t("experimentalAppearance.elegancki"); }, get hint() { return t("experimentalAppearance.szeryfowe_tytuly_spokojny_tekst"); } },
] as const;

export const EXPERIMENTAL_SHAPES = [
  { value: "arena", label: "Arena", get hint() { return t("experimentalAppearance.lagodne_zaokraglenia"); } },
  { value: "sharp", get label() { return t("experimentalAppearance.ostre"); }, get hint() { return t("experimentalAppearance.proste_techniczne_krawedzie"); } },
  { value: "round", get label() { return t("experimentalAppearance.okragle"); }, get hint() { return t("experimentalAppearance.miekkie_duze_zaokraglenia"); } },
  { value: "cut", get label() { return t("experimentalAppearance.sciete"); }, get hint() { return t("experimentalAppearance.sciete_narozniki_jak_w_interfejsie"); } },
] as const;

// V5.4 · more categories. Every option changes the look of real components, not only colours.
export const EXPERIMENTAL_DENSITY = [
  { value: "comfortable", get label() { return t("experimentalAppearance.wygodna"); }, get hint() { return t("experimentalAppearance.domyslne_odstepy"); } },
  { value: "compact", get label() { return t("experimentalAppearance.zwarta"); }, get hint() { return t("experimentalAppearance.wiecej_tresci_na_ekranie"); } },
  { value: "spacious", get label() { return t("experimentalAppearance.przestronna"); }, get hint() { return t("experimentalAppearance.duze_odstepy_spokojny_uklad"); } },
] as const;

export const EXPERIMENTAL_BUTTONS = [
  { value: "arena", label: "Arena", get hint() { return t("experimentalAppearance.gradient_i_miekki_blask"); } },
  { value: "solid", get label() { return t("experimentalAppearance.pelne"); }, get hint() { return t("experimentalAppearance.jednolity_kolor_bez_efektow"); } },
  { value: "outline", get label() { return t("experimentalAppearance.kontur"); }, get hint() { return t("experimentalAppearance.przezroczyste_z_wyrazna_ramka"); } },
  { value: "pill", get label() { return t("experimentalAppearance.pigulki"); }, get hint() { return t("experimentalAppearance.w_pelni_zaokraglone"); } },
  { value: "beveled", get label() { return t("experimentalAppearance.sciete"); }, get hint() { return t("experimentalAppearance.sciete_rogi_wersaliki"); } },
] as const;

export const EXPERIMENTAL_CONTROLS = [
  { value: "arena", label: "Arena", get hint() { return t("experimentalAppearance.ciemne_pola_z_ramka"); } },
  { value: "filled", get label() { return t("experimentalAppearance.wypelnione"); }, get hint() { return t("experimentalAppearance.jasne_tlo_pola_bez_ramki"); } },
  { value: "underline", get label() { return t("experimentalAppearance.podkreslone"); }, get hint() { return t("experimentalAppearance.tylko_linia_pod_polem"); } },
  { value: "outlined", get label() { return t("experimentalAppearance.grube_ramki"); }, get hint() { return t("experimentalAppearance.wyrazne_kontrastowe_obramowanie"); } },
] as const;

export const EXPERIMENTAL_BORDERS = [
  { value: "arena", label: "Arena", get hint() { return t("experimentalAppearance.cienkie_linie_i_miekkie_cienie"); } },
  { value: "none", get label() { return t("experimentalAppearance.bez_ramek"); }, get hint() { return t("experimentalAppearance.panele_oddzielone_tylko_tlem"); } },
  { value: "bold", get label() { return t("experimentalAppearance.wyrazne"); }, get hint() { return t("experimentalAppearance.grube_linie_w_kolorze_akcentu"); } },
  { value: "deep", get label() { return t("experimentalAppearance.glebokie_cienie"); }, get hint() { return t("experimentalAppearance.panele_unosza_sie_nad_tlem"); } },
] as const;

export const EXPERIMENTAL_GLOW = [
  { value: "soft", get label() { return t("experimentalAppearance.delikatne"); }, get hint() { return t("experimentalAppearance.lekka_poswiata_akcentow"); } },
  { value: "neon", label: "Neon", get hint() { return t("experimentalAppearance.swiecace_tytuly_i_ramki"); } },
  { value: "none", get label() { return t("experimentalAppearance.bez_swiatla"); }, get hint() { return t("experimentalAppearance.bez_poswiat"); } },
] as const;

export const EXPERIMENTAL_NAV = [
  { value: "arena", label: "Arena", get hint() { return t("experimentalAppearance.zakladki_w_panelu"); } },
  { value: "underline", get label() { return t("experimentalAppearance.podkreslenie"); }, get hint() { return t("experimentalAppearance.linia_pod_aktywna_zakladka"); } },
  { value: "blocks", get label() { return t("experimentalAppearance.bloki"); }, get hint() { return t("experimentalAppearance.wyrazne_pelne_przyciski"); } },
  { value: "pills", get label() { return t("experimentalAppearance.pigulki"); }, get hint() { return t("experimentalAppearance.zaokraglone_zakladki"); } },
] as const;

export const EXPERIMENTAL_TABLES = [
  { value: "arena", label: "Arena", get hint() { return t("experimentalAppearance.delikatne_linie"); } },
  { value: "striped", get label() { return t("experimentalAppearance.pasy"); }, get hint() { return t("experimentalAppearance.naprzemienne_tlo_wierszy"); } },
  { value: "lined", get label() { return t("experimentalAppearance.linie"); }, get hint() { return t("experimentalAppearance.mocne_linie_wersalikowe_naglowki"); } },
  { value: "spacious", get label() { return t("experimentalAppearance.przestronne"); }, get hint() { return t("experimentalAppearance.wyzsze_wiersze_latwe_na_telefonie"); } },
] as const;

export const EXPERIMENTAL_BRACKETS = [
  { value: "arena", label: "Arena", get hint() { return t("experimentalAppearance.spokojne_linie_i_karty"); } },
  { value: "neon", label: "Neon", get hint() { return t("experimentalAppearance.swiecace_polaczenia"); } },
  { value: "minimal", get label() { return t("experimentalAppearance.minimalna"); }, get hint() { return t("experimentalAppearance.cienkie_linie_bez_tla_kart"); } },
  { value: "broadcast", get label() { return t("experimentalAppearance.transmisja"); }, get hint() { return t("experimentalAppearance.grube_linie_kontrastowe_karty"); } },
] as const;

export const EXPERIMENTAL_MATCH_CARDS = [
  { value: "arena", label: "Arena", get hint() { return t("experimentalAppearance.domyslne_karty"); } },
  { value: "scoreboard", get label() { return t("experimentalAppearance.tablica_wynikow"); }, get hint() { return t("experimentalAppearance.duze_cyfry_ciemny_pas_wyniku"); } },
  { value: "compact", get label() { return t("experimentalAppearance.zwarte"); }, get hint() { return t("experimentalAppearance.mniej_miejsca_na_mecz"); } },
] as const;

export const EXPERIMENTAL_DECOR = [
  { value: "none", get label() { return t("experimentalAppearance.brak"); }, get hint() { return t("experimentalAppearance.bez_dodatkow"); } },
  { value: "corners", get label() { return t("experimentalAppearance.narozniki"); }, get hint() { return t("experimentalAppearance.znaczniki_w_rogach_paneli"); } },
  { value: "scanlines", get label() { return t("experimentalAppearance.linie_ekranu"); }, get hint() { return t("experimentalAppearance.delikatny_efekt_monitora"); } },
  { value: "noise", get label() { return t("experimentalAppearance.ziarno"); }, get hint() { return t("experimentalAppearance.subtelna_faktura_tla"); } },
] as const;

export const EXPERIMENTAL_CARD_STYLES = [
  { value: "glass", get label() { return t("experimentalAppearance.szklo"); }, get hint() { return t("experimentalAppearance.polprzezroczyste_panele"); } },
  { value: "solid", get label() { return t("experimentalAppearance.pelne"); }, get hint() { return t("experimentalAppearance.nieprzezroczyste_spokojne"); } },
  { value: "outline", get label() { return t("experimentalAppearance.kontur"); }, get hint() { return t("experimentalAppearance.lekkie_panele_z_wyrazna_linia"); } },
] as const;

export const EXPERIMENTAL_EFFECTS = [
  { value: "full", get label() { return t("experimentalAppearance.pelne"); }, get hint() { return t("experimentalAppearance.poswiaty_i_glebia"); } },
  { value: "subtle", get label() { return t("experimentalAppearance.delikatne"); }, get hint() { return t("experimentalAppearance.mniej_cieni_i_blasku"); } },
  { value: "off", get label() { return t("experimentalAppearance.wylaczone"); }, get hint() { return t("experimentalAppearance.bez_cieni_i_poswiat"); } },
] as const;

export const EXPERIMENTAL_MOTION = [
  { value: "system", get label() { return t("experimentalAppearance.jak_w_systemie"); }, get hint() { return t("experimentalAppearance.szanuje_ustawienie_ograniczonego_ruchu"); } },
  { value: "reduced", get label() { return t("experimentalAppearance.ograniczony"); }, get hint() { return t("experimentalAppearance.bez_animacji_i_przejsc"); } },
] as const;

export const EXPERIMENTAL_CONTRAST = [
  { value: "standard", get label() { return t("experimentalAppearance.standardowy"); }, get hint() { return t("experimentalAppearance.zrownowazony"); } },
  { value: "high", get label() { return t("experimentalAppearance.wysoki"); }, get hint() { return t("experimentalAppearance.mocniejszy_tekst_i_linie"); } },
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

/** V5.8 · preset families, so the list reads as a few styles with variants, not fourteen similar tiles. */
export const EXPERIMENTAL_APPEARANCE_FAMILIES = [
  { id: "arena", label: "Arena", get hint() { return t("experimentalAppearance.futurystycznie_i_kolorowo"); } },
  { id: "broadcast", get label() { return t("experimentalAppearance.transmisja"); }, get hint() { return t("experimentalAppearance.duze_wyniki_na_ekran_i"); } },
  { id: "sport", label: "Sport", get hint() { return t("experimentalAppearance.klasycznie_i_profesjonalnie"); } },
  { id: "arcade", label: "Arcade", get hint() { return t("experimentalAppearance.zywo_i_dynamicznie"); } },
  { id: "technical", get label() { return t("experimentalAppearance.techniczny"); }, get hint() { return t("experimentalAppearance.zwarto_duzo_danych"); } },
  { id: "comfort", get label() { return t("experimentalAppearance.wygoda"); }, get hint() { return t("experimentalAppearance.czytelnosc_i_spokoj"); } },
] as const;
export type ExperimentalAppearanceFamily = (typeof EXPERIMENTAL_APPEARANCE_FAMILIES)[number]["id"];

/** Ready-made sets: one click for beginners, a starting point for tinkering. */
export const EXPERIMENTAL_APPEARANCE_PRESETS: Array<{ id: string; label: string; hint: string; family: ExperimentalAppearanceFamily; values: Partial<ExperimentalAppearance> }> = [
  { id: "arena", label: "Arena", get hint() { return t("experimentalAppearance.domyslny_wyglad_turnieju"); }, family: "arena", values: {} },
  { id: "stage", get label() { return t("experimentalAppearance.scena_turniejowa"); }, get hint() { return t("experimentalAppearance.na_projektor_duze_wyniki_cieple"); }, family: "broadcast", values: { skin: "ember", background: "nebula", palette: "triad", typography: "display", shape: "round", cards: "glass", effects: "full", glow: "neon", density: "spacious", buttons: "pill", nav: "pills", tables: "spacious", brackets: "broadcast", matchCards: "scoreboard", decor: "none" } },
  { id: "readable", get label() { return t("experimentalAppearance.czytelny"); }, get hint() { return t("experimentalAppearance.duzy_tekst_wysoki_kontrast_wyrazne"); }, family: "comfort", values: { background: "carbon", contrast: "high", typography: "readable", cards: "solid", effects: "subtle", glow: "none", density: "spacious", buttons: "solid", controls: "filled", borders: "bold", nav: "blocks", tables: "striped", matchCards: "arena", decor: "none" } },
  { id: "pro", label: "Minimal pro", get hint() { return t("experimentalAppearance.stalowe_pelne_panele_bez_efektow"); }, family: "technical", values: { skin: "iron-citadel", background: "solid", palette: "mono", typography: "classic", shape: "sharp", cards: "solid", effects: "off", glow: "none", density: "comfortable", buttons: "solid", controls: "filled", borders: "none", nav: "blocks", tables: "striped", brackets: "minimal", matchCards: "compact", decor: "none" } },
  { id: "neon", label: "Neon", get hint() { return t("experimentalAppearance.fiolet_i_neon_siatka_areny"); }, family: "arena", values: { skin: "void", background: "grid", palette: "contrast", typography: "technical", shape: "arena", cards: "glass", effects: "full", glow: "neon", buttons: "arena", nav: "arena", tables: "lined", brackets: "neon", matchCards: "scoreboard", decor: "corners" } },
  { id: "calm", get label() { return t("experimentalAppearance.spokojny"); }, get hint() { return t("experimentalAppearance.cieple_miekkie_barwy_bez_animacji"); }, family: "comfort", values: { skin: "copper-age", background: "aura", palette: "analog", typography: "readable", shape: "round", cards: "solid", effects: "subtle", motion: "reduced", glow: "none", buttons: "solid", controls: "filled", borders: "none", nav: "underline", tables: "spacious", matchCards: "arena", decor: "none" } },
  // V5.4 · styles that differ in shape, type, buttons, tables and brackets — not only in colour.
  { id: "esport", get label() { return t("experimentalAppearance.futurystyczny_e_sport"); }, get hint() { return t("experimentalAppearance.siatka_sciete_rogi_neonowa_drabinka"); }, family: "arena", values: { skin: "abyssal", background: "grid", palette: "triad", typography: "technical", shape: "cut", cards: "glass", effects: "full", glow: "neon", buttons: "beveled", nav: "pills", tables: "lined", brackets: "neon", matchCards: "scoreboard", decor: "corners" } },
  { id: "minimal", get label() { return t("experimentalAppearance.minimalistyczny_profesjonalny"); }, get hint() { return t("experimentalAppearance.zwarty_ostry_bez_efektow"); }, family: "technical", values: { skin: "obsidian", background: "solid", palette: "mono", typography: "classic", shape: "sharp", cards: "outline", effects: "off", glow: "none", density: "compact", buttons: "outline", controls: "underline", nav: "underline", tables: "lined", brackets: "minimal", matchCards: "compact", borders: "arena" } },
  { id: "arcade", get label() { return t("experimentalAppearance.energetyczny_arcade"); }, get hint() { return t("experimentalAppearance.pigulki_grube_ramki_linie_ekranu"); }, family: "arcade", values: { skin: "toxic", background: "grid", palette: "triad", typography: "display", shape: "round", cards: "solid", effects: "full", glow: "neon", buttons: "pill", controls: "outlined", borders: "bold", nav: "pills", tables: "striped", matchCards: "scoreboard", decor: "scanlines" } },
  { id: "cyberpunk", label: "Cyberpunk", get hint() { return t("experimentalAppearance.roz_i_cyjan_sciete_panele"); }, family: "arena", values: { skin: "midnight-rose", background: "nebula", palette: "contrast", typography: "technical", shape: "cut", cards: "outline", effects: "full", glow: "neon", buttons: "beveled", controls: "outlined", borders: "bold", nav: "blocks", tables: "lined", brackets: "neon", matchCards: "scoreboard", decor: "scanlines" } },
  { id: "sport", get label() { return t("experimentalAppearance.klasyczny_sport"); }, get hint() { return t("experimentalAppearance.tablica_wynikow_pasy_w_tabeli"); }, family: "sport", values: { skin: "classic", background: "solid", palette: "harmony", typography: "display", shape: "sharp", cards: "solid", effects: "subtle", glow: "none", buttons: "solid", controls: "filled", borders: "arena", nav: "blocks", tables: "striped", brackets: "arena", matchCards: "scoreboard", decor: "none" } },
  { id: "broadcast", get label() { return t("experimentalAppearance.transmisja_tv"); }, get hint() { return t("experimentalAppearance.mocny_kontrast_duze_wyniki_przestrzen"); }, family: "broadcast", values: { skin: "crimson-vault", background: "carbon", palette: "contrast", typography: "display", shape: "sharp", cards: "solid", effects: "subtle", glow: "soft", density: "spacious", buttons: "solid", nav: "underline", tables: "spacious", brackets: "broadcast", matchCards: "scoreboard", borders: "deep", decor: "corners" } },
  { id: "premium", get label() { return t("experimentalAppearance.elegancki_premium"); }, get hint() { return t("experimentalAppearance.zloto_szeryfy_duzo_powietrza"); }, family: "sport", values: { skin: "sandstorm", background: "aura", palette: "analog", typography: "elegant", shape: "round", cards: "glass", effects: "subtle", glow: "soft", density: "spacious", buttons: "outline", controls: "underline", borders: "deep", nav: "underline", tables: "spacious", brackets: "minimal", matchCards: "arena", decor: "noise" } },
  { id: "scifi", get label() { return t("experimentalAppearance.techniczny_sci_fi"); }, get hint() { return t("experimentalAppearance.chlodne_kolory_siatka_znaczniki"); }, family: "technical", values: { skin: "glacier", background: "grid", palette: "analog", typography: "technical", shape: "cut", cards: "outline", effects: "subtle", glow: "soft", density: "compact", buttons: "outline", controls: "outlined", borders: "bold", nav: "underline", tables: "lined", brackets: "minimal", matchCards: "compact", decor: "corners" } },
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
    const label = customName.trim().slice(0, 40) || t("experimentalAppearance.moj_zestaw_v0", { v0: custom.length + 1 });
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
        <button type="button" className="experimental-appearance-trigger" aria-label={t("experimentalAppearance.wyglad_tlo_i_kolory")} title={t("experimentalAppearance.wyglad_zestawy_skorka_tlo_kolory")}>
          <Palette className="h-4 w-4" aria-hidden="true" />
          <span className="experimental-appearance-trigger-label">{t("experimentalAppearance.wyglad")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="experimental-appearance-panel">
        <p className="experimental-appearance-title">{t("experimentalAppearance.wyglad")}</p>
        <p className="experimental-appearance-note">
          {t("experimentalAppearance.tylko_dla_ciebie_w_tej")}</p>
        <div className="experimental-appearance-tabs" role="tablist" aria-label={t("experimentalAppearance.rodzaj_ustawien")}>
          <button type="button" role="tab" aria-selected={tab === "sets"} onClick={() => setTab("sets")}>{t("experimentalAppearance.zestawy")}</button>
          <button type="button" role="tab" aria-selected={tab === "details"} onClick={() => setTab("details")}>{t("experimentalAppearance.szczegoly")}</button>
        </div>

        {tab === "sets" && (
          <div role="tabpanel" aria-label={t("experimentalAppearance.zestawy")}>
            <fieldset className="experimental-appearance-group">
              <legend>{t("experimentalAppearance.gotowe_zestawy")}</legend>
              {EXPERIMENTAL_APPEARANCE_FAMILIES.map((family) => (
              <div key={family.id} className="experimental-appearance-family" role="group" aria-label={`${family.label}: ${family.hint}`}>
              <p className="experimental-appearance-family-label"><strong>{family.label}</strong> <span>{family.hint}</span></p>
              <div className="experimental-appearance-presets">
                {EXPERIMENTAL_APPEARANCE_PRESETS.filter((preset) => preset.family === family.id).map((preset) => {
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
              </div>
              ))}
            </fieldset>
            <fieldset className="experimental-appearance-group">
              <legend>{t("experimentalAppearance.twoje_zestawy")}</legend>
              {custom.length === 0 && <p className="experimental-appearance-note">{t("experimentalAppearance.dopasuj_szczegoly_i_zapisz_wlasny")}{" "}{MAX_CUSTOM_APPEARANCES}).</p>}
              <ul className="experimental-appearance-custom">
                {custom.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="experimental-appearance-custom-apply" aria-pressed={same(item.values, draft)} onClick={() => setDraft(item.values)}>
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {item.label}
                    </button>
                    <button type="button" className="experimental-appearance-custom-remove" aria-label={t("experimentalAppearance.usun_zestaw_label", { label: item.label })} onClick={() => removeCustom(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="experimental-appearance-save">
                <input aria-label={t("experimentalAppearance.nazwa_wlasnego_zestawu")} placeholder={t("experimentalAppearance.nazwa_zestawu")} maxLength={40} value={customName} onChange={(event) => setCustomName(event.target.value)} />
                <button type="button" onClick={saveCustom}><Save className="h-3.5 w-3.5" aria-hidden="true" /> {t("experimentalAppearance.zapisz_obecny")}</button>
              </div>
            </fieldset>
          </div>
        )}

        {tab === "details" && (
          <div role="tabpanel" aria-label={t("experimentalAppearance.szczegoly")}>
            <fieldset className="experimental-appearance-group">
              <legend>{t("experimentalAppearance.skorka")}</legend>
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
              <summary>{t("experimentalAppearance.kolory_tlo_i_faktura")}</summary>
              <OptionGroup category="background" legend={t("experimentalAppearance.tlo")} value={draft.background} onChange={(background) => update({ background })} swatch="bg" />
              <OptionGroup category="palette" legend={t("experimentalAppearance.system_kolorow")} value={draft.palette} onChange={(palette) => update({ palette })} swatch="palette" />
              <OptionGroup category="decor" legend={t("experimentalAppearance.dodatki")} value={draft.decor} onChange={(decor) => update({ decor })} />
            </details>
            <details className="experimental-appearance-section">
              <summary>{t("experimentalAppearance.tekst_uklad_i_ksztalty")}</summary>
              <OptionGroup category="typography" legend={t("experimentalAppearance.typografia")} value={draft.typography} onChange={(typography) => update({ typography })} />
              <OptionGroup category="density" legend={t("experimentalAppearance.gestosc")} value={draft.density} onChange={(density) => update({ density })} />
              <OptionGroup category="shape" legend={t("experimentalAppearance.ksztalty")} value={draft.shape} onChange={(shape) => update({ shape })} />
              <OptionGroup category="cards" legend={t("experimentalAppearance.karty_i_panele")} value={draft.cards} onChange={(cards) => update({ cards })} />
              <OptionGroup category="borders" legend={t("experimentalAppearance.obramowania_i_cienie")} value={draft.borders} onChange={(borders) => update({ borders })} />
            </details>
            <details className="experimental-appearance-section">
              <summary>{t("experimentalAppearance.przyciski_pola_i_nawigacja")}</summary>
              <OptionGroup category="buttons" legend={t("experimentalAppearance.przyciski")} value={draft.buttons} onChange={(buttons) => update({ buttons })} />
              <OptionGroup category="controls" legend={t("experimentalAppearance.pola_formularzy")} value={draft.controls} onChange={(controls) => update({ controls })} />
              <OptionGroup category="nav" legend={t("experimentalAppearance.nawigacja")} value={draft.nav} onChange={(nav) => update({ nav })} />
            </details>
            <details className="experimental-appearance-section">
              <summary>{t("experimentalAppearance.tabele_drabinki_i_mecze")}</summary>
              <OptionGroup category="tables" legend={t("experimentalAppearance.tabele")} value={draft.tables} onChange={(tables) => update({ tables })} />
              <OptionGroup category="brackets" legend={t("experimentalAppearance.drabinki")} value={draft.brackets} onChange={(brackets) => update({ brackets })} />
              <OptionGroup category="matchCards" legend={t("experimentalAppearance.karty_meczow_i_wyniki")} value={draft.matchCards} onChange={(matchCards) => update({ matchCards })} />
            </details>
            <details className="experimental-appearance-section">
              <summary>{t("experimentalAppearance.swiatlo_ruch_i_kontrast")}</summary>
              <OptionGroup category="effects" legend={t("experimentalAppearance.efekty")} value={draft.effects} onChange={(effects) => update({ effects })} />
              <OptionGroup category="glow" legend={t("experimentalAppearance.efekty_swietlne")} value={draft.glow} onChange={(glow) => update({ glow })} />
              <OptionGroup category="contrast" legend={t("experimentalAppearance.kontrast")} value={draft.contrast} onChange={(contrast) => update({ contrast })} />
              {highContrastNote && <p className="experimental-appearance-note" role="status">{t("experimentalAppearance.wysoki_kontrast_zamienia_szklo_na")}</p>}
              <OptionGroup category="motion" legend={t("experimentalAppearance.ruch")} value={draft.motion} onChange={(motion) => update({ motion })} />
            </details>
            <p className="experimental-appearance-note">{t("experimentalAppearance.barwy_i_logo_turnieju_ustala")}</p>
          </div>
        )}

        <div className="experimental-appearance-footer">
          {dirty && <p className="experimental-appearance-note" role="status">{t("experimentalAppearance.podglad_kliknij_zastosuj_aby_zachowac")}</p>}
          {/* V5.8: every shared element (forms, tables, dialogs, notices) under each set, without saving anything. */}
          <a href={`${(import.meta.env?.BASE_URL ?? "/").replace(/\/$/, "")}/experimental/tournaments/katalog`} className="experimental-appearance-note underline">{t("experimentalAppearance.zobacz_wszystkie_elementy_w_katalogu")}</a>
          <div className="experimental-appearance-actions">
            <button type="button" className="experimental-appearance-reset" disabled={same(draft, DEFAULT_EXPERIMENTAL_APPEARANCE)} onClick={() => setDraft(DEFAULT_EXPERIMENTAL_APPEARANCE)}>
              {t("experimentalAppearance.przywroc_domyslne")}</button>
            <button type="button" className="experimental-appearance-cancel" disabled={!dirty} onClick={cancel}>{t("experimentalAppearance.anuluj")}</button>
            <button type="button" className="experimental-appearance-apply" disabled={!dirty} onClick={apply}>{t("experimentalAppearance.zastosuj")}</button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
