import { t } from "@/i18n";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  type CameraChatConfig,
  CHAT_TEXT_SHADOWS,
  chatAvatarPx,
  chatBadgePx,
  chatDensityGap,
  chatDensityPadding,
  chatEmotePx,
  chatExitMs,
  chatFontFamily,
  chatFontPx,
  chatLineHeightPx,
  getCameraChatAnimationCss,
  getCameraChatExitCss,
  getCameraChatSize,
  getChatEffectCss,
  readableNameColor,
  getChatFrameCss,
  chatOverlayPlacement,
  chatOverlaySize,
  isChatOverlayDock,
  chatPanelBackground,
  rgbaCss,
} from "./camera-chat-settings";
import {
  type ChatBadge,
  type ChatEmote,
  type ChatMessage,
  type ChatPart,
  type ChatRow,
  type RevealPiece,
  CHAT_ROLE_COLORS,
  buildChatRows,
  isChatMessageHidden,
  nextChatPhaseChange,
} from "./chat-message-format";
import {
  FIRST_MESSAGE_COLOR,
  chatAmbientParticles,
  chatBubbleFilled,
  chatBurstPieces,
  CHAT_HYPE_LABEL,
  chatHeaderContent,
  chatShapeBorder,
  getChatDecorCss,
} from "./chat-decor";
import { chatOrnamentGlyph } from "./chat-ornaments";
import { chatSceneHtml, chatSceneLevel } from "./chat-scenes";
import {
  type ChatEventLabels,
  type ChatGoalKind,
  type ChatHypeHit,
  type ChatStreamEvent,
  CHAT_EVENT_ICONS,
  CHAT_HYPE_EVENT_WEIGHT,
  CHAT_HYPE_WINDOW_MS,
  POINTS_MESSAGE_COLOR,
  chatConfettiPieces,
  chatEventShown,
  chatEventTag,
  chatEventTitleParts,
  chatGoalAmount,
  chatGoalProgress,
  chatHypePercent,
  getChatEventCss,
} from "./chat-events";
import { chatEventLabels } from "./chat-event-labels";
import { CHAT_SOUND_RECIPES, CHAT_TICK_GAP_MS, chatAudio, playChatNotes } from "./chat-sound";

/** Kept under its old name: the preview, the OBS page and tests all pass messages of this shape. */
export type MockChatMessage = ChatMessage;

// --- Sample chat (preview and the OBS page without StreamElements) ------------------------------------------------

const svgImage = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
const face = (fill: string, mouth: string) => svgImage(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${fill}"/>`
  + `<circle cx="11" cy="13" r="2.4" fill="#1e1b4b"/><circle cx="21" cy="13" r="2.4" fill="#1e1b4b"/>${mouth}</svg>`,
);

/** Sample emotes drawn locally, so the preview loads nothing from the internet. */
export const SAMPLE_EMOTES: readonly ChatEmote[] = [
  { name: "swarmHype", url: face("#fbbf24", `<ellipse cx="16" cy="22" rx="5" ry="4" fill="#1e1b4b"/>`) },
  { name: "swarmLol", url: face("#38bdf8", `<path d="M9 19 Q16 27 23 19" stroke="#1e1b4b" stroke-width="2.6" fill="none" stroke-linecap="round"/>`) },
  { name: "swarmPog", url: face("#fb923c", `<circle cx="16" cy="22" r="3.6" fill="#1e1b4b"/>`) },
  { name: "swarmLove", url: svgImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 28C3 19 3 7 10.5 6.2c3-.3 4.8 1.5 5.5 3.3.7-1.8 2.5-3.6 5.5-3.3C29 7 29 19 16 28z" fill="#f43f5e"/></svg>`) },
  { name: "swarmGG", url: svgImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="6" width="28" height="20" rx="6" fill="#22c55e"/><path d="M12 12h-3.5a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 1.5 1.5H12v-3.5h-2M23.5 12H20a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 20 20h3.5v-3.5h-2" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`) },
];

const badgeIcon = (fill: string, shape: string) => svgImage(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><rect width="18" height="18" rx="4" fill="${fill}"/>${shape}</svg>`,
);

export const SAMPLE_BADGES: Record<"broadcaster" | "moderator" | "vip" | "subscriber", ChatBadge> = {
  broadcaster: { type: "broadcaster", description: "Broadcaster", url: badgeIcon("#e91916", `<circle cx="7.5" cy="9" r="3.2" fill="#fff"/><path d="M11 7l4-2v8l-4-2z" fill="#fff"/>`) },
  moderator: { type: "moderator", description: "Moderator", url: badgeIcon("#00ad03", `<path d="M4.5 13.5l8-8M10.5 4.5l3 3M5 11l2 2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`) },
  vip: { type: "vip", description: "VIP", url: badgeIcon("#e005b9", `<path d="M9 14.5L3.5 8 6 4.5h6L14.5 8z" fill="#fff"/>`) },
  subscriber: { type: "subscriber", description: "Subscriber", url: badgeIcon("#8205b4", `<path d="M9 3l1.8 3.8 4.2.5-3.1 2.9.8 4.1L9 12.3l-3.7 2 .8-4.1L3 7.3l4.2-.5z" fill="#fff"/>`) },
};

type SampleViewer = { name: string; color: string; badges: ChatBadge[] };

const SAMPLE_VIEWERS: readonly SampleViewer[] = [
  { name: "NightOwl", color: "#1E90FF", badges: [SAMPLE_BADGES.subscriber] },
  { name: "PixelMaja", color: "#FF69B4", badges: [SAMPLE_BADGES.vip, SAMPLE_BADGES.subscriber] },
  { name: "KubaGG", color: "", badges: [] },
  { name: "GreenWolf", color: "#2E8B57", badges: [SAMPLE_BADGES.moderator] },
  { name: "LunaPlays", color: "#9ACD32", badges: [SAMPLE_BADGES.subscriber] },
  { name: "Bartek_TV", color: "#0000FF", badges: [] },
  { name: "frostbyte", color: "#DAA520", badges: [] },
  { name: "AdaQ", color: "#B22222", badges: [SAMPLE_BADGES.subscriber] },
];

function sampleTexts(): string[] {
  const [hype, lol, pog, love, gg] = SAMPLE_EMOTES.map((emote) => emote.name);
  return [
    t("cameraChatWidget.hej_wszystkim"),
    t("cameraChatWidget.co_za_mecz_gg"),
    `${hype} ${hype} ${hype}`,
    t("cameraChatWidget.kiedy_nastepny_turniej"),
    t("cameraChatWidget.najlepsza_runda_dzisiaj", { emote: pog }),
    t("cameraChatWidget.pozdrowienia_z_gdanska"),
    `lol ${lol}`,
    t("cameraChatWidget.trzymam_kciuki_za_niebieskich"),
    t("cameraChatWidget.ten_clutch_byl_szalony", { emote: love }),
    t("cameraChatWidget.dzieki_za_stream", { emote: gg }),
  ];
}

let sampleSeries = 0;

export function generateMockMessages(
  count = 30,
): MockChatMessage[] {
  const texts = sampleTexts();
  const series = ++sampleSeries;
  const offset = Math.floor(Math.random() * texts.length);
  return Array.from({ length: count }, (_, index) => {
    const viewer = SAMPLE_VIEWERS[Math.floor(Math.random() * SAMPLE_VIEWERS.length)];
    return {
      id: `sample-${series}-${index}`,
      name: viewer.name,
      nick: viewer.name.toLowerCase(),
      color: viewer.color || undefined,
      badges: viewer.badges,
      emotes: [...SAMPLE_EMOTES],
      text: texts[(offset + index) % texts.length],
    };
  });
}

// --- Widget -------------------------------------------------------------------------------------------------------

/** Re-renders exactly when a message reaches the end of its lifetime or of its exit animation. */
function useChatClock(messages: readonly MockChatMessage[], config: CameraChatConfig) {
  const [, setTick] = useState(0);
  const next = nextChatPhaseChange(messages, config, Date.now());
  useEffect(() => {
    if (next === null) return undefined;
    const timer = window.setTimeout(() => setTick((tick) => tick + 1), Math.max(16, next - Date.now() + 5));
    return () => window.clearTimeout(timer);
  }, [next]);
}

type GoalTotals = Record<Exclude<ChatGoalKind, "none">, number>;

/** Goal totals of every event the widget has seen (the message list itself is trimmed to the last ones). */
function useGoalTotals(messages: readonly MockChatMessage[]): GoalTotals {
  const seen = useRef(new Set<string>());
  const totals = useRef<GoalTotals>({ follow: 0, sub: 0, bits: 0, tip: 0 });
  for (const message of messages) {
    if (!message.event) continue;
    const key = message.id ?? message.msgId ?? `${message.name}|${message.event.kind}|${message.event.amount}|${message.receivedAt ?? ""}`;
    if (seen.current.has(key)) continue;
    seen.current.add(key);
    for (const goal of ["follow", "sub", "bits", "tip"] as const) totals.current[goal] += chatGoalAmount(message.event, goal);
  }
  return totals.current;
}

/** Hype: shown messages and events of the last 20 seconds; re-checked every second while the meter is on. */
function useHypePercent(messages: readonly MockChatMessage[], config: CameraChatConfig): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!config.hypeMeter) return undefined;
    const timer = window.setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(timer);
  }, [config.hypeMeter]);
  if (!config.hypeMeter) return 0;
  const now = Date.now();
  const hits: ChatHypeHit[] = [];
  for (const message of messages) {
    if (message.receivedAt === undefined || now - message.receivedAt >= CHAT_HYPE_WINDOW_MS) continue;
    if (message.event ? chatEventShown(message.event, config) : !isChatMessageHidden(message, config)) {
      hits.push({ at: message.receivedAt, weight: message.event ? CHAT_HYPE_EVENT_WEIGHT : 1 });
    }
  }
  return chatHypePercent(hits, now, config.hypeTarget);
}

/** A sound for new rows that just arrived: the event sound for events, a quiet tick for messages when asked. */
function useChatSounds(rows: readonly ChatRow[], config: CameraChatConfig) {
  const seen = useRef<Set<string> | null>(null);
  const lastTick = useRef(0);
  useEffect(() => {
    const keys = rows.map((row) => row.key);
    if (seen.current === null || seen.current.size > 2000) {
      seen.current = new Set(keys);
      return;
    }
    const fresh = rows.filter((row) => !seen.current!.has(row.key));
    for (const key of keys) seen.current.add(key);
    if (config.sound === "none" || !fresh.length) return;
    const now = Date.now();
    const recent = fresh.filter((row) => row.message.receivedAt !== undefined && now - row.message.receivedAt < 5000);
    if (!recent.length) return;
    const audio = chatAudio();
    if (!audio) return;
    if (recent.some((row) => row.event)) {
      playChatNotes(audio, CHAT_SOUND_RECIPES[config.soundStyle], config.soundVolume);
    } else if (config.sound === "all" && now - lastTick.current >= CHAT_TICK_GAP_MS) {
      lastTick.current = now;
      playChatNotes(audio, CHAT_SOUND_RECIPES.tick, config.soundVolume);
    }
  });
}

type Props = {
  config: CameraChatConfig;
  messages: MockChatMessage[];
  previewCamera?: boolean;
  /** Event templates; the site's language by default. */
  eventLabels?: ChatEventLabels;
  /** Tip currency from the platform; the label's currency by default. */
  currency?: string;
};

export function CameraChatWidget({
  config,
  messages,
  previewCamera = false,
  eventLabels,
  currency,
}: Props) {
  useChatClock(messages, config);
  const size =
    getCameraChatSize(config);

  const rows = buildChatRows(messages, config, Date.now());
  const goalTotals = useGoalTotals(messages);
  const hype = useHypePercent(messages, config);
  useChatSounds(rows, config);

  const fontPx = chatFontPx(config);
  const lineHeight = chatLineHeightPx(config);
  const avatarPx = chatAvatarPx(config);
  const badgePx = chatBadgePx(config);
  const emotePx = chatEmotePx(config);
  const exitMs = chatExitMs(config);
  const right = config.textAlign === "right";
  const block = config.messageLayout !== "inline";

  const labels = eventLabels ?? chatEventLabels();
  const ornamentGlyph = chatOrnamentGlyph(config.ornament);
  const tipCurrency = currency ?? labels.tipCurrency;
  const contentStyle: CSSProperties = {
    fontSize: fontPx,
    lineHeight: `${lineHeight}px`,
    textShadow: config.textShadow === "none" ? undefined : CHAT_TEXT_SHADOWS[config.textShadow],
  };

  /** A follow, sub, gift, cheer, raid or tip: icon, title with the names, and the message that came with it. */
  const renderEventRow = (row: ChatRow, event: ChatStreamEvent) => {
    const entry = config.animateMessages
      ? `${config.animationStyle === "random" ? "obs-chat-in-" + row.motion : "obs-chat-in"} ${config.animationDurationMs}ms cubic-bezier(.2,.7,.2,1) backwards`
      : undefined;
    const tag = chatEventTag(event);
    const said = row.parts.map((part) => (part.kind === "text" ? part.text : part.name)).join("").trim();
    return (
      <div
        key={row.key}
        className={[
          "obs-chat-message flex min-w-0 items-start chat-event",
          `chat-event-${event.kind} chat-event-${config.eventStyle}`,
          row.phase === "leaving" ? "obs-chat-leaving" : "",
        ].filter(Boolean).join(" ")}
        style={{
          opacity: row.opacity,
          padding: chatDensityPadding(config.density),
          flexDirection: right ? "row-reverse" : "row",
          textAlign: config.textAlign,
          // The glow style draws its own border in the event colour.
          border: config.showBorders && config.eventStyle !== "glow" ? "1px solid rgba(255,255,255,.07)" : undefined,
          animation: row.phase === "leaving" && exitMs > 0 ? `obs-chat-out ${exitMs}ms ease-in forwards` : entry,
        }}
        data-event={event.kind}
      >
        <span className="chat-event-icon" aria-hidden="true">{CHAT_EVENT_ICONS[event.kind]}</span>
        <div className="chat-event-body" style={contentStyle}>
          <span className="chat-event-title">
            {chatEventTitleParts(event, labels, tipCurrency).map((part, index) => (part.strong
              ? <span key={index} className="chat-event-name">{part.text}</span>
              : part.text))}
            {tag && <span className="chat-event-tag">{tag}</span>}
          </span>
          {said && <span className="chat-event-text">{said}</span>}
        </div>
        {config.eventConfetti && chatConfettiPieces().map((piece, index) => (
          <span
            key={`confetti-${index}`}
            className="chat-confetti"
            aria-hidden="true"
            style={{ "--x": piece.x, "--y": piece.y, "--r": piece.r, "--d": piece.d, background: piece.color } as CSSProperties}
          />
        ))}
      </div>
    );
  };

  const renderRow = (row: ChatRow) => {
    if (row.event) return renderEventRow(row, row.event);
    const { message } = row;
    const entry = config.animateMessages
      ? `${config.animationStyle === "random" ? "obs-chat-in-" + row.motion : "obs-chat-in"} ${config.animationDurationMs}ms cubic-bezier(.2,.7,.2,1) backwards`
      : undefined;
    // Precedence: highlighted word, channel-points highlight, first message, role, then the plain bubble.
    const roleColor = !row.highlighted && !row.points && !row.firstTime && row.role ? CHAT_ROLE_COLORS[row.role] : null;
    const tintColor = row.highlighted ? null
      : row.points ? POINTS_MESSAGE_COLOR
        : row.firstTime ? FIRST_MESSAGE_COLOR : roleColor;
    const fill = row.highlighted
      ? rgbaCss(config.highlightColor, 18)
      : tintColor ? rgbaCss(tintColor, 14)
        : chatBubbleFilled(config) ? rgbaCss(config.bubbleColor, config.bubbleOpacity) : undefined;
    const bar = row.highlighted
      ? `inset ${right ? -3 : 3}px 0 0 ${config.highlightColor}`
      : tintColor ? `inset ${right ? -3 : 3}px 0 0 ${tintColor}`
        : config.accentBar ? `inset ${right ? -3 : 3}px 0 0 ${row.nameColor}` : undefined;
    const style: CSSProperties & { "--chat-fx"?: string; "--chat-bubble"?: string } = {
      opacity: row.opacity,
      gap: 8,
      padding: chatDensityPadding(config.density),
      flexDirection: right ? "row-reverse" : "row",
      textAlign: config.textAlign,
      borderRadius: chatBubbleFilled(config) || config.bubbleShape === "outline" || row.highlighted || tintColor
        ? config.bubbleRadius : undefined,
      background: fill,
      border: config.showBorders ? "1px solid rgba(255,255,255,.07)" : undefined,
      ...chatShapeBorder(config, row.nameColor),
      boxShadow: bar,
      ...(config.bubbleShape === "tail" || config.bubbleShape === "skew" ? { "--chat-bubble": fill ?? "transparent" } : {}),
      ...(config.messageLayout === "bubble" ? { alignSelf: right ? "flex-end" : "flex-start", maxWidth: "100%" } : {}),
      animation: row.phase === "leaving" && exitMs > 0
        ? `obs-chat-out ${exitMs}ms ease-in forwards`
        : entry,
      ...(config.newMessageEffect !== "none" ? { "--chat-fx": row.nameColor } : {}),
    };
    const emoteHeight = row.emoteOnly ? emotePx * 2 : emotePx;
    const name = (
      <span
        className="obs-chat-name chat-name"
        style={{
          ...(config.nameStyle !== "plain" || config.nameTag !== "plain" ? { "--chat-name": row.nameColor } as CSSProperties : {}),
          ...(config.nameTag === "pill" ? { "--chat-name-bg": readableNameColor(row.nameColor) } as CSSProperties : {}),
          color: row.nameColor,
          fontWeight: 900,
          marginRight: block ? undefined : 8,
          textTransform: config.nameUppercase ? "uppercase" : undefined,
        }}
      >
        {message.name}{config.showColon ? ":" : ""}
      </span>
    );
    const firstTag = row.firstTime ? <span className="chat-first-tag">{t("obsLab.nowy")}</span> : null;
    const mark = ornamentGlyph ? <span className="chat-mark" aria-hidden="true">{ornamentGlyph}</span> : null;
    const firstEmote = row.parts.find((part) => part.kind === "emote");
    const burst = config.emoteBurst && firstEmote && firstEmote.kind === "emote"
      ? chatBurstPieces(config).map((piece, index) => (
        <img key={`burst-${index}`} className="chat-burst" src={firstEmote.url} alt="" style={{ left: piece.left, animationDelay: piece.delay }} />
      ))
      : null;
    const badges = row.badges.map((badge, index) => (
      <img
        key={`${badge.type ?? "badge"}-${index}`}
        className="obs-chat-badge"
        src={badge.url}
        alt={badge.description || badge.type || ""}
        style={{ display: "inline-block", height: badgePx, width: "auto", marginRight: 4, verticalAlign: "middle" }}
      />
    ));
    const text = (
      <span
        className="obs-chat-text chat-text"
        style={{
          color: message.isAction ? row.nameColor : rgbaCss(config.textColor, config.textOpacity),
          fontStyle: message.isAction ? "italic" : undefined,
          fontWeight: config.textBold ? 600 : undefined,
          overflowWrap: "anywhere",
          display: block ? "block" : undefined,
        }}
      >
        {(row.reveal ?? row.parts as ReadonlyArray<ChatPart | RevealPiece>).map((part, index) => part.kind === "emote"
          ? (
            <img
              key={index}
              className="obs-chat-emote"
              src={part.url}
              alt={part.name}
              style={{
                display: "inline-block",
                height: emoteHeight,
                width: "auto",
                margin: "0 1px",
                verticalAlign: "middle",
                animation: "animation" in part ? part.animation : undefined,
              }}
            />
          )
          : "animation" in part && part.animation
            ? (
              <span
                key={index}
                className="obs-chat-reveal"
                style={{ display: "word" in part && part.word ? "inline-block" : undefined, animation: part.animation }}
              >
                {part.text}
              </span>
            )
            : part.text)}
      </span>
    );

    return (
      <div
        key={row.key}
        className={[
          "obs-chat-message flex min-w-0 items-start",
          row.phase === "leaving" ? "obs-chat-leaving" : "",
          row.emoteOnly ? "obs-chat-emote-only" : "",
          row.highlighted ? "obs-chat-highlight" : "",
          config.newMessageEffect !== "none" ? `obs-chat-fx obs-chat-fx-${config.newMessageEffect}` : "",
        ].filter(Boolean).join(" ")}
        style={style}
        data-role={roleColor ? row.role ?? undefined : undefined}
        data-first={row.firstTime ? "1" : undefined}
        data-points={row.points ? "1" : undefined}
        data-highlight={row.highlighted ? "1" : undefined}
      >
        {config.showAvatars && (
          <div
            className="grid shrink-0 place-items-center rounded-full font-black"
            style={{
              width: avatarPx,
              height: avatarPx,
              fontSize: Math.round(avatarPx * 0.36),
              background: rgbaCss(row.nameColor, 22),
              color: row.nameColor,
            }}
          >
            {(Array.from(message.name)[0] ?? "").toUpperCase()}
          </div>
        )}

        <div className="min-w-0" style={contentStyle}>
          {row.reply && (
            <span className="chat-reply">
              {"\u21aa "}<span className="chat-reply-name">@{row.reply.name}</span>{row.reply.text ? `: ${row.reply.text}` : ""}
            </span>
          )}
          {block
            ? (<><div className="obs-chat-head">{firstTag}{badges}{mark}{name}</div>{text}</>)
            : (<>{firstTag}{badges}{mark}{name}<wbr />{text}</>)}
          {row.combo > 1 && (
            <span key={`combo-${row.combo}`} className="chat-combo" data-hot={row.combo >= 5 ? "1" : undefined}>
              {"\u00d7"}{row.combo}
            </span>
          )}
        </div>
        {burst}
      </div>
    );
  };

  const particles = chatAmbientParticles(config);
  const sceneMarkup = chatSceneHtml(config);
  const chatLevel = chatSceneLevel(rows.filter((row) => row.phase !== "leaving").length, config.maxMessages);
  const headerContent = chatHeaderContent(config);
  const goal = config.goalKind === "none"
    ? null
    : chatGoalProgress(config, config.goalStart + goalTotals[config.goalKind], labels, tipCurrency);

  const renderMessages = (
    forceHeight?: number | string,
    maxHeight?: number,
  ) => (
    <div
      data-chat-level={chatLevel}
      className={`obs-chat-panel flex min-h-0 w-full flex-col overflow-hidden ${
        config.chatAnchor === "top"
          ? "justify-start"
          : "justify-end"
      }`}
      style={{
        height: forceHeight,
        maxHeight,
        ...(config.panelGradient
          ? { background: chatPanelBackground(config) }
          : { backgroundColor: chatPanelBackground(config) }),
      }}
    >
      {/* The scene markup is fixed per scene (constants only, nothing typed by anyone), see chat-scenes.ts. */}
      {sceneMarkup && <div className="chat-scene" aria-hidden="true" dangerouslySetInnerHTML={{ __html: sceneMarkup }} />}
      {config.panelPattern !== "none" && <div className="chat-pattern" aria-hidden="true" />}
      {particles.length > 0 && (
        <div className="chat-ambient" aria-hidden="true">
          {particles.map((particle, index) => (
            <span key={index} className={particle.className} style={particle.style}>{particle.text}</span>
          ))}
        </div>
      )}
      {ornamentGlyph && <div className="chat-emblem" aria-hidden="true">{ornamentGlyph}</div>}
      {ornamentGlyph && <div className="chat-divider" aria-hidden="true">{ornamentGlyph}</div>}
      {headerContent.visible && (
        <div className="chat-header-box">
          {headerContent.header && (
            <div className={`chat-header chat-header-${config.headerStyle}`}>
              {headerContent.live && <span className="chat-live-dot" />}
              <span>{headerContent.title}</span>
            </div>
          )}
          {goal && (
            <div className="chat-goal" data-goal={config.goalKind} data-done={goal.done ? "1" : undefined}>
              <div className="chat-goal-top">
                <span className="chat-goal-label">{goal.label}</span>
                <span className="chat-goal-count">{goal.text}</span>
              </div>
              <div className="chat-goal-track"><div className="chat-goal-fill" style={{ width: `${goal.percent}%` }} /></div>
            </div>
          )}
          {headerContent.hype && (
            <div className="chat-hype" data-hot={hype >= 100 ? "1" : undefined}>
              <span className="chat-hype-label">{CHAT_HYPE_LABEL}</span>
              <div className="chat-hype-track"><div className="chat-hype-fill" style={{ width: `${hype}%` }} /></div>
            </div>
          )}
          {headerContent.pinned && <div className="chat-pinned">{headerContent.pinned}</div>}
        </div>
      )}
      <div
        className="obs-chat-list flex shrink-0 flex-col"
        style={{
          gap: chatDensityGap(config.density),
          padding:
            `${config.innerPadding}px`,
        }}
      >
        {rows.map(renderRow)}
      </div>
    </div>
  );

  const cameraClass =
    previewCamera
      ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950"
      : "bg-transparent";

  const camera = (
    <div
      className={[
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        cameraClass,
      ].join(" ")}
      style={{
        width:
          `${config.cameraWidth}px`,
        height:
          `${size.cameraHeight}px`,
      }}
    >
      {previewCamera && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,.08),transparent_45%)]" />

          <div className="relative text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-black/20 text-xs font-black tracking-[0.15em] text-white/40">{t("cameraChatWidget.cam")}</div>

            <div className="mt-3 text-sm font-bold text-white/55">
              {config.cameraWidth}
              {" × "}
              {size.cameraHeight}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Keep the inset within both axes, even for manually edited URL parameters.
  const overlayInset = Math.min(config.overlayInset,
    Math.max(0, (size.cameraHeight - 1) / 2),
    Math.max(0, (config.cameraWidth - size.chatWidthPx) / 2));
  const overlayPositionStyle: CSSProperties = chatOverlayPlacement(config.overlayPosition, overlayInset);
  const overlayDock = isChatOverlayDock(config.overlayPosition);
  const overlaySizeStyle: CSSProperties = chatOverlaySize(config.overlayPosition, config.chatWidth, size.cameraHeight, overlayInset);

  return (
    <>
      <style>{`${getCameraChatAnimationCss(config.animationStyle, "obs-chat-in")}
${getCameraChatExitCss(config.exitStyle, config.textAlign, "obs-chat-out")}
${getChatEffectCss(config, ".obs-chat-fx")}
${getChatFrameCss(config, ".obs-chat-panel", ".obs-chat-list")}
${getChatDecorCss(config, ".obs-chat-panel", ".obs-chat-message")}
${getChatEventCss(config, ".obs-chat-message")}
@media (prefers-reduced-motion: reduce) { .obs-chat-message, .obs-chat-message::after, .obs-chat-reveal, .obs-chat-emote, .obs-chat-panel, .obs-chat-panel::before, .obs-chat-panel::after, .obs-chat-list, .chat-amb, .chat-live-dot, .chat-burst { animation: none !important; } }`}</style>

      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          borderRadius:
            `${config.radius}px`,
          border: config.showBorders ? "1px solid rgba(255,255,255,.1)" : undefined,
          fontFamily: chatFontFamily(config),
        }}
      >
        {config.layout === "chat" && renderMessages("100%")}

        {(config.layout === "right" || config.layout === "left") && (
          <div
            className="flex h-full"
            style={{
              gap:
                `${config.gap}px`,
              flexDirection: config.layout === "left" ? "row-reverse" : undefined,
            }}
          >
            {camera}

            <div
              className="flex shrink-0 overflow-hidden"
              style={{
                width:
                  `${size.chatWidthPx}px`,
                height:
                  `${size.cameraHeight}px`,
                alignItems:
                  config.chatAnchor ===
                  "top"
                    ? "flex-start"
                    : "flex-end",
              }}
            >
              {renderMessages(
                config.fitChatHeight
                  ? "100%"
                  : undefined,
              )}
            </div>
          </div>
        )}

        {(config.layout === "below" || config.layout === "above") && (
          <div
            className="flex h-full flex-col"
            style={{
              gap:
                `${config.gap}px`,
              flexDirection: config.layout === "above" ? "column-reverse" : undefined,
            }}
          >
            {camera}

            <div
              className="shrink-0 overflow-hidden"
              style={{
                height:
                  `${config.belowHeight}px`,
              }}
            >
              {renderMessages("100%")}
            </div>
          </div>
        )}

        {config.layout === "overlay" && (
          <>
            {camera}

            <div
              className="absolute overflow-hidden"
              style={{
                ...overlaySizeStyle,
                borderRadius:
                  `${Math.max(
                    6,
                    config.radius * 0.7,
                  )}px`,
                ...overlayPositionStyle,
              }}
            >
              {overlayDock
                ? renderMessages("100%")
                : renderMessages(undefined, size.cameraHeight - overlayInset * 2)}
            </div>
          </>
        )}
      </div>
    </>
  );
}
