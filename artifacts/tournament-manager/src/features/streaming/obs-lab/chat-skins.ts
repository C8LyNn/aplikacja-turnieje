/**
 * Theme skins: a bespoke look for every theme that no other theme shares — the shape of its rows (bevelled, pointed,
 * cup, blob, capsule, leaf), its borders (brass plate, candy cane, gilded double line), its type (drop caps, small caps,
 * spacing) and signature details (a blinking cursor, coloured notes, a zigzag). Pure CSS on the panel, the message rows
 * (event rows keep their own look), `.chat-name`, `.chat-text` and `.chat-mark`, so the preview, the OBS page and the
 * exported StreamElements widget draw the same skin. !important wins over the rows' inline colours.
 */
import type { CameraChatConfig } from "./camera-chat-settings";

type SkinContext = {
  panel: string;
  /** A message row (not an event row). */
  card: string;
  config: CameraChatConfig;
};

type Skin = (context: SkinContext) => string[];

const cut = (size: number) =>
  `polygon(${size}px 0, 100% 0, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0 100%, 0 ${size}px)`;

/** A border painted by a gradient (candy cane, rainbow) around a solid card. */
const paintedBorder = (card: string, fill: string, paint: string, width: number, radius: number) =>
  `${card} { border: ${width}px solid transparent !important; border-radius: ${radius}px !important; background: linear-gradient(${fill}, ${fill}) padding-box, ${paint} border-box !important; box-shadow: none !important; }`;

const hideShapeLayer = (card: string) => `${card}::before { display: none !important; }`;

const SKINS = {
  // --- Classic -----------------------------------------------------------------------------------------------------
  glass: ({ panel }) => [
    `${panel} { -webkit-backdrop-filter: blur(10px) saturate(140%); backdrop-filter: blur(10px) saturate(140%); box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 10px 30px rgba(0,0,0,.35); }`,
    `.chat-name { letter-spacing: .02em; }`,
  ],
  minimal: ({ card }) => [
    `.chat-name { text-transform: lowercase; font-weight: 600 !important; opacity: .92; }`,
    `${card} { padding-left: 2px !important; padding-right: 2px !important; }`,
  ],
  compact: ({ panel, card }) => [
    `${panel} { border-radius: 10px !important; box-shadow: 0 8px 24px rgba(0,0,0,.45); }`,
    `${card} { padding-top: 2px !important; padding-bottom: 2px !important; font-size: .95em; }`,
  ],
  classic: ({ card }) => [
    `${card}:nth-child(odd) { background: rgba(255,255,255,.04) !important; }`,
    `.chat-name { font-weight: 800 !important; }`,
  ],
  light: ({ panel, card }) => [
    `${panel} { background: #eef2f7 !important; }`,
    `${card} { background: #ffffff !important; border-radius: 10px !important; box-shadow: 0 1px 3px rgba(15,23,42,.14) !important; }`,
  ],
  clear: ({ panel }) => [
    `${panel} { background: transparent !important; }`,
    `.chat-name { text-shadow: 0 0 2px #000, 0 0 2px #000, 0 0 3px #000 !important; }`,
    `.chat-text { -webkit-text-stroke: .35px rgba(0,0,0,.85); }`,
  ],
  paper: ({ panel }) => [
    `${panel} { border-left: 3px double #ef4444 !important; }`,
    `.chat-name { background: linear-gradient(transparent 60%, rgba(250,204,21,.6) 60%); padding: 0 2px; }`,
  ],
  noir: ({ panel, card }) => [
    `${panel} { box-shadow: inset 0 0 70px rgba(0,0,0,.9); }`,
    `${card} { filter: grayscale(1); }`,
    `.chat-name { font-variant: small-caps; letter-spacing: .08em; }`,
    `.chat-text { font-style: italic; }`,
  ],
  gold: ({ card }) => [
    `${card} { border: 1px solid rgba(251,191,36,.4) !important; border-radius: 2px !important; box-shadow: inset 0 0 0 2px rgba(0,0,0,.55), inset 0 0 0 3px rgba(251,191,36,.22) !important; }`,
    `.chat-name { letter-spacing: .12em; text-transform: uppercase; font-size: .85em; }`,
  ],
  chalkboard: ({ panel }) => [
    `${panel} { box-shadow: inset 0 0 45px rgba(0,0,0,.6); }`,
    `.chat-text { text-shadow: 0 0 1px rgba(255,255,255,.65), 1px 1px 0 rgba(255,255,255,.08); }`,
    `.chat-name { text-decoration: underline wavy !important; text-underline-offset: 4px; }`,
  ],
  blueprint: ({ card }) => [
    `${card} { border: 1px dashed rgba(191,219,254,.55) !important; border-radius: 0 !important; background: rgba(255,255,255,.03) !important; }`,
    `.chat-name { font-family: Consolas, "Courier New", monospace; letter-spacing: .15em; font-size: .78em; }`,
  ],
  newspaper: () => [
    `.chat-text { text-align: justify; hyphens: auto; }`,
    `.chat-text::first-letter { float: left; margin: 2px 2px 0 0; font-size: 2.1em; line-height: .85; font-weight: 700; }`,
  ],
  corkboard: ({ card }) => [
    `${card}:nth-child(3n+2) { background: #bbf7d0 !important; }`,
    `${card}:nth-child(3n) { background: #fbcfe8 !important; }`,
    `.chat-name { font-weight: 700; }`,
  ],
  // --- Neon and games ----------------------------------------------------------------------------------------------
  neon: ({ card, config }) => [
    `${card} { border: 1px solid ${config.frameColor}77 !important; box-shadow: 0 0 10px ${config.frameColor}55, inset 0 0 10px ${config.frameColor}33 !important; }`,
    `.chat-name { text-shadow: 0 0 4px currentColor, 0 0 12px currentColor, 0 0 22px currentColor !important; }`,
  ],
  esport: ({ panel, card, config }) => [
    `${panel} { box-shadow: inset 0 3px 0 ${config.frameColor}; }`,
    `${card} { clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%); padding-left: 14px !important; border-left: 4px solid ${config.frameColor} !important; }`,
  ],
  rainbow: ({ card }) => [
    hideShapeLayer(card),
    paintedBorder(card, "#11111c", "linear-gradient(90deg, #f43f5e, #f59e0b, #84cc16, #06b6d4, #8b5cf6)", 2, 4),
  ],
  terminal: ({ panel, card }) => [
    `${panel} { border-radius: 18px / 42px !important; box-shadow: inset 0 0 50px rgba(34,197,94,.16); }`,
    `.chat-text { font-family: Consolas, "Courier New", monospace !important; }`,
    `${card}:last-child .chat-text::after { content: "\\2588"; margin-left: 3px; color: #22c55e; animation: chat-skin-blink 1s steps(1) infinite; }`,
    `@keyframes chat-skin-blink { 50% { opacity: 0; } }`,
  ],
  cyberpunk: ({ card }) => [
    `${card} { clip-path: ${cut(10)}; background: linear-gradient(90deg, rgba(250,204,21,.16), rgba(34,211,238,.05)) !important; border: none !important; }`,
    `.chat-name { text-shadow: 2px 0 #ff2a6d, -2px 0 #05d9e8 !important; letter-spacing: .08em; }`,
  ],
  synthwave: ({ card }) => [
    `${card} { background: linear-gradient(180deg, rgba(244,114,182,.2), rgba(34,211,238,.06)) !important; border-radius: 0 !important; border-bottom: 2px solid #f472b6 !important; }`,
    `.chat-name { font-style: italic; text-shadow: 0 0 8px #f472b6, 2px 2px 0 #2e1065 !important; }`,
  ],
  retro: ({ panel }) => [
    `${panel} { border-radius: 0 !important; }`,
    `.chat-name, .chat-text { text-shadow: 2px 2px 0 #000 !important; }`,
  ],
  fps: ({ card }) => [
    `${card} { clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%); background: linear-gradient(90deg, rgba(239,68,68,.28), transparent 75%) !important; border: none !important; padding-right: 18px !important; }`,
    `.chat-name { font-family: Consolas, "Courier New", monospace; letter-spacing: .08em; }`,
  ],
  matrix: ({ card }) => [
    `.chat-text { text-shadow: 0 0 6px rgba(34,197,94,.75); }`,
    `${card}:not(:last-child) .chat-text { color: #15803d !important; }`,
    `${card}:last-child .chat-text { color: #dcfce7 !important; }`,
  ],
  amberterm: ({ panel }) => [
    `${panel} { border-radius: 22px / 50px !important; animation: chat-skin-flicker 4s infinite; }`,
    `.chat-text, .chat-name { text-shadow: 0 0 5px rgba(251,191,36,.85) !important; }`,
    `@keyframes chat-skin-flicker { 0%, 100% { opacity: 1; } 92% { opacity: .96; } 94% { opacity: .82; } 96% { opacity: .97; } }`,
  ],
  neontokyo: ({ card }) => [
    `${card} { border-left: 3px solid #ff2a6d !important; border-right: 3px solid #05d9e8 !important; }`,
    `.chat-name { letter-spacing: .2em; text-transform: uppercase; font-size: .8em; text-shadow: 0 0 8px #ff2a6d !important; }`,
  ],
  arcade: () => [
    `.chat-name { text-shadow: 2px 2px 0 #ef4444, 4px 4px 0 #1d4ed8 !important; }`,
    `.chat-text { text-transform: uppercase; letter-spacing: .05em; font-size: .9em; }`,
  ],
  racing: ({ card }) => [
    `${card} { border-left: 6px solid #facc15 !important; font-style: italic; }`,
    `.chat-name { font-style: italic; letter-spacing: .05em; }`,
  ],
  // --- Fantasy -----------------------------------------------------------------------------------------------------
  fantasy: ({ card }) => [
    `${card} { border: 1px solid rgba(251,191,36,.38) !important; border-radius: 16px 2px 16px 2px !important; box-shadow: 0 0 12px rgba(167,139,250,.28) !important; }`,
    `.chat-name { font-variant: small-caps; letter-spacing: .06em; }`,
  ],
  steampunk: ({ card }) => [
    `${card} { border: 3px ridge #b87333 !important; border-radius: 4px !important; background: linear-gradient(180deg, rgba(184,115,51,.2), rgba(0,0,0,.28)) !important; }`,
    `.chat-name { text-shadow: 0 1px 0 rgba(255,255,255,.25), 0 -1px 0 rgba(0,0,0,.7) !important; }`,
  ],
  gothic: ({ card }) => [
    `${card} { border-bottom: 1px solid rgba(185,28,28,.45) !important; }`,
    `.chat-text { display: block; }`,
    `.chat-text::first-letter { color: #b91c1c; font-size: 1.7em; font-weight: 700; line-height: 1; }`,
    `.chat-name { font-variant: small-caps; letter-spacing: .1em; }`,
  ],
  dragon: ({ card }) => [
    `${card} { clip-path: polygon(0 0, 100% 0, 96% 50%, 100% 100%, 0 100%); background: linear-gradient(90deg, rgba(239,68,68,.28), rgba(249,115,22,.08)) !important; border-left: 3px solid #f97316 !important; padding-right: 22px !important; }`,
    `.chat-name { text-shadow: 0 0 6px #f97316, 0 0 14px #dc2626 !important; }`,
  ],
  pirate: ({ panel, card }) => [
    `${panel} { box-shadow: inset 0 0 40px rgba(91,58,26,.55); }`,
    `${card} { border-bottom: 1px dashed rgba(59,36,18,.55) !important; }`,
    `.chat-name { font-weight: 700; letter-spacing: .02em; }`,
  ],
  samurai: ({ card }) => [
    `${card} { border-left: 4px solid #dc2626 !important; padding-left: 10px !important; background: linear-gradient(90deg, rgba(220,38,38,.14), transparent 60%) !important; }`,
    `.chat-name { letter-spacing: .25em; text-transform: uppercase; font-size: .78em; }`,
  ],
  horror: ({ panel }) => [
    `${panel} { animation: chat-skin-flicker 5s infinite; }`,
    `.chat-name { text-shadow: 0 2px 0 #7f1d1d, 0 4px 3px rgba(127,29,29,.65) !important; }`,
    `.chat-text { text-shadow: 0 0 2px rgba(127,29,29,.8); }`,
    `@keyframes chat-skin-flicker { 0%, 100% { opacity: 1; } 92% { opacity: .96; } 94% { opacity: .82; } 96% { opacity: .97; } }`,
  ],
  western: ({ card }) => [
    `${card} { background: rgba(233,196,106,.13) !important; border: 2px solid rgba(160,82,45,.85) !important; border-radius: 0 !important; box-shadow: inset 0 0 0 3px rgba(43,27,14,.6) !important; }`,
    `.chat-name { letter-spacing: .18em; }`,
  ],
  // --- Cute and girly ----------------------------------------------------------------------------------------------
  bubbles: ({ card }) => [
    `${card} { border-radius: 999px !important; padding-left: 14px !important; padding-right: 14px !important; background: radial-gradient(circle at 25% 25%, rgba(255,255,255,.28), rgba(125,211,252,.12)) !important; box-shadow: inset 0 0 0 1px rgba(255,255,255,.32) !important; }`,
  ],
  kawaii: ({ card }) => [
    `${card} { border: 2px dashed rgba(244,114,182,.6) !important; }`,
    `.chat-mark { animation: chat-skin-bob 1.6s ease-in-out infinite; }`,
    `@keyframes chat-skin-bob { 50% { transform: translateY(-2px); } }`,
  ],
  candy: ({ card }) => [
    hideShapeLayer(card),
    paintedBorder(card, "#2e1065", "repeating-linear-gradient(45deg, #f0abfc 0 6px, #ffffff 6px 12px)", 3, 14),
  ],
  mint: ({ card }) => [
    `${card} { border-radius: 4px 16px 4px 16px !important; border-left: 3px solid #34d399 !important; }`,
    `.chat-text { color: #ecfdf5 !important; }`,
  ],
  coffee: ({ card }) => [
    hideShapeLayer(card),
    `${card} { background: linear-gradient(180deg, rgba(214,167,122,.2), rgba(63,42,32,.32)) !important; border-radius: 4px 4px 16px 16px !important; border-top: 2px solid rgba(214,167,122,.6) !important; }`,
    `.chat-name { font-style: italic; }`,
  ],
  princess: ({ card }) => [
    `${card} { border: 1px solid rgba(253,230,138,.6) !important; border-radius: 20px !important; box-shadow: 0 0 0 3px rgba(249,168,212,.16), 0 0 14px rgba(253,230,138,.28) !important; }`,
    `.chat-name { letter-spacing: .04em; }`,
  ],
  cottoncandy: ({ card }) => [
    hideShapeLayer(card),
    `${card} { border-radius: 22px 22px 22px 6px !important; background: linear-gradient(135deg, #fce7f3, #e0f2fe) !important; box-shadow: 0 2px 6px rgba(219,39,119,.15) !important; }`,
  ],
  lilac: ({ card }) => [
    hideShapeLayer(card),
    `${card} { border-radius: 40px 12px 40px 12px / 24px 12px 24px 12px !important; background: rgba(216,180,254,.15) !important; border: 1px solid rgba(216,180,254,.35) !important; }`,
  ],
  unicorn: ({ card }) => [
    hideShapeLayer(card),
    paintedBorder(card, "#1f1238", "linear-gradient(90deg, #fbcfe8, #fef9c3, #bbf7d0, #bfdbfe, #e9d5ff)", 2, 18),
  ],
  bubblegum: ({ card }) => [
    `${card} { rotate: -.6deg; }`,
    `${card}:nth-child(even) { rotate: .6deg; }`,
    `.chat-name { text-shadow: 1px 1px 0 #ffffff !important; }`,
  ],
  pastelgoth: ({ card }) => [
    `${card} { border: 1px solid #f9a8d4 !important; border-radius: 0 !important; box-shadow: 3px 3px 0 #c4b5fd !important; }`,
    `.chat-name { letter-spacing: .12em; text-transform: lowercase; }`,
  ],
  y2k: ({ card }) => [
    `${card} { border-radius: 20px !important; background: linear-gradient(180deg, rgba(255,255,255,.36), rgba(255,255,255,.09) 50%, rgba(255,255,255,.03)) !important; }`,
    `.chat-name { font-style: italic; text-shadow: 0 1px 0 rgba(255,255,255,.8) !important; }`,
  ],
  peach: ({ card }) => [
    `${card} { background: #ffe4cc !important; border-radius: 16px !important; box-shadow: 0 2px 0 #fdba74 !important; }`,
  ],
  // --- Abstract ----------------------------------------------------------------------------------------------------
  aurora: ({ panel, card }) => [
    `${panel} { background-size: 220% 220% !important; animation: chat-skin-aurora 14s ease-in-out infinite; }`,
    `${card} { background: rgba(255,255,255,.05) !important; border-radius: 0 !important; border-top: 1px solid rgba(52,211,153,.45) !important; }`,
    `@keyframes chat-skin-aurora { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`,
  ],
  hologram: ({ card }) => [
    `${card} { background: linear-gradient(120deg, rgba(103,232,249,.17), rgba(240,171,252,.16), rgba(253,230,138,.13)) !important; }`,
    `.chat-name { font-family: Consolas, "Courier New", monospace; letter-spacing: .1em; }`,
  ],
  memphis: ({ card }) => [
    `${card}:nth-child(even) { margin-left: 18px; }`,
    `.chat-name { display: inline-block; transform: rotate(-3deg); }`,
  ],
  lavalamp: ({ card }) => [
    hideShapeLayer(card),
    `${card} { border-radius: 40% 60% 55% 45% / 55% 45% 55% 45% !important; background: rgba(251,146,60,.17) !important; padding-left: 16px !important; padding-right: 16px !important; }`,
  ],
  vaporwave: ({ card }) => [
    `${card} { border: 1px solid #67e8f9 !important; border-radius: 0 !important; box-shadow: 4px 4px 0 #f0abfc !important; }`,
    `.chat-name { letter-spacing: .3em; text-transform: uppercase; font-size: .78em; }`,
  ],
  chrome: ({ card }) => [
    `${card} { background: linear-gradient(180deg, #52525b, #27272a 50%, #18181b) !important; border: 1px solid #a1a1aa !important; border-radius: 6px !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.35) !important; }`,
    `.chat-name { background: linear-gradient(180deg, #ffffff, #a1a1aa) !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important; border: none !important; }`,
  ],
  neonwaves: ({ card }) => [
    `${card} { border-radius: 0 !important; border: none !important; border-bottom: 2px solid transparent !important; background: linear-gradient(#020617, #020617) padding-box, linear-gradient(90deg, #22d3ee, #e879f9) border-box !important; }`,
  ],
  music: ({ card }) => [
    hideShapeLayer(card),
    `${card} { border-left: 4px solid transparent !important; border-image: linear-gradient(180deg, #22d3ee, #a78bfa, #f472b6) 1 !important; }`,
    `.chat-name { letter-spacing: .04em; }`,
  ],
  comic: ({ card }) => [
    `${card} { rotate: -.5deg; }`,
    `${card}:nth-child(even) { rotate: .5deg; }`,
    `.chat-name { -webkit-text-stroke: .5px #111111; letter-spacing: .03em; }`,
  ],
  // --- Nature ------------------------------------------------------------------------------------------------------
  ocean: ({ card }) => [
    hideShapeLayer(card),
    `${card} { border-radius: 4px 20px 4px 20px !important; background: linear-gradient(180deg, rgba(125,211,252,.18), rgba(14,116,144,.28)) !important; }`,
    `.chat-text { color: #e0f2fe !important; }`,
  ],
  forest: ({ card }) => [
    `${card} { border-left: 3px solid #65a30d !important; background: linear-gradient(90deg, rgba(101,163,13,.16), transparent) !important; }`,
    `.chat-name { font-variant: small-caps; }`,
  ],
  space: ({ card }) => [
    `${card} { background: rgba(15,23,42,.55) !important; border: 1px solid rgba(196,181,253,.28) !important; border-radius: 999px !important; padding-left: 14px !important; padding-right: 14px !important; }`,
    `.chat-name { letter-spacing: .15em; text-transform: uppercase; font-size: .8em; }`,
  ],
  sunset: ({ card }) => [
    `${card} { background: linear-gradient(90deg, rgba(251,146,60,.26), rgba(236,72,153,.12)) !important; border-radius: 12px 12px 12px 0 !important; }`,
  ],
  sakura: ({ card }) => [
    `${card} { border-radius: 0 20px 0 20px !important; border: 1px solid rgba(251,207,232,.38) !important; }`,
  ],
  desert: ({ card }) => [
    `${card} { background: rgba(252,211,77,.1) !important; border-top: 1px solid rgba(252,211,77,.42) !important; border-radius: 0 !important; }`,
    `.chat-name { letter-spacing: .14em; text-transform: uppercase; font-size: .8em; }`,
  ],
  volcano: ({ card }) => [
    hideShapeLayer(card),
    `${card} { background: linear-gradient(0deg, rgba(239,68,68,.32), rgba(0,0,0,.22)) !important; border-bottom: 2px solid #f97316 !important; box-shadow: 0 4px 12px -4px #ef4444 !important; }`,
    `.chat-name { text-shadow: 0 0 6px #f97316 !important; }`,
  ],
  jungle: ({ card }) => [
    hideShapeLayer(card),
    `${card} { border-radius: 20px 4px 20px 4px !important; background: rgba(34,197,94,.15) !important; }`,
    `.chat-name { font-weight: 800 !important; }`,
  ],
  // --- Seasons -----------------------------------------------------------------------------------------------------
  winter: ({ card }) => [
    `${card} { background: linear-gradient(180deg, rgba(224,242,254,.15), rgba(186,230,253,.05)) !important; border: 1px solid rgba(224,242,254,.38) !important; border-radius: 10px !important; box-shadow: inset 0 2px 0 rgba(255,255,255,.35) !important; }`,
    `.chat-name { text-shadow: 0 0 6px #bae6fd !important; }`,
  ],
  christmas: ({ card }) => [
    paintedBorder(card, "#2a0a0a", "repeating-linear-gradient(45deg, #ef4444 0 6px, #ffffff 6px 12px, #22c55e 12px 18px, #ffffff 18px 24px)", 3, 10),
  ],
  halloween: ({ card }) => [
    hideShapeLayer(card),
    `${card} { border: 2px solid #f97316 !important; border-radius: 22px 22px 10px 10px / 30px 30px 10px 10px !important; }`,
    `.chat-name { text-shadow: 0 0 8px #f97316 !important; }`,
  ],
  valentine: ({ card }) => [
    `${card} { border-radius: 18px !important; border: 1px solid rgba(251,113,133,.5) !important; box-shadow: 0 0 12px rgba(251,113,133,.35) !important; }`,
    `.chat-name { font-style: italic; }`,
  ],
  autumn: ({ card }) => [
    hideShapeLayer(card),
    `${card} { border-radius: 2px 18px 2px 18px !important; background: linear-gradient(90deg, rgba(234,88,12,.22), rgba(202,138,4,.08)) !important; }`,
  ],
  newyear: ({ card }) => [
    `${card} { border: 1px solid rgba(253,230,138,.5) !important; background: linear-gradient(90deg, rgba(253,230,138,.13), transparent) !important; border-radius: 4px !important; }`,
    `.chat-text { letter-spacing: .03em; }`,
  ],
  easter: ({ card }) => [
    `${card} { border: 2px dotted #c4b5fd !important; border-radius: 26px 26px 18px 18px !important; }`,
  ],
  summer: ({ card }) => [
    hideShapeLayer(card),
    `${card} { background: linear-gradient(90deg, rgba(253,224,71,.22), rgba(14,165,233,.12)) !important; border-radius: 16px !important; border-bottom: 3px solid #0ea5e9 !important; }`,
  ],
  spring: ({ card }) => [
    `${card} { border-radius: 20px 20px 20px 4px !important; border: 1px solid rgba(134,239,172,.42) !important; }`,
  ],
  carnival: ({ card }) => [
    hideShapeLayer(card),
    `${card} { background: repeating-conic-gradient(rgba(253,224,71,.15) 0 25%, rgba(236,72,153,.15) 0 50%) 0 0 / 18px 18px !important; rotate: -.8deg; }`,
    `${card}:nth-child(even) { rotate: .8deg; }`,
  ],
} satisfies Record<string, Skin>;

export type ChatSkinId = "none" | keyof typeof SKINS;

export const CHAT_SKIN_IDS: readonly ChatSkinId[] = ["none", ...(Object.keys(SKINS) as (keyof typeof SKINS)[])];

/** The skin's rules for a renderer (`panel` and `row` are its selectors); event rows keep their own look. */
export function getChatSkinCss(config: CameraChatConfig, panel: string, row: string): string {
  if (config.skin === "none") return "";
  const rules = SKINS[config.skin]({ panel, card: `${row}:not(.chat-event)`, config });
  rules.push(`@media (prefers-reduced-motion: reduce) { ${panel}, .chat-mark, .chat-text::after { animation: none !important; } }`);
  return rules.join("\n");
}
