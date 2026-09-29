import { useMemo, useState } from "react";
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
  DEFAULT_CAMERA_CHAT_CONFIG,
  cameraChatConfigToSearch,
  getCameraChatSize,
} from "./camera-chat-settings";

const LAYOUT_OPTIONS = [
  { value: "right", label: "Prawo" },
  { value: "below", label: "Dół" },
  { value: "overlay", label: "Na kamerce" },
] as const;

export function ObsLab() {
  const [openChatLab, setOpenChatLab] = useState(false);
  const [config, setConfig] = useState<CameraChatConfig>(DEFAULT_CAMERA_CHAT_CONFIG);
  const [mockMessages, setMockMessages] = useState(() => generateMockMessages());
  const [copied, setCopied] = useState(false);

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
              <span className="rounded-full border border-border bg-background/55 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">aktywne</span>
            </div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-fuchsia-400">OBS 01</div>
            <h2 className="mt-1 text-lg font-bold">Camera + Chat Overlay</h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">Konfigurator kamerki i czatu z gotowym URL dla OBS.</p>
            <div className="mt-auto pt-5 text-xs font-bold text-fuchsia-400">Otwórz konfigurator →</div>
          </div>
        </button>

        <a
          href="/stream/animated-effects/"
          className="group relative min-h-[205px] overflow-hidden rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-fuchsia-500/45 hover:shadow-lg hover:shadow-black/10"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/15 via-fuchsia-500/5 to-transparent" />
          <div className="absolute left-5 top-0 h-1.5 w-16 rounded-b-lg bg-fuchsia-500/55 transition-all group-hover:w-20" />
          <div className="relative flex h-full flex-col">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/65 text-fuchsia-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-border bg-background/55 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">aktywne</span>
            </div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-fuchsia-400">OBS 02</div>
            <h2 className="mt-1 text-lg font-bold">Animated Effects</h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">Edytor animowanych efektów i eksportu do StreamElements.</p>
            <div className="mt-auto pt-5 text-xs font-bold text-fuchsia-400">Otwórz edytor →</div>
          </div>
        </a>

        <div className="flex min-h-[205px] flex-col rounded-2xl border border-dashed border-border bg-card/20 p-5 text-muted-foreground">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-dashed border-border bg-background/30 text-xs font-black">OBS</div>
          <div className="mt-auto">
            <div className="text-sm font-semibold text-foreground">Kolejne narzędzie</div>
            <div className="mt-1 text-xs">Miejsce na następny moduł streamowy.</div>
          </div>
        </div>
      </div>
    );
  }

  const controls = (
    <div className="space-y-3">
      <ToolPanel
        title="Presety"
        actions={
          <ToolButton type="button" variant="ghost" onClick={() => setConfig({ ...DEFAULT_CAMERA_CHAT_CONFIG })}>
            <RefreshCw className="h-4 w-4" /> Reset
          </ToolButton>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {(["glass", "minimal", "compact"] as const).map((preset) => (
            <ToolButton key={preset} type="button" onClick={() => applyPreset(preset)} className="px-2 text-xs">
              {preset === "glass" ? "Glass" : preset === "minimal" ? "Minimal" : "Compact"}
            </ToolButton>
          ))}
        </div>
      </ToolPanel>

      <ToolDisclosure title="Kamerka" open>
        <div className="space-y-4 text-fuchsia-300">
          <label className="block text-xs text-muted-foreground">
            Proporcje
            <ToolSelect
              value={config.aspectRatio}
              onChange={(event) => patchConfig({ aspectRatio: event.target.value as CameraChatAspectRatio })}
              className="mt-1.5"
            >
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
              <option value="1:1">1:1</option>
            </ToolSelect>
          </label>
          <ToolRange label="Szerokość" value={config.cameraWidth} suffix="px" min={320} max={960} step={20} onChange={(cameraWidth) => patchConfig({ cameraWidth })} />
        </div>
      </ToolDisclosure>

      <ToolDisclosure title="Układ" open>
        <div className="space-y-4 text-fuchsia-300">
          <ToolSelect value={config.layout} onChange={(event) => patchConfig({ layout: event.target.value as CameraChatLayout })}>
            <option value="right">Czat po prawej</option>
            <option value="below">Czat pod kamerką</option>
            <option value="overlay">Czat na kamerce</option>
          </ToolSelect>

          {(config.layout === "right" || config.layout === "overlay") && (
            <ToolRange label="Szerokość czatu" value={config.chatWidth} suffix="%" min={20} max={55} onChange={(chatWidth) => patchConfig({ chatWidth })} />
          )}
          {config.layout === "below" && (
            <ToolRange label="Wysokość czatu" value={config.belowHeight} suffix="px" min={80} max={300} onChange={(belowHeight) => patchConfig({ belowHeight })} />
          )}
          {config.layout !== "overlay" && (
            <ToolRange label="Odstęp" value={config.gap} suffix="px" min={0} max={40} onChange={(gap) => patchConfig({ gap })} />
          )}
          {config.layout === "right" && (
            <ToolToggle label="Pełna wysokość czatu" checked={config.fitChatHeight} onChange={(fitChatHeight) => patchConfig({ fitChatHeight })} />
          )}
          {config.layout === "overlay" && (
            <>
              <ToolSelect value={config.overlayPosition} onChange={(event) => patchConfig({ overlayPosition: event.target.value as CameraChatOverlayPosition })}>
                <option value="top-left">Lewy górny</option>
                <option value="top-right">Prawy górny</option>
                <option value="bottom-left">Lewy dolny</option>
                <option value="bottom-right">Prawy dolny</option>
              </ToolSelect>
              <ToolRange label="Odsunięcie" value={config.overlayInset} suffix="px" min={0} max={50} onChange={(overlayInset) => patchConfig({ overlayInset })} />
            </>
          )}
        </div>
      </ToolDisclosure>

      <ToolDisclosure title="Wiadomości">
        <div className="space-y-4 text-fuchsia-300">
          <ToolSection
            title="Przykład"
            action={
              <ToolButton type="button" variant="ghost" onClick={() => setMockMessages(generateMockMessages())}>
                Losuj
              </ToolButton>
            }
          >
            <ToolRange label="Liczba wiadomości" value={config.maxMessages} min={1} max={12} onChange={(maxMessages) => patchConfig({ maxMessages })} />
          </ToolSection>
          <label className="block text-xs text-muted-foreground">
            Rozmiar tekstu
            <ToolSelect value={config.fontSize} onChange={(event) => patchConfig({ fontSize: event.target.value as CameraChatFontSize })} className="mt-1.5">
              <option value="small">Mały</option>
              <option value="medium">Średni</option>
              <option value="large">Duży</option>
            </ToolSelect>
          </label>
          <label className="block text-xs text-muted-foreground">
            Gęstość
            <ToolSelect value={config.density} onChange={(event) => patchConfig({ density: event.target.value as CameraChatDensity })} className="mt-1.5">
              <option value="compact">Kompaktowa</option>
              <option value="normal">Normalna</option>
              <option value="relaxed">Luźna</option>
            </ToolSelect>
          </label>
          <label className="block text-xs text-muted-foreground">
            Kotwiczenie
            <ToolSelect value={config.chatAnchor} onChange={(event) => patchConfig({ chatAnchor: event.target.value as CameraChatAnchor })} className="mt-1.5">
              <option value="top">Od góry</option>
              <option value="bottom">Od dołu</option>
            </ToolSelect>
          </label>
        </div>
      </ToolDisclosure>

      <ToolDisclosure title="Wygląd">
        <div className="space-y-4 text-fuchsia-300">
          <ToolRange label="Krycie panelu" value={config.panelOpacity} suffix="%" min={0} max={100} onChange={(panelOpacity) => patchConfig({ panelOpacity })} />
          <ToolRange label="Zaokrąglenie" value={config.radius} suffix="px" min={0} max={48} onChange={(radius) => patchConfig({ radius })} />
          <ToolRange label="Padding" value={config.innerPadding} suffix="px" min={0} max={30} onChange={(innerPadding) => patchConfig({ innerPadding })} />
          <ToolToggle label="Avatary" checked={config.showAvatars} onChange={(showAvatars) => patchConfig({ showAvatars })} />
          <ToolToggle label="Obramowania" checked={config.showBorders} onChange={(showBorders) => patchConfig({ showBorders })} />
          <ToolToggle label="Tła wiadomości" checked={config.messageBackground} onChange={(messageBackground) => patchConfig({ messageBackground })} />
          <ToolToggle label="Wygaszanie starszych" checked={config.fadeOldMessages} onChange={(fadeOldMessages) => patchConfig({ fadeOldMessages })} />
          <ToolToggle label="Animacja wejścia" checked={config.animateMessages} onChange={(animateMessages) => patchConfig({ animateMessages })} />
        </div>
      </ToolDisclosure>
    </div>
  );

  return (
    <div className="space-y-4">
      <ToolToolbar>
        <ToolButton type="button" onClick={() => setOpenChatLab(false)}>
          <ArrowLeft className="h-4 w-4" /> Narzędzia OBS
        </ToolButton>
        <ToolSegmented value={config.layout} options={LAYOUT_OPTIONS} onChange={(layout) => patchConfig({ layout })} />
      </ToolToolbar>

      <ToolWorkspace sidebar={controls} sidebarWidth="350px">
        <div className="space-y-4">
          <ToolPanel
            title="Podgląd"
            description="Zmiany są od razu widoczne w docelowym rozmiarze."
            actions={<span className="text-xs font-semibold text-muted-foreground">{size.width} × {size.height}px</span>}
          >
            <div className="flex min-h-[560px] items-center justify-center overflow-auto rounded-xl border border-border bg-slate-950 p-6">
              <CameraChatWidget config={config} messages={mockMessages} previewCamera />
            </div>
          </ToolPanel>

          <ToolPanel title="Browser Source" description="Gotowy adres zawierający aktualną konfigurację.">
            <div className="break-all rounded-xl border border-border bg-background/70 p-3 font-mono text-xs leading-5">{overlayUrl}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ToolButton type="button" variant="primary" onClick={copyUrl}>
                <Copy className="h-4 w-4" /> {copied ? "Skopiowano" : "Kopiuj URL"}
              </ToolButton>
              <ToolButton type="button" onClick={() => window.open(overlayUrl, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="h-4 w-4" /> Otwórz overlay
              </ToolButton>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/45 p-3">
                <div className="text-xs text-muted-foreground">Szerokość w OBS</div>
                <div className="mt-1 text-xl font-black">{size.width}px</div>
              </div>
              <div className="rounded-xl border border-border bg-background/45 p-3">
                <div className="text-xs text-muted-foreground">Wysokość w OBS</div>
                <div className="mt-1 text-xl font-black">{size.height}px</div>
              </div>
            </div>
          </ToolPanel>

          <StreamElementsSetup config={config} width={size.width} height={size.height} />
        </div>
      </ToolWorkspace>
    </div>
  );
}
