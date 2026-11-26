import { t } from "@/i18n";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Copy, ExternalLink, MonitorPlay, Redo2, RefreshCw, Save, Search, Sparkles, Trash2, Undo2, Upload, Volume2 } from "lucide-react";
import {
  ToolButton,
  ToolDisclosure,
  ToolInput,
  ToolNotice,
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
import { ChatQuickSetup, ObsSourceSteps, PresetCategoryChips, PresetSwatch, choiceClass } from "./ChatQuickSetup";
import { type CameraChatEventStyle, type ChatEventKind, type ChatGoalKind, CHAT_EVENT_KINDS, chatGoalDefaultLabel } from "./chat-events";
import { type ChatSoundMode, type ChatSoundStyle, CHAT_SOUND_RECIPES, chatAudio, playChatNotes } from "./chat-sound";
import { chatEventLabels } from "./chat-event-labels";
import { ChatSetupCheck } from "./ChatSetupCheck";
import { useChatPacer } from "./use-chat-pacer";

/** Lower case, without Polish accents, so "snieg" finds "Śnieg". */
function normalizeSearch(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0142/g, "l");
}
import { commitChatHistory, redoChatHistory, startChatHistory, undoChatHistory } from "./chat-quick-setup";
import {
  CameraChatWidget,
  generateMockMessages,
  SAMPLE_BADGES,
  SAMPLE_EMOTES,
  type MockChatMessage,
} from "./CameraChatWidget";
import {
  type CameraChatConfig,
  type CameraChatLayout,
  type CameraChatAspectRatio,
  type CameraChatFontSize,
  type CameraChatDensity,
  type CameraChatAnchor,
  type CameraChatOverlayPosition,
  type CameraChatAnimationStyle,
  type CameraChatFontFamily,
  type CameraChatTextShadow,
  type CameraChatMessageLayout,
  type CameraChatAlign,
  type CameraChatNameColorMode,
  type CameraChatExitStyle,
  type CameraChatMessageEffect,
  type CameraChatTextReveal,
  type CameraChatFrameStyle,
  type CameraChatPanelAnimation,
  type CameraChatNamePalette,
  type CameraChatAmbient,
  type CameraChatHeaderStyle,
  type CameraChatBubbleShape,
  type CameraChatNameStyle,
  type CameraChatPanelPattern,
  COMMON_CHAT_BOTS,
  DEFAULT_CAMERA_CHAT_CONFIG,
  cameraChatConfigFromSearch,
  cameraChatConfigFromUrl,
  cameraChatConfigToSearch,
  getCameraChatSize,
} from "./camera-chat-settings";
import { parseChatNameList, parseChatWordList } from "./chat-message-format";
import {
  type ChatPresetCategory,
  chatPresetsIn,
  CHAT_COLOR_THEME_IDS,
  CHAT_COLOR_THEMES,
  applyChatColorTheme,
  chatColorThemeLabel,
  chatPresetConfig,
  chatPresetLabel,
} from "./chat-presets";

const LAYOUT_OPTIONS = [
  { value: "right", get label() { return t("obsLab.prawo"); } },
  { value: "left", get label() { return t("obsLab.lewo"); } },
  { value: "below", get label() { return t("obsLab.dol"); } },
  { value: "above", get label() { return t("obsLab.gora"); } },
  { value: "overlay", get label() { return t("obsLab.na_kamerce"); } },
  { value: "chat", get label() { return t("obsLab.sam_czat"); } },
] as const;

const ALIGN_OPTIONS = [
  { value: "left", get label() { return t("obsLab.do_lewej"); } },
  { value: "right", get label() { return t("obsLab.do_prawej"); } },
] as const;

// --- Stored setups (this browser only) ----------------------------------------------------------------------------

const CONFIG_STORAGE_KEY = "tm_obs_camera_chat_config";
const MODE_STORAGE_KEY = "tm_obs_camera_chat_mode";
const SAVED_STORAGE_KEY = "tm_obs_camera_chat_saved";
const MAX_SAVED_SETUPS = 20;

type SavedSetup = { name: string; search: string };

function loadStoredConfig(): CameraChatConfig {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    return stored ? cameraChatConfigFromSearch(stored) : DEFAULT_CAMERA_CHAT_CONFIG;
  } catch {
    return DEFAULT_CAMERA_CHAT_CONFIG;
  }
}

function loadSavedSetups(): SavedSetup[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is SavedSetup => !!item && typeof item === "object"
        && typeof (item as SavedSetup).name === "string" && typeof (item as SavedSetup).search === "string")
      .map((item) => ({ name: item.name.slice(0, 40), search: item.search.slice(0, 4000) }))
      .slice(0, MAX_SAVED_SETUPS);
  } catch {
    return [];
  }
}

type SetupMode = "quick" | "all";

const SETUP_MODE_OPTIONS = [
  { value: "quick", get label() { return t("obsLab.szybkie_ustawienie"); } },
  { value: "all", get label() { return t("obsLab.wszystkie_opcje"); } },
] as const;

function loadSetupMode(): SetupMode {
  try {
    return localStorage.getItem(MODE_STORAGE_KEY) === "all" ? "all" : "quick";
  } catch {
    return "quick";
  }
}

/** How often "live preview" sends a test message. */
const LIVE_PREVIEW_MS = 2500;

function storeValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage blocked: the settings last for this visit
  }
}

// --- Preview ------------------------------------------------------------------------------------------------------

type PreviewBackground = "dark" | "light" | "checker" | "game";

const PREVIEW_BACKGROUNDS: Record<PreviewBackground, string> = {
  dark: "#020617",
  light: "#e2e8f0",
  checker: "repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 24px 24px",
  game: "radial-gradient(circle at 18% 28%, rgba(250,204,21,.35), transparent 40%), radial-gradient(circle at 82% 72%, rgba(14,165,233,.45), transparent 45%), linear-gradient(135deg, #1e1b4b, #7c2d12 55%, #14532d)",
};

const PREVIEW_BACKGROUND_OPTIONS = [
  { value: "dark", get label() { return t("obsLab.ciemne"); } },
  { value: "light", get label() { return t("obsLab.jasne"); } },
  { value: "checker", get label() { return t("obsLab.przezroczyste"); } },
  { value: "game", get label() { return t("obsLab.gra"); } },
] as const;

type TestKind = "plain" | "emotes" | "mod" | "command" | "link" | "long" | "mention" | "action" | "bot" | "first" | "reply" | "points";

const TEST_KINDS: readonly TestKind[] = [
  "plain", "emotes", "mod", "command", "link", "long", "mention", "action", "bot", "first", "reply", "points",
];

/** Messages sent at once by the chat-flood test. */
const FLOOD_TEST_COUNT = 20;
const FLOOD_NAMES = ["NightOwl", "PixelMaja", "GreenWolf", "LunaPlays", "frostbyte", "AdaQ", "Bartek_TV"] as const;

function testKindLabel(kind: TestKind): string {
  switch (kind) {
    case "plain": return t("obsLab.zwykla");
    case "emotes": return t("obsLab.z_emotkami");
    case "mod": return t("obsLab.moderator");
    case "command": return t("obsLab.komenda");
    case "link": return t("obsLab.link");
    case "long": return t("obsLab.dluga");
    case "mention": return t("obsLab.wzmianka");
    case "action": return "/me";
    case "bot": return t("obsLab.bot");
    case "first": return t("obsLab.nowy_widz");
    case "reply": return t("obsLab.odpowiedz");
    case "points": return t("obsLab.za_punkty");
  }
}

function eventKindLabel(kind: ChatEventKind): string {
  switch (kind) {
    case "follow": return t("obsLab.obserwacja");
    case "sub": return t("obsLab.subskrypcja");
    case "gift": return t("obsLab.suby_w_prezencie");
    case "cheer": return t("obsLab.bitsy");
    case "raid": return t("obsLab.raid");
    case "tip": return t("obsLab.napiwek");
  }
}

function testEvent(kind: ChatEventKind, id: number): MockChatMessage {
  const base = { id: `event-test-${id}`, receivedAt: Date.now() };
  switch (kind) {
    case "follow":
      return { ...base, name: "MartaGra", text: "", event: { kind, name: "MartaGra", amount: 0 } };
    case "sub":
      return { ...base, name: "LunaPlays", text: t("obsLab.pol_roku_z_wami"), event: { kind, name: "LunaPlays", amount: 6, tier: "1000" } };
    case "gift":
      return { ...base, name: "AdaQ", text: "", event: { kind, name: "AdaQ", sender: "AdaQ", amount: 5, bulk: true, tier: "1000" } };
    case "cheer":
      return { ...base, name: "frostbyte", text: "GG!", event: { kind, name: "frostbyte", amount: 500 } };
    case "raid":
      return { ...base, name: "KubaGG", text: "", event: { kind, name: "KubaGG", amount: 42 } };
    case "tip":
      return { ...base, name: "Bartek_TV", text: t("obsLab.na_nowa_kamerke"), event: { kind, name: "Bartek_TV", amount: 25 } };
  }
}

function testMessage(kind: TestKind, id: number, config: CameraChatConfig): MockChatMessage {
  const base = {
    id: `test-${id}`,
    msgId: `chat-test-${id}`,
    receivedAt: Date.now(),
    emotes: [...SAMPLE_EMOTES],
  };
  switch (kind) {
    case "plain":
      return { ...base, name: "NightOwl", color: "#1E90FF", badges: [SAMPLE_BADGES.subscriber], text: t("obsLab.czesc_jak_leci") };
    case "emotes":
      return { ...base, name: "LunaPlays", color: "#9ACD32", text: t("obsLab.ale_akcja_a_b", { a: SAMPLE_EMOTES[0]!.name, b: SAMPLE_EMOTES[2]!.name }) };
    case "mod":
      return { ...base, name: "GreenWolf", color: "#2E8B57", badges: [SAMPLE_BADGES.moderator], text: t("obsLab.pamietajcie_o_regulaminie_czatu") };
    case "command":
      return { ...base, name: "KubaGG", text: "!discord" };
    case "link":
      return { ...base, name: "frostbyte", color: "#DAA520", text: t("obsLab.zobaczcie_to_link", { link: "www.example.com/clip" }) };
    case "long":
      return { ...base, name: "PixelMaja", color: "#FF69B4", badges: [SAMPLE_BADGES.vip], text: t("obsLab.dluga_wiadomosc_testowa") };
    case "mention":
      return {
        ...base,
        name: "AdaQ",
        color: "#B22222",
        badges: [SAMPLE_BADGES.subscriber],
        text: t("obsLab.hej_name_pozdrawiam_z_krakowa", { name: parseChatWordList(config.highlightWords)[0] ?? "streamer" }),
      };
    case "action":
      return { ...base, name: "Bartek_TV", color: "#0000FF", isAction: true, text: t("obsLab.tanczy_z_radosci") };
    case "bot":
      return { ...base, name: "StreamElements", nick: "streamelements", color: "#5B99FF", badges: [SAMPLE_BADGES.moderator], text: t("obsLab.dolacz_do_naszego_discorda") };
    case "first":
      return { ...base, name: "ZielonaZaba", color: "#7CFC00", firstMessage: true, text: `${t("obsLab.pierwszy_raz_tutaj")} ${SAMPLE_EMOTES[3]!.name}` };
    case "reply":
      return {
        ...base,
        name: "LunaPlays",
        color: "#9ACD32",
        badges: [SAMPLE_BADGES.subscriber],
        text: `@NightOwl ${t("obsLab.tez_tak_mysle")}`,
        reply: { name: "NightOwl", text: t("obsLab.czesc_jak_leci") },
      };
    case "points":
      return { ...base, name: "PixelMaja", color: "#FF69B4", badges: [SAMPLE_BADGES.vip], pointsMessage: true, text: t("obsLab.wyroznione_za_punkty_tekst") };
  }
}

// --- Small controls -----------------------------------------------------------------------------------------------

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/35 px-3 py-2 text-xs text-muted-foreground">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <code className="font-mono text-[11px] text-foreground">{value}</code>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-9 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
        />
      </span>
    </label>
  );
}

function FieldLabel({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[11px] leading-4 text-muted-foreground/80">{hint}</span>}
    </label>
  );
}

// --- Configurator -------------------------------------------------------------------------------------------------

export function ObsLab() {
  const [openChatLab, setOpenChatLab] = useState(false);
  const [history, setHistory] = useState(() => startChatHistory(loadStoredConfig()));
  const config = history.present;
  const [mode, setMode] = useState<SetupMode>(loadSetupMode);
  const [livePreview, setLivePreview] = useState(false);
  const [mockMessages, setMockMessages] = useState(() => generateMockMessages());
  const [copied, setCopied] = useState(false);
  const [previewBackground, setPreviewBackground] = useState<PreviewBackground>("dark");
  const [savedSetups, setSavedSetups] = useState<SavedSetup[]>(loadSavedSetups);
  const [setupName, setSetupName] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importResult, setImportResult] = useState<"ok" | "invalid" | null>(null);
  const previewMessageId = useRef(0);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [optionQuery, setOptionQuery] = useState("");
  const [optionMatches, setOptionMatches] = useState(0);
  const [presetCategory, setPresetCategory] = useState<ChatPresetCategory | "all">("all");
  const configRef = useRef(config);
  configRef.current = config;
  // Test messages go through the same calm-chat pacing as the OBS page; each lifetime starts when it shows.
  const pacer = useChatPacer<MockChatMessage>(config.floodLimit, (message) => {
    setMockMessages((current) => [...current, { ...message, receivedAt: Date.now() }].slice(-40));
  });

  const size = getCameraChatSize(config);
  const chatOnly = config.layout === "chat";
  const beside = config.layout === "right" || config.layout === "left";
  const stacked = config.layout === "below" || config.layout === "above";
  const frameAnimated = !["none", "solid", "gradient"].includes(config.frameStyle);
  const frameTwoColours = ["gradient", "flow", "rotate"].includes(config.frameStyle);

  useEffect(() => {
    storeValue(CONFIG_STORAGE_KEY, cameraChatConfigToSearch(config));
  }, [config]);

  useEffect(() => {
    storeValue(SAVED_STORAGE_KEY, JSON.stringify(savedSetups));
  }, [savedSetups]);

  useEffect(() => {
    storeValue(MODE_STORAGE_KEY, mode);
  }, [mode]);

  // Option search: sections whose text matches stay and open; the rest hide. Clearing restores them.
  useEffect(() => {
    const root = optionsRef.current;
    if (!root) return;
    const query = normalizeSearch(optionQuery.trim());
    let matches = 0;
    root.querySelectorAll<HTMLDetailsElement>("details").forEach((details) => {
      if (!query) {
        details.hidden = false;
        if (details.dataset["searchOpened"]) {
          details.open = false;
          delete details.dataset["searchOpened"];
        }
        return;
      }
      const match = normalizeSearch(details.textContent ?? "").includes(query);
      details.hidden = !match;
      if (match) {
        matches += 1;
        if (!details.open) {
          details.open = true;
          details.dataset["searchOpened"] = "1";
        }
      }
    });
    setOptionMatches(matches);
  }, [optionQuery, mode, config]);

  // Live preview: a test message every few seconds, so animations and extras show without clicking.
  useEffect(() => {
    if (!livePreview) return undefined;
    let tick = 0;
    let messageIndex = 0;
    let eventIndex = 0;
    const timer = window.setInterval(() => {
      const current = configRef.current;
      // Every third test is a stream event when events are on.
      const next = current.streamEvents && current.eventKinds.length && tick++ % 3 === 2
        ? testEvent(current.eventKinds[eventIndex++ % current.eventKinds.length]!, ++previewMessageId.current)
        : testMessage(TEST_KINDS[messageIndex++ % TEST_KINDS.length]!, ++previewMessageId.current, current);
      setMockMessages((list) => [...list, next].slice(-40));
    }, LIVE_PREVIEW_MS);
    return () => window.clearInterval(timer);
  }, [livePreview]);

  /** Every change goes through the undo history (quick changes, such as dragging a slider, are one step). */
  function setConfig(next: CameraChatConfig | ((current: CameraChatConfig) => CameraChatConfig)) {
    setHistory((current) => commitChatHistory(current, typeof next === "function" ? next(current.present) : next, Date.now()));
  }

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

  function pushTestMessages(incoming: MockChatMessage[]) {
    for (const message of incoming) pacer.push(message);
  }

  /** A test event; when events are off (or this kind is not picked) it switches them on, so the row shows. */
  function sendEvent(kind: ChatEventKind) {
    if (!config.streamEvents || !config.eventKinds.includes(kind)) {
      patchConfig({
        streamEvents: true,
        eventKinds: CHAT_EVENT_KINDS.filter((item) => item === kind || config.eventKinds.includes(item)),
      });
    }
    setMockMessages((current) => [...current, testEvent(kind, ++previewMessageId.current)].slice(-40));
  }

  function previewSound() {
    const audio = chatAudio();
    if (audio) playChatNotes(audio, CHAT_SOUND_RECIPES[config.soundStyle], Math.max(config.soundVolume, 10));
  }

  function toggleEventKind(kind: ChatEventKind) {
    patchConfig({
      eventKinds: config.eventKinds.includes(kind)
        ? config.eventKinds.filter((item) => item !== kind)
        : CHAT_EVENT_KINDS.filter((item) => item === kind || config.eventKinds.includes(item)),
    });
  }

  /** Many messages at once, to see the calm chat at work. */
  function floodTest() {
    pushTestMessages(Array.from({ length: FLOOD_TEST_COUNT }, (_, index) => {
      const id = ++previewMessageId.current;
      return {
        id: `flood-${id}`,
        msgId: `chat-flood-${id}`,
        name: FLOOD_NAMES[index % FLOOD_NAMES.length]!,
        text: `${t("obsLab.zalew_wiadomosc", { n: index + 1 })} ${SAMPLE_EMOTES[index % SAMPLE_EMOTES.length]!.name}`,
        emotes: [...SAMPLE_EMOTES],
        receivedAt: Date.now(),
      };
    }));
  }

  function testChatAnimation(count = 1) {
    pushTestMessages(Array.from({ length: count }, (_, index) => {
      const id = ++previewMessageId.current;
      return {
        name: t("obsLab.widz_testowy") + (index + 1),
        text: t("obsLab.nowa_wiadomosc_podglad_animacji") + id + "!",
        msgId: `chat-animation-preview-${id}`,
        receivedAt: Date.now(),
      };
    }));
  }

  function sendTest(kind: TestKind) {
    pushTestMessages([testMessage(kind, ++previewMessageId.current, config)]);
  }

  function saveSetup() {
    const name = setupName.trim().slice(0, 40);
    if (!name) return;
    const search = cameraChatConfigToSearch(config);
    setSavedSetups((current) => [{ name, search }, ...current.filter((item) => item.name !== name)].slice(0, MAX_SAVED_SETUPS));
    setSetupName("");
  }

  function importFromUrl() {
    const imported = cameraChatConfigFromUrl(importUrl, window.location.origin);
    if (!imported) {
      setImportResult("invalid");
      return;
    }
    setConfig(imported);
    setImportResult("ok");
    setImportUrl("");
  }

  function addCommonBots() {
    const current = parseChatNameList(config.ignoredUsers);
    const merged = [...current, ...COMMON_CHAT_BOTS.filter((bot) => !current.includes(bot))];
    patchConfig({ ignoredUsers: merged.join(", ") });
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
      <div data-testid="chat-setup-mode">
        <ToolSegmented<SetupMode> value={mode} options={SETUP_MODE_OPTIONS} onChange={setMode} />
      </div>
      {mode === "all" && (
        <div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <ToolInput
              type="search"
              value={optionQuery}
              onChange={(event) => setOptionQuery(event.target.value)}
              placeholder={t("obsLab.szukaj_opcji")}
              aria-label={t("obsLab.szukaj_opcji")}
              className="pl-9"
              data-testid="chat-option-search"
            />
          </div>
          {optionQuery.trim() !== "" && optionMatches === 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">{t("obsLab.brak_takiej_opcji")}</p>
          )}
        </div>
      )}
      {mode === "quick" && (
        <ChatQuickSetup
          config={config}
          update={setConfig}
          width={size.width}
          height={size.height}
          copied={copied}
          onCopyUrl={copyUrl}
          onShowAll={() => setMode("all")}
        />
      )}
      {/* While searching, the results come right under the search box. */}
      {mode === "all" && !optionQuery.trim() && (
      <ToolPanel
        title={t("obsLab.presety")}
        actions={
          <ToolButton type="button" variant="ghost" onClick={() => setConfig({ ...DEFAULT_CAMERA_CHAT_CONFIG })}>
            <RefreshCw className="h-4 w-4" />{" "}{t("obsLab.reset")}</ToolButton>
        }
      >
        <div className="mb-3">
          <PresetCategoryChips value={presetCategory} onChange={setPresetCategory} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {chatPresetsIn(presetCategory).map((preset) => (
            <ToolButton
              key={preset}
              type="button"
              onClick={() => setConfig(chatPresetConfig(preset))}
              className="justify-start px-2 py-1.5 text-left text-xs"
              data-testid={`chat-preset-${preset}`}
            >
              <PresetSwatch config={chatPresetConfig(preset)} />
              <span className="min-w-0 leading-tight">{chatPresetLabel(preset)}</span>
            </ToolButton>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold text-muted-foreground">{t("obsLab.szybkie_kolory")}</div>
          <div className="grid grid-cols-4 gap-1.5">
            {CHAT_COLOR_THEME_IDS.map((theme) => {
              const colors = CHAT_COLOR_THEMES[theme];
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setConfig((current) => applyChatColorTheme(current, theme))}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border/70 bg-background/35 px-1 py-1.5 text-[10px] font-semibold text-muted-foreground transition hover:border-fuchsia-400/60 hover:text-foreground"
                  data-testid={`chat-colors-${theme}`}
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
          <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">{t("obsLab.zmienia_tylko_kolory_panelu_dymkow")}</p>
        </div>
      </ToolPanel>
      )}

      <ToolDisclosure title={t("obsLab.moje_konfiguracje")}>
        <div className="space-y-4">
          <p className="text-xs leading-5 text-muted-foreground">{t("obsLab.biezace_ustawienia_zapisuja_sie_same")}</p>
          <div className="flex gap-2">
            <ToolInput
              value={setupName}
              maxLength={40}
              placeholder={t("obsLab.nazwa_konfiguracji")}
              onChange={(event) => setSetupName(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") saveSetup(); }}
            />
            <ToolButton type="button" onClick={saveSetup} disabled={!setupName.trim()}>
              <Save className="h-4 w-4" />{" "}{t("obsLab.zapisz")}</ToolButton>
          </div>
          {savedSetups.length === 0
            ? <p className="text-xs text-muted-foreground">{t("obsLab.brak_zapisanych_konfiguracji")}</p>
            : (
              <ul className="space-y-1.5">
                {savedSetups.map((setup) => (
                  <li key={setup.name} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/35 px-2.5 py-1.5">
                    <span className="min-w-0 truncate text-sm">{setup.name}</span>
                    <span className="flex shrink-0 gap-1">
                      <ToolButton type="button" variant="ghost" className="px-2 py-1 text-xs" onClick={() => setConfig(cameraChatConfigFromSearch(setup.search))}>{t("obsLab.wczytaj")}</ToolButton>
                      <ToolButton
                        type="button"
                        variant="ghost"
                        className="px-2 py-1 text-xs"
                        aria-label={t("obsLab.usun")}
                        onClick={() => setSavedSetups((current) => current.filter((item) => item.name !== setup.name))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </ToolButton>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          <ToolSection title={t("obsLab.wczytaj_z_adresu_obs")} description={t("obsLab.wklej_adres_browser_source_aby")}>
            <div className="flex gap-2">
              <ToolInput
                value={importUrl}
                placeholder="https://…/stream/overlay/camera-chat?…"
                onChange={(event) => { setImportUrl(event.target.value); setImportResult(null); }}
              />
              <ToolButton type="button" onClick={importFromUrl} disabled={!importUrl.trim()} aria-label={t("obsLab.wczytaj")}>
                <Upload className="h-4 w-4" />
              </ToolButton>
            </div>
            {importResult === "ok" && <ToolNotice tone="success">{t("obsLab.wczytano_ustawienia_z_adresu")}</ToolNotice>}
            {importResult === "invalid" && <ToolNotice tone="danger">{t("obsLab.to_nie_jest_adres_nakladki")}</ToolNotice>}
          </ToolSection>
        </div>
      </ToolDisclosure>

      {mode === "all" && (<div ref={optionsRef} className="space-y-3" data-testid="chat-all-options">
      <ToolDisclosure title={chatOnly ? t("obsLab.rozmiar_czatu") : t("obsLab.kamerka")} open>
        <div className="space-y-4 text-fuchsia-300">
          {chatOnly ? (
            <>
              <ToolRange label={t("obsLab.szerokosc")} value={config.chatOnlyWidth} suffix="px" min={200} max={1200} step={10} onChange={(chatOnlyWidth) => patchConfig({ chatOnlyWidth })} />
              <ToolRange label={t("obsLab.wysokosc")} value={config.chatOnlyHeight} suffix="px" min={120} max={1080} step={10} onChange={(chatOnlyHeight) => patchConfig({ chatOnlyHeight })} />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </ToolDisclosure>

      <ToolDisclosure title={t("obsLab.uklad")} open>
        <div className="space-y-4 text-fuchsia-300">
          <ToolSelect value={config.layout} onChange={(event) => patchConfig({ layout: event.target.value as CameraChatLayout })}>
            <option value="right">{t("obsLab.czat_po_prawej")}</option>
            <option value="left">{t("obsLab.czat_po_lewej")}</option>
            <option value="below">{t("obsLab.czat_pod_kamerka")}</option>
            <option value="above">{t("obsLab.czat_nad_kamerka")}</option>
            <option value="overlay">{t("obsLab.czat_na_kamerce")}</option>
            <option value="chat">{t("obsLab.sam_czat_bez_kamerki")}</option>
          </ToolSelect>

          {(beside || config.layout === "overlay") && (
            <ToolRange label={t("obsLab.szerokosc_czatu")} value={config.chatWidth} suffix="%" min={20} max={55} onChange={(chatWidth) => patchConfig({ chatWidth })} />
          )}
          {stacked && (
            <ToolRange label={t("obsLab.wysokosc_czatu")} value={config.belowHeight} suffix="px" min={80} max={300} onChange={(belowHeight) => patchConfig({ belowHeight })} />
          )}
          {(beside || stacked) && (
            <ToolRange label={t("obsLab.odstep")} value={config.gap} suffix="px" min={0} max={40} onChange={(gap) => patchConfig({ gap })} />
          )}
          {beside && (
            <ToolToggle label={t("obsLab.pelna_wysokosc_czatu")} checked={config.fitChatHeight} onChange={(fitChatHeight) => patchConfig({ fitChatHeight })} />
          )}
          {config.layout === "overlay" && (
            <>
              <ToolSelect value={config.overlayPosition} onChange={(event) => patchConfig({ overlayPosition: event.target.value as CameraChatOverlayPosition })}>
                <option value="top-left">{t("obsLab.lewy_gorny")}</option>
                <option value="top-center">{t("obsLab.gora_srodek")}</option>
                <option value="top-right">{t("obsLab.prawy_gorny")}</option>
                <option value="middle-left">{t("obsLab.srodek_lewa_strona")}</option>
                <option value="middle-right">{t("obsLab.srodek_prawa_strona")}</option>
                <option value="bottom-left">{t("obsLab.lewy_dolny")}</option>
                <option value="bottom-center">{t("obsLab.dol_srodek")}</option>
                <option value="bottom-right">{t("obsLab.prawy_dolny")}</option>
              </ToolSelect>
              <ToolRange label={t("obsLab.odsuniecie")} value={config.overlayInset} suffix="px" min={0} max={50} onChange={(overlayInset) => patchConfig({ overlayInset })} />
            </>
          )}
          <FieldLabel label={t("obsLab.uklad_wiadomosci")}>
            <ToolSelect value={config.messageLayout} onChange={(event) => patchConfig({ messageLayout: event.target.value as CameraChatMessageLayout })}>
              <option value="inline">{t("obsLab.w_jednej_linii")}</option>
              <option value="stacked">{t("obsLab.nick_nad_tekstem")}</option>
              <option value="bubble">{t("obsLab.dymki")}</option>
            </ToolSelect>
          </FieldLabel>
          <div className="text-xs text-muted-foreground">
            {t("obsLab.wyrownanie")}
            <div className="mt-1.5">
              <ToolSegmented<CameraChatAlign> value={config.textAlign} options={ALIGN_OPTIONS} onChange={(textAlign) => patchConfig({ textAlign })} />
            </div>
          </div>
          <ToolToggle
            label={t("obsLab.najnowsze_na_gorze")}
            description={t("obsLab.nowe_wiadomosci_pojawiaja_sie_u")}
            checked={config.newestFirst}
            onChange={(newestFirst) => patchConfig({ newestFirst, chatAnchor: newestFirst ? "top" : "bottom" })}
          />
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
            <ToolRange label={t("obsLab.liczba_wiadomosci")} value={config.maxMessages} min={1} max={20} onChange={(maxMessages) => patchConfig({ maxMessages })} />
          </ToolSection>
          <div>
            <ToolRange label={t("obsLab.znikanie_po")} value={config.messageLifetime} suffix=" s" min={0} max={120} step={5} onChange={(messageLifetime) => patchConfig({ messageLifetime })} />
            <p className="mt-1 text-[11px] text-muted-foreground">{t("obsLab.0_wiadomosci_zostaja_na_ekranie")}</p>
          </div>
          <div>
            <ToolRange label={t("obsLab.maks_dlugosc_wiadomosci")} value={config.maxMessageLength} suffix={t("obsLab.zn")} min={0} max={300} step={10} onChange={(maxMessageLength) => patchConfig({ maxMessageLength })} />
            <p className="mt-1 text-[11px] text-muted-foreground">{t("obsLab.0_bez_limitu")}</p>
          </div>
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

      <ToolDisclosure title={t("obsLab.tekst_i_nicki")}>
        <div className="space-y-4 text-fuchsia-300">
          <FieldLabel label={t("obsLab.czcionka")}>
            <ToolSelect value={config.fontFamily} onChange={(event) => patchConfig({ fontFamily: event.target.value as CameraChatFontFamily })}>
              <option value="inter">Inter</option>
              <option value="system">{t("obsLab.systemowa")}</option>
              <option value="segoe">Segoe UI</option>
              <option value="arial">Arial</option>
              <option value="verdana">Verdana</option>
              <option value="trebuchet">Trebuchet MS</option>
              <option value="georgia">Georgia</option>
              <option value="mono">{t("obsLab.stala_szerokosc_mono")}</option>
              <option value="impact">Impact</option>
              <option value="comic">Comic Sans MS</option>
              <option value="bahnschrift">Bahnschrift</option>
              <option value="arialblack">Arial Black</option>
              <option value="tahoma">Tahoma</option>
              <option value="calibri">Calibri</option>
              <option value="cambria">Cambria</option>
              <option value="franklin">Franklin Gothic</option>
              <option value="times">Times New Roman</option>
              <option value="courier">Courier New</option>
              <option value="lucida">Lucida Console</option>
              <option value="palatino">Palatino</option>
              <option value="segoeprint">Segoe Print</option>
              <option value="custom">{t("obsLab.wlasna_zainstalowana_na_komputerze")}</option>
            </ToolSelect>
          </FieldLabel>
          {config.fontFamily === "custom" && (
            <FieldLabel label={t("obsLab.nazwa_czcionki")} hint={t("obsLab.czcionka_musi_byc_zainstalowana_na")}>
              <ToolInput value={config.customFont} maxLength={40} placeholder={t("obsLab.np_bebas_neue")} onChange={(event) => patchConfig({ customFont: event.target.value })} />
            </FieldLabel>
          )}
          <label className="block text-xs text-muted-foreground">{t("obsLab.rozmiar_tekstu")}<ToolSelect value={config.fontSize} onChange={(event) => patchConfig({ fontSize: event.target.value as CameraChatFontSize })} className="mt-1.5">
              <option value="small">{t("obsLab.maly")}</option>
              <option value="medium">{t("obsLab.sredni")}</option>
              <option value="large">{t("obsLab.duzy")}</option>
              <option value="custom">{t("obsLab.wlasny")}</option>
            </ToolSelect>
          </label>
          {config.fontSize === "custom" && (
            <ToolRange label={t("obsLab.rozmiar")} value={config.fontSizePx} suffix="px" min={10} max={48} onChange={(fontSizePx) => patchConfig({ fontSizePx })} />
          )}
          <ColorField label={t("obsLab.kolor_tekstu")} value={config.textColor} onChange={(textColor) => patchConfig({ textColor })} />
          <ToolRange label={t("obsLab.krycie_tekstu")} value={config.textOpacity} suffix="%" min={10} max={100} onChange={(textOpacity) => patchConfig({ textOpacity })} />
          <FieldLabel label={t("obsLab.cien_tekstu")}>
            <ToolSelect value={config.textShadow} onChange={(event) => patchConfig({ textShadow: event.target.value as CameraChatTextShadow })}>
              <option value="none">{t("obsLab.brak")}</option>
              <option value="soft">{t("obsLab.delikatny")}</option>
              <option value="strong">{t("obsLab.mocny")}</option>
              <option value="outline">{t("obsLab.obrys")}</option>
            </ToolSelect>
          </FieldLabel>
          <ToolToggle label={t("obsLab.pogrubiony_tekst_wiadomosci")} checked={config.textBold} onChange={(textBold) => patchConfig({ textBold })} />
          <FieldLabel label={t("obsLab.kolory_nickow")}>
            <ToolSelect value={config.nameColorMode} onChange={(event) => patchConfig({ nameColorMode: event.target.value as CameraChatNameColorMode })}>
              <option value="user">{t("obsLab.kolor_widza_z_twitcha")}</option>
              <option value="palette">{t("obsLab.paleta")}</option>
              <option value="single">{t("obsLab.jeden_kolor")}</option>
            </ToolSelect>
          </FieldLabel>
          {config.nameColorMode === "single" && (
            <ColorField label={t("obsLab.kolor_nickow")} value={config.nameColor} onChange={(nameColor) => patchConfig({ nameColor })} />
          )}
          {config.nameColorMode === "user" && (
            <ToolToggle label={t("obsLab.czytelne_kolory_nickow")} description={t("obsLab.rozjasnia_zbyt_ciemne_kolory_widzow")} checked={config.readableNames} onChange={(readableNames) => patchConfig({ readableNames })} />
          )}
          {config.nameColorMode !== "single" && (
            <FieldLabel label={t("obsLab.paleta_kolorow_nickow")} hint={t("obsLab.dla_widzow_bez_wlasnego_koloru")}>
              <ToolSelect value={config.namePalette} onChange={(event) => patchConfig({ namePalette: event.target.value as CameraChatNamePalette })}>
                <option value="classic">{t("obsLab.klasyczna")}</option>
                <option value="pastel">{t("obsLab.pastelowa")}</option>
                <option value="neon">{t("obsLab.neonowa")}</option>
                <option value="warm">{t("obsLab.ciepla")}</option>
                <option value="cool">{t("obsLab.chlodna")}</option>
              </ToolSelect>
            </FieldLabel>
          )}
          <ToolToggle label={t("obsLab.dwukropek_po_nicku")} checked={config.showColon} onChange={(showColon) => patchConfig({ showColon })} />
          <ToolToggle label={t("obsLab.nicki_wielkimi_literami")} checked={config.nameUppercase} onChange={(nameUppercase) => patchConfig({ nameUppercase })} />
          <FieldLabel label={t("obsLab.styl_nickow")}>
            <ToolSelect value={config.nameStyle} onChange={(event) => patchConfig({ nameStyle: event.target.value as CameraChatNameStyle })} data-testid="chat-name-style">
              <option value="plain">{t("obsLab.zwykle_nicki")}</option>
              <option value="glow">{t("obsLab.nicki_swiecace")}</option>
              <option value="gradient">{t("obsLab.nicki_gradient")}</option>
              <option value="rainbow">{t("obsLab.nicki_teczowe")}</option>
              <option value="shimmer">{t("obsLab.nicki_z_polyskiem")}</option>
            </ToolSelect>
          </FieldLabel>
        </div>
      </ToolDisclosure>

      <ToolDisclosure title={t("obsLab.wyglad")}>
        <div className="space-y-4 text-fuchsia-300">
          <ColorField label={t("obsLab.kolor_panelu")} value={config.panelColor} onChange={(panelColor) => patchConfig({ panelColor })} />
          <ToolRange label={t("obsLab.krycie_panelu")} value={config.panelOpacity} suffix="%" min={0} max={100} onChange={(panelOpacity) => patchConfig({ panelOpacity })} />
          <ToolToggle label={t("obsLab.gradient_panelu")} checked={config.panelGradient} onChange={(panelGradient) => patchConfig({ panelGradient })} />
          {config.panelGradient && (
            <div className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
              <ColorField label={t("obsLab.drugi_kolor_panelu")} value={config.panelColor2} onChange={(panelColor2) => patchConfig({ panelColor2 })} />
              <ToolRange label={t("obsLab.kat_gradientu")} value={config.panelGradientAngle} suffix="°" min={0} max={360} step={5} onChange={(panelGradientAngle) => patchConfig({ panelGradientAngle })} />
            </div>
          )}
          <ToolRange label={t("obsLab.zaokraglenie")} value={config.radius} suffix="px" min={0} max={48} onChange={(radius) => patchConfig({ radius })} />
          <ToolRange label={t("obsLab.padding")} value={config.innerPadding} suffix="px" min={0} max={30} onChange={(innerPadding) => patchConfig({ innerPadding })} />
          <ToolToggle label={t("obsLab.tla_wiadomosci")} checked={config.messageBackground} onChange={(messageBackground) => patchConfig({ messageBackground })} />
          {config.messageBackground && (
            <div className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
              <ColorField label={t("obsLab.kolor_dymkow")} value={config.bubbleColor} onChange={(bubbleColor) => patchConfig({ bubbleColor })} />
              <ToolRange label={t("obsLab.krycie_dymkow")} value={config.bubbleOpacity} suffix="%" min={0} max={100} step={0.5} onChange={(bubbleOpacity) => patchConfig({ bubbleOpacity })} />
              <ToolRange label={t("obsLab.zaokraglenie_dymkow")} value={config.bubbleRadius} suffix="px" min={0} max={40} onChange={(bubbleRadius) => patchConfig({ bubbleRadius })} />
            </div>
          )}
          <FieldLabel label={t("obsLab.ksztalt_wiadomosci")} hint={config.messageBackground ? undefined : t("obsLab.ogonek_i_skos_potrzebuja_tla")}>
            <ToolSelect value={config.bubbleShape} onChange={(event) => patchConfig({ bubbleShape: event.target.value as CameraChatBubbleShape })}>
              <option value="rounded">{t("obsLab.zaokraglone")}</option>
              <option value="tail">{t("obsLab.dymek_z_ogonkiem")}</option>
              <option value="skew">{t("obsLab.skosne")}</option>
              <option value="outline">{t("obsLab.sam_kontur")}</option>
              <option value="underline">{t("obsLab.podkreslenie")}</option>
            </ToolSelect>
          </FieldLabel>
          <FieldLabel label={t("obsLab.wzor_tla")}>
            <ToolSelect value={config.panelPattern} onChange={(event) => patchConfig({ panelPattern: event.target.value as CameraChatPanelPattern })} data-testid="chat-pattern">
              <option value="none">{t("obsLab.bez_wzoru")}</option>
              <option value="dots">{t("obsLab.wzor_kropki")}</option>
              <option value="grid">{t("obsLab.wzor_kratka")}</option>
              <option value="stripes">{t("obsLab.wzor_paski")}</option>
              <option value="carbon">{t("obsLab.wzor_karbon")}</option>
              <option value="waves">{t("obsLab.wzor_fale")}</option>
              <option value="scanlines">{t("obsLab.wzor_linie_crt")}</option>
            </ToolSelect>
          </FieldLabel>
          {config.panelPattern !== "none" && (
            <div className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
              <ColorField label={t("obsLab.kolor_wzoru")} value={config.patternColor} onChange={(patternColor) => patchConfig({ patternColor })} />
              <ToolRange label={t("obsLab.widocznosc_wzoru")} value={config.patternOpacity} suffix="%" min={2} max={50} onChange={(patternOpacity) => patchConfig({ patternOpacity })} />
            </div>
          )}
          <ToolToggle label={t("obsLab.pasek_w_kolorze_nicku")} checked={config.accentBar} onChange={(accentBar) => patchConfig({ accentBar })} />
          <ToolToggle label={t("obsLab.obramowania")} checked={config.showBorders} onChange={(showBorders) => patchConfig({ showBorders })} />
          <ToolToggle label={t("obsLab.avatary")} checked={config.showAvatars} onChange={(showAvatars) => patchConfig({ showAvatars })} />
          <ToolToggle label={t("obsLab.odznaki_mod_vip_sub")} checked={config.showBadges} onChange={(showBadges) => patchConfig({ showBadges })} />
          <ToolToggle label={t("obsLab.emotki")} description={t("obsLab.twitch_bttv_ffz_i_7tv")} checked={config.showEmotes} onChange={(showEmotes) => patchConfig({ showEmotes })} />
          {config.showEmotes && (
            <div className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
              <ToolRange label={t("obsLab.rozmiar_emotek")} value={config.emoteScale} suffix="%" min={60} max={300} step={10} onChange={(emoteScale) => patchConfig({ emoteScale })} />
              <ToolToggle label={t("obsLab.wieksze_gdy_wiadomosc_to_same")} checked={config.emoteOnlyLarge} onChange={(emoteOnlyLarge) => patchConfig({ emoteOnlyLarge })} />
            </div>
          )}
          <ToolToggle label={t("obsLab.wygaszanie_starszych")} checked={config.fadeOldMessages} onChange={(fadeOldMessages) => patchConfig({ fadeOldMessages })} />
        </div>
      </ToolDisclosure>

      <ToolDisclosure title={t("obsLab.ramka_i_ruch_czatu")}>
        <div className="space-y-4 text-fuchsia-300">
          <FieldLabel label={t("obsLab.ramka")}>
            <ToolSelect value={config.frameStyle} onChange={(event) => patchConfig({ frameStyle: event.target.value as CameraChatFrameStyle })}>
              <option value="none">{t("obsLab.bez_ramki")}</option>
              <option value="solid">{t("obsLab.jednolita")}</option>
              <option value="gradient">{t("obsLab.gradientowa")}</option>
              <option value="pulse">{t("obsLab.pulsujaca")}</option>
              <option value="glow">{t("obsLab.swiecaca")}</option>
              <option value="flow">{t("obsLab.plynacy_gradient")}</option>
              <option value="rotate">{t("obsLab.wirujacy_neon")}</option>
              <option value="rainbow">{t("obsLab.teczowa")}</option>
              <option value="dashes">{t("obsLab.biegnace_kreski")}</option>
              <option value="corners">{t("obsLab.narozniki_hud")}</option>
            </ToolSelect>
          </FieldLabel>
          {config.frameStyle !== "none" && (
            <div className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
              <ToolRange label={t("obsLab.grubosc_ramki")} value={config.frameWidth} suffix="px" min={1} max={12} onChange={(frameWidth) => patchConfig({ frameWidth })} />
              {config.frameStyle !== "rainbow" && (
                <ColorField label={t("obsLab.kolor_ramki")} value={config.frameColor} onChange={(frameColor) => patchConfig({ frameColor })} />
              )}
              {frameTwoColours && (
                <ColorField label={t("obsLab.drugi_kolor_ramki")} value={config.frameColor2} onChange={(frameColor2) => patchConfig({ frameColor2 })} />
              )}
              {frameAnimated && (
                <ToolRange label={t("obsLab.czas_jednego_cyklu_ramki")} value={config.frameSpeed} suffix=" s" min={1} max={20} step={0.5} onChange={(frameSpeed) => patchConfig({ frameSpeed })} />
              )}
              {config.frameStyle === "rotate" && (
                <p className="text-[11px] leading-4 text-muted-foreground">{t("obsLab.wirujacy_neon_potrzebuje_obs_28")}</p>
              )}
            </div>
          )}
          <FieldLabel label={t("obsLab.ruch_czatu")}>
            <ToolSelect value={config.panelAnimation} onChange={(event) => patchConfig({ panelAnimation: event.target.value as CameraChatPanelAnimation })}>
              <option value="none">{t("obsLab.brak")}</option>
              <option value="float">{t("obsLab.unoszenie_wiadomosci")}</option>
              <option value="breathe">{t("obsLab.oddychanie")}</option>
              <option value="shimmer">{t("obsLab.blysk_co_kilka_sekund")}</option>
              <option value="intro">{t("obsLab.wejscie_przy_starcie")}</option>
            </ToolSelect>
          </FieldLabel>
        </div>
      </ToolDisclosure>

      <ToolDisclosure title={t("obsLab.dodatki_czatu")}>
        <div className="space-y-4 text-fuchsia-300">
          <FieldLabel label={t("obsLab.efekt_w_tle_czatu")}>
            <ToolSelect value={config.ambient} onChange={(event) => patchConfig({ ambient: event.target.value as CameraChatAmbient })} data-testid="chat-ambient">
              <option value="none">{t("obsLab.brak")}</option>
              <option value="snow">{t("obsLab.snieg")}</option>
              <option value="sparkles">{t("obsLab.iskierki")}</option>
              <option value="hearts">{t("obsLab.serduszka")}</option>
              <option value="bubbles">{t("obsLab.babelki")}</option>
              <option value="stars">{t("obsLab.gwiazdy")}</option>
              <option value="confetti">{t("obsLab.konfetti")}</option>
              <option value="rain">{t("obsLab.deszcz")}</option>
              <option value="fireflies">{t("obsLab.swietliki")}</option>
              <option value="petals">{t("obsLab.platki_sakury")}</option>
              <option value="leaves">{t("obsLab.jesienne_liscie")}</option>
              <option value="pixels">{t("obsLab.piksele")}</option>
            </ToolSelect>
          </FieldLabel>
          {config.ambient !== "none" && (
            <div className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
              <ToolRange label={t("obsLab.ilosc_drobinek")} value={config.ambientDensity} min={4} max={40} onChange={(ambientDensity) => patchConfig({ ambientDensity })} />
              {config.ambient !== "confetti" && config.ambient !== "leaves" && (
                <ColorField label={t("obsLab.kolor_drobinek")} value={config.ambientColor} onChange={(ambientColor) => patchConfig({ ambientColor })} />
              )}
            </div>
          )}
          <FieldLabel label={t("obsLab.naglowek_czatu")}>
            <ToolSelect
              value={config.headerStyle}
              // A header picked for the first time starts with a title and the live dot, so it shows at once.
              onChange={(event) => patchConfig({
                headerStyle: event.target.value as CameraChatHeaderStyle,
                ...(config.headerStyle === "none" && !config.headerText.trim() && !config.headerLive
                  ? { headerText: t("obsLab.czat_na_zywo"), headerLive: true } : {}),
              })}
              data-testid="chat-header-style"
            >
              <option value="none">{t("obsLab.bez_naglowka")}</option>
              <option value="bar">{t("obsLab.pasek")}</option>
              <option value="pill">{t("obsLab.plakietka")}</option>
              <option value="minimal">{t("obsLab.minimalny")}</option>
            </ToolSelect>
          </FieldLabel>
          {config.headerStyle !== "none" && (
            <div className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
              <FieldLabel label={t("obsLab.tytul_naglowka")}>
                <ToolInput value={config.headerText} maxLength={40} placeholder={t("obsLab.np_czat_na_zywo")} onChange={(event) => patchConfig({ headerText: event.target.value })} />
              </FieldLabel>
              <ToolToggle label={t("obsLab.kropka_na_zywo")} checked={config.headerLive} onChange={(headerLive) => patchConfig({ headerLive })} />
              <ColorField label={t("obsLab.kolor_naglowka")} value={config.headerColor} onChange={(headerColor) => patchConfig({ headerColor })} />
            </div>
          )}
          <FieldLabel label={t("obsLab.przypieta_wiadomosc")} hint={t("obsLab.zawsze_widoczna_nad_wiadomosciami")}>
            <ToolInput value={config.pinnedText} maxLength={120} placeholder={t("obsLab.np_regulamin")} onChange={(event) => patchConfig({ pinnedText: event.target.value })} />
          </FieldLabel>
        </div>
      </ToolDisclosure>

      <ToolDisclosure title={t("obsLab.filtry_i_wyroznienia")}>
        <div className="space-y-4 text-fuchsia-300">
          <ToolToggle label={t("obsLab.ukryj_komendy_komenda")} checked={config.hideCommands} onChange={(hideCommands) => patchConfig({ hideCommands })} />
          <ToolToggle label={t("obsLab.ukryj_linki")} description={t("obsLab.adresy_stron_zastepuje_napisem_link")} checked={config.hideLinks} onChange={(hideLinks) => patchConfig({ hideLinks })} />
          <FieldLabel label={t("obsLab.ukryci_uzytkownicy_boty")} hint={t("obsLab.oddziel_przecinkami")}>
            <ToolInput value={config.ignoredUsers} maxLength={600} placeholder={t("obsLab.np_nightbot_streamelements")} onChange={(event) => patchConfig({ ignoredUsers: event.target.value })} />
          </FieldLabel>
          <ToolButton type="button" variant="ghost" className="-mt-2 px-2 py-1 text-xs" onClick={addCommonBots}>{t("obsLab.dodaj_popularne_boty")}</ToolButton>
          <FieldLabel label={t("obsLab.wyrozniaj_slowa")} hint={t("obsLab.oddziel_przecinkami")}>
            <ToolInput value={config.highlightWords} maxLength={300} placeholder={t("obsLab.np_twoj_nick_giveaway")} onChange={(event) => patchConfig({ highlightWords: event.target.value })} />
          </FieldLabel>
          <ColorField label={t("obsLab.kolor_wyroznienia")} value={config.highlightColor} onChange={(highlightColor) => patchConfig({ highlightColor })} />
          <ToolToggle
            label={t("obsLab.wyrozniaj_nadawce_moderatorow_i_vip")}
            description={t("obsLab.kolor_wedlug_odznaki_z_twitcha")}
            checked={config.roleHighlight}
            onChange={(roleHighlight) => patchConfig({ roleHighlight })}
          />
          <ToolToggle
            label={t("obsLab.wyrozniaj_nowych_widzow")}
            description={t("obsLab.etykieta_nowy_przy_pierwszej")}
            checked={config.firstTimeHighlight}
            onChange={(firstTimeHighlight) => patchConfig({ firstTimeHighlight })}
          />
          <ToolToggle
            label={t("obsLab.kombo_wiadomosci")}
            description={t("obsLab.kombo_wiadomosci_opis")}
            checked={config.comboMessages}
            onChange={(comboMessages) => patchConfig({ comboMessages })}
          />
        </div>
      </ToolDisclosure>

      <ToolDisclosure title={t("obsLab.zdarzenia_i_spokojny_czat")}>
        <div className="space-y-4 text-fuchsia-300" data-testid="chat-events-options">
          <ToolToggle
            label={t("obsLab.zdarzenia_na_czacie")}
            description={t("obsLab.zdarzenia_na_czacie_opis")}
            checked={config.streamEvents}
            onChange={(streamEvents) => patchConfig({
              streamEvents,
              ...(streamEvents && !config.eventKinds.length ? { eventKinds: [...CHAT_EVENT_KINDS] } : {}),
            })}
          />
          {config.streamEvents && (
            <div className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
              <FieldLabel label={t("obsLab.ktore_zdarzenia")}>
                <div className="flex flex-wrap gap-1.5">
                  {CHAT_EVENT_KINDS.map((kind) => {
                    const on = config.eventKinds.includes(kind);
                    return (
                      <button
                        key={kind}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleEventKind(kind)}
                        className={`${choiceClass(on)} px-2.5 py-1 text-xs`}
                        data-testid={`chat-event-kind-${kind}`}
                      >
                        {eventKindLabel(kind)}
                      </button>
                    );
                  })}
                </div>
              </FieldLabel>
              <FieldLabel label={t("obsLab.wyglad_zdarzen")}>
                <ToolSelect value={config.eventStyle} onChange={(event) => patchConfig({ eventStyle: event.target.value as CameraChatEventStyle })} data-testid="chat-event-style">
                  <option value="banner">{t("obsLab.baner_z_blyskiem")}</option>
                  <option value="glow">{t("obsLab.swiecaca_ramka_zdarzenia")}</option>
                  <option value="compact">{t("obsLab.jedna_linia")}</option>
                </ToolSelect>
              </FieldLabel>
              {config.eventKinds.includes("cheer") && (
                <FieldLabel label={t("obsLab.najmniej_bitsow")} hint={t("obsLab.mniejsze_cheery_bez_wiersza")}>
                  <ToolInput
                    type="number"
                    min={1}
                    max={100000}
                    value={config.eventMinBits}
                    onChange={(event) => patchConfig({ eventMinBits: Math.min(100000, Math.max(1, Math.round(Number(event.target.value) || 1))) })}
                  />
                </FieldLabel>
              )}
            </div>
          )}
          <ToolToggle
            label={t("obsLab.wiadomosci_za_punkty")}
            description={t("obsLab.wiadomosci_za_punkty_opis")}
            checked={config.pointsHighlight}
            onChange={(pointsHighlight) => patchConfig({ pointsHighlight })}
          />
          <ToolToggle
            label={t("obsLab.pokazuj_odpowiedzi")}
            description={t("obsLab.pokazuj_odpowiedzi_opis")}
            checked={config.showReplies}
            onChange={(showReplies) => patchConfig({ showReplies })}
          />
          <FieldLabel
            label={t("obsLab.spokojny_czat")}
            hint={config.floodLimit > 0 ? t("obsLab.spokojny_czat_opis", { n: config.floodLimit }) : t("obsLab.spokojny_czat_wylaczony")}
          >
            <ToolRange label={t("obsLab.wiadomosci_na_sekunde")} value={config.floodLimit} min={0} max={10} onChange={(floodLimit) => patchConfig({ floodLimit })} />
          </FieldLabel>
        </div>
      </ToolDisclosure>

      <ToolDisclosure title={t("obsLab.cel_hype_i_dzwieki")}>
        <div className="space-y-4 text-fuchsia-300" data-testid="chat-gadgets-options">
          <FieldLabel label={t("obsLab.pasek_celu")} hint={t("obsLab.pasek_celu_opis")}>
            <ToolSelect value={config.goalKind} onChange={(event) => patchConfig({ goalKind: event.target.value as ChatGoalKind })} data-testid="chat-goal-kind">
              <option value="none">{t("obsLab.bez_celu")}</option>
              <option value="follow">{t("obsLab.cel_obserwujacych")}</option>
              <option value="sub">{t("obsLab.cel_subow")}</option>
              <option value="bits">{t("obsLab.cel_bitsow")}</option>
              <option value="tip">{t("obsLab.cel_napiwkow")}</option>
            </ToolSelect>
          </FieldLabel>
          {config.goalKind !== "none" && (
            <div className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
              <FieldLabel label={t("obsLab.tytul_paska")}>
                <ToolInput
                  value={config.goalText}
                  maxLength={40}
                  placeholder={chatGoalDefaultLabel(config.goalKind, chatEventLabels())}
                  onChange={(event) => patchConfig({ goalText: event.target.value })}
                />
              </FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <FieldLabel label={t("obsLab.cel_do_zdobycia")}>
                  <ToolInput
                    type="number"
                    min={1}
                    max={1000000}
                    value={config.goalTarget}
                    onChange={(event) => patchConfig({ goalTarget: Math.min(1000000, Math.max(1, Math.round(Number(event.target.value) || 1))) })}
                    data-testid="chat-goal-target"
                  />
                </FieldLabel>
                <FieldLabel label={t("obsLab.zaczyna_od")}>
                  <ToolInput
                    type="number"
                    min={0}
                    max={1000000}
                    value={config.goalStart}
                    onChange={(event) => patchConfig({ goalStart: Math.min(1000000, Math.max(0, Math.round(Number(event.target.value) || 0))) })}
                  />
                </FieldLabel>
              </div>
            </div>
          )}
          <ToolToggle label={t("obsLab.pasek_hype")} description={t("obsLab.pasek_hype_opis")} checked={config.hypeMeter} onChange={(hypeMeter) => patchConfig({ hypeMeter })} />
          {config.hypeMeter && (
            <ToolRange label={t("obsLab.wiadomosci_do_pelnego_paska")} value={config.hypeTarget} min={5} max={200} step={5} onChange={(hypeTarget) => patchConfig({ hypeTarget })} />
          )}
          <ToolToggle
            label={t("obsLab.konfetti_przy_zdarzeniach")}
            description={t("obsLab.konfetti_przy_zdarzeniach_opis")}
            checked={config.eventConfetti}
            onChange={(eventConfetti) => patchConfig({ eventConfetti })}
          />
          <FieldLabel label={t("obsLab.dzwieki")} hint={t("obsLab.dzwieki_opis")}>
            <ToolSelect value={config.sound} onChange={(event) => patchConfig({ sound: event.target.value as ChatSoundMode })} data-testid="chat-sound">
              <option value="none">{t("obsLab.bez_dzwiekow")}</option>
              <option value="events">{t("obsLab.tylko_przy_zdarzeniach")}</option>
              <option value="all">{t("obsLab.zdarzenia_i_wiadomosci")}</option>
            </ToolSelect>
          </FieldLabel>
          {config.sound !== "none" && (
            <div className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
              <FieldLabel label={t("obsLab.dzwiek_zdarzenia")}>
                <ToolSelect value={config.soundStyle} onChange={(event) => patchConfig({ soundStyle: event.target.value as ChatSoundStyle })}>
                  <option value="ding">{t("obsLab.dzwonek")}</option>
                  <option value="pop">{t("obsLab.pykniecie")}</option>
                  <option value="arcade">{t("obsLab.automat_do_gier")}</option>
                  <option value="chime">{t("obsLab.cymbalki")}</option>
                </ToolSelect>
              </FieldLabel>
              <ToolRange label={t("obsLab.glosnosc")} value={config.soundVolume} suffix="%" min={0} max={100} step={5} onChange={(soundVolume) => patchConfig({ soundVolume })} />
              <ToolButton type="button" className="px-2.5 py-1 text-xs" onClick={previewSound} data-testid="chat-sound-preview">
                <Volume2 className="h-3.5 w-3.5" />{" "}{t("obsLab.posluchaj")}
              </ToolButton>
            </div>
          )}
        </div>
      </ToolDisclosure>

      <ToolDisclosure title={t("obsLab.animacje")}>
        <div className="space-y-4 text-fuchsia-300">
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
                  <option value="drop">{t("obsLab.spadniecie")}</option>
                  <option value="zoom">{t("obsLab.najazd")}</option>
                  <option value="swing">{t("obsLab.wahadlo")}</option>
                  <option value="glitch">{t("obsLab.glitch")}</option>
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
          <FieldLabel label={t("obsLab.efekt_nowej_wiadomosci")} hint={t("obsLab.efekt_ma_kolor_nicku_widza")}>
            <ToolSelect value={config.newMessageEffect} onChange={(event) => patchConfig({ newMessageEffect: event.target.value as CameraChatMessageEffect })}>
              <option value="none">{t("obsLab.brak")}</option>
              <option value="glow">{t("obsLab.poswiata")}</option>
              <option value="shine">{t("obsLab.blysk")}</option>
              <option value="pulse">{t("obsLab.puls")}</option>
              <option value="flash">{t("obsLab.rozblysk_tla")}</option>
            </ToolSelect>
          </FieldLabel>
          <FieldLabel label={t("obsLab.odslanianie_tekstu")}>
            <ToolSelect value={config.textReveal} onChange={(event) => patchConfig({ textReveal: event.target.value as CameraChatTextReveal })}>
              <option value="none">{t("obsLab.od_razu_caly_tekst")}</option>
              <option value="typewriter">{t("obsLab.maszyna_do_pisania")}</option>
              <option value="words">{t("obsLab.slowo_po_slowie")}</option>
            </ToolSelect>
          </FieldLabel>
          <FieldLabel label={t("obsLab.znikanie_wiadomosci")} hint={t("obsLab.dziala_gdy_ustawisz_znikanie_po")}>
            <ToolSelect value={config.exitStyle} onChange={(event) => patchConfig({ exitStyle: event.target.value as CameraChatExitStyle })}>
              <option value="fade">{t("obsLab.przenikanie")}</option>
              <option value="slide">{t("obsLab.wysuniecie")}</option>
              <option value="shrink">{t("obsLab.zmniejszenie")}</option>
              <option value="none">{t("obsLab.bez_animacji")}</option>
            </ToolSelect>
          </FieldLabel>
          {config.showEmotes && (
            <ToolToggle
              label={t("obsLab.wylatujace_emotki")}
              description={t("obsLab.pierwsza_emotka_wylatuje")}
              checked={config.emoteBurst}
              onChange={(emoteBurst) => patchConfig({ emoteBurst })}
            />
          )}
        </div>
      </ToolDisclosure>
      </div>)}
    </div>
  );

  return (
    <div className="space-y-4">
      <ToolToolbar>
        <ToolButton type="button" onClick={() => setOpenChatLab(false)}>
          <ArrowLeft className="h-4 w-4" />{" "}{t("obsLab.narzedzia_obs")}</ToolButton>
        <div className="flex flex-wrap items-center gap-2">
          <ToolButton type="button" variant="ghost" onClick={() => setHistory(undoChatHistory)} disabled={history.past.length === 0} data-testid="chat-undo">
            <Undo2 className="h-4 w-4" />{" "}{t("obsLab.cofnij")}</ToolButton>
          <ToolButton type="button" variant="ghost" onClick={() => setHistory(redoChatHistory)} disabled={history.future.length === 0} data-testid="chat-redo">
            <Redo2 className="h-4 w-4" />{" "}{t("obsLab.ponow")}</ToolButton>
          <ToolSegmented value={config.layout} options={LAYOUT_OPTIONS} onChange={(layout) => patchConfig({ layout })} />
        </div>
      </ToolToolbar>

      <ToolWorkspace sidebar={controls} sidebarWidth="350px">
        <div className="space-y-4">
          <ToolPanel
            title={t("obsLab.podglad")}
            description={t("obsLab.zmiany_sa_od_razu_widoczne")}
            actions={
              <>
                <ToolSegmented<PreviewBackground> value={previewBackground} options={PREVIEW_BACKGROUND_OPTIONS} onChange={setPreviewBackground} />
                <span className="text-xs font-semibold text-muted-foreground">{size.width} × {size.height}{t("obsLab.px")}</span>
              </>
            }
          >
            <div
              className="flex min-h-[560px] items-center justify-center overflow-auto rounded-xl border border-border p-6"
              style={{ background: PREVIEW_BACKGROUNDS[previewBackground] }}
              aria-label={t("obsLab.tlo_podgladu")}
            >
              <CameraChatWidget config={config} messages={mockMessages} previewCamera />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-semibold text-muted-foreground">{t("obsLab.wyslij_testowa_wiadomosc")}</span>
              {TEST_KINDS.map((kind) => (
                <ToolButton key={kind} type="button" className="px-2.5 py-1 text-xs" onClick={() => sendTest(kind)} data-testid={`chat-test-${kind}`}>
                  {testKindLabel(kind)}
                </ToolButton>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-semibold text-muted-foreground">{t("obsLab.testowe_zdarzenie")}</span>
              {CHAT_EVENT_KINDS.map((kind) => (
                <ToolButton key={kind} type="button" className="px-2.5 py-1 text-xs" onClick={() => sendEvent(kind)} data-testid={`chat-test-event-${kind}`}>
                  {eventKindLabel(kind)}
                </ToolButton>
              ))}
              <ToolButton type="button" className="px-2.5 py-1 text-xs" onClick={floodTest} data-testid="chat-test-flood">
                {t("obsLab.zalew_czatu", { n: FLOOD_TEST_COUNT })}
              </ToolButton>
            </div>
            <div className="mt-3 max-w-md" data-testid="chat-live-preview">
              <ToolToggle label={t("obsLab.ozyw_podglad")} description={t("obsLab.ozyw_podglad_opis")} checked={livePreview} onChange={setLivePreview} />
            </div>
          </ToolPanel>

          <ChatSetupCheck config={config} update={setConfig} />

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
            <div className="mt-4">
              <ObsSourceSteps width={size.width} height={size.height} />
            </div>
          </ToolPanel>

          <StreamElementsSetup config={config} width={size.width} height={size.height} />
        </div>
      </ToolWorkspace>
    </div>
  );
}
