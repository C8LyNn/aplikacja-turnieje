import { t } from "@/i18n";
import type { CSSProperties, ReactNode } from "react";
import { Check, Copy, Shuffle } from "lucide-react";
import { ToolButton, ToolPanel } from "@/components/tool-ui";
import {
  type CameraChatConfig,
  type CameraChatLayout,
  type CameraChatOverlayPosition,
  rgbaCss,
} from "./camera-chat-settings";
import {
  CHAT_COLOR_THEMES,
  CHAT_COLOR_THEME_IDS,
  CHAT_PRESET_IDS,
  applyChatColorTheme,
  chatColorThemeLabel,
  chatPresetConfig,
  chatPresetLabel,
} from "./chat-presets";
import {
  QUICK_EXTRAS,
  type QuickExtraId,
  applyChatPresetKeepingPlacement,
  quickExtraOn,
  randomChatLook,
  toggleQuickExtra,
} from "./chat-quick-setup";

type ConfigUpdate = (update: (current: CameraChatConfig) => CameraChatConfig) => void;

const CHECKER = "repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 24px 24px";

/** A small picture of a preset: panel, two message bars, its frame colour. */
export function PresetSwatch({ config }: { config: CameraChatConfig }) {
  const panel = rgbaCss(config.panelColor, Math.max(config.panelOpacity, 35));
  const bubble = config.messageBackground ? rgbaCss(config.bubbleColor, Math.max(config.bubbleOpacity, 14)) : "transparent";
  const name = config.nameColorMode === "single" ? config.nameColor : "#a78bfa";
  const text = rgbaCss(config.textColor, config.textOpacity);
  const bar = (width: string, style?: CSSProperties) => (
    <span className="flex items-center gap-1 rounded px-1 py-0.5" style={{ background: bubble, ...style }}>
      <span className="h-1 w-2.5 rounded-full" style={{ background: name }} />
      <span className="h-1 rounded-full" style={{ width, background: text }} />
    </span>
  );
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-12 shrink-0 flex-col justify-end gap-0.5 overflow-hidden rounded-md border border-white/10 p-1"
      style={{
        background: config.panelOpacity > 0 ? panel : CHECKER,
        alignItems: config.textAlign === "right" ? "flex-end" : "flex-start",
        boxShadow: config.frameStyle === "none"
          ? undefined
          : `inset 0 0 0 2px ${config.frameStyle === "rainbow" ? "#f472b6" : config.frameColor}`,
      }}
    >
      {bar("60%")}
      {bar("80%")}
    </span>
  );
}

// --- Step 1: placement --------------------------------------------------------------------------------------------

const LAYOUT_TILES: ReadonlyArray<{ layout: CameraChatLayout; camera?: CSSProperties; chat: CSSProperties; label: () => string }> = [
  { layout: "right", camera: { inset: "0 32% 0 0" }, chat: { inset: "0 0 0 72%" }, label: () => t("obsLab.czat_po_prawej") },
  { layout: "left", camera: { inset: "0 0 0 32%" }, chat: { inset: "0 72% 0 0" }, label: () => t("obsLab.czat_po_lewej") },
  { layout: "below", camera: { inset: "0 0 34% 0" }, chat: { inset: "70% 0 0 0" }, label: () => t("obsLab.czat_pod_kamerka") },
  { layout: "above", camera: { inset: "34% 0 0 0" }, chat: { inset: "0 0 70% 0" }, label: () => t("obsLab.czat_nad_kamerka") },
  { layout: "overlay", camera: { inset: "0" }, chat: { inset: "44% 8% 10% 58%" }, label: () => t("obsLab.czat_na_kamerce") },
  { layout: "chat", chat: { inset: "0 26%" }, label: () => t("obsLab.sam_czat_bez_kamerki") },
];

/** Reading order of the 3 × 3 picker; the middle cell is the camera itself. */
const OVERLAY_GRID: ReadonlyArray<CameraChatOverlayPosition | null> = [
  "top-left", "top-center", "top-right",
  "middle-left", null, "middle-right",
  "bottom-left", "bottom-center", "bottom-right",
];

function overlayPositionLabel(position: CameraChatOverlayPosition): string {
  switch (position) {
    case "top-left": return t("obsLab.lewy_gorny");
    case "top-center": return t("obsLab.gora_srodek");
    case "top-right": return t("obsLab.prawy_gorny");
    case "middle-left": return t("obsLab.srodek_lewa_strona");
    case "middle-right": return t("obsLab.srodek_prawa_strona");
    case "bottom-left": return t("obsLab.lewy_dolny");
    case "bottom-center": return t("obsLab.dol_srodek");
    case "bottom-right": return t("obsLab.prawy_dolny");
  }
}

function quickExtraLabel(id: QuickExtraId): string {
  switch (id) {
    case "snow": return t("obsLab.snieg");
    case "hearts": return t("obsLab.serduszka");
    case "sparkles": return t("obsLab.iskierki");
    case "header": return t("obsLab.naglowek_na_zywo");
    case "firstTime": return t("obsLab.etykieta_nowy");
    case "burst": return t("obsLab.wylatujace_emotki");
    case "frame": return t("obsLab.animowana_ramka");
    case "fade": return t("obsLab.znikanie_po_30_s");
    case "events": return t("obsLab.zdarzenia_na_czacie");
    case "calm": return t("obsLab.spokojny_czat");
  }
}

function Step({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {hint && <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export const choiceClass = (active: boolean) => [
  "rounded-lg border text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
  active
    ? "border-fuchsia-400 bg-fuchsia-500/15 text-foreground"
    : "border-border/70 bg-background/35 text-muted-foreground hover:border-fuchsia-400/60 hover:text-foreground",
].join(" ");

/** Numbered steps for adding the overlay as an OBS Browser Source. */
export function ObsSourceSteps({ width, height }: { width: number; height: number }) {
  return (
    <ol className="list-decimal space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
      <li>{t("obsLab.obs_krok_1")}</li>
      <li>{t("obsLab.obs_krok_2")}</li>
      <li>{t("obsLab.obs_krok_3", { w: width, h: height })}</li>
      <li>{t("obsLab.obs_krok_4")}</li>
    </ol>
  );
}

type Props = {
  config: CameraChatConfig;
  update: ConfigUpdate;
  width: number;
  height: number;
  copied: boolean;
  onCopyUrl: () => void;
  onShowAll: () => void;
};

/** Five short steps that cover what most streamers change; everything else stays in "All options". */
export function ChatQuickSetup({ config, update, width, height, copied, onCopyUrl, onShowAll }: Props) {
  return (
    <ToolPanel title={t("obsLab.szybkie_ustawienie")} description={t("obsLab.piec_krokow_opis")}>
      <div className="space-y-6" data-testid="chat-quick-setup">
        <Step title={t("obsLab.krok_gdzie_czat")}>
          <div className="grid grid-cols-3 gap-1.5">
            {LAYOUT_TILES.map((tile) => (
              <button
                key={tile.layout}
                type="button"
                aria-pressed={config.layout === tile.layout}
                onClick={() => update((current) => ({ ...current, layout: tile.layout }))}
                className={`${choiceClass(config.layout === tile.layout)} flex flex-col items-center gap-1 px-1 py-1.5`}
                data-testid={`quick-layout-${tile.layout}`}
              >
                <span aria-hidden="true" className="relative h-9 w-14 overflow-hidden rounded border border-white/10 bg-slate-950/60">
                  {tile.camera && <span className="absolute rounded-sm bg-slate-500/70" style={tile.camera} />}
                  <span className="absolute rounded-sm bg-fuchsia-400/80" style={tile.chat} />
                </span>
                <span className="leading-tight">{tile.label()}</span>
              </button>
            ))}
          </div>
          {config.layout === "overlay" && (
            <div>
              <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground">{t("obsLab.miejsce_czatu_na_kamerce")}</div>
              <div className="grid w-40 grid-cols-3 gap-1 rounded-lg border border-border/70 bg-slate-950/40 p-1">
                {OVERLAY_GRID.map((position, index) => position
                  ? (
                    <button
                      key={position}
                      type="button"
                      aria-label={overlayPositionLabel(position)}
                      title={overlayPositionLabel(position)}
                      aria-pressed={config.overlayPosition === position}
                      onClick={() => update((current) => ({ ...current, overlayPosition: position }))}
                      className={`${choiceClass(config.overlayPosition === position)} h-7`}
                      data-testid={`quick-position-${position}`}
                    >
                      {config.overlayPosition === position && <Check className="mx-auto h-3.5 w-3.5" />}
                    </button>
                  )
                  : <span key={`camera-${index}`} aria-hidden="true" className="grid h-7 place-items-center text-[9px] font-black text-muted-foreground/60">{t("cameraChatWidget.cam")}</span>)}
              </div>
            </div>
          )}
        </Step>

        <Step title={t("obsLab.krok_styl")} hint={t("obsLab.styl_zachowuje_uklad")}>
          <div className="grid grid-cols-2 gap-1.5">
            {CHAT_PRESET_IDS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => update((current) => applyChatPresetKeepingPlacement(current, preset))}
                className={`${choiceClass(false)} flex items-center gap-2 px-2 py-1.5 text-left`}
                data-testid={`quick-preset-${preset}`}
              >
                <PresetSwatch config={chatPresetConfig(preset)} />
                <span className="min-w-0 leading-tight">{chatPresetLabel(preset)}</span>
              </button>
            ))}
          </div>
          <ToolButton type="button" variant="ghost" className="px-2 py-1 text-xs" onClick={() => update((current) => randomChatLook(current))} data-testid="quick-random">
            <Shuffle className="h-3.5 w-3.5" />{" "}{t("obsLab.losuj_wyglad")}
          </ToolButton>
        </Step>

        <Step title={t("obsLab.krok_kolory")}>
          <div className="grid grid-cols-4 gap-1.5">
            {CHAT_COLOR_THEME_IDS.map((theme) => {
              const colors = CHAT_COLOR_THEMES[theme];
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => update((current) => applyChatColorTheme(current, theme))}
                  className={`${choiceClass(false)} flex flex-col items-center gap-1 px-1 py-1.5 text-[10px]`}
                >
                  <span
                    aria-hidden="true"
                    className="h-5 w-full rounded"
                    style={{ background: `linear-gradient(90deg, ${colors.panelColor}, ${colors.panelColor2} 45%, ${colors.frameColor} 75%, ${colors.frameColor2})` }}
                  />
                  {chatColorThemeLabel(theme)}
                </button>
              );
            })}
          </div>
        </Step>

        <Step title={t("obsLab.krok_dodatki")} hint={t("obsLab.kliknij_aby_wlaczyc_lub_wylaczyc")}>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EXTRAS.map((extra) => {
              const on = quickExtraOn(extra, config);
              return (
                <button
                  key={extra}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update((current) => toggleQuickExtra(extra, current, t("obsLab.czat_na_zywo")))}
                  className={`${choiceClass(on)} inline-flex items-center gap-1 px-2.5 py-1.5 text-xs`}
                  data-testid={`quick-extra-${extra}`}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {quickExtraLabel(extra)}
                </button>
              );
            })}
          </div>
        </Step>

        <Step title={t("obsLab.krok_obs")}>
          <ObsSourceSteps width={width} height={height} />
          <ToolButton type="button" variant="primary" onClick={onCopyUrl} className="w-full">
            <Copy className="h-4 w-4" /> {copied ? t("obsLab.skopiowano") : t("obsLab.kopiuj_adres_do_obs")}
          </ToolButton>
          <p className="text-[11px] leading-4 text-muted-foreground">{t("obsLab.wolisz_streamelements")}</p>
        </Step>

        <div className="rounded-xl border border-dashed border-border bg-background/30 p-3 text-xs leading-5 text-muted-foreground">
          {t("obsLab.wiecej_opcji_w_trybie")}
          <ToolButton type="button" variant="ghost" className="mt-1 px-2 py-1 text-xs" onClick={onShowAll}>
            {t("obsLab.pokaz_wszystkie_opcje")}
          </ToolButton>
        </div>
      </div>
    </ToolPanel>
  );
}
