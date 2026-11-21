import { t } from "@/i18n";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, ExternalLink, MonitorPlay, RefreshCw, Sparkles } from "lucide-react";
import {
  ToolButton,
  ToolDisclosure,
  ToolPanel,
  ToolRange,
  ToolSection,
  ToolSegmented,
  ToolSelect,
  ToolToggle,
  ToolToolbar,
  ToolWorkspace,
} from "@/components/tool-ui";
import { StreamElementsSetup } from "./StreamElementsSetup";
import { CameraChatWidget, generateMockMessages } from "./CameraChatWidget";
import {
  type CameraChatConfig,
  type CameraChatLayout,
  type CameraChatAspectRatio,
  type CameraChatFontSize,
  type CameraChatDensity,
  type CameraChatAnchor,
  type CameraChatOverlayPosition,
  type CameraChatAnimationStyle,
  DEFAULT_CAMERA_CHAT_CONFIG,
  cameraChatConfigToSearch,
  getCameraChatSize,
} from "./camera-chat-settings";

const LAYOUT_OPTIONS = [
  { value: "right", label: "Prawo" },
  { value: "below", get label() { return t("obsLab.dol"); } },
  { value: "overlay", get label() { return t("obsLab.na_kamerce"); } },
] as const;

export function ObsLab() {
  const [openChatLab, setOpenChatLab] = useState(false);
  const [config, setConfig] = useState<CameraChatConfig>(DEFAULT_CAMERA_CHAT_CONFIG);
  const [mockMessages, setMockMessages] = useState(() => generateMockMessages());
  const [copied, setCopied] = useState(false);
  const previewMessageId = useRef(0);

  const size = getCameraChatSize(config);

  function patchConfig(patch: Partial<CameraChatConfig>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  const overlayUrl = useMemo(() => {
    const basePath = (import.meta.env?.BASE_URL ?? "/").replace(/\/$/, "");
    const path = `${basePath}/stream/overlay/camera-chat`;
    return `${window.location.origin}${path}?${cameraChatConfigToSearch(config)}`;
  }, [config]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(overlayUrl);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = overlayUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function testChatAnimation(count = 1) {
    const incoming = Array.from({ length: count }, (_, index) => {
      const id = ++previewMessageId.current;
      return {
        name: t("obsLab.widz_testowy") + (index + 1),
        text: t("obsLab.nowa_wiadomosc_podglad_animacji") + id + "!",
        msgId: `chat-animation-preview-${id}`,
      };
    });
    setMockMessages((current) => [...current, ...incoming].slice(-30));
  }

  function applyPreset(preset: "glass" | "minimal" | "compact") {
    if (preset === "glass") {
      setConfig({ ...DEFAULT_CAMERA_CHAT_CONFIG, panelOpacity: 66, radius: 24 });
      return;
    }
    if (preset === "minimal") {
      setConfig({
        ...DEFAULT_CAMERA_CHAT_CONFIG,
        layout: "below",
        fontSize: "small",
        density: "compact",
        maxMessages: 4,
        panelOpacity: 28,
        radius: 14,
        innerPadding: 8,
        showBorders: false,
        messageBackground: false,
      });
      return;
    }
    setConfig({
      ...DEFAULT_CAMERA_CHAT_CONFIG,
      layout: "overlay",
      chatWidth: 38,
      maxMessages: 4,
      fontSize: "small",
      density: "compact",
      panelOpacity: 62,
      radius: 18,
      innerPadding: 8,
      showBorders: false,
      overlayInset: 12,
      overlayPosition: "bottom-right",
    });
  }

  if (!openChatLab) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => setOpenChatLab(true)}
          className="group relative min-h-[205px] overflow-hidden rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-fuchsia-500/45 hover:shadow-lg hover:shadow-black/10"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/15 via-fuchsia-500/5 to-transparent" />
          <div className="absolute left-5 top-0 h-1.5 w-16 rounded-b-lg bg-fuchsia-500/55 transition-all group-hover:w-20" />
          <div className="relative flex h-full flex-col">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/65 text-fuchsia-400">
                <MonitorPlay className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-border bg-background/55 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{t("obsLab.aktywne")}</span>
            </div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-fuchsia-400">{t("obsLab.obs_01")}</div>
            <h2 className="mt-1 text-lg font-bold">{t("obsLab.camera_chat_overlay")}</h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">{t("obsLab.konfigurator_kamerki_i_czatu_z")}</p>
            <div className="mt-auto pt-5 text-xs font-bold text-fuchsia-400">{t("obsLab.otworz_konfigurator")}</div>
          </div>
        </button>

        <a
          href="/stream/animated-effects/index.html"
          className="group relative min-h-[205px] overflow-hidden rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-fuchsia-500/45 hover:shadow-lg hover:shadow-black/10"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/15 via-fuchsia-500/5 to-transparent" />
          <div className="absolute left-5 top-0 h-1.5 w-16 rounded-b-lg bg-fuchsia-500/55 transition-all group-hover:w-20" />
          <div className="relative flex h-full flex-col">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/65 text-fuchsia-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-border bg-background/55 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{t("obsLab.aktywne")}</span>
            </div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-fuchsia-400">{t("obsLab.obs_02")}</div>
            <h2 className="mt-1 text-lg font-bold">{t("obsLab.animated_effects")}</h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">{t("obsLab.edytor_animowanych_efektow_i_eksportu")}</p>
            <div className="mt-auto pt-5 text-xs font-bold text-fuchsia-400">{t("obsLab.otworz_edytor")}</div>
          </div>
        </a>

        <div className="flex min-h-[205px] flex-col rounded-2xl border border-dashed border-border bg-card/20 p-5 text-muted-foreground">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-dashed border-border bg-background/30 text-xs font-black">{t("obsLab.obs")}</div>
          <div className="mt-auto">
            <div className="text-sm font-semibold text-foreground">{t("obsLab.kolejne_narzedzie")}</div>
            <div className="mt-1 text-xs">{t("obsLab.miejsce_na_nastepny_modul_streamowy")}</div>
          </div>
        </div>
      </div>
    );
  }

  const controls = (
    <div className="space-y-3">
      <ToolPanel
        title={t("obsLab.presety")}
        actions={
          <ToolButton type="button" variant="ghost" onClick={() => setConfig({ ...DEFAULT_CAMERA_CHAT_CONFIG })}>
            <RefreshCw className="h-4 w-4" />{" "}{t("obsLab.reset")}</ToolButton>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {(["glass", "minimal", "compact"] as const).map((preset) => (
            <ToolButton key={preset} type="button" onClick={() => applyPreset(preset)} className="px-2 text-xs">
              {preset === "glass" ? t("obsLab.glass") : preset === "minimal" ? t("obsLab.minimal") : t("obsLab.compact")}
            </ToolButton>
          ))}
        </div>
      </ToolPanel>

      <ToolDisclosure title={t("obsLab.kamerka")} open>
        <div className="space-y-4 text-fuchsia-300">
          <label className="block text-xs text-muted-foreground">{t("obsLab.proporcje")}<ToolSelect
              value={config.aspectRatio}
              onChange={(event) => patchConfig({ aspectRatio: event.target.value as CameraChatAspectRatio })}
              className="mt-1.5"
            >
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
              <option value="1:1">1:1</option>
            </ToolSelect>
          </label>
          <ToolRange label={t("obsLab.szerokosc")} value={config.cameraWidth} suffix="px" min={320} max={960} step={20} onChange={(cameraWidth) => patchConfig({ cameraWidth })} />
        </div>
      </ToolDisclosure>

      <ToolDisclosure title={t("obsLab.uklad")} open>
        <div className="space-y-4 text-fuchsia-300">
          <ToolSelect value={config.layout} onChange={(event) => patchConfig({ layout: event.target.value as CameraChatLayout })}>
            <option value="right">{t("obsLab.czat_po_prawej")}</option>
            <option value="below">{t("obsLab.czat_pod_kamerka")}</option>
            <option value="overlay">{t("obsLab.czat_na_kamerce")}</option>
          </ToolSelect>

          {(config.layout === "right" || config.layout === "overlay") && (
            <ToolRange label={t("obsLab.szerokosc_czatu")} value={config.chatWidth} suffix="%" min={20} max={55} onChange={(chatWidth) => patchConfig({ chatWidth })} />
          )}
          {config.layout === "below" && (
            <ToolRange label={t("obsLab.wysokosc_czatu")} value={config.belowHeight} suffix="px" min={80} max={300} onChange={(belowHeight) => patchConfig({ belowHeight })} />
          )}
          {config.layout !== "overlay" && (
            <ToolRange label={t("obsLab.odstep")} value={config.gap} suffix="px" min={0} max={40} onChange={(gap) => patchConfig({ gap })} />
          )}
          {config.layout === "right" && (
            <ToolToggle label={t("obsLab.pelna_wysokosc_czatu")} checked={config.fitChatHeight} onChange={(fitChatHeight) => patchConfig({ fitChatHeight })} />
          )}
          {config.layout === "overlay" && (
            <>
              <ToolSelect value={config.overlayPosition} onChange={(event) => patchConfig({ overlayPosition: event.target.value as CameraChatOverlayPosition })}>
                <option value="top-left">{t("obsLab.lewy_gorny")}</option>
                <option value="top-right">{t("obsLab.prawy_gorny")}</option>
                <option value="bottom-left">{t("obsLab.lewy_dolny")}</option>
                <option value="bottom-right">{t("obsLab.prawy_dolny")}</option>
              </ToolSelect>
              <ToolRange label={t("obsLab.odsuniecie")} value={config.overlayInset} suffix="px" min={0} max={50} onChange={(overlayInset) => patchConfig({ overlayInset })} />
            </>
          )}
        </div>
      </ToolDisclosure>

      <ToolDisclosure title={t("obsLab.wiadomosci")}>
        <div className="space-y-4 text-fuchsia-300">
          <ToolSection
            title={t("obsLab.przyklad")}
            action={
              <ToolButton type="button" variant="ghost" onClick={() => setMockMessages(generateMockMessages())}>{t("obsLab.losuj")}</ToolButton>
            }
          >
            <ToolRange label={t("obsLab.liczba_wiadomosci")} value={config.maxMessages} min={1} max={12} onChange={(maxMessages) => patchConfig({ maxMessages })} />
          </ToolSection>
          <label className="block text-xs text-muted-foreground">{t("obsLab.rozmiar_tekstu")}<ToolSelect value={config.fontSize} onChange={(event) => patchConfig({ fontSize: event.target.value as CameraChatFontSize })} className="mt-1.5">
              <option value="small">{t("obsLab.maly")}</option>
              <option value="medium">{t("obsLab.sredni")}</option>
              <option value="large">{t("obsLab.duzy")}</option>
            </ToolSelect>
          </label>
          <label className="block text-xs text-muted-foreground">{t("obsLab.gestosc")}<ToolSelect value={config.density} onChange={(event) => patchConfig({ density: event.target.value as CameraChatDensity })} className="mt-1.5">
              <option value="compact">{t("obsLab.kompaktowa")}</option>
              <option value="normal">{t("obsLab.normalna")}</option>
              <option value="relaxed">{t("obsLab.luzna")}</option>
            </ToolSelect>
          </label>
          <label className="block text-xs text-muted-foreground">{t("obsLab.kotwiczenie")}<ToolSelect value={config.chatAnchor} onChange={(event) => patchConfig({ chatAnchor: event.target.value as CameraChatAnchor })} className="mt-1.5">
              <option value="top">{t("obsLab.od_gory")}</option>
              <option value="bottom">{t("obsLab.od_dolu")}</option>
            </ToolSelect>
          </label>
        </div>
      </ToolDisclosure>

      <ToolDisclosure title={t("obsLab.wyglad")}>
        <div className="space-y-4 text-fuchsia-300">
          <ToolRange label={t("obsLab.krycie_panelu")} value={config.panelOpacity} suffix="%" min={0} max={100} onChange={(panelOpacity) => patchConfig({ panelOpacity })} />
          <ToolRange label={t("obsLab.zaokraglenie")} value={config.radius} suffix="px" min={0} max={48} onChange={(radius) => patchConfig({ radius })} />
          <ToolRange label={t("obsLab.padding")} value={config.innerPadding} suffix="px" min={0} max={30} onChange={(innerPadding) => patchConfig({ innerPadding })} />
          <ToolToggle label={t("obsLab.avatary")} checked={config.showAvatars} onChange={(showAvatars) => patchConfig({ showAvatars })} />
          <ToolToggle label={t("obsLab.obramowania")} checked={config.showBorders} onChange={(showBorders) => patchConfig({ showBorders })} />
          <ToolToggle label={t("obsLab.tla_wiadomosci")} checked={config.messageBackground} onChange={(messageBackground) => patchConfig({ messageBackground })} />
          <ToolToggle label={t("obsLab.wygaszanie_starszych")} checked={config.fadeOldMessages} onChange={(fadeOldMessages) => patchConfig({ fadeOldMessages })} />
          <ToolToggle label={t("obsLab.animacja_wejscia")} checked={config.animateMessages} onChange={(animateMessages) => patchConfig({ animateMessages })} />
          {config.animateMessages && (
            <div className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
              <label className="block text-xs text-muted-foreground">{t("obsLab.styl_animacji")}<ToolSelect value={config.animationStyle} onChange={(event) => patchConfig({ animationStyle: event.target.value as CameraChatAnimationStyle })} className="mt-1.5">
                  <option value="rise">{t("obsLab.pojawienie_od_dolu")}</option>
                  <option value="slide">{t("obsLab.wjazd_z_lewej")}</option>
                  <option value="pop">{t("obsLab.powiekszenie")}</option>
                  <option value="fade">{t("obsLab.przenikanie")}</option>
                  <option value="bounce">{t("obsLab.odbicie")}</option>
                  <option value="flip">{t("obsLab.obrot_3d")}</option>
                  <option value="wipe">{t("obsLab.odsloniecie")}</option>
                  <option value="random">{t("obsLab.losowo_dla_kazdej_wiadomosci")}</option>
                </ToolSelect>
              </label>
              <ToolRange label={t("obsLab.czas_animacji")} value={config.animationDurationMs} suffix="ms" min={100} max={1200} step={20} onChange={(animationDurationMs) => patchConfig({ animationDurationMs })} />
              <div className="flex flex-wrap gap-2">
                <ToolButton type="button" onClick={() => testChatAnimation()}>{t("obsLab.testuj_nowa_wiadomosc")}</ToolButton>
                <ToolButton type="button" onClick={() => testChatAnimation(4)}>{t("obsLab.testuj_serie_4_wiadomosci")}</ToolButton>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{t("obsLab.animujemy")}{" "}<strong>{t("obsLab.sama_wiadomosc_czatu")}</strong>{t("obsLab.a_nie_cale_tlo_sceny")}</p>
            </div>
          )}
        </div>
      </ToolDisclosure>
    </div>
  );

  return (
    <div className="space-y-4">
      <ToolToolbar>
        <ToolButton type="button" onClick={() => setOpenChatLab(false)}>
          <ArrowLeft className="h-4 w-4" />{" "}{t("obsLab.narzedzia_obs")}</ToolButton>
        <ToolSegmented value={config.layout} options={LAYOUT_OPTIONS} onChange={(layout) => patchConfig({ layout })} />
      </ToolToolbar>

      <ToolWorkspace sidebar={controls} sidebarWidth="350px">
        <div className="space-y-4">
          <ToolPanel
            title={t("obsLab.podglad")}
            description={t("obsLab.zmiany_sa_od_razu_widoczne")}
            actions={<span className="text-xs font-semibold text-muted-foreground">{size.width} × {size.height}{t("obsLab.px")}</span>}
          >
            <div className="flex min-h-[560px] items-center justify-center overflow-auto rounded-xl border border-border bg-slate-950 p-6">
              <CameraChatWidget config={config} messages={mockMessages} previewCamera />
            </div>
          </ToolPanel>

          <ToolPanel title={t("obsLab.browser_source")} description={t("obsLab.gotowy_adres_zawierajacy_aktualna_konfig")}>
            <div className="break-all rounded-xl border border-border bg-background/70 p-3 font-mono text-xs leading-5">{overlayUrl}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ToolButton type="button" variant="primary" onClick={copyUrl}>
                <Copy className="h-4 w-4" /> {copied ? t("obsLab.skopiowano") : t("obsLab.kopiuj_url")}
              </ToolButton>
              <ToolButton type="button" onClick={() => window.open(overlayUrl, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="h-4 w-4" />{" "}{t("obsLab.otworz_overlay")}</ToolButton>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/45 p-3">
                <div className="text-xs text-muted-foreground">{t("obsLab.szerokosc_w_obs")}</div>
                <div className="mt-1 text-xl font-black">{size.width}{t("obsLab.px")}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/45 p-3">
                <div className="text-xs text-muted-foreground">{t("obsLab.wysokosc_w_obs")}</div>
                <div className="mt-1 text-xl font-black">{size.height}{t("obsLab.px")}</div>
              </div>
            </div>
          </ToolPanel>

          <StreamElementsSetup config={config} width={size.width} height={size.height} />
        </div>
      </ToolWorkspace>
    </div>
  );
}
