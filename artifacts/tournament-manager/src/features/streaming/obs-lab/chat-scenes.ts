/**
 * Theme scenes: an animated picture behind the messages. Waves at the surface, fish and seaweed in a sea that gets
 * darker the deeper it goes; pine trees under the moon; comets and a ship passing in space; a real sunset over the sea;
 * maple, oak and birch leaves; fireworks; falling Easter eggs; a café awning and a steaming cup; turning gears and
 * steam; a dragon's fire from off-screen and a dragon far away; an animated aurora; and more.
 *
 * Shared by the React preview, the OBS page and the native StreamElements widget. A scene's markup is fixed: it is built
 * only from constants in this file (never from anything the streamer or a viewer types), sits behind the message list
 * and takes no clicks. Messages blur what is behind them a little, so the picture never fights with the text.
 */
import type { CameraChatConfig } from "./camera-chat-settings";

type Style = Record<string, string | number>;
type Scene = { html: string; css: string[] };

// --- Small helpers ------------------------------------------------------------------------------------------------

/** Small deterministic generator (mulberry32): the same scene in every renderer and on every reload. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (value: number) => Math.round(value * 10) / 10;

const styleText = (style: Style) =>
  Object.entries(style)
    .map(([key, value]) => `${key.startsWith("--") ? key : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value}`)
    .join("; ");

/** An absolutely placed piece of the scene. */
const item = (name: string, style: Style, inner = "") =>
  `<span class="cs${name ? ` cs-${name}` : ""}" style="${styleText(style)}">${inner}</span>`;

const svg = (viewBox: string, body: string, fit = "xMidYMid meet", style = "") =>
  `<svg viewBox="${viewBox}" preserveAspectRatio="${fit}"${style ? ` style="${style}"` : ""}>${body}</svg>`;

/** A smooth, irregular line repeating every 600 units, drawn twice (0..1200) so it can scroll without a seam. */
function periodicCurve(seed: number, crests: number, low: number, high: number): string {
  const random = seeded(seed);
  const count = crests * 2;
  const step = 600 / count;
  const base = Array.from({ length: count }, (_, index): [number, number] => {
    const x = index === 0 ? 0 : step * index + (random() - 0.5) * step * 0.6;
    const crest = index % 2 === 0;
    const y = crest ? low + random() * (high - low) * 0.3 : low + (high - low) * (0.62 + random() * 0.38);
    return [x, y];
  });
  const at = (k: number): [number, number] => {
    const wrap = Math.floor(k / count);
    const [x, y] = base[((k % count) + count) % count]!;
    return [x + wrap * 600, y];
  };
  let path = `M0,${r1(at(0)[1])}`;
  for (let k = 0; k < count * 2; k += 1) {
    const [p0, p1, p2, p3] = [at(k - 1), at(k), at(k + 1), at(k + 2)];
    path += ` C${r1(p1[0] + (p2[0] - p0[0]) / 6)},${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)},${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])},${r1(p2[1])}`;
  }
  return path;
}

type WaveOptions = {
  seed: number;
  crests: number;
  height: number;
  color: string;
  foam?: string;
  duration: number;
  back?: boolean;
  bob: number;
  /** true: filled above the line (the surface seen from below); false: filled below it (the sea). */
  top: boolean;
  offset?: number;
  /** Where a sea wave sits (its top edge), instead of resting on the bottom. */
  at?: string;
};

/** A wave band that scrolls, swells and bobs at its own pace; two or three of them never line up. */
function waveLayer(options: WaveOptions): string {
  const curve = periodicCurve(options.seed, options.crests, 16, 84);
  const fill = `<path d="${curve}${options.top ? " L1200,0 L0,0 Z" : " L1200,100 L0,100 Z"}" fill="${options.color}"/>`;
  const foam = options.foam ? `<path d="${curve}" fill="none" stroke="${options.foam}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>` : "";
  const edge: Style = options.at ? { top: options.at } : options.top ? { top: `${options.offset ?? 0}px` } : { bottom: `${options.offset ?? 0}px` };
  const swell = `transform-origin: 50% ${options.top ? "0" : "100%"}; animation: cs-swell ${r1(options.bob * 1.4)}s ease-in-out infinite alternate`;
  return item("", { left: 0, width: "100%", height: `${options.height}px`, ...edge, animation: `cs-bob ${options.bob}s ease-in-out infinite alternate` },
    item("", { left: 0, top: 0, width: "200%", height: "100%", animation: `${options.back ? "cs-drift-back" : "cs-drift"} ${options.duration}s linear infinite` },
      svg("0 0 1200 100", fill + foam, "none", swell)));
}

type FallOptions = {
  seed: number;
  count: number;
  shapes: string[];
  viewBox: string;
  size: [number, number];
  duration: [number, number];
  spin: "flutter" | "tumble" | "rock";
  rise?: boolean;
  opacity?: number;
};

/** Things that fall (leaves, eggs, candy) or rise (ice, motes), each swaying and turning at its own pace. */
function fallers(options: FallOptions): string {
  const random = seeded(options.seed);
  const between = ([min, max]: [number, number]) => min + (max - min) * random();
  return Array.from({ length: options.count }, (_, index) => {
    const size = Math.round(between(options.size));
    const time = r1(between(options.duration));
    const swayTime = r1(2.6 + random() * 2.4);
    const spinTime = r1(options.spin === "flutter" ? 2.4 + random() * 2.6 : 6 + random() * 6);
    const spin = options.spin === "flutter" ? "cs-flutter" : options.spin === "tumble" ? (index % 2 ? "cs-spin" : "cs-spin-back") : "cs-rock";
    const motion = options.rise ? "cs-rise" : "cs-fall";
    return item("", {
      left: `${r1(random() * 92)}%`,
      top: options.rise ? "104%" : "-12%",
      width: `${size}px`,
      height: `${size}px`,
      opacity: options.opacity ?? 1,
      animation: `${motion} ${time}s linear ${-r1(random() * time)}s infinite`,
    }, item("", { inset: 0, animation: `cs-sway ${swayTime}s ease-in-out ${-r1(random() * swayTime)}s infinite alternate` },
      svg(options.viewBox, options.shapes[index % options.shapes.length]!, "xMidYMid meet",
        `animation: ${spin} ${spinTime}s ${options.spin === "rock" ? "ease-in-out" : "linear"} ${-r1(random() * spinTime)}s infinite${options.spin === "rock" ? " alternate" : ""}`)));
  }).join("");
}

type CrossOptions = {
  name: string;
  body: string;
  viewBox: string;
  width: number;
  height: number;
  top: string;
  duration: number;
  delay: number;
  /** Share of the cycle spent crossing; the rest of the time it is off-screen. */
  share?: number;
  back?: boolean;
  bob?: number;
  opacity?: number;
  bodyStyle?: string;
};

/** Something crossing the panel now and then (fish, a ship, a dragon, birds, a race car). */
function crosser(options: CrossOptions): Scene {
  const share = Math.round((options.share ?? 1) * 1000) / 10;
  const start = `-${options.width + 12}px`;
  const end = "calc(100% + 12px)";
  const [from, to] = options.back ? [end, start] : [start, end];
  const keyframes = `@keyframes cs-${options.name} { 0% { left: ${from}; } ${share}% { left: ${to}; } 100% { left: ${to}; } }`;
  const inner = svg(options.viewBox, options.body, "xMidYMid meet", options.bodyStyle ?? "");
  const flipped = options.back ? item("", { inset: 0, transform: "scaleX(-1)" }, inner) : inner;
  const bobbing = options.bob ? item("", { inset: 0, animation: `cs-bob ${options.bob}s ease-in-out infinite alternate` }, flipped) : flipped;
  return {
    html: item("", {
      left: start,
      top: options.top,
      width: `${options.width}px`,
      height: `${options.height}px`,
      opacity: options.opacity ?? 1,
      animation: `cs-${options.name} ${options.duration}s linear ${options.delay}s infinite`,
    }, bobbing),
    css: [keyframes],
  };
}

/** Small stars that only fade in and out a little (no pulsing size). */
function stars(seed: number, count: number, bottom: number, colors: string[]): string {
  const random = seeded(seed);
  return Array.from({ length: count }, (_, index) => {
    const size = r1(1 + random() * 1.8);
    const time = r1(4 + random() * 5);
    return item("star", {
      left: `${r1(random() * 98)}%`,
      top: `${r1(random() * bottom)}%`,
      width: `${size}px`,
      height: `${size}px`,
      background: colors[index % colors.length]!,
      animation: index % 3 === 0 ? `cs-twinkle ${time}s ease-in-out ${-r1(random() * time)}s infinite` : "none",
      opacity: index % 3 === 0 ? 1 : r1(0.45 + random() * 0.5),
    });
  }).join("");
}

/** A row of pine trees as one shape (three tiers and a trunk each). */
function pines(seed: number, count: number, minHeight: number, maxHeight: number, span = 1200, base = 120): string {
  const random = seeded(seed);
  let path = "";
  for (let index = 0; index < count; index += 1) {
    const x = (span / count) * (index + 0.5) + (random() - 0.5) * (span / count) * 0.8;
    const height = minHeight + random() * (maxHeight - minHeight);
    const width = height * (0.42 + random() * 0.14);
    const top = base - height;
    const tier = (t: number) => top + height * 0.9 * (t / 3);
    const half = (t: number) => (width / 2) * (0.55 + 0.45 * (t / 3));
    const right: string[] = [];
    const left: string[] = [];
    for (let t = 1; t <= 3; t += 1) {
      right.push(`${r1(x + half(t))},${r1(tier(t))}`);
      left.unshift(`${r1(x - half(t))},${r1(tier(t))}`);
      if (t < 3) {
        right.push(`${r1(x + half(t) * 0.45)},${r1(tier(t))}`);
        left.unshift(`${r1(x - half(t) * 0.45)},${r1(tier(t))}`);
      }
    }
    const trunk = Math.max(2, width * 0.05);
    path += `M${r1(x)},${r1(top)} L${right.join(" L")} L${r1(x + trunk)},${r1(tier(3))} L${r1(x + trunk)},${base} L${r1(x - trunk)},${base} L${r1(x - trunk)},${r1(tier(3))} L${left.join(" L")} Z `;
  }
  return path.trim();
}

/** Mountains with snow on the peaks. */
function mountains(seed: number, color: string, snow: string): string {
  const random = seeded(seed);
  const points: Array<[number, number]> = [[0, 70]];
  const peaks: Array<[number, number, number, number]> = [];
  let x = 0;
  while (x < 1200) {
    const peakX = x + 60 + random() * 90;
    const peakY = 8 + random() * 38;
    const valleyX = peakX + 60 + random() * 90;
    const valleyY = 58 + random() * 28;
    points.push([peakX, peakY], [valleyX, valleyY]);
    peaks.push([peakX, peakY, x, valleyX]);
    x = valleyX;
  }
  const outline = `M${points.map(([px, py]) => `${r1(px)},${r1(py)}`).join(" L")} L1200,100 L0,100 Z`;
  const caps = peaks.map(([px, py]) => {
    const drop = 12 + random() * 6;
    const spread = drop * 1.3;
    return `M${r1(px)},${r1(py)} L${r1(px + spread)},${r1(py + drop)} L${r1(px + spread * 0.4)},${r1(py + drop * 0.7)} L${r1(px)},${r1(py + drop)} L${r1(px - spread * 0.5)},${r1(py + drop * 0.75)} L${r1(px - spread)},${r1(py + drop)} Z`;
  }).join(" ");
  return `<path d="${outline}" fill="${color}"/><path d="${caps}" fill="${snow}"/>`;
}

/** A city skyline with lit windows; some of them flicker. */
function skyline(seed: number, color: string, lights: string[], flicker: boolean): string {
  const random = seeded(seed);
  let buildings = "";
  let windows = "";
  let x = 0;
  while (x < 1200) {
    const width = 34 + random() * 46;
    const height = 30 + random() * 62;
    const top = 100 - height;
    buildings += `<rect x="${r1(x)}" y="${r1(top)}" width="${r1(width)}" height="${r1(height)}" fill="${color}"/>`;
    if (random() < 0.3) buildings += `<rect x="${r1(x + width / 2 - 1)}" y="${r1(top - 10)}" width="2" height="10" fill="${color}"/>`;
    for (let wy = top + 5; wy < 96; wy += 7) {
      for (let wx = x + 5; wx < x + width - 6; wx += 8) {
        if (random() < 0.22) {
          const light = lights[Math.floor(random() * lights.length)]!;
          const blink = flicker && random() < 0.18 ? ` class="cs-win" style="animation-delay: ${-r1(random() * 6)}s"` : "";
          windows += `<rect x="${r1(wx)}" y="${r1(wy)}" width="3.5" height="3" fill="${light}"${blink}/>`;
        }
      }
    }
    x += width + 2 + random() * 6;
  }
  return buildings + windows;
}

/** A gear with teeth, round holes and an axle. */
function gear(teeth: number, color: string): string {
  const polar = (radius: number, angle: number) => `${r1(Math.cos(angle) * radius)},${r1(Math.sin(angle) * radius)}`;
  const step = (Math.PI * 2) / teeth;
  const outline: string[] = [];
  for (let index = 0; index < teeth; index += 1) {
    const angle = step * index;
    outline.push(polar(40, angle), polar(50, angle + step * 0.14), polar(50, angle + step * 0.44), polar(40, angle + step * 0.58));
  }
  const circle = (cx: number, cy: number, radius: number) =>
    `M${r1(cx + radius)},${r1(cy)} A${radius},${radius} 0 1 0 ${r1(cx - radius)},${r1(cy)} A${radius},${radius} 0 1 0 ${r1(cx + radius)},${r1(cy)} Z`;
  const holes = Array.from({ length: 5 }, (_, index) => {
    const angle = ((Math.PI * 2) / 5) * index;
    return circle(Math.cos(angle) * 25, Math.sin(angle) * 25, 7);
  }).join(" ");
  return `<path d="M${outline.join(" L")} Z ${holes} ${circle(0, 0, 8)}" fill="${color}" fill-rule="evenodd"/><circle r="34" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="3"/>`;
}

type Firework = { x: number; y: number; color: string; size: number; duration: number; delay: number };

/** A rocket goes up and bursts into sparks that fall a little and fade. */
function fireworks(list: Firework[]): Scene {
  const css: string[] = [
    ".cs-fw-burst b { position: absolute; left: 0; top: 0; width: 0; height: 0; }",
    ".cs-fw-burst i { position: absolute; left: -1px; top: -4px; width: 2px; height: 8px; border-radius: 2px; opacity: 0; }",
    ".cs-fw-rocket { width: 2px; height: 12px; margin-left: -1px; border-radius: 2px; background: linear-gradient(180deg, #fff7ed, rgba(253,186,116,0)); opacity: 0; }",
  ];
  const html = list.map((firework, index) => {
    const name = `cs-fw${index}`;
    const timing = `${firework.duration}s ease-out ${firework.delay}s infinite`;
    css.push(
      `@keyframes ${name}-up { 0% { top: 104%; opacity: 0; } 4% { opacity: 1; } 28% { top: ${firework.y}%; opacity: 1; } 30%, 100% { top: ${firework.y}%; opacity: 0; } }`,
      `@keyframes ${name}-fall { 0%, 30% { transform: translateY(0); } 90%, 100% { transform: translateY(16px); } }`,
      `@keyframes ${name}-spark { 0%, 29% { opacity: 0; transform: translateY(0) scale(1); } 32% { opacity: 1; } 62% { opacity: .9; transform: translateY(-${firework.size}px) scale(.9); } 84%, 100% { opacity: 0; transform: translateY(-${firework.size + 6}px) scale(.4); } }`,
      `@keyframes ${name}-flash { 0%, 29% { opacity: 0; transform: scale(.2); } 32% { opacity: .75; transform: scale(1); } 48%, 100% { opacity: 0; transform: scale(1.3); } }`,
      `.${name} i { background: ${firework.color}; box-shadow: 0 0 4px ${firework.color}; animation: ${name}-spark ${timing}; }`,
    );
    const sparks = Array.from({ length: 14 }, (_, spark) => `<b style="transform: rotate(${r1((360 / 14) * spark)}deg)"><i></i></b>`).join("");
    const flash = item("", { left: `-${firework.size}px`, top: `-${firework.size}px`, width: `${firework.size * 2}px`, height: `${firework.size * 2}px`, borderRadius: "50%", background: `radial-gradient(circle, ${firework.color} 0%, transparent 65%)`, opacity: 0, animation: `${name}-flash ${timing}` });
    return item("fw-rocket", { left: `${firework.x}%`, top: "104%", animation: `${name}-up ${timing}` })
      + `<span class="cs cs-fw-burst ${name}" style="left: ${firework.x}%; top: ${firework.y}%; animation: ${name}-fall ${timing}">${flash}${sparks}</span>`;
  }).join("");
  return { html, css };
}

// --- Shapes -------------------------------------------------------------------------------------------------------

const FISH = {
  plain: (color: string) => `<path d="M12,12 C18,3 34,3 42,12 C34,21 18,21 12,12 Z" fill="${color}"/><path d="M13,12 L3,4 L5,12 L3,20 Z" fill="${color}"/><path d="M24,6 C22,10 22,14 24,18" stroke="rgba(255,255,255,.45)" stroke-width="1.5" fill="none"/><circle cx="36" cy="10.5" r="1.6" fill="#0f172a"/>`,
  tall: (color: string) => `<path d="M10,16 C16,6 30,4 40,16 C30,28 16,26 10,16 Z" fill="${color}"/><path d="M20,8 L30,0 L31,9 Z M20,24 L30,32 L31,23 Z" fill="${color}"/><path d="M11,16 L3,9 L6,16 L3,23 Z" fill="${color}"/><path d="M22,8 V24 M28,6 V26" stroke="rgba(255,255,255,.5)" stroke-width="2"/><circle cx="35" cy="14" r="1.6" fill="#0f172a"/>`,
  school: (color: string) => [0, 1, 2].map((index) => `<g transform="translate(${index * 14},${[6, 0, 12][index]}) scale(.5)"><path d="M12,12 C18,3 34,3 42,12 C34,21 18,21 12,12 Z M13,12 L3,4 L5,12 L3,20 Z" fill="${color}"/></g>`).join(""),
};

const LEAF = {
  maple: (color: string) => `<path d="M12,1 L13.6,5.2 L16,4 L15.2,8.4 L19.6,6.6 L18.4,10 L22.6,10.6 L19,13.4 L20.2,15.2 L14.6,14.6 L15,18.2 L12.6,16.6 L12.6,23 L11.4,23 L11.4,16.6 L9,18.2 L9.4,14.6 L3.8,15.2 L5,13.4 L1.4,10.6 L5.6,10 L4.4,6.6 L8.8,8.4 L8,4 L10.4,5.2 Z" fill="${color}"/>`,
  oak: (color: string) => `<path d="M12,2 C14,3 13,5 15,6 C17,6 16,9 15,10 C17,10 18,12 16,14 C15,15 16,17 14,18 C13,19 13,21 12,22 C11,21 11,19 10,18 C8,17 9,15 8,14 C6,12 7,10 9,10 C8,9 7,6 9,6 C11,5 10,3 12,2 Z" fill="${color}"/><path d="M12,4 V22" stroke="rgba(0,0,0,.25)" stroke-width="1"/>`,
  birch: (color: string) => `<path d="M12,2 C18,7 18,16 12,21 C6,16 6,7 12,2 Z" fill="${color}"/><path d="M12,4 V23 M12,9 L9,7 M12,9 L15,7 M12,13 L8.5,11 M12,13 L15.5,11" stroke="rgba(0,0,0,.25)" stroke-width="1" fill="none"/>`,
  mint: (color: string) => `<path d="M3,13 C5,5 15,2 22,5 C21,14 13,21 4,19 C4,17 3,15 3,13 Z" fill="${color}"/><path d="M4,18 C9,13 14,9 21,6 M9,14 L8,10 M12,11.5 L11.5,7.5 M10,15 L14,15.5 M14,12 L18,12" stroke="rgba(255,255,255,.55)" stroke-width="1" fill="none"/>`,
};

const egg = (fill: string, deco: string) =>
  `<path d="M10,1 C16,1 19,11 19,16 C19,22 15,25 10,25 C5,25 1,22 1,16 C1,11 4,1 10,1 Z" fill="${fill}" stroke="rgba(76,29,149,.35)" stroke-width=".8"/>` + deco + `<path d="M6,6 C5,8 4.5,10 4.5,12" stroke="rgba(255,255,255,.6)" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
const EGGS = [
  egg("#f472b6", `<path d="M2.4,14 L5,11 L7.5,14 L10,11 L12.5,14 L15,11 L17.6,14" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>`),
  egg("#facc15", `<path d="M3.6,9 H16.4 M1.6,19 H18.4" stroke="#a78bfa" stroke-width="2"/>`),
  egg("#818cf8", [[7, 8], [13, 8], [5, 15], [10, 14], [15, 15], [8, 20], [12, 20]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="1.3" fill="#ffffff"/>`).join("")),
  egg("#4ade80", `<circle cx="10" cy="15" r="2" fill="#f472b6"/><circle cx="10" cy="11.6" r="1.5" fill="#ffffff"/><circle cx="10" cy="18.4" r="1.5" fill="#ffffff"/><circle cx="6.6" cy="15" r="1.5" fill="#ffffff"/><circle cx="13.4" cy="15" r="1.5" fill="#ffffff"/>`),
  egg("#38bdf8", `<path d="M2,12 Q6,9 10,12 T18,12 M1.4,17 Q6,14 10,17 T18.6,17" fill="none" stroke="#fef08a" stroke-width="1.6"/>`),
  egg("#fb923c", `<path d="M3,10 L17,10 M2,15 L18,15 M2.4,20 L17.6,20" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="2 1.5"/>`),
];

const CANDY = {
  wrapped: (color: string) => `<path d="M11,12 L2,5 L4,9 L1,12 L4,15 L2,19 Z M29,12 L38,5 L36,9 L39,12 L36,15 L38,19 Z" fill="${color}" opacity=".85"/><circle cx="20" cy="12" r="9" fill="${color}"/><path d="M13,8 L24,19 M17,4.5 L28,15.5 M12,13 L19,20" stroke="rgba(255,255,255,.55)" stroke-width="2"/><circle cx="16.5" cy="8.5" r="2" fill="rgba(255,255,255,.7)"/>`,
  lollipop: (color: string) => `<rect x="18.8" y="20" width="2.4" height="19" rx="1" fill="#f5f5f4"/><circle cx="20" cy="12" r="10.5" fill="${color}"/><path d="M20,12 m0,-1.5 a1.5,1.5 0 1 1 -1.5,1.5 a4,4 0 1 1 4,4 a6.5,6.5 0 1 1 -6.5,-6.5 a9,9 0 1 1 9,9" fill="none" stroke="#ffffff" stroke-width="1.6" opacity=".85"/>`,
  gumdrop: (color: string) => `<path d="M10,30 C10,16 15,10 20,10 C25,10 30,16 30,30 Z" fill="${color}"/><path d="M15,18 h1 M22,15 h1 M19,23 h1 M25,22 h1 M14,26 h1" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>`,
  stick: (color: string) => `<rect x="6" y="15" width="28" height="10" rx="5" fill="#ffffff"/><path d="M11,15 L15,25 M18,15 L22,25 M25,15 L29,25" stroke="${color}" stroke-width="3"/>`,
};

const seagull = (color: string) => `<path d="M1,7 Q6,1 12,6 Q18,1 23,7" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>`;
const cloud = (color: string) => `<path d="M12,28 C4,28 2,18 10,16 C10,8 22,4 28,12 C32,4 46,6 46,16 C54,16 56,28 48,28 Z" fill="${color}"/>`;

const DRAGON = (color: string, wing: string) =>
  `<path class="cs-dragon-wing2" d="M66,33 C66,22 72,12 82,6 C80,14 84,18 90,16 C88,22 92,26 96,25 C88,30 78,33 68,34 Z" fill="${wing}"/>`
  + `<path d="M2,40 L9,35 L7,42 Z M6,39 C20,34 30,42 44,38 C56,35 64,33 76,32 C84,31 90,28 96,24 L104,19 L108,20 L105,23 L112,24 L104,27 C98,31 92,35 84,37 C74,40 62,40 52,42 C38,45 22,46 6,39 Z M100,20 L98,13 L103,19 Z" fill="${color}"/>`
  + `<path d="M60,40 L58,48 L62,48 M72,38 L72,46 L76,46" stroke="${color}" stroke-width="2.5" fill="none"/>`
  + `<path class="cs-dragon-wing" d="M58,34 C56,20 62,9 74,2 C72,11 76,15 83,13 C81,20 85,24 90,22 C82,29 70,33 60,35 Z" fill="${color}"/>`;

const SHIP = `<path d="M-1,12 L-12,9 L-8,12 L-12,15 Z" fill="#fdba74" class="cs-flame"/><path d="M2,14 L14,8 L40,7 C50,7 58,10 58,12 C58,14 50,17 40,17 L14,16 Z" fill="#cbd5e1"/><path d="M38,8.6 C44,8.4 50,10 52.5,12 L40,12 Z" fill="#67e8f9"/><path d="M14,8 L8,1 L21,7 Z M14,16 L8,23 L21,17 Z" fill="#94a3b8"/><path d="M18,12 H34" stroke="#6366f1" stroke-width="1.6"/>`;

const CAR = `<path d="M2,7 H8 V12 H2 Z" fill="#111111"/><path d="M6,14 L14,13 L20,10 L32,9.5 L36,6.5 L42,6.5 L45,9.5 L56,11 L62,13.5 V15.5 H6 Z" fill="#dc2626"/><path d="M36,7 H41 L43,9.5 H35 Z" fill="#1f2937"/><path d="M22,12 H50" stroke="#ffffff" stroke-width="1.2"/><circle cx="16" cy="15.5" r="3.6" fill="#111111"/><circle cx="52" cy="15.5" r="3.6" fill="#111111"/>`;

const CHECKER_FLAG = `<rect x="0" y="0" width="2" height="34" fill="#d4d4d8"/>` + Array.from({ length: 24 }, (_, index) => {
  const column = index % 6;
  const row = Math.floor(index / 6);
  return `<rect x="${2 + column * 6}" y="${1 + row * 6}" width="6" height="6" fill="${(column + row) % 2 ? "#111111" : "#f5f5f5"}"/>`;
}).join("");

const SNOWFLAKE = `<g stroke="#f8fafc" stroke-width="1.6" stroke-linecap="round" fill="none">${Array.from({ length: 6 }, (_, index) => `<path d="M0,0 V-10 M0,-6 L-3,-8.5 M0,-6 L3,-8.5" transform="rotate(${index * 60})"/>`).join("")}</g>`;

const BAT = `<path d="M20,8 C18,4 16,4 15,7 C12,2 6,2 1,6 C5,7 7,10 6,13 C9,11 12,12 13,15 C15,12 17,12 20,14 C23,12 25,12 27,15 C28,12 31,11 34,13 C33,10 35,7 39,6 C34,2 28,2 25,7 C24,4 22,4 20,8 Z" fill="#0b0b0f"/>`;

const GHOST = `<path d="M4,46 L4,20 C4,8 12,2 20,2 C28,2 36,8 36,20 L36,46 L30,40 L24,46 L18,40 L12,46 L8,42 Z" fill="rgba(248,250,252,.9)"/><ellipse cx="14" cy="20" rx="3" ry="4" fill="#111827"/><ellipse cx="26" cy="20" rx="3" ry="4" fill="#111827"/><ellipse cx="20" cy="30" rx="3" ry="2.4" fill="#111827" opacity=".7"/>`;

const PUMPKIN = `<path d="M20,8 C17,2 22,0 24,2" stroke="#3f6212" stroke-width="3" fill="none"/><ellipse cx="12" cy="21" rx="10" ry="13" fill="#ea580c"/><ellipse cx="28" cy="21" rx="10" ry="13" fill="#ea580c"/><ellipse cx="20" cy="21" rx="10" ry="14" fill="#f97316"/><path class="cs-glowface" d="M12,16 L16,20 L10,21 Z M28,16 L24,20 L30,21 Z M12,26 L15,29 L18,26 L21,29 L24,26 L27,29 L28,25 C24,32 16,32 12,25 Z" fill="#fde047"/>`;

const heart = (color: string) =>
  `<path d="M10,17 C4,12 0,9 0,5 C0,2 2,0 5,0 C7,0 9,1 10,3 C11,1 13,0 15,0 C18,0 20,2 20,5 C20,9 16,12 10,17 Z" fill="${color}"/>`;

const blossom = (x: number, y: number, petal: string, center: string) =>
  [0, 72, 144, 216, 288].map((angle) => `<circle cx="${r1(x + Math.cos((angle * Math.PI) / 180) * 3.4)}" cy="${r1(y + Math.sin((angle * Math.PI) / 180) * 3.4)}" r="3" fill="${petal}"/>`).join("")
  + `<circle cx="${x}" cy="${y}" r="1.6" fill="${center}"/>`;

/** A flowering branch reaching in from a top corner. */
const branch = (bark: string, petal: string, center: string, side: "left" | "right") =>
  item("sway", { [side]: "-8px", top: "-6px", width: "150px", height: "100px", transformOrigin: side === "left" ? "0 0" : "100% 0", animation: "cs-swing 7s ease-in-out infinite alternate" },
    svg("0 0 150 100", `<g${side === "right" ? ' transform="translate(150,0) scale(-1,1)"' : ""}><path d="M0,10 C40,14 70,30 110,40 M50,22 C58,34 60,50 56,64 M86,34 C96,26 110,22 124,24" stroke="${bark}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      + [[30, 14], [62, 26], [96, 36], [112, 42], [58, 46], [56, 62], [118, 24], [80, 30], [40, 20], [128, 25]].map(([x, y]) => blossom(x!, y!, petal, center)).join("") + "</g>",
    side === "left" ? "xMinYMin meet" : "xMaxYMin meet"));

const BUTTERFLY = (color: string) =>
  `<g class="cs-wing-l"><path d="M13,10 C8,0 0,2 2,8 C3,12 8,12 13,10 Z M13,10 C8,12 3,18 6,19 C9,20 12,15 13,10 Z" fill="${color}"/></g>`
  + `<g class="cs-wing-r"><path d="M13,10 C18,0 26,2 24,8 C23,12 18,12 13,10 Z M13,10 C18,12 23,18 20,19 C17,20 14,15 13,10 Z" fill="${color}"/></g>`
  + `<path d="M13,5 L13,16" stroke="#1f2937" stroke-width="1.4" stroke-linecap="round"/>`;

const CACTUS = `<path d="M16,80 L16,10 C16,4 24,4 24,10 L24,80 Z M16,44 L9,44 C5,44 4,40 4,36 L4,22 C4,18 10,18 10,22 L10,36 L16,36 Z M24,36 L30,36 L30,18 C30,14 36,14 36,18 L36,34 C36,40 34,44 30,44 L24,44 Z" fill="#166534"/><path d="M20,8 V78" stroke="#14532d" stroke-width="1.2"/>`;

const MONSTERA = (color: string) =>
  `<path d="M50,108 L50,52" stroke="#14532d" stroke-width="3"/><path d="M50,52 C26,58 4,40 6,20 C8,6 24,2 38,10 C44,4 56,4 62,10 C76,2 92,6 94,20 C96,40 74,58 50,52 Z" fill="${color}"/>`
  + `<path d="M50,52 L50,12 M50,40 L22,26 M50,34 L30,12 M50,40 L78,26 M50,34 L70,12" stroke="rgba(0,0,0,.25)" stroke-width="2"/><path d="M14,30 L30,34 M86,30 L70,34 M20,14 L34,22 M80,14 L66,22" stroke="#052e16" stroke-width="3" stroke-linecap="round"/>`;

const PARROT = `<path d="M2,14 L14,12 L12,16 Z" fill="#2563eb"/><path d="M12,12 C16,6 26,6 30,10 C34,8 38,9 38,12 C35,13 33,14 30,15 C26,19 16,18 12,12 Z" fill="#dc2626"/><path class="cs-wing" d="M18,11 C20,2 28,0 30,4 C26,6 24,10 22,13 Z" fill="#facc15"/><path d="M33,10 L38,11 L35,13 Z" fill="#fde68a"/><circle cx="33" cy="10" r="1" fill="#111827"/>`;

const COMPASS = `<circle r="46" fill="none" stroke="#5b3a1a" stroke-width="1.4"/><circle r="40" fill="none" stroke="#5b3a1a" stroke-width=".6" stroke-dasharray="2 3"/><path d="M0,-28 L3,-3 L28,0 L3,3 L0,28 L-3,3 L-28,0 L-3,-3 Z" fill="none" stroke="#5b3a1a" stroke-width=".8" transform="rotate(45)"/><path d="M0,-44 L6,-6 L0,0 Z M0,44 L-6,6 L0,0 Z M44,0 L6,6 L0,0 Z M-44,0 L-6,-6 L0,0 Z" fill="#5b3a1a"/><path d="M0,-44 L-6,-6 L0,0 Z M0,44 L6,6 L0,0 Z M44,0 L6,-6 L0,0 Z M-44,0 L-6,6 L0,0 Z" fill="#c9a46a" stroke="#5b3a1a" stroke-width=".6"/>`;

const SHIP_SAIL = `<path d="M6,36 L54,36 L48,46 L12,46 Z" fill="#5b3a1a"/><path d="M28,6 V36 M30,10 V36" stroke="#5b3a1a" stroke-width="1.4"/><path d="M28,8 L28,34 L12,32 C16,22 18,14 28,8 Z" fill="#f5e6c8" stroke="#5b3a1a" stroke-width="1"/><path d="M30,12 L30,34 L46,32 C42,24 40,17 30,12 Z" fill="#f5e6c8" stroke="#5b3a1a" stroke-width="1"/><path d="M28,6 L28,1 L37,3 Z" fill="#1c1917"/>`;

const BAMBOO = `<rect x="5" y="0" width="6" height="300" fill="#4d7c0f"/>` + Array.from({ length: 8 }, (_, index) => {
  const y = 20 + index * 38;
  return `<rect x="4" y="${y}" width="8" height="2" fill="#365314"/>` + (index % 3 === 1 ? `<path d="M11,${y} c8,-4 12,0 16,4 c-6,0 -10,-1 -16,-4 z" fill="#65a30d"/>` : "");
}).join("");

const ROSE_WINDOW = `<circle r="47" fill="#1c1917"/>` + Array.from({ length: 12 }, (_, index) => {
  const angle = (index * Math.PI) / 6;
  return `<circle cx="${r1(Math.cos(angle) * 31)}" cy="${r1(Math.sin(angle) * 31)}" r="10" fill="${["#b91c1c", "#1d4ed8", "#ca8a04", "#7e22ce"][index % 4]}" opacity=".85"/>`;
}).join("") + `<circle r="14" fill="#ca8a04" opacity=".9"/><circle r="47" fill="none" stroke="#44403c" stroke-width="3"/>` + Array.from({ length: 12 }, (_, index) => `<path d="M0,0 L0,-46" stroke="#1c1917" stroke-width="2" transform="rotate(${index * 30 + 15})"/>`).join("") + `<circle r="14" fill="none" stroke="#1c1917" stroke-width="2"/>`;

const CASTLE = `<rect x="40" y="60" width="90" height="60" fill="#f9a8d4"/>`
  + [40, 56, 72, 90, 106, 122].map((x) => `<rect x="${x}" y="52" width="8" height="8" fill="#f9a8d4"/>`).join("")
  + `<rect x="18" y="48" width="24" height="72" fill="#f472b6"/><path d="M14,48 L30,14 L46,48 Z" fill="#a855f7"/><path class="cs-flag" d="M30,14 V4 L40,7 L30,10 Z" fill="#fde047"/>`
  + `<rect x="128" y="48" width="24" height="72" fill="#f472b6"/><path d="M124,48 L140,14 L156,48 Z" fill="#a855f7"/><path class="cs-flag" d="M140,14 V4 L150,7 L140,10 Z" fill="#fde047"/>`
  + `<rect x="72" y="30" width="26" height="40" fill="#f472b6"/><path d="M68,30 L85,0 L102,30 Z" fill="#a855f7"/><path d="M76,120 V96 C76,88 94,88 94,96 V120 Z" fill="#831843"/>`
  + [[26, 70], [134, 70], [80, 44], [56, 80], [110, 80]].map(([x, y]) => `<path d="M${x},${y! + 10} V${y! + 4} C${x},${y} ${x! + 6},${y} ${x! + 6},${y! + 4} V${y! + 10} Z" fill="#fde68a"/>`).join("");

const STAR4 = (color: string) =>
  `<path d="M0,-5.5 C.6,-1.4 1.4,-.6 5.5,0 C1.4,.6 .6,1.4 0,5.5 C-.6,1.4 -1.4,.6 -5.5,0 C-1.4,-.6 -.6,-1.4 0,-5.5 Z" fill="${color}"/>`;

const LAVENDER = `<path d="M11,200 C10,140 12,90 11,40" stroke="#4d7c0f" stroke-width="2" fill="none"/>` + Array.from({ length: 12 }, (_, index) =>
  `<ellipse cx="${index % 2 ? 13.5 : 8.5}" cy="${8 + index * 5.5}" rx="3" ry="4" fill="${index % 3 ? "#a78bfa" : "#c4b5fd"}"/>`).join("");

const KAWAII_FACE = (cx: number, cy: number, scale = 1) =>
  `<g transform="translate(${cx},${cy}) scale(${scale})"><circle cx="-5" cy="-1" r="1.6" fill="#1f2937"/><circle cx="5" cy="-1" r="1.6" fill="#1f2937"/><path d="M-2.5,2 Q0,4.5 2.5,2" stroke="#1f2937" stroke-width="1.2" fill="none" stroke-linecap="round"/><ellipse cx="-8" cy="2" rx="2.2" ry="1.3" fill="#f9a8d4"/><ellipse cx="8" cy="2" rx="2.2" ry="1.3" fill="#f9a8d4"/></g>`;

/** An original little pixel jelly with eyes and tentacles (11 x 8 cells). */
const PIXEL_ALIEN = (color: string) => {
  const rows = ["...XXXXX...", "..XXXXXXX..", ".XX.XXX.XX.", ".XXXXXXXXX.", ".XXX...XXX.", "..XXXXXXX..", ".X.X.X.X.X.", "X...X.X...X"];
  const cells = rows.flatMap((row, y) => Array.from(row).map((cell, x) => (cell === "X" ? `M${x},${y}h1v1h-1z` : ""))).join("");
  return `<path d="${cells}" fill="${color}"/>`;
};

// --- Scenes -------------------------------------------------------------------------------------------------------

const join = (...parts: Array<string | Scene>) => {
  const html: string[] = [];
  const css: string[] = [];
  for (const part of parts) {
    if (typeof part === "string") html.push(part);
    else { html.push(part.html); css.push(...part.css); }
  }
  return { html: html.join(""), css };
};

const SCENES = {
  ocean: (): Scene => {
    const fishes = [
      crosser({ name: "ocean-f1", body: FISH.plain("#fb923c"), viewBox: "0 0 48 24", width: 34, height: 17, top: "38%", duration: 21, delay: -4, bob: 3, opacity: 0.8, bodyStyle: "animation: cs-wiggle .9s ease-in-out infinite alternate" }),
      crosser({ name: "ocean-f2", body: FISH.tall("#facc15"), viewBox: "0 0 48 32", width: 30, height: 20, top: "56%", duration: 27, delay: -15, back: true, bob: 4, opacity: 0.7, bodyStyle: "animation: cs-wiggle 1.2s ease-in-out infinite alternate" }),
      crosser({ name: "ocean-f3", body: FISH.school("#7dd3fc"), viewBox: "0 0 50 30", width: 46, height: 26, top: "24%", duration: 33, delay: -22, bob: 5, opacity: 0.55 }),
      crosser({ name: "ocean-f4", body: FISH.plain("#a78bfa"), viewBox: "0 0 48 24", width: 22, height: 11, top: "70%", duration: 25, delay: -9, back: true, bob: 3, opacity: 0.55, bodyStyle: "animation: cs-wiggle .8s ease-in-out infinite alternate" }),
    ];
    const kelp = (left: string, height: number, time: number, color: string) => item("sway", { left, bottom: "-4px", width: `${height * 0.4}px`, height: `${height}px`, animation: `cs-swing ${time}s ease-in-out ${-time / 2}s infinite alternate` },
      svg("0 0 40 100", `<path d="M20,100 C8,78 30,62 18,42 C10,28 24,16 20,2" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M24,100 C34,84 16,70 28,54 C34,46 28,36 30,28" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`, "xMidYMax meet"));
    return join(
      item("", { inset: 0, background: "linear-gradient(180deg, rgba(125,211,252,.16) 0%, rgba(8,47,73,0) 26%, rgba(2,6,23,.45) 72%, rgba(2,6,23,.78) 100%)" }),
      ...[10, 33, 58, 80].map((left, index) => item("ocean-ray", { left: `${left}%`, top: "-2%", width: `${[40, 22, 48, 26][index]}px`, height: "70%", animation: `cs-ocean-ray ${[9, 12, 10, 14][index]}s ease-in-out ${-index * 2.5}s infinite alternate` })),
      waveLayer({ seed: 11, crests: 2, height: 30, color: "rgba(186,230,253,.26)", foam: "rgba(255,255,255,.35)", duration: 23, bob: 6.5, top: true }),
      waveLayer({ seed: 23, crests: 3, height: 20, color: "rgba(224,242,254,.40)", foam: "rgba(255,255,255,.65)", duration: 15, back: true, bob: 4.7, top: true }),
      ...fishes,
      item("", { left: "-4%", bottom: "-6px", width: "34%", height: "26px" }, svg("0 0 60 26", `<path d="M0,26 C4,10 20,6 34,12 C44,6 58,12 60,26 Z" fill="#0b1324"/>`, "none")),
      item("", { right: "-3%", bottom: "-4px", width: "28%", height: "20px" }, svg("0 0 60 26", `<path d="M0,26 C6,12 22,8 32,14 C46,8 56,16 60,26 Z" fill="#0b1324"/>`, "none")),
      kelp("6%", 74, 5.5, "rgba(34,197,94,.55)"),
      kelp("16%", 52, 6.8, "rgba(21,128,61,.6)"),
      kelp("82%", 66, 6.1, "rgba(34,197,94,.5)"),
      item("", { right: "18%", bottom: "-2px", width: "40px", height: "34px", opacity: 0.6 }, svg("0 0 60 50", `<path d="M30,50 L30,30 M30,36 L20,22 M30,32 L40,18 M20,22 L14,12 M20,22 L24,10 M40,18 L36,6 M40,18 L48,10" stroke="#fb7185" stroke-width="5" stroke-linecap="round" fill="none"/>`, "xMidYMax meet")),
    );
  },
  forest: (): Scene => join(
    stars(41, 22, 40, ["#f8fafc", "#fde68a", "#e0e7ff"]),
    item("", { right: "10%", top: "6%", width: "30px", height: "30px", borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, #fefce8, #fde68a 62%, #facc15)", boxShadow: "0 0 18px 6px rgba(254,240,138,.32)" }),
    item("", { left: 0, right: 0, bottom: 0, height: "120px", opacity: 0.6 }, svg("0 0 1200 120", `<path d="${pines(3, 18, 45, 80)}" fill="#14342a"/>`, "xMidYMax slice")),
    item("forest-fog", { left: "-20%", width: "140%", bottom: "54px", height: "40px", animation: "cs-forest-fog 18s ease-in-out infinite alternate" }),
    item("", { left: 0, right: 0, bottom: 0, height: "105px" }, svg("0 0 1200 120", `<path d="${pines(7, 12, 60, 104)}" fill="#0b2117"/>`, "xMidYMax slice")),
    item("", { left: 0, right: 0, bottom: 0, height: "86px" }, svg("0 0 1200 120", `<path d="${pines(13, 8, 78, 118)}" fill="#030b07"/><rect x="0" y="114" width="1200" height="6" fill="#030b07"/>`, "xMidYMax slice")),
    // Tall pines framing both sides, so the forest shows above a full chat too.
    item("", { left: "-34px", bottom: 0, width: "120px", height: "84%" }, svg("0 0 100 300", `<path d="${pines(5, 2, 230, 296, 100, 300)}" fill="#04110a"/>`, "xMinYMax meet")),
    item("", { right: "-30px", bottom: 0, width: "104px", height: "70%" }, svg("0 0 100 300", `<path d="${pines(8, 2, 200, 290, 100, 300)}" fill="#061a10"/>`, "xMaxYMax meet")),
  ),
  space: (): Scene => join(
    item("", { left: "-10%", top: "8%", width: "70%", height: "45%", background: "radial-gradient(ellipse, rgba(139,92,246,.30), transparent 70%)", filter: "blur(6px)" }),
    item("", { right: "-12%", top: "40%", width: "60%", height: "40%", background: "radial-gradient(ellipse, rgba(45,212,191,.18), transparent 70%)", filter: "blur(6px)" }),
    stars(97, 46, 100, ["#ffffff", "#e0e7ff", "#c4b5fd", "#fde68a"]),
    item("", { left: "-24px", top: "7%", width: "78px", height: "78px", borderRadius: "50%", background: "radial-gradient(circle at 34% 32%, #c4b5fd, #7c3aed 55%, #1e1b4b 100%)", boxShadow: "0 0 24px rgba(167,139,250,.35)" }),
    item("", { left: "-48px", top: "calc(7% + 30px)", width: "126px", height: "18px", borderRadius: "50%", border: "2px solid rgba(233,213,255,.55)", transform: "rotate(-14deg)" }),
    item("", { right: "16%", top: "18%", width: "14px", height: "14px", borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #fde68a, #ea580c 70%, #7c2d12)" }),
    ...[[78, 6, 11, 1], [92, 26, 15, 6], [60, 2, 18, 11]].map(([left, top, time, delay], index) => item("", { left: `${left}%`, top: `${top}%`, width: "1px", height: "1px", animation: `cs-space-comet ${time}s linear ${delay}s infinite` },
      item("space-comet", { left: 0, top: 0, width: `${[96, 70, 84][index]}px` }))),
    crosser({ name: "space-ship", body: SHIP, viewBox: "-12 0 72 24", width: 62, height: 21, top: "30%", duration: 26, delay: 3, share: 0.24, bob: 2.4, opacity: 0.9 }),
  ),
  sunset: (): Scene => join(
    item("", { left: 0, right: 0, top: "14%", height: "34%", background: "radial-gradient(ellipse at 50% 100%, rgba(251,146,60,.8), rgba(244,63,94,.34) 45%, transparent 72%)" }),
    item("sunset-sun", { left: "50%", top: "46%", width: "84px", height: "84px", animation: "cs-sunset-sink 40s ease-in-out infinite alternate" }),
    ...[[14, 26, 170, 52], [56, 32, 130, 64], [4, 39, 120, 70]].map(([left, top, width, time]) => item("sunset-cloud", { left: `${left}%`, top: `${top}%`, width: `${width}px`, height: "8px", animation: `cs-sunset-cloud ${time}s ease-in-out infinite alternate` })),
    item("", { left: 0, right: 0, top: "46%", bottom: 0, background: "linear-gradient(180deg, rgba(124,45,18,.9), rgba(76,29,149,.9) 22%, rgba(30,27,75,.96) 60%, rgba(15,23,42,.98))" }),
    item("", { left: 0, right: 0, top: "46%", height: "1px", background: "rgba(254,215,170,.85)" }),
    ...[70, 56, 46, 36, 28, 20, 14, 9].map((width, index) => item("sunset-glint", { left: "50%", top: `${47.5 + index * 3.2}%`, width: `${width}px`, height: "2px", animation: `cs-sunset-glint ${r1(1.8 + (index % 3) * 0.6)}s ease-in-out ${-index * 0.4}s infinite alternate` })),
    item("", { right: "-6px", top: "calc(46% - 46px)", width: "70px", height: "48px" }, svg("0 0 70 48", `<path d="M0,48 L0,30 C8,22 14,26 20,18 C26,10 34,14 40,20 C48,14 56,22 70,26 L70,48 Z" fill="#1e1035"/>`, "xMaxYMax meet")),
    crosser({ name: "sunset-b1", body: seagull("#1e1b4b"), viewBox: "0 0 24 10", width: 18, height: 8, top: "20%", duration: 34, delay: -6, bob: 3, bodyStyle: "animation: cs-flap .5s ease-in-out infinite alternate" }),
    crosser({ name: "sunset-b2", body: seagull("#1e1b4b"), viewBox: "0 0 24 10", width: 13, height: 6, top: "24%", duration: 34, delay: -8, bob: 2.6, bodyStyle: "animation: cs-flap .45s ease-in-out infinite alternate" }),
  ),
  autumn: (): Scene => join(
    item("sway", { left: "-6px", top: "-4px", width: "120px", height: "62px", transformOrigin: "0 0", animation: "cs-swing 6s ease-in-out infinite alternate" },
      svg("0 0 120 60", `<path d="M0,8 C30,12 60,6 90,18 M40,9 C48,20 52,28 50,36 M70,12 C74,4 82,2 92,0" stroke="#3f2a1d" stroke-width="3" fill="none" stroke-linecap="round"/><g transform="translate(44,30) scale(.75)">${LEAF.maple("#dc2626")}</g><g transform="translate(84,14) scale(.6) rotate(30 12 12)">${LEAF.oak("#d97706")}</g><g transform="translate(18,6) scale(.55) rotate(-20 12 12)">${LEAF.maple("#ea580c")}</g>`, "xMinYMin meet")),
    fallers({ seed: 5, count: 17, viewBox: "0 0 24 24", size: [18, 32], duration: [8, 14], spin: "flutter",
      shapes: [LEAF.maple("#dc2626"), LEAF.oak("#b45309"), LEAF.maple("#f59e0b"), LEAF.birch("#eab308"), LEAF.maple("#ea580c"), LEAF.oak("#92400e"), LEAF.birch("#ca8a04"), LEAF.maple("#b91c1c")] }),
    item("", { left: 0, right: 0, bottom: "-4px", height: "22px", opacity: 0.85 }, svg("0 0 200 22", [
      [8, 12, "#b45309", 20], [30, 10, "#dc2626", -30], [52, 13, "#eab308", 60], [80, 11, "#ea580c", 10], [112, 12, "#92400e", -50],
      [140, 10, "#f59e0b", 40], [166, 13, "#b91c1c", -10], [188, 11, "#ca8a04", 70],
    ].map(([x, y, color, angle]) => `<g transform="translate(${x},${y}) rotate(${angle}) scale(.5) translate(-12,-12)">${LEAF.maple(color as string)}</g>`).join(""), "xMidYMax slice")),
  ),
  newyear: (): Scene => join(
    stars(71, 14, 55, ["#ffffff", "#fde68a"]),
    fireworks([
      { x: 22, y: 22, color: "#fde68a", size: 30, duration: 5.2, delay: 0 },
      { x: 70, y: 16, color: "#f472b6", size: 36, duration: 6.1, delay: 1.4 },
      { x: 48, y: 34, color: "#67e8f9", size: 26, duration: 4.7, delay: 2.6 },
      { x: 84, y: 38, color: "#86efac", size: 24, duration: 5.6, delay: 3.5 },
      { x: 12, y: 44, color: "#ffffff", size: 22, duration: 6.4, delay: 4.4 },
    ]),
    item("", { left: 0, right: 0, bottom: 0, height: "70px", opacity: 0.95 }, svg("0 0 1200 100", skyline(19, "#0c0a09", ["#fde68a", "#fef3c7", "#fbbf24"], true), "xMidYMax slice")),
  ),
  easter: (): Scene => join(
    fallers({ seed: 9, count: 13, viewBox: "0 0 20 26", size: [24, 36], duration: [9, 15], spin: "rock", shapes: EGGS }),
    item("", { left: 0, right: 0, bottom: "-2px", height: "26px" }, svg("0 0 400 26", Array.from({ length: 80 }, (_, index) => {
      const x = index * 5;
      const height = 10 + ((index * 7) % 11);
      return `<path d="M${x},26 L${x + 2.5},${26 - height} L${x + 5},26 Z" fill="${index % 2 ? "#4ade80" : "#22c55e"}"/>`;
    }).join("") + [[40, "#f9a8d4"], [120, "#fde68a"], [205, "#a5b4fc"], [290, "#f9a8d4"], [360, "#fde68a"]].map(([x, color]) => `<circle cx="${x}" cy="12" r="3" fill="${color}"/><circle cx="${x}" cy="12" r="1.2" fill="#ffffff"/>`).join(""), "none")),
  ),
  summer: (): Scene => join(
    item("", { right: "6%", top: "5%", width: "54px", height: "54px", animation: "cs-spin 40s linear infinite" },
      svg("-30 -30 60 60", Array.from({ length: 12 }, (_, index) => `<line x1="0" y1="-17" x2="0" y2="-27" stroke="#fde047" stroke-width="3" stroke-linecap="round" transform="rotate(${index * 30})"/>`).join("") + `<circle r="14" fill="#fde047"/><circle r="10" fill="#fef9c3" opacity=".6"/>`)),
    ...[[8, 10, 60, 70], [40, 20, 44, 90]].map(([left, top, width, time]) => item("summer-cloud", { left: `${left}%`, top: `${top}%`, width: `${width}px`, height: `${width / 2}px`, animation: `cs-summer-cloud ${time}s ease-in-out infinite alternate` }, svg("0 0 60 30", cloud("rgba(255,255,255,.92)")))),
    crosser({ name: "summer-g1", body: seagull("#0f172a"), viewBox: "0 0 24 10", width: 18, height: 8, top: "22%", duration: 22, delay: -3, bob: 2, bodyStyle: "animation: cs-flap .4s ease-in-out infinite alternate" }),
    // The sea starts at the horizon, so the beach reads above a full chat too; sand at the very bottom.
    item("", { left: 0, right: 0, top: "34%", bottom: 0, background: "linear-gradient(180deg, #0891b2, #06b6d4 30%, #22d3ee 70%, #67e8f9)" }),
    item("", { left: 0, right: 0, top: "34%", height: "2px", background: "rgba(255,255,255,.6)" }),
    crosser({ name: "summer-boat", body: `<path d="M4,22 L36,22 L31,28 L9,28 Z" fill="#ffffff"/><path d="M19,21 L19,1 L33,20 Z" fill="#f97316"/><path d="M18,21 L18,5 L7,20 Z" fill="#fef3c7"/>`, viewBox: "0 0 40 30", width: 30, height: 23, top: "calc(34% - 19px)", duration: 70, delay: -20, bob: 2.2 }),
    waveLayer({ seed: 31, crests: 2, height: 16, color: "rgba(255,255,255,.22)", foam: "rgba(255,255,255,.75)", duration: 16, bob: 4.2, top: false, at: "calc(34% + 14px)" }),
    waveLayer({ seed: 37, crests: 3, height: 14, color: "rgba(255,255,255,.18)", foam: "rgba(255,255,255,.7)", duration: 11, back: true, bob: 3.4, top: false, at: "calc(34% + 44px)" }),
    item("", { left: 0, right: 0, bottom: 0, height: "26px", background: "linear-gradient(180deg, #fde68a, #fbbf24)" }),
    item("", { left: "-34px", bottom: "8px", width: "150px", height: "78%" }, svg("0 0 90 260", `<path d="M50,260 C46,200 42,120 54,40" stroke="#7c4a1e" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M43,236 h8 M42,206 h8 M42,176 h8 M43,146 h8 M45,116 h8 M47,86 h8 M50,62 h7" stroke="#5b3714" stroke-width="2.2"/><g class="cs-palm"><path d="M54,40 C42,26 24,24 6,34 C24,28 40,32 54,40 Z M54,40 C68,24 84,24 90,36 C78,30 64,32 54,40 Z M54,40 C48,20 36,10 22,10 C36,18 46,28 54,40 Z M54,40 C60,18 72,8 84,10 C72,18 62,28 54,40 Z M54,40 C40,40 26,52 22,66 C30,52 42,46 54,40 Z M54,40 C68,42 80,54 82,68 C76,54 66,46 54,40 Z" fill="#15803d"/><path d="M54,40 C44,30 30,28 16,32 M54,40 C64,30 76,28 86,32" stroke="#166534" stroke-width="1.2" fill="none"/><circle cx="52" cy="44" r="3.4" fill="#78350f"/><circle cx="58" cy="45" r="3.4" fill="#78350f"/></g>`, "xMinYMax meet")),
  ),
  fantasy: (): Scene => join(
    stars(53, 18, 100, ["#fde68a", "#e9d5ff"]),
    item("", { left: "50%", top: "30%", width: "250px", height: "250px", margin: "-125px 0 0 -125px", opacity: 0.38, animation: "cs-spin 80s linear infinite", filter: "drop-shadow(0 0 4px #fbbf24)" },
      svg("-50 -50 100 100", `<circle r="47" fill="none" stroke="#fbbf24" stroke-width="1.2"/><circle r="43" fill="none" stroke="#fbbf24" stroke-width=".7" stroke-dasharray="1.5 3"/><circle r="31" fill="none" stroke="#fbbf24" stroke-width="1"/>`
        + Array.from({ length: 12 }, (_, index) => `<path d="M0,-40 L2,-36 L0,-33 L-2,-36 Z" fill="#fde68a" transform="rotate(${index * 30})"/>`).join("")
        + Array.from({ length: 8 }, (_, index) => `<circle cx="0" cy="-31" r="2.4" fill="none" stroke="#fde68a" stroke-width=".8" transform="rotate(${index * 45})"/>`).join(""))),
    item("", { left: "50%", top: "30%", width: "160px", height: "160px", margin: "-80px 0 0 -80px", opacity: 0.45, animation: "cs-spin-back 50s linear infinite", filter: "drop-shadow(0 0 4px #a78bfa)" },
      svg("-50 -50 100 100", `<rect x="-34" y="-34" width="68" height="68" fill="none" stroke="#c4b5fd" stroke-width="1.4"/><rect x="-34" y="-34" width="68" height="68" fill="none" stroke="#c4b5fd" stroke-width="1.4" transform="rotate(45)"/><circle r="18" fill="none" stroke="#c4b5fd" stroke-width="1" stroke-dasharray="3 2"/><circle r="6" fill="#fde68a" opacity=".7"/>`)),
    item("", { right: "9%", top: "5%", width: "30px", height: "30px", borderRadius: "50%", boxShadow: "inset -8px 3px 0 0 #fef3c7", filter: "drop-shadow(0 0 6px rgba(254,243,199,.6))", transform: "rotate(-20deg)" }),
    ...[[18, 14, 6.5], [74, 40, 8.2], [30, 52, 7.4]].map(([left, top, time], index) => item("fantasy-orb", { left: `${left}%`, top: `${top}%`, width: `${[12, 9, 7][index]}px`, height: `${[12, 9, 7][index]}px`, animation: `cs-fantasy-float ${time}s ease-in-out ${-index * 2}s infinite alternate` })),
    fallers({ seed: 17, count: 16, viewBox: "0 0 10 10", size: [4, 8], duration: [7, 12], spin: "rock", rise: true, shapes: [`<circle cx="5" cy="5" r="4" fill="#fde68a"/>`, `<circle cx="5" cy="5" r="4" fill="#c4b5fd"/>`, `<circle cx="5" cy="5" r="4" fill="#f9a8d4"/>`] }),
  ),
  steampunk: (): Scene => {
    const brass = (teeth: number, color: string) => gear(teeth, color) + `<circle r="46" fill="none" stroke="rgba(255,236,179,.35)" stroke-width="1.5"/>`;
    return join(
      item("", { left: "-52px", top: "-52px", width: "150px", height: "150px", opacity: 0.78, animation: "cs-spin 24s linear infinite" }, svg("-52 -52 104 104", brass(14, "#c9a227"))),
      item("", { left: "74px", top: "8px", width: "78px", height: "78px", opacity: 0.74, animation: "cs-spin-back 13.7s linear infinite" }, svg("-52 -52 104 104", brass(8, "#b87333"))),
      item("", { left: "132px", top: "-14px", width: "48px", height: "48px", opacity: 0.7, animation: "cs-spin 8.2s linear infinite" }, svg("-52 -52 104 104", brass(6, "#d4a373"))),
      item("", { right: "18px", top: "34%", width: "96px", height: "96px", opacity: 0.55, animation: "cs-spin-back 20s linear infinite" }, svg("-52 -52 104 104", brass(11, "#a16207"))),
      item("steam-pipe", { right: "10px", top: 0, height: "48%", width: "13px" }),
      item("steam-valve", { right: "4px", top: "40%", width: "26px", height: "13px" }),
      ...[0, 1.2, 2.4].map((delay) => item("steam-puff", { right: "16px", top: "37%", width: "30px", height: "30px", animation: `cs-steam-puff 3.6s ease-out ${delay}s infinite` })),
      item("", { right: "30px", top: "8px", width: "46px", height: "46px", opacity: 0.85 }, svg("-20 -20 40 40", `<circle r="18" fill="#2a1a0e" stroke="#c9a227" stroke-width="3"/><circle r="13" fill="none" stroke="#e9b872" stroke-width="3" stroke-dasharray="1 4.1"/><path d="M-10,8 A13,13 0 0 1 -12,-4" stroke="#ef4444" stroke-width="2" fill="none"/><line class="cs-needle" x1="0" y1="3" x2="0" y2="-12" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round"/><circle r="2.4" fill="#c9a227"/>`)),
    );
  },
  dragon: (): Scene => {
    const blobs = [[0, 30, 34, "#fffbeb"], [9, 32, 46, "#fef08a"], [22, 34, 62, "#fde047"], [37, 34, 78, "#fb923c"], [53, 32, 90, "#f97316"], [68, 32, 100, "#dc2626"]] as const;
    const sparks = Array.from({ length: 9 }, (_, index) => item("dragon-spark", { left: `${10 + index * 7}%`, top: `${44 + ((index * 17) % 14) - 7}%`, animation: `cs-dragon-spark${index % 3} ${r1(0.5 + (index % 4) * 0.15)}s linear ${-r1(index * 0.11)}s infinite` }));
    return join(
      item("", { left: 0, right: 0, top: 0, height: "46%", background: "radial-gradient(ellipse at 62% 0%, rgba(251,146,60,.42), rgba(153,27,27,.22) 42%, transparent 72%)" }),
      crosser({ name: "dragon-far", body: DRAGON("#070101", "#1f0505"), viewBox: "0 0 120 64", width: 74, height: 40, top: "7%", duration: 30, delay: 2, share: 0.36, bob: 3, opacity: 0.85, bodyStyle: "filter: blur(.3px)" }),
      item("dragon-heat", { left: 0, top: "16%", width: "46%", height: "140px", animation: "cs-dragon-heat 11s ease-in-out 1s infinite" }),
      item("dragon-fire", { left: "-10px", top: "calc(16% + 24px)", width: "86%", height: "92px", opacity: 0, animation: "cs-dragon-breath 11s ease-out 1s infinite" },
        blobs.map(([left, width, height, color], index) => item("dragon-blob", {
          left: `${left}%`, top: `${(100 - height) / 2}%`, width: `${width}%`, height: `${height}%`,
          background: `radial-gradient(ellipse, ${color} 0%, ${index < 3 ? "#fb923c" : "#b91c1c"} 45%, ${index < 3 ? "rgba(234,88,12,.6)" : "rgba(127,29,29,.45)"} 62%, transparent 72%)`,
          animation: `cs-dragon-lick ${r1(0.16 + index * 0.04)}s ease-in-out ${-r1(index * 0.07)}s infinite alternate`,
        })).join("") + item("dragon-core", { left: 0, top: "40%", width: "58%", height: "20%" }) + sparks),
      ...[0, 1].map((index) => item("dragon-smoke", { left: `${44 + index * 16}%`, top: `calc(16% + ${30 + index * 14}px)`, width: "54px", height: "36px", opacity: 0, animation: `cs-dragon-smoke 11s ease-out ${r1(1.9 + index * 0.25)}s infinite` })),
    );
  },
  aurora: (): Scene => join(
    stars(29, 34, 70, ["#ffffff", "#ccfbf1", "#e0e7ff"]),
    ...[[0, 12, 0], [8, 15, -5], [16, 19, -9]].map(([top, time, delay], index) => item(`aurora-band${index}`, { left: "-30%", width: "160%", top: `${top}%`, height: "40%", animation: `cs-aurora-${index} ${time}s ease-in-out ${delay}s infinite alternate` })),
    item("", { left: 0, right: 0, bottom: 0, height: "80px" }, svg("0 0 1200 100", mountains(61, "#0b1220", "rgba(226,232,240,.75)"), "xMidYMax slice")),
  ),
  candy: (): Scene => join(
    // A string of wrapped sweets along the top and two big lollipops in the corners.
    item("", { left: 0, right: 0, top: "-2px", height: "34px" }, svg("0 0 400 34", `<path d="M0,6 Q100,22 200,8 T400,6" stroke="#fbcfe8" stroke-width="1.5" fill="none"/>`
      + [[22, 9, "#f472b6"], [70, 15, "#facc15"], [118, 16, "#38bdf8"], [166, 11, "#a855f7"], [214, 8, "#34d399"], [262, 10, "#fb923c"], [310, 9, "#f43f5e"], [358, 7, "#facc15"]].map(([x, y, color], index) => `<g transform="translate(${(x as number) - 12},${y}) scale(.6) rotate(${index % 2 ? 12 : -10} 20 12)">${CANDY.wrapped(color as string)}</g>`).join(""), "xMidYMin slice")),
    item("sway", { left: "-8px", top: "26px", width: "56px", height: "56px", transformOrigin: "50% 0", animation: "cs-swing 4.6s ease-in-out infinite alternate" }, svg("0 0 40 40", CANDY.lollipop("#ec4899"))),
    item("sway", { right: "-6px", top: "30px", width: "46px", height: "46px", transformOrigin: "50% 0", animation: "cs-swing 5.3s ease-in-out -2s infinite alternate" }, svg("0 0 40 40", CANDY.lollipop("#22d3ee"))),
    fallers({ seed: 77, count: 20, viewBox: "0 0 40 40", size: [30, 46], duration: [9, 15], spin: "tumble",
      shapes: [CANDY.wrapped("#f472b6"), CANDY.lollipop("#a855f7"), CANDY.gumdrop("#34d399"), CANDY.wrapped("#facc15"), CANDY.stick("#ef4444"), CANDY.wrapped("#38bdf8"), CANDY.lollipop("#fb923c"), CANDY.gumdrop("#f43f5e")] }),
  ),
  mint: (): Scene => join(
    item("sway", { right: "-10px", top: "-12px", width: "128px", height: "128px", transformOrigin: "80% 10%", animation: "cs-swing 5s ease-in-out infinite alternate" },
      svg("0 0 80 80", `<path d="M72,0 C66,20 56,38 40,56" stroke="#047857" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
        + [[58, 14, 200, 1.3], [44, 26, 150, 1.2], [56, 30, 250, 1.1], [38, 42, 140, 1], [48, 46, 230, 1.15], [32, 54, 180, .9]].map(([x, y, angle, scale]) => `<g transform="translate(${x},${y}) rotate(${angle}) scale(${scale}) translate(-12,-12)">${LEAF.mint(angle as number > 190 ? "#10b981" : "#059669")}</g>`).join(""), "xMaxYMin meet")),
    fallers({ seed: 33, count: 7, viewBox: "0 0 24 24", size: [20, 30], duration: [11, 16], spin: "flutter", shapes: [LEAF.mint("#10b981"), LEAF.mint("#34d399"), LEAF.mint("#059669")], opacity: 0.85 }),
    fallers({ seed: 47, count: 5, viewBox: "0 0 24 24", size: [16, 24], duration: [12, 18], spin: "rock", rise: true, opacity: 0.8,
      shapes: [`<rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(255,255,255,.5)" stroke="rgba(255,255,255,.9)" stroke-width="1.2"/><path d="M7,7 H12 M7,7 V12" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>`] }),
    fallers({ seed: 59, count: 9, viewBox: "0 0 10 10", size: [5, 9], duration: [6, 10], spin: "rock", rise: true, opacity: 0.75,
      shapes: [`<circle cx="5" cy="5" r="4" fill="none" stroke="#ffffff" stroke-width="1.2"/>`] }),
  ),
  coffee: (): Scene => join(
    item("coffee-awning", { left: 0, right: 0, top: 0, height: "20px" }),
    item("coffee-scallops", { left: 0, right: 0, top: "20px", height: "10px" }),
    item("coffee-board", { left: "10px", top: "40px", width: "58px", height: "50px" }, `<i></i><i></i><i></i><i></i>`),
    ...[[8, 70, 20], [22, 84, -30], [86, 52, 50], [74, 78, 10], [40, 88, 75], [92, 30, -15]].map(([left, top, angle]) => item("", { left: `${left}%`, top: `${top}%`, width: "16px", height: "11px", opacity: 0.4, transform: `rotate(${angle}deg)` },
      svg("0 0 20 14", `<ellipse cx="10" cy="7" rx="9" ry="6" fill="#4a2c17"/><path d="M3,6 C7,9 13,5 17,8" stroke="#1f1108" stroke-width="1.4" fill="none"/>`))),
    item("", { right: "10px", top: "40px", width: "62px", height: "62px", opacity: 0.95 }, svg("0 0 64 64", `<ellipse cx="32" cy="57" rx="27" ry="5" fill="#e7d3b8"/><path d="M52,34 C62,34 62,46 50,47" fill="none" stroke="#f5ebe0" stroke-width="4"/><path d="M12,30 L52,30 C52,46 44,56 32,56 C20,56 12,46 12,30 Z" fill="#f5ebe0"/><ellipse cx="32" cy="30" rx="20" ry="4.5" fill="#6f4e37"/><path d="M32,33 C29,30 27,29.5 27.5,28.5 C28,27.5 30.5,27.8 32,29.5 C33.5,27.8 36,27.5 36.5,28.5 C37,29.5 35,30 32,33 Z" fill="#e8d5b5"/>`)),
    ...[0, 1.2, 2.4].map((delay, index) => item("coffee-steam", { right: `${30 + index * 9}px`, top: "26px", width: "12px", height: "40px", animation: `cs-coffee-steam 3.6s ease-out ${delay}s infinite` },
      svg("0 0 12 40", `<path d="M6,40 C0,32 12,26 6,18 C1,12 10,6 6,0" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="2.4" stroke-linecap="round"/>`))),
  ),
  cyberpunk: (): Scene => join(
    item("", { left: 0, right: 0, top: "18%", height: "34%", background: "radial-gradient(ellipse at 50% 100%, rgba(255,42,109,.28), rgba(0,229,255,.12) 45%, transparent 72%)" }),
    // A far megacity on the horizon above the messages, with flying cars, and a near one at the bottom.
    item("", { left: 0, right: 0, top: "calc(52% - 120px)", height: "120px", opacity: 0.75 }, svg("0 0 1200 100", skyline(91, "#1a1530", ["#00e5ff", "#ff2a6d", "#fcee0a", "#c084fc"], true), "xMidYMax slice")),
    ...[[30, 9, 1, false], [38, 13, 5, true], [24, 17, 9, false]].map(([top, time, delay, back], index) => crosser({ name: `cyber-car${index}`, body: `<rect x="2" y="3" width="20" height="4" rx="2" fill="#111827"/><circle cx="21" cy="5" r="1.6" fill="${back ? "#ff2a6d" : "#ffffff"}"/><circle cx="3" cy="5" r="1.4" fill="${back ? "#ffffff" : "#ff2a6d"}"/><path d="M-14,5 H2" stroke="${back ? "rgba(255,42,109,.5)" : "rgba(0,229,255,.55)"}" stroke-width="1.6"/>`, viewBox: "-14 0 38 10", width: 38, height: 10, top: `${top}%`, duration: time as number, delay: delay as number, share: 0.45, back: back as boolean })),
    item("", { left: 0, right: 0, bottom: 0, height: "78px", opacity: 0.9 }, svg("0 0 1200 100", skyline(83, "#120f1f", ["#00e5ff", "#ff2a6d", "#fcee0a"], true), "xMidYMax slice")),
    ...[["left", "top"], ["right", "top"], ["left", "bottom"], ["right", "bottom"]].map(([x, y]) => item(`cyber-corner cs-cyber-${x}-${y}`, { [x as string]: "6px", [y as string]: "6px", width: "14px", height: "14px" })),
    item("cyber-label", { left: "26px", top: "8px" }, "NET//LINK 97%"),
    item("cyber-label", { right: "26px", bottom: "84px" }, "SEC.04 // REC"),
    item("cyber-barcode", { right: "26px", top: "9px", width: "46px", height: "9px" }),
    item("cyber-hazard", { left: "6px", bottom: "84px", width: "34px", height: "8px" }),
    ...[[18, 5.3, "rgba(0,229,255,.55)"], [47, 7.9, "rgba(255,42,109,.5)"], [71, 11.7, "rgba(252,238,10,.45)"]].map(([top, time, color], index) => item("cyber-glitch", { left: 0, right: 0, top: `${top}%`, height: `${[3, 7, 4][index]}px`, background: color as string, animation: `cs-cyber-glitch ${time}s steps(1) ${-index * 1.7}s infinite` })),
  ),
  racing: (): Scene => join(
    item("racing-asphalt", { inset: 0 }),
    item("racing-checker", { left: 0, right: 0, top: 0, height: "12px" }),
    item("racing-kerb", { left: 0, top: 0, bottom: 0, width: "8px" }),
    item("racing-kerb", { right: 0, top: 0, bottom: 0, width: "8px" }),
    ...[[18, 34, -8], [56, 46, 6], [30, 64, -4]].map(([left, top, angle]) => item("racing-skid", { left: `${left}%`, top: `${top}%`, width: "120px", height: "9px", transform: `rotate(${angle}deg)` })),
    ...Array.from({ length: 9 }, (_, index) => item("racing-speed", { top: `${10 + index * 10}%`, width: `${40 + (index * 37) % 70}px`, animation: `cs-racing-speed ${r1(0.7 + (index % 4) * 0.22)}s linear ${-r1(index * 0.31)}s infinite` })),
    item("", { right: "14px", top: "18px", width: "44px", height: "37px", opacity: 0.9 }, svg("0 0 40 34", CHECKER_FLAG, "xMidYMid meet", "transform-origin: 0 50%; animation: cs-racing-flag .9s ease-in-out infinite alternate")),
    item("racing-lights", { left: "18px", top: "20px", width: "66px", height: "15px" }, Array.from({ length: 5 }, (_, index) => `<i class="cs-light${index}"></i>`).join("")),
    crosser({ name: "racing-car", body: CAR + `<path d="M-30,10 H4 M-22,13.5 H4 M-36,7 H0" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>`, viewBox: "-36 0 100 20", width: 110, height: 22, top: "26%", duration: 7, delay: 1.5, share: 0.14, opacity: 0.95 }),
  ),
  newspaper: (): Scene => join(
    item("", { inset: 0, background: "repeating-linear-gradient(0deg, rgba(92,64,30,.035) 0 1px, transparent 1px 3px)" }),
    item("", { left: "8%", top: "18%", width: "110px", height: "110px", background: "radial-gradient(circle, transparent 0 57%, rgba(110,70,30,.20) 60% 64%, transparent 67%)" }),
    item("", { right: "6%", top: "52%", width: "120px", height: "90px", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(146,98,46,.16), rgba(146,98,46,.06) 55%, transparent 72%)" }),
    item("", { left: "30%", bottom: "6%", width: "80px", height: "60px", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(146,98,46,.12), transparent 70%)" }),
    ...Array.from({ length: 12 }, (_, index) => item("paper-fox", { left: `${(index * 37 + 11) % 96}%`, top: `${(index * 53 + 7) % 94}%`, width: `${2 + (index % 3)}px`, height: `${2 + (index % 3)}px` })),
    item("", { left: "calc(50% - 7px)", top: 0, bottom: 0, width: "14px", background: "linear-gradient(90deg, transparent, rgba(0,0,0,.07) 45%, rgba(255,255,255,.28) 50%, rgba(0,0,0,.05) 55%, transparent)" }),
    item("", { inset: 0, background: "radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(146,98,46,.22) 80%, rgba(110,70,30,.42) 100%)" }),
    item("", { inset: 0, boxShadow: "inset 0 0 34px rgba(92,64,30,.6), inset 0 0 8px rgba(70,46,20,.55)" }),
    item("paper-torn", { left: 0, right: 0, bottom: 0, height: "8px" }),
    item("paper-rule", { left: "8px", right: "8px", top: "6px", height: "6px" }),
  ),
  // --- Seasons ---------------------------------------------------------------------------------------------------
  winter: (): Scene => join(
    item("", { inset: 0, background: "radial-gradient(circle at 0 0, rgba(255,255,255,.35), transparent 22%), radial-gradient(circle at 100% 0, rgba(255,255,255,.3), transparent 20%)" }),
    item("", { left: 0, right: 0, top: "calc(50% - 110px)", height: "110px", opacity: 0.8 }, svg("0 0 1200 100", mountains(43, "#334155", "rgba(241,245,249,.85)"), "xMidYMax slice")),
    item("", { left: "-30px", bottom: 0, width: "112px", height: "76%" }, svg("0 0 100 300", `<path d="${pines(21, 2, 220, 292, 100, 300)}" fill="#1e3a5f"/><path d="${pines(21, 2, 220, 292, 100, 300)}" fill="none" stroke="#f8fafc" stroke-width="3" stroke-dasharray="14 22" opacity=".85"/>`, "xMinYMax meet")),
    item("", { right: "-26px", bottom: 0, width: "100px", height: "64%" }, svg("0 0 100 300", `<path d="${pines(29, 2, 200, 286, 100, 300)}" fill="#1e3a5f"/><path d="${pines(29, 2, 200, 286, 100, 300)}" fill="none" stroke="#f8fafc" stroke-width="3" stroke-dasharray="12 20" opacity=".85"/>`, "xMaxYMax meet")),
    fallers({ seed: 101, count: 12, viewBox: "-12 -12 24 24", size: [10, 20], duration: [10, 18], spin: "tumble", opacity: 0.9, shapes: [SNOWFLAKE] }),
  ),
  christmas: (): Scene => join(
    item("", { left: 0, right: 0, top: "-2px", height: "30px" }, svg("0 0 400 30", `<path d="M0,4 Q50,22 100,6 T200,6 T300,6 T400,4" stroke="#14532d" stroke-width="2" fill="none"/>`
      + Array.from({ length: 16 }, (_, index) => {
        const x = 12 + index * 25;
        const y = 6 + Math.abs(Math.sin((x / 100) * Math.PI)) * 12;
        return `<circle cx="${x}" cy="${r1(y + 5)}" r="4.2" fill="${["#ef4444", "#facc15", "#22c55e", "#38bdf8"][index % 4]}" class="cs-bulb" style="animation-delay: ${-r1((index % 4) * 0.4)}s"/>`;
      }).join(""), "xMidYMin slice")),
    item("", { right: "-8px", top: "18%", width: "110px", height: "58%" }, svg("0 0 100 160", `<path d="M50,6 L78,52 L64,52 L88,92 L70,92 L96,136 L4,136 L30,92 L12,92 L36,52 L22,52 Z" fill="#166534"/><rect x="43" y="136" width="14" height="18" fill="#78350f"/>`
      + [[42, 44, "#ef4444"], [58, 64, "#facc15"], [36, 80, "#38bdf8"], [64, 100, "#ef4444"], [30, 116, "#facc15"], [52, 120, "#a855f7"], [74, 126, "#38bdf8"], [48, 92, "#f472b6"]].map(([cx, cy, color], index) => `<circle cx="${cx}" cy="${cy}" r="4" fill="${color}" class="cs-bulb" style="animation-delay: ${-r1(index * 0.35)}s"/>`).join("")
      + `<path d="M50,0 L53,8 L61,8 L55,13 L57,21 L50,16 L43,21 L45,13 L39,8 L47,8 Z" fill="#fde047" class="cs-star-top"/>`, "xMaxYMin meet")),
    fallers({ seed: 103, count: 10, viewBox: "-12 -12 24 24", size: [8, 16], duration: [10, 16], spin: "tumble", opacity: 0.85, shapes: [SNOWFLAKE] }),
  ),
  halloween: (): Scene => join(
    item("", { right: "8%", top: "6%", width: "56px", height: "56px", borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, #fff7ed, #fdba74 60%, #ea580c)", boxShadow: "0 0 30px 10px rgba(251,146,60,.35)" }),
    item("", { left: "-2px", top: "-2px", width: "86px", height: "86px", opacity: 0.55 }, svg("0 0 80 80", `<path d="M0,0 L80,80 M0,0 L40,80 M0,0 L80,40 M0,0 L0,80 M0,0 L80,0" stroke="#e5e7eb" stroke-width=".8"/>` + [16, 32, 48, 64].map((r) => `<path d="M0,${r} Q${r * 0.35},${r * 0.62} ${r * 0.45},${r * 0.9} Q${r * 0.6},${r * 0.6} ${r * 0.9},${r * 0.45} Q${r * 0.62},${r * 0.35} ${r},0" stroke="#e5e7eb" stroke-width=".8" fill="none"/>`).join(""), "xMinYMin meet")),
    ...[[12, 13, 2, false], [22, 17, 7, true], [9, 21, 12, false]].map(([top, time, delay, back], index) => crosser({ name: `halloween-bat${index}`, body: BAT, viewBox: "0 0 40 20", width: [34, 26, 22][index]!, height: [17, 13, 11][index]!, top: `${top}%`, duration: time as number, delay: delay as number, share: 0.55, back: back as boolean, bob: 1.2, bodyStyle: "animation: cs-flap .25s ease-in-out infinite alternate" })),
    crosser({ name: "halloween-ghost", body: GHOST, viewBox: "0 0 40 48", width: 36, height: 43, top: "30%", duration: 24, delay: 4, share: 0.5, bob: 2, opacity: 0.75 }),
    item("forest-fog", { left: "-20%", width: "140%", top: "40%", height: "60px", animation: "cs-forest-fog 16s ease-in-out infinite alternate" }),
    ...[["left", "-6px", 54], ["right", "-4px", 44]].map(([side, offset, size]) => item("", { [side as string]: offset, top: "calc(50% - 30px)", width: `${size}px`, height: `${size}px` }, svg("0 0 40 36", PUMPKIN))),
  ),
  valentine: (): Scene => join(
    item("", { left: 0, right: 0, top: "-2px", height: "30px" }, svg("0 0 400 30", `<path d="M0,4 Q100,24 200,6 T400,4" stroke="#fda4af" stroke-width="1.5" fill="none"/>`
      + [20, 70, 120, 170, 220, 270, 320, 370].map((x, index) => `<g transform="translate(${x - 8},${r1(6 + Math.abs(Math.sin((x / 200) * Math.PI)) * 12)}) scale(.8)">${heart(["#f43f5e", "#fb7185", "#ec4899", "#fda4af"][index % 4]!)}</g>`).join(""), "xMidYMin slice")),
    fallers({ seed: 107, count: 9, viewBox: "0 0 24 34", size: [26, 40], duration: [12, 18], spin: "rock", rise: true, opacity: 0.85,
      shapes: ["#f43f5e", "#ec4899", "#fb7185"].map((color) => `<g transform="translate(2,0)">${heart(color)}</g><path d="M12,19 C10,24 14,28 12,34" stroke="#fecdd3" stroke-width="1" fill="none"/>`) }),
  ),
  spring: (): Scene => join(
    item("", { left: "-12%", top: "6%", width: "124%", height: "80%", borderRadius: "50%", border: "10px solid transparent", background: "conic-gradient(from 270deg, rgba(239,68,68,.25), rgba(250,204,21,.25), rgba(34,197,94,.25), rgba(59,130,246,.25), rgba(168,85,247,.25), transparent 50%) border-box", "-webkit-mask-image": "radial-gradient(closest-side, transparent 80%, #000 82%, #000 96%, transparent 98%)", maskImage: "radial-gradient(closest-side, transparent 80%, #000 82%, #000 96%, transparent 98%)", opacity: 0.8 }),
    branch("#5b3a1a", "#fbcfe8", "#ffffff", "right"),
    ...[[18, 20, 0], [52, 30, -3], [30, 44, -6]].map(([left, top, delay], index) => item(`spring-fly${index}`, { left: `${left}%`, top: `${top}%`, width: "26px", height: "20px", animation: `cs-spring-path${index} ${14 + index * 3}s ease-in-out ${delay}s infinite alternate` }, svg("0 0 26 20", BUTTERFLY(["#f472b6", "#facc15", "#60a5fa"][index]!)))),
  ),
  carnival: (): Scene => join(
    ...[0, 1].map((row) => item("sway", { left: "-4%", width: "108%", top: `${row * 18 - 2}px`, height: "34px", transformOrigin: "50% 0", animation: `cs-swing ${row ? 5.4 : 4.2}s ease-in-out ${-row * 2}s infinite alternate` }, svg("0 0 400 34", `<path d="M0,4 Q100,${row ? 18 : 22} 200,6 T400,4" stroke="#fde68a" stroke-width="1.5" fill="none"/>`
      + Array.from({ length: 12 }, (_, index) => {
        const x = 8 + index * 33 + row * 16;
        const y = 4 + Math.abs(Math.sin((x / 200) * Math.PI)) * (row ? 13 : 16);
        return `<path d="M${x},${r1(y)} L${x + 18},${r1(y)} L${x + 9},${r1(y + 16)} Z" fill="${["#ef4444", "#facc15", "#22c55e", "#3b82f6", "#a855f7", "#f97316"][(index + row * 3) % 6]}"/>`;
      }).join(""), "xMidYMin slice"))),
    fallers({ seed: 109, count: 8, viewBox: "0 0 24 40", size: [28, 42], duration: [11, 17], spin: "rock", rise: true,
      shapes: ["#ef4444", "#facc15", "#3b82f6", "#22c55e", "#a855f7"].map((color) => `<ellipse cx="12" cy="11" rx="10" ry="11" fill="${color}"/><path d="M10,22 L14,22 L12,25 Z" fill="${color}"/><path d="M12,25 C10,30 14,34 12,40" stroke="#e5e7eb" stroke-width="1" fill="none"/><ellipse cx="8.5" cy="7" rx="2.4" ry="3.4" fill="rgba(255,255,255,.55)"/>`) }),
  ),
  // --- Nature ----------------------------------------------------------------------------------------------------
  sakura: (): Scene => join(
    item("", { right: "12%", top: "8%", width: "60px", height: "60px", borderRadius: "50%", background: "#dc2626", opacity: 0.8 }),
    item("", { left: 0, right: 0, top: "calc(52% - 90px)", height: "90px", opacity: 0.35 }, svg("0 0 1200 100", mountains(53, "#f9a8d4", "#ffffff"), "xMidYMax slice")),
    branch("#3f2a1d", "#f9a8d4", "#fdf2f8", "left"),
    fallers({ seed: 113, count: 12, viewBox: "-6 -6 12 12", size: [10, 16], duration: [9, 15], spin: "flutter", shapes: [`<path d="M0,-5 C3,-5 5,-2 3,1 L0,5 L-3,1 C-5,-2 -3,-5 0,-5 Z" fill="#f9a8d4"/>`, `<path d="M0,-5 C3,-5 5,-2 3,1 L0,5 L-3,1 C-5,-2 -3,-5 0,-5 Z" fill="#fbcfe8"/>`] }),
  ),
  desert: (): Scene => join(
    item("", { left: "50%", top: "8%", width: "70px", height: "70px", marginLeft: "-35px", borderRadius: "50%", background: "radial-gradient(circle, #fffbeb, #fde68a 55%, rgba(251,191,36,0) 72%)" }),
    item("", { left: 0, right: 0, top: "40%", bottom: 0 }, svg("0 0 1200 100", `<path d="${periodicCurve(131, 2, 10, 40)} L1200,100 L0,100 Z" fill="#d97706" opacity=".55"/><path d="${periodicCurve(137, 3, 30, 60)} L1200,100 L0,100 Z" fill="#b45309" opacity=".7"/>`, "none")),
    item("desert-haze", { left: 0, right: 0, top: "34%", height: "40px", animation: "cs-desert-haze 3s ease-in-out infinite alternate" }),
    item("", { left: "-6px", top: "22%", width: "60px", height: "120px" }, svg("0 0 40 80", CACTUS, "xMinYMax meet")),
    item("", { right: "-4px", top: "30%", width: "44px", height: "88px" }, svg("0 0 40 80", CACTUS, "xMaxYMax meet")),
    item("desert-vultures", { left: "44%", top: "18%", width: "60px", height: "60px", animation: "cs-spin 14s linear infinite" }, item("", { left: 0, top: 0, width: "18px", height: "8px" }, svg("0 0 24 10", seagull("#1c1917")))),
    crosser({ name: "desert-weed", body: `<g class="cs-roll"><circle cx="15" cy="15" r="13" fill="none" stroke="#92400e" stroke-width="1.6"/><path d="M4,10 C12,18 20,4 27,14 M6,22 C14,8 22,26 26,18 M10,4 C14,14 8,22 18,27" stroke="#a16207" stroke-width="1.3" fill="none"/></g>`, viewBox: "0 0 30 30", width: 30, height: 30, top: "calc(40% - 6px)", duration: 16, delay: 3, share: 0.5 }),
  ),
  volcano: (): Scene => join(
    item("", { left: 0, right: 0, top: 0, height: "56%", background: "radial-gradient(ellipse at 50% 60%, rgba(239,68,68,.45), rgba(127,29,29,.2) 40%, transparent 70%)" }),
    ...[0, 1.4, 2.8, 4.2].map((delay, index) => item("volcano-smoke", { left: `calc(50% - ${30 + index * 4}px)`, top: "calc(26% - 40px)", width: `${60 + index * 8}px`, height: `${60 + index * 8}px`, animation: `cs-volcano-smoke 5.6s ease-out ${delay}s infinite` })),
    item("", { left: 0, right: 0, top: "16%", height: "40%" }, svg("0 0 200 100", `<path d="M0,100 L60,40 C70,30 80,28 88,26 L112,26 C120,28 130,30 140,40 L200,100 Z" fill="#1c0a05"/><path d="M88,26 L112,26 L108,22 L92,22 Z" fill="#f97316" class="cs-crater"/><path d="M96,26 C94,40 88,52 84,70 M104,26 C106,42 114,56 118,76" stroke="#f97316" stroke-width="2.4" fill="none" class="cs-lava"/>`, "xMidYMax meet")),
    ...[[-60, 0.2], [50, 1.1], [-30, 2], [70, 2.7], [10, 3.5]].map(([dx, delay], index) => item("", { left: "50%", top: "26%", width: "1px", height: "1px", animation: `cs-volcano-x${index} 2.4s linear ${delay}s infinite` }, item("volcano-bomb", { left: 0, top: 0, animation: `cs-volcano-y 2.4s cubic-bezier(.3,0,.7,1) ${delay}s infinite` }))),
  ),
  jungle: (): Scene => join(
    ...[[6, 66, 5.2], [24, 46, 6.4], [62, 56, 5.8], [84, 38, 6.9]].map(([left, height, time]) => item("sway", { left: `${left}%`, top: "-4px", width: "34px", height: `${height}%`, transformOrigin: "50% 0", animation: `cs-swing ${time}s ease-in-out ${-time / 3}s infinite alternate` }, svg("0 0 30 200", `<path d="M15,0 C10,40 20,80 14,120 C10,150 18,180 15,200" stroke="#3f6212" stroke-width="2.4" fill="none"/>` + Array.from({ length: 9 }, (_, index) => `<path d="M15,${14 + index * 21} c${index % 2 ? 10 : -10},-6 ${index % 2 ? 14 : -14},2 ${index % 2 ? 10 : -10},8 z" fill="${index % 3 ? "#4d7c0f" : "#65a30d"}"/>`).join(""), "xMidYMin meet"))),
    item("sway", { left: "-30px", top: "30%", width: "110px", height: "120px", transformOrigin: "0 50%", animation: "cs-swing 6s ease-in-out infinite alternate" }, svg("0 0 100 110", MONSTERA("#166534"))),
    item("sway", { right: "-34px", top: "12%", width: "110px", height: "120px", transformOrigin: "100% 50%", animation: "cs-swing 7s ease-in-out -3s infinite alternate" }, svg("0 0 100 110", MONSTERA("#15803d"), "xMidYMid meet", "transform: scaleX(-1)")),
    crosser({ name: "jungle-parrot", body: PARROT, viewBox: "0 0 40 24", width: 38, height: 23, top: "16%", duration: 18, delay: 2, share: 0.35, bob: 1.4 }),
  ),
  // --- Fantasy and adventure ---------------------------------------------------------------------------------------
  pirate: (): Scene => join(
    item("", { right: "6px", top: "6px", width: "70px", height: "70px", opacity: 0.55, animation: "cs-spin 120s linear infinite" }, svg("-50 -50 100 100", COMPASS)),
    item("", { left: 0, right: 0, top: "36%", height: "26px" }, svg("0 0 400 26", Array.from({ length: 3 }, (_, row) => `<path d="M${row * 8},${10 + row * 6}${" q5,-5 10,0 q5,5 10,0".repeat(20)}" stroke="#5b3a1a" stroke-width="1.1" fill="none" opacity="${0.75 - row * 0.2}"/>`).join(""), "none")),
    crosser({ name: "pirate-ship", body: SHIP_SAIL, viewBox: "0 0 60 50", width: 58, height: 48, top: "calc(36% - 38px)", duration: 46, delay: -12, bob: 2.6 }),
    item("", { left: "8%", top: "10%", width: "46%", height: "16%" }, svg("0 0 200 60", `<path d="M4,52 C40,20 80,58 120,30 C150,10 170,24 186,12" stroke="#7f1d1d" stroke-width="2" stroke-dasharray="6 5" fill="none"/><path d="M180,4 L194,18 M194,4 L180,18" stroke="#7f1d1d" stroke-width="3" stroke-linecap="round"/>`, "none")),
  ),
  samurai: (): Scene => join(
    item("", { left: "50%", top: "10%", width: "96px", height: "96px", marginLeft: "-48px", borderRadius: "50%", background: "#b91c1c", opacity: 0.85 }),
    item("", { left: 0, right: 0, top: "calc(50% - 80px)", height: "80px", opacity: 0.4 }, svg("0 0 1200 100", mountains(149, "#e5e7eb", "#ffffff"), "xMidYMax slice")),
    ...[["left", "-6px", 0], ["left", "18px", 1], ["right", "-4px", 2], ["right", "20px", 3]].map(([side, offset, index]) => item("sway", { [side as string]: offset, bottom: 0, width: "16px", height: `${[86, 72, 80, 64][index as number]}%`, animation: `cs-swing ${r1(5 + (index as number) * 0.7)}s ease-in-out ${-(index as number)}s infinite alternate` }, svg("0 0 16 300", BAMBOO, "xMidYMax slice"))),
    fallers({ seed: 151, count: 8, viewBox: "0 0 24 24", size: [12, 18], duration: [10, 16], spin: "flutter", shapes: [LEAF.maple("#dc2626"), LEAF.maple("#b91c1c")] }),
  ),
  horror: (): Scene => join(
    item("horror-flicker", { inset: 0 }),
    ...[[12, 34], [28, 22], [55, 44], [73, 28], [88, 38]].map(([left, length], index) => item("horror-drip", { left: `${left}%`, top: 0, width: "5px", height: `${length}px`, animation: `cs-horror-drip ${r1(5 + index * 1.3)}s ease-in ${-index}s infinite` })),
    ...[["left", "8px", "36%", 0], ["right", "14px", "22%", 3]].map(([side, offset, top, delay]) => item("horror-eyes", { [side as string]: offset, top: top as string, width: "22px", height: "6px", animation: `cs-horror-eyes 7s steps(1) ${delay}s infinite` }, "<i></i><i></i>")),
    item("forest-fog", { left: "-20%", width: "140%", top: "36%", height: "70px", animation: "cs-forest-fog 14s ease-in-out infinite alternate" }),
  ),
  western: (): Scene => join(
    item("", { left: 0, right: 0, top: "8%", height: "40%", background: "radial-gradient(ellipse at 50% 100%, rgba(251,146,60,.55), rgba(220,38,38,.2) 50%, transparent 75%)" }),
    item("", { left: 0, right: 0, top: "calc(46% - 70px)", height: "70px" }, svg("0 0 1200 100", `<path d="M0,100 L0,70 L60,70 L80,30 L210,30 L230,70 L380,70 L395,50 L470,50 L485,70 L700,70 L720,20 L900,20 L925,70 L1200,70 L1200,100 Z" fill="#7c2d12" opacity=".85"/>`, "xMidYMax slice")),
    item("", { left: "-8px", top: "26%", width: "56px", height: "112px" }, svg("0 0 40 80", CACTUS, "xMinYMax meet")),
    crosser({ name: "western-weed", body: `<g class="cs-roll"><circle cx="15" cy="15" r="13" fill="none" stroke="#78350f" stroke-width="1.6"/><path d="M4,10 C12,18 20,4 27,14 M6,22 C14,8 22,26 26,18 M10,4 C14,14 8,22 18,27" stroke="#92400e" stroke-width="1.3" fill="none"/></g>`, viewBox: "0 0 30 30", width: 32, height: 32, top: "calc(46% - 30px)", duration: 14, delay: 2, share: 0.55 }),
    item("desert-vultures", { left: "58%", top: "14%", width: "54px", height: "54px", animation: "cs-spin 16s linear infinite" }, item("", { left: 0, top: 0, width: "16px", height: "7px" }, svg("0 0 24 10", seagull("#1c1917")))),
  ),
  gothic: (): Scene => join(
    item("gothic-window", { left: "50%", top: "6%", width: "120px", height: "120px", marginLeft: "-60px", animation: "cs-glow 6s ease-in-out infinite alternate" }, svg("-50 -50 100 100", ROSE_WINDOW)),
    ...[["left", "14px"], ["right", "14px"]].map(([side, offset], index) => item("", { [side as string]: offset, top: "8%", width: "16px", height: "52px" }, svg("0 0 16 52", `<rect x="4" y="20" width="8" height="32" rx="1" fill="#e7e5e4"/><path class="cs-candle" style="animation-delay: ${-index * 0.13}s" d="M8,4 C11,9 12,13 8,18 C4,13 5,9 8,4 Z" fill="#fbbf24"/>`, "xMidYMax meet"))),
    crosser({ name: "gothic-bat", body: BAT, viewBox: "0 0 40 20", width: 26, height: 13, top: "30%", duration: 19, delay: 5, share: 0.4, bob: 1.2, bodyStyle: "animation: cs-flap .25s ease-in-out infinite alternate" }),
  ),
  princess: (): Scene => join(
    item("", { left: "50%", top: "4%", width: "170px", height: "120px", marginLeft: "-85px", opacity: 0.85 }, svg("0 0 170 120", CASTLE)),
    fallers({ seed: 157, count: 12, viewBox: "-6 -6 12 12", size: [8, 14], duration: [8, 13], spin: "tumble", opacity: 0.9, shapes: [STAR4("#fde68a"), STAR4("#fbcfe8"), STAR4("#ffffff")] }),
  ),
  // --- Cute -------------------------------------------------------------------------------------------------------
  unicorn: (): Scene => join(
    item("", { left: "-8%", top: "5%", width: "116%", height: "84%", borderRadius: "50%", background: "conic-gradient(from 270deg, #f87171, #fb923c, #facc15, #4ade80, #60a5fa, #a78bfa, transparent 50%)", "-webkit-mask-image": "radial-gradient(closest-side, transparent 74%, #000 76%, #000 97%, transparent 99%)", maskImage: "radial-gradient(closest-side, transparent 74%, #000 76%, #000 97%, transparent 99%)", opacity: 0.85 }),
    ...[[2, 26, 74, 50], [70, 18, 60, 60]].map(([left, top, width, time]) => item("summer-cloud", { left: `${left}%`, top: `${top}%`, width: `${width}px`, height: `${(width as number) / 2}px`, animation: `cs-summer-cloud ${time}s ease-in-out infinite alternate` }, svg("0 0 60 30", cloud("#ffffff")))),
    fallers({ seed: 163, count: 12, viewBox: "-6 -6 12 12", size: [8, 14], duration: [8, 13], spin: "tumble", shapes: [STAR4("#f0abfc"), STAR4("#fde68a"), STAR4("#a5f3fc")] }),
  ),
  cottoncandy: (): Scene => join(
    ...[[-6, 6, 120, 60, "#fbcfe8"], [52, 2, 100, 74, "#bae6fd"], [20, 22, 90, 66, "#f5d0fe"], [70, 30, 80, 58, "#fbcfe8"]].map(([left, top, width, time, color]) => item("summer-cloud", { left: `${left}%`, top: `${top}%`, width: `${width}px`, height: `${(width as number) / 2}px`, opacity: 0.85, animation: `cs-summer-cloud ${time}s ease-in-out infinite alternate` }, svg("0 0 60 30", cloud(color as string)))),
    fallers({ seed: 167, count: 10, viewBox: "-6 -6 12 12", size: [6, 11], duration: [8, 13], spin: "tumble", opacity: 0.8, shapes: [STAR4("#ffffff"), STAR4("#fbcfe8")] }),
  ),
  lilac: (): Scene => join(
    ...[["left", "-4px", 0], ["left", "16px", 1], ["right", "-2px", 2], ["right", "18px", 3]].map(([side, offset, index]) => item("sway", { [side as string]: offset, bottom: 0, width: "22px", height: `${[70, 56, 64, 50][index as number]}%`, animation: `cs-swing ${r1(4 + (index as number) * 0.6)}s ease-in-out ${-(index as number)}s infinite alternate` }, svg("0 0 22 200", LAVENDER, "xMidYMax slice"))),
    ...[[30, 22, 0], [62, 34, -4]].map(([left, top, delay], index) => item(`spring-fly${index}`, { left: `${left}%`, top: `${top}%`, width: "24px", height: "18px", animation: `cs-spring-path${index} ${15 + index * 3}s ease-in-out ${delay}s infinite alternate` }, svg("0 0 26 20", BUTTERFLY(["#d8b4fe", "#f0abfc"][index]!)))),
    ...[[18, 12, 18], [74, 8, 26], [46, 16, 14], [86, 26, 20]].map(([left, top, size], index) => item("lilac-bokeh", { left: `${left}%`, top: `${top}%`, width: `${size}px`, height: `${size}px`, animation: `cs-fantasy-float ${7 + index}s ease-in-out ${-index}s infinite alternate` })),
  ),
  kawaii: (): Scene => join(
    ...[[4, 8, 70, 54], [62, 4, 60, 64]].map(([left, top, width, time]) => item("summer-cloud", { left: `${left}%`, top: `${top}%`, width: `${width}px`, height: `${(width as number) / 2}px`, animation: `cs-summer-cloud ${time}s ease-in-out infinite alternate` }, svg("0 0 60 30", cloud("#ffffff") + KAWAII_FACE(30, 20)))),
    ...[[30, 26], [80, 30], [12, 36]].map(([left, top], index) => item("", { left: `${left}%`, top: `${top}%`, width: "26px", height: "26px", animation: `cs-fantasy-float ${6 + index}s ease-in-out ${-index}s infinite alternate` }, svg("-12 -12 24 24", `<path d="M0,-11 L3,-4 L11,-3.5 L5,1.5 L7,10 L0,5.5 L-7,10 L-5,1.5 L-11,-3.5 L-3,-4 Z" fill="#fde047" stroke="#f59e0b" stroke-width="1" stroke-linejoin="round"/>` + KAWAII_FACE(0, 0, 0.6)))),
  ),
  bubbles: (): Scene => join(
    fallers({ seed: 173, count: 9, viewBox: "0 0 40 40", size: [26, 54], duration: [12, 20], spin: "rock", rise: true, opacity: 0.85,
      shapes: [`<circle cx="20" cy="20" r="18" fill="rgba(186,230,253,.08)" stroke="rgba(255,255,255,.55)" stroke-width="1"/><path d="M8,14 A14,14 0 0 1 20,6" stroke="rgba(255,255,255,.85)" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M30,30 A14,14 0 0 1 22,34" stroke="rgba(244,114,182,.6)" stroke-width="1.6" fill="none"/>`] }),
  ),
  pastelgoth: (): Scene => join(
    item("", { right: "10%", top: "6%", width: "34px", height: "34px", borderRadius: "50%", boxShadow: "inset -9px 3px 0 0 #f9a8d4", transform: "rotate(-20deg)" }),
    stars(181, 16, 50, ["#f9a8d4", "#c4b5fd", "#ffffff"]),
    ...[[16, 15, 1, false], [28, 19, 8, true]].map(([top, time, delay, back], index) => crosser({ name: `pastelgoth-bat${index}`, body: BAT.split("#0b0b0f").join("#c4b5fd"), viewBox: "0 0 40 20", width: 28, height: 14, top: `${top}%`, duration: time as number, delay: delay as number, share: 0.5, back: back as boolean, bob: 1.3, bodyStyle: "animation: cs-flap .3s ease-in-out infinite alternate" })),
  ),
  y2k: (): Scene => join(
    ...[[12, 14, 30, 7], [70, 8, 22, 9], [48, 30, 16, 6], [84, 34, 26, 8]].map(([left, top, size, time], index) => item("y2k-blob", { left: `${left}%`, top: `${top}%`, width: `${size}px`, height: `${size}px`, animation: `cs-fantasy-float ${time}s ease-in-out ${-index}s infinite alternate` })),
    fallers({ seed: 191, count: 10, viewBox: "-6 -6 12 12", size: [10, 18], duration: [9, 14], spin: "tumble", shapes: [STAR4("#e0e7ff"), STAR4("#f0abfc")] }),
  ),
  peach: (): Scene => join(
    branch("#5b3a1a", "#fdba74", "#fff7ed", "right"),
    ...[[64, 74, 0], [78, 96, 1]].map(([right, top, index]) => item("sway", { right: `${right}px`, top: `${top}px`, width: "26px", height: "28px", transformOrigin: "50% 0", animation: `cs-swing ${r1(4 + (index as number))}s ease-in-out infinite alternate` }, svg("0 0 26 28", `<path d="M13,0 L13,5" stroke="#5b3a1a" stroke-width="1.6"/><circle cx="13" cy="16" r="11" fill="#fb923c"/><path d="M13,6 C9,10 9,20 13,27" stroke="#ea580c" stroke-width="1.2" fill="none"/><ellipse cx="9" cy="12" rx="3" ry="4" fill="rgba(255,237,213,.6)"/><path d="M13,5 C17,1 22,3 22,5 C18,7 15,6 13,5 Z" fill="#65a30d"/>`))),
    fallers({ seed: 193, count: 9, viewBox: "-6 -6 12 12", size: [9, 14], duration: [9, 15], spin: "flutter", shapes: [`<path d="M0,-5 C3,-5 5,-2 3,1 L0,5 L-3,1 C-5,-2 -3,-5 0,-5 Z" fill="#fed7aa"/>`, `<path d="M0,-5 C3,-5 5,-2 3,1 L0,5 L-3,1 C-5,-2 -3,-5 0,-5 Z" fill="#fdba74"/>`] }),
  ),
  // --- Neon and games -------------------------------------------------------------------------------------------
  synthwave: (): Scene => join(
    item("synth-sun", { left: "50%", top: "calc(46% - 92px)", width: "120px", height: "92px", marginLeft: "-60px" }),
    item("", { left: 0, right: 0, top: "calc(46% - 46px)", height: "46px", opacity: 0.9 }, svg("0 0 1200 100", mountains(197, "#1e0538", "rgba(244,114,182,0)") + `<path d="${periodicCurve(199, 4, 30, 90)}" stroke="#f472b6" stroke-width="2" fill="none" vector-effect="non-scaling-stroke"/>`, "xMidYMax slice")),
    item("synth-floor", { left: "-50%", right: "-50%", top: "46%", bottom: 0 }),
  ),
  vaporwave: (): Scene => join(
    item("synth-sun", { left: "50%", top: "calc(44% - 80px)", width: "100px", height: "80px", marginLeft: "-50px", filter: "hue-rotate(-40deg) saturate(.8)" }),
    item("vapor-floor", { left: "-50%", right: "-50%", top: "44%", bottom: 0 }),
    item("", { left: "14%", top: "10%", width: "50px", height: "50px", animation: "cs-spin 18s linear infinite" }, svg("-25 -25 50 50", `<path d="M0,-20 L18,12 L-18,12 Z M0,-20 L0,4 M18,12 L0,4 L-18,12" stroke="#67e8f9" stroke-width="1.4" fill="none"/>`)),
    item("", { right: "-10px", top: "18%", width: "70px", height: "110px", opacity: 0.8 }, svg("0 0 90 260", `<path d="M50,260 C46,200 42,120 54,40" stroke="#f0abfc" stroke-width="5" fill="none"/><path d="M54,40 C42,26 24,24 6,34 C24,28 40,32 54,40 Z M54,40 C68,24 84,24 90,36 C78,30 64,32 54,40 Z M54,40 C48,20 36,10 22,10 C36,18 46,28 54,40 Z M54,40 C60,18 72,8 84,10 C72,18 62,28 54,40 Z" fill="#f0abfc"/>`, "xMaxYMin meet")),
  ),
  neontokyo: (): Scene => join(
    item("", { left: 0, right: 0, top: "calc(54% - 130px)", height: "130px", opacity: 0.85 }, svg("0 0 1200 100", skyline(211, "#0b0718", ["#05d9e8", "#ff2a6d", "#d1f7ff", "#f9c80e"], true), "xMidYMax slice")),
    ...[[8, 18, "#ff2a6d", 0], [74, 12, "#05d9e8", 1.3], [40, 24, "#f9c80e", 2.1]].map(([left, top, color, delay]) => item("tokyo-sign", { left: `${left}%`, top: `${top}%`, width: "14px", height: "54px", color: color as string, animation: `cs-tokyo-sign 5s steps(1) ${delay}s infinite` }, "<i></i><i></i><i></i>")),
    fallers({ seed: 213, count: 26, viewBox: "0 0 2 20", size: [12, 20], duration: [0.7, 1.3], spin: "rock", opacity: 0.45, shapes: [`<rect x="0" y="0" width="1" height="20" fill="#a5f3fc"/>`] }),
  ),
  arcade: (): Scene => join(
    item("arcade-score", { left: "14px", top: "8px" }, "1UP 004200"),
    item("arcade-score", { right: "14px", top: "8px" }, "HI 050000"),
    item("arcade-fleet", { left: "10%", top: "8%", width: "80%", height: "70px", animation: "cs-arcade-march 6s steps(12) infinite alternate" },
      Array.from({ length: 12 }, (_, index) => item("", { left: `${(index % 6) * 16}%`, top: `${Math.floor(index / 6) * 34}px`, width: "26px", height: "20px" }, svg("0 0 11 8", PIXEL_ALIEN(["#f472b6", "#4ade80", "#facc15", "#60a5fa"][index % 4]!), "xMidYMid meet", "shape-rendering: crispEdges"))).join("")),
    item("arcade-blink", { left: "50%", top: "calc(8% + 84px)" }, "INSERT COIN"),
  ),
  retro: (): Scene => join(
    ...[[6, 8, 64, 40], [56, 18, 48, 52]].map(([left, top, width, time]) => item("summer-cloud", { left: `${left}%`, top: `${top}%`, width: `${width}px`, height: `${(width as number) / 2}px`, animation: `cs-summer-cloud ${time}s steps(8) infinite alternate` }, svg("0 0 16 8", `<path d="M3,8 H13 V7 H15 V5 H13 V3 H11 V1 H6 V3 H4 V5 H2 V7 H3 Z" fill="#f8fafc"/>`, "xMidYMid meet", "shape-rendering: crispEdges"))),
    item("", { right: "10%", top: "6%", width: "36px", height: "36px" }, svg("0 0 9 9", `<path d="M3,0 H6 V1 H8 V3 H9 V6 H8 V8 H6 V9 H3 V8 H1 V6 H0 V3 H1 V1 H3 Z" fill="#facc15"/>`, "xMidYMid meet", "shape-rendering: crispEdges")),
    ...[[18, 26], [44, 34], [70, 24]].map(([left, top], index) => item("retro-coin", { left: `${left}%`, top: `${top}%`, width: "16px", height: "22px", animation: `cs-bob 1.2s ease-in-out ${-index * 0.3}s infinite alternate` }, svg("0 0 6 8", `<path d="M1,0 H5 V1 H6 V7 H5 V8 H1 V7 H0 V1 H1 Z" fill="#fbbf24"/><path d="M2,2 H4 V6 H2 Z" fill="#fde68a"/>`, "xMidYMid meet", `shape-rendering: crispEdges; animation: cs-retro-coin 1s steps(4) ${-index * 0.3}s infinite`))),
  ),
  music: (): Scene => join(
    item("music-eq", { left: "8%", right: "28%", top: "10px", height: "54px" }, Array.from({ length: 14 }, (_, index) => `<i style="animation-duration: ${r1(0.45 + ((index * 7) % 5) * 0.12)}s; animation-delay: ${-r1(index * 0.13)}s"></i>`).join("")),
    item("", { right: "8px", top: "6px", width: "64px", height: "64px", animation: "cs-spin 4s linear infinite" }, svg("-32 -32 64 64", `<circle r="31" fill="#111827"/><circle r="26" fill="none" stroke="#1f2937" stroke-width="1"/><circle r="21" fill="none" stroke="#1f2937" stroke-width="1"/><circle r="16" fill="none" stroke="#1f2937" stroke-width="1"/><circle r="10" fill="#a78bfa"/><circle r="2" fill="#111827"/><path d="M-22,-16 A27,27 0 0 1 0,-27" stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none"/>`)),
  ),
  neonwaves: (): Scene => join(
    ...[[22, "#22d3ee", 9, 2], [32, "#e879f9", 13, 3], [42, "#a3e635", 17, 2]].map(([top, color, time, crests], index) => item("", { left: 0, width: "100%", top: `${top}%`, height: "50px" }, item("", { left: 0, top: 0, width: "200%", height: "100%", animation: `${index % 2 ? "cs-drift-back" : "cs-drift"} ${time}s linear infinite` }, svg("0 0 1200 100", `<path d="${periodicCurve(221 + index, crests as number, 15, 85)}" stroke="${color}" stroke-width="2.5" fill="none" vector-effect="non-scaling-stroke"/>`, "none", `filter: drop-shadow(0 0 4px ${color})`)))),
  ),
  esport: (): Scene => join(
    ...[["left", -18, 0], ["right", 18, 2.5]].map(([side, angle, delay]) => item("esport-beam", { [side as string]: "10%", bottom: "-10%", width: "60px", height: "120%", transformOrigin: "50% 100%", animation: `cs-esport-beam${(angle as number) < 0 ? "a" : "b"} 7s ease-in-out ${delay}s infinite alternate` })),
    fallers({ seed: 227, count: 10, viewBox: "-6 -6 12 12", size: [6, 10], duration: [8, 12], spin: "tumble", opacity: 0.7, shapes: [STAR4("#38bdf8"), STAR4("#ffffff")] }),
  ),
  fps: (): Scene => join(
    item("fps-radar", { right: "10px", top: "10px", width: "78px", height: "78px" }, item("fps-sweep", { inset: 0, animation: "cs-spin 3s linear infinite" }) + ["30% 40%", "62% 68%", "40% 72%"].map((position, index) => `<b style="left: ${position.split(" ")[0]}; top: ${position.split(" ")[1]}; animation-delay: ${-index}s"></b>`).join("")),
    item("fps-compass", { left: "12%", right: "34%", top: "10px", height: "16px" }),
  ),
  noir: (): Scene => join(
    item("noir-blinds", { inset: "-20%", animation: "cs-noir-blinds 30s ease-in-out infinite alternate" }),
    fallers({ seed: 233, count: 18, viewBox: "0 0 4 20", size: [14, 22], duration: [1, 2], spin: "rock", opacity: 0.35, shapes: [`<path d="M2,0 C1,6 3,12 2,20" stroke="#e5e7eb" stroke-width="1" fill="none"/>`] }),
    ...[[12, 20, 30], [70, 12, 44], [40, 34, 22]].map(([left, top, size]) => item("noir-bokeh", { left: `${left}%`, top: `${top}%`, width: `${size}px`, height: `${size}px` })),
  ),
  // --- Abstract -----------------------------------------------------------------------------------------------------
  hologram: (): Scene => join(
    item("", { left: "50%", top: "28%", width: "130px", height: "130px", margin: "-65px 0 0 -65px", opacity: 0.55 }, svg("-50 -50 100 100", `<circle r="44" fill="none" stroke="#67e8f9" stroke-width="1"/><ellipse rx="44" ry="14" fill="none" stroke="#67e8f9" stroke-width=".8"/><ellipse rx="44" ry="30" fill="none" stroke="#67e8f9" stroke-width=".6" opacity=".7"/><g class="cs-holo-spin"><ellipse rx="14" ry="44" fill="none" stroke="#a5f3fc" stroke-width=".8"/><ellipse rx="30" ry="44" fill="none" stroke="#a5f3fc" stroke-width=".6"/></g>`, "xMidYMid meet", "filter: drop-shadow(0 0 3px #22d3ee)")),
    item("holo-scan", { left: 0, right: 0, height: "26px", animation: "cs-holo-scan 5s linear infinite" }),
  ),
  memphis: (): Scene => join(
    ...[
      [8, 10, 44, `<path d="M2,20 Q8,4 14,20 T26,20 T38,20" stroke="#111827" stroke-width="3" fill="none" stroke-linecap="round"/>`, "0 0 40 30"],
      [72, 6, 34, `<path d="M4,30 L18,4 L32,30 Z" fill="#facc15" stroke="#111827" stroke-width="2"/>`, "0 0 36 34"],
      [44, 22, 26, `<circle cx="13" cy="13" r="11" fill="#f472b6"/>` + [6, 13, 20].map((x) => `<circle cx="${x}" cy="13" r="1.5" fill="#111827"/>`).join(""), "0 0 26 26"],
      [18, 34, 30, `<path d="M2,4 L8,14 L14,4 L20,14 L26,4" stroke="#22d3ee" stroke-width="3" fill="none"/>`, "0 0 28 18"],
      [84, 30, 24, `<rect x="3" y="3" width="18" height="18" fill="none" stroke="#111827" stroke-width="3"/>`, "0 0 24 24"],
    ].map(([left, top, size, body, viewBox], index) => item("", { left: `${left}%`, top: `${top}%`, width: `${size}px`, height: `${size}px`, animation: `cs-memphis-drift ${7 + index}s ease-in-out ${-index}s infinite alternate` }, svg(viewBox as string, body as string))),
  ),
  lavalamp: (): Scene => join(
    ...[[14, 40, "#fb923c", 16], [56, 52, "#f43f5e", 21], [30, 70, "#facc15", 18], [74, 60, "#f97316", 24]].map(([left, size, color, time], index) => item("lava-blob", { left: `${left}%`, bottom: "-20%", width: `${size}px`, height: `${size}px`, background: `radial-gradient(circle at 35% 35%, ${color}, ${color}aa 60%, transparent 72%)`, animation: `cs-lava-rise ${time}s ease-in-out ${-index * 4}s infinite, cs-lava-morph ${r1((time as number) / 3)}s ease-in-out infinite alternate` })),
  ),
  // --- Classic with a subject -------------------------------------------------------------------------------------
  gold: (): Scene => join(
    item("gold-sweep", { left: "-60%", top: "-20%", width: "40%", height: "140%", animation: "cs-gold-sweep 7s ease-in-out infinite" }),
    fallers({ seed: 239, count: 14, viewBox: "0 0 10 10", size: [3, 6], duration: [8, 14], spin: "rock", rise: true, opacity: 0.85, shapes: [`<circle cx="5" cy="5" r="4" fill="#fbbf24"/>`, `<circle cx="5" cy="5" r="4" fill="#fde68a"/>`] }),
  ),
  chalkboard: (): Scene => join(
    item("chalk-doodle", { left: "12px", top: "10px" }, "E = mc²"),
    item("", { right: "12px", top: "8px", width: "54px", height: "40px", opacity: 0.5 }, svg("0 0 54 40", `<path d="M27,3 L32,15 L45,15 L35,23 L39,36 L27,28 L15,36 L19,23 L9,15 L22,15 Z" stroke="#f8fafc" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`)),
    item("", { left: "36%", top: "16%", width: "70px", height: "30px", opacity: 0.45 }, svg("0 0 70 30", `<path d="M4,22 C20,4 40,4 58,16 M50,8 L60,17 L48,22" stroke="#f8fafc" stroke-width="1.6" fill="none" stroke-linecap="round"/>`)),
  ),
  blueprint: (): Scene => join(
    item("", { right: "10px", top: "10px", width: "80px", height: "80px", opacity: 0.6, animation: "cs-spin 40s linear infinite" }, svg("-52 -52 104 104", `<g stroke="#bfdbfe" stroke-width="1.4">${gear(10, "none")}</g>`)),
    item("", { left: "12px", top: "14px", width: "48%", height: "60px", opacity: 0.6 }, svg("0 0 200 60", `<path class="cs-draw" d="M10,50 H190 M10,44 V56 M190,44 V56 M10,50 L18,46 M10,50 L18,54 M190,50 L182,46 M190,50 L182,54 M40,10 H160 V40 H40 Z M70,10 V40 M100,25 m-10,0 a10,10 0 1 0 20,0 a10,10 0 1 0 -20,0" stroke="#bfdbfe" stroke-width="1.2" fill="none"/>`, "xMinYMin meet")),
  ),
  comic: (): Scene => join(
    ...[["POW!", 12, 12, "#facc15", 0], ["BAM!", 62, 20, "#f472b6", 2.2], ["WOW!", 30, 34, "#22d3ee", 4.4]].map(([word, left, top, color, delay]) => item("comic-burst", { left: `${left}%`, top: `${top}%`, width: "70px", height: "52px", animation: `cs-comic-pop 6.6s ease-out ${delay}s infinite` }, svg("0 0 70 52", `<path d="M35,2 L42,14 L56,6 L52,20 L68,22 L54,30 L64,44 L48,40 L42,50 L35,40 L26,50 L22,38 L6,44 L14,30 L2,22 L18,18 L12,4 L28,12 Z" fill="${color}" stroke="#111111" stroke-width="2"/>`) + `<b>${word}</b>`)),
  ),
  corkboard: (): Scene => join(
    ...[[6, 8, -6, "#f8fafc"], [70, 6, 7, "#fef9c3"]].map(([left, top, angle, color]) => item("cork-photo", { left: `${left}%`, top: `${top}px`, width: "58px", height: "64px", transform: `rotate(${angle}deg)`, background: color as string })),
    item("", { left: 0, right: 0, top: "4px", height: "60px" }, svg("0 0 400 60", `<path d="M30,14 Q200,60 360,10" stroke="#dc2626" stroke-width="1.6" fill="none"/><circle cx="30" cy="14" r="4" fill="#dc2626"/><circle cx="360" cy="10" r="4" fill="#2563eb"/>`, "none")),
  ),
} satisfies Record<string, () => Scene>;

/** Rules each scene needs besides the shared ones (pieces named in its markup). */
const SCENE_CSS: Partial<Record<keyof typeof SCENES, string[]>> = {
  ocean: [
    ".cs-ocean-ray { background: linear-gradient(180deg, rgba(186,230,253,.28), rgba(186,230,253,0)); transform: skewX(-16deg); transform-origin: 50% 0; filter: blur(2px); }",
    "@keyframes cs-ocean-ray { from { opacity: .25; transform: skewX(-20deg); } to { opacity: .75; transform: skewX(-10deg); } }",
  ],
  forest: [],
  space: [
    ".cs-space-comet { position: absolute; height: 2px; border-radius: 2px; background: linear-gradient(90deg, #ffffff, rgba(196,181,253,.55) 30%, rgba(196,181,253,0)); transform: rotate(-30deg); transform-origin: 0 50%; box-shadow: 0 0 6px rgba(255,255,255,.8); }",
    "@keyframes cs-space-comet { 0% { transform: translate(0, 0); opacity: 0; } 2% { opacity: 1; } 13% { transform: translate(-260px, 150px); opacity: 0; } 100% { transform: translate(-260px, 150px); opacity: 0; } }",
    ".cs-flame { transform-box: fill-box; transform-origin: 100% 50%; animation: cs-flame .12s ease-in-out infinite alternate; }",
    "@keyframes cs-flame { from { transform: scaleX(.7); opacity: .7; } to { transform: scaleX(1.15); opacity: 1; } }",
  ],
  sunset: [
    ".cs-sunset-sun { border-radius: 50%; margin-left: -37px; background: radial-gradient(circle, #fff7ed 0%, #fde68a 34%, #fb923c 68%, #f43f5e 100%); box-shadow: 0 0 40px 14px rgba(251,146,60,.5), 0 0 90px 30px rgba(244,63,94,.25); }",
    "@keyframes cs-sunset-sink { from { transform: translateY(-62%); } to { transform: translateY(-40%); } }",
    ".cs-sunset-cloud { border-radius: 50%; background: linear-gradient(90deg, transparent, rgba(126,34,206,.55) 25%, rgba(190,24,93,.5) 70%, transparent); filter: blur(1.5px); }",
    "@keyframes cs-sunset-cloud { from { transform: translateX(-14px); } to { transform: translateX(14px); } }",
    ".cs-sunset-glint { margin-left: 0; border-radius: 2px; background: rgba(253,186,116,.85); transform: translateX(-50%); }",
    "@keyframes cs-sunset-glint { from { opacity: .35; transform: translateX(-50%) scaleX(.7); } to { opacity: .95; transform: translateX(-50%) scaleX(1.1); } }",
  ],
  autumn: [],
  newyear: [],
  easter: [],
  summer: [
    ".cs-palm { transform-box: view-box; transform-origin: 54px 40px; animation: cs-palm 4s ease-in-out infinite alternate; }",
    "@keyframes cs-palm { from { transform: rotate(-4deg); } to { transform: rotate(4deg); } }",
  ],
  fantasy: [
    ".cs-fantasy-orb { border-radius: 50%; background: radial-gradient(circle at 35% 35%, #ffffff, #c4b5fd 45%, rgba(139,92,246,.2) 70%); box-shadow: 0 0 12px 4px rgba(167,139,250,.55); }",
  ],
  steampunk: [
    ".cs-steam-pipe { background: linear-gradient(90deg, #5b3714, #b87333 40%, #e9b872 55%, #8a5a2b); opacity: .5; border-radius: 3px; }",
    ".cs-steam-valve { background: linear-gradient(180deg, #e9b872, #8a5a2b); border-radius: 3px; opacity: .65; }",
    ".cs-steam-puff { border-radius: 50%; background: radial-gradient(circle, rgba(241,245,249,.55), rgba(241,245,249,0) 70%); opacity: 0; }",
    "@keyframes cs-steam-puff { 0% { transform: translate(0, 0) scale(.3); opacity: 0; } 15% { opacity: .9; } 100% { transform: translate(-46px, -36px) scale(2.4); opacity: 0; } }",
    ".cs-needle { transform-box: view-box; transform-origin: 50% 50%; animation: cs-needle 2.2s ease-in-out infinite alternate; }",
    "@keyframes cs-needle { 0% { transform: rotate(-50deg); } 40% { transform: rotate(20deg); } 55% { transform: rotate(8deg); } 100% { transform: rotate(48deg); } }",
  ],
  dragon: [
    ".cs-dragon-wing, .cs-dragon-wing2 { transform-box: fill-box; transform-origin: 20% 100%; animation: cs-dragon-flap .55s ease-in-out infinite alternate; }",
    ".cs-dragon-wing2 { animation-delay: -.27s; }",
    "@keyframes cs-dragon-flap { from { transform: scaleY(1); } to { transform: scaleY(-.35); } }",
    ".cs-dragon-heat { background: radial-gradient(ellipse at 0% 50%, rgba(251,146,60,.55), rgba(220,38,38,.18) 45%, transparent 70%); opacity: 0; }",
    "@keyframes cs-dragon-heat { 0%, 54% { opacity: 0; } 62% { opacity: 1; } 76% { opacity: .9; } 88%, 100% { opacity: 0; } }",
    ".cs-dragon-fire { transform-origin: 0 50%; filter: blur(1.2px); }",
    ".cs-dragon-blob { border-radius: 50%; mix-blend-mode: screen; }",
    ".cs-dragon-core { border-radius: 0 50% 50% 0; background: linear-gradient(90deg, #ffffff, #fef9c3 40%, rgba(253,224,71,0)); filter: blur(2px); }",
    ".cs-dragon-spark { width: 3px; height: 3px; border-radius: 50%; background: #fde68a; box-shadow: 0 0 4px #f97316; }",
    "@keyframes cs-dragon-breath { 0%, 54% { transform: scaleX(0); opacity: 0; } 57% { transform: scaleX(.35); opacity: 1; } 63% { transform: scaleX(1); opacity: 1; } 74% { transform: scaleX(1.05); opacity: .95; } 81% { transform: scaleX(.8); opacity: 0; } 100% { transform: scaleX(0); opacity: 0; } }",
    "@keyframes cs-dragon-lick { from { transform: scale(.86, .78) translateY(5px); } to { transform: scale(1.12, 1.16) translateY(-6px); } }",
    "@keyframes cs-dragon-spark0 { from { transform: translate(0, 0); opacity: 1; } to { transform: translate(90px, -26px) scale(.3); opacity: 0; } }",
    "@keyframes cs-dragon-spark1 { from { transform: translate(0, 0); opacity: 1; } to { transform: translate(110px, 20px) scale(.3); opacity: 0; } }",
    "@keyframes cs-dragon-spark2 { from { transform: translate(0, 0); opacity: 1; } to { transform: translate(70px, -6px) scale(.4); opacity: 0; } }",
    ".cs-dragon-smoke { border-radius: 50%; background: radial-gradient(circle, rgba(68,64,60,.55), rgba(68,64,60,0) 70%); }",
    "@keyframes cs-dragon-smoke { 0%, 70% { transform: translate(0, 0) scale(.4); opacity: 0; } 76% { opacity: .8; } 100% { transform: translate(26px, -40px) scale(2.2); opacity: 0; } }",
  ],
  aurora: [
    ".cs-aurora-band0, .cs-aurora-band1, .cs-aurora-band2 { border-radius: 50% 50% 46% 54% / 100% 100% 18% 22%; -webkit-mask-image: linear-gradient(0deg, transparent 0%, #000 14%, rgba(0,0,0,.55) 55%, transparent 100%); mask-image: linear-gradient(0deg, transparent 0%, #000 14%, rgba(0,0,0,.55) 55%, transparent 100%); filter: blur(3px); transform-origin: 50% 100%; }",
    ".cs-aurora-band0 { background: repeating-linear-gradient(90deg, rgba(236,253,245,.38) 0 1.5px, transparent 1.5px 7px), linear-gradient(90deg, transparent 2%, rgba(52,211,153,.85) 22%, rgba(45,212,191,.75) 45%, rgba(74,222,128,.55) 68%, transparent 92%); }",
    ".cs-aurora-band1 { background: repeating-linear-gradient(90deg, rgba(240,253,250,.3) 0 1.5px, transparent 1.5px 9px), linear-gradient(90deg, transparent 8%, rgba(34,211,238,.55) 32%, rgba(167,139,250,.7) 58%, transparent 90%); }",
    ".cs-aurora-band2 { background: repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 1px, transparent 1px 6px), linear-gradient(90deg, transparent 0%, rgba(167,139,250,.45) 28%, rgba(244,114,182,.4) 52%, rgba(52,211,153,.5) 76%, transparent 96%); }",
    "@keyframes cs-aurora-0 { from { transform: translateX(-10%) skewX(-16deg) scaleY(.85); opacity: .55; } to { transform: translateX(9%) skewX(12deg) scaleY(1.15); opacity: 1; } }",
    "@keyframes cs-aurora-1 { from { transform: translateX(8%) skewX(14deg) scaleY(1.1); opacity: .4; } to { transform: translateX(-9%) skewX(-10deg) scaleY(.8); opacity: .9; } }",
    "@keyframes cs-aurora-2 { from { transform: translateX(-6%) skewX(8deg) scaleY(.9); opacity: .3; } to { transform: translateX(6%) skewX(-12deg) scaleY(1.2); opacity: .7; } }",
  ],
  candy: [],
  mint: [],
  coffee: [
    ".chat-scene .cs-coffee-board { display: flex; flex-direction: column; gap: 6px; padding: 7px 6px; background: #1f2a24; border: 3px solid #8a5a2b; border-radius: 3px; box-shadow: 0 2px 5px rgba(0,0,0,.45); opacity: .92; }",
    ".cs-coffee-board i { display: block; height: 2px; border-radius: 1px; background: rgba(255,255,255,.72); }",
    ".cs-coffee-board i:nth-child(1) { width: 62%; height: 3px; background: #fde68a; }",
    ".cs-coffee-board i:nth-child(2) { width: 88%; }",
    ".cs-coffee-board i:nth-child(3) { width: 70%; }",
    ".cs-coffee-board i:nth-child(4) { width: 80%; }",
    ".cs-coffee-awning { background: repeating-linear-gradient(90deg, #14532d 0 16px, #f5ebe0 16px 32px); box-shadow: 0 2px 0 rgba(0,0,0,.15); }",
    ".cs-coffee-scallops { background: radial-gradient(circle at 8px 0, #14532d 0 8px, transparent 8.5px) 0 0 / 32px 10px repeat-x, radial-gradient(circle at 24px 0, #f5ebe0 0 8px, transparent 8.5px) 0 0 / 32px 10px repeat-x; filter: drop-shadow(0 3px 2px rgba(0,0,0,.35)); }",
    "@keyframes cs-coffee-steam { 0% { transform: translateY(8px) scaleX(.8); opacity: 0; } 30% { opacity: .85; } 100% { transform: translateY(-20px) scaleX(1.25); opacity: 0; } }",
  ],
  cyberpunk: [
    ".cs-cyber-corner { border: 0 solid #00e5ff; filter: drop-shadow(0 0 3px #00e5ff); }",
    ".cs-cyber-left-top { border-left-width: 2px; border-top-width: 2px; }",
    ".cs-cyber-right-top { border-right-width: 2px; border-top-width: 2px; }",
    ".cs-cyber-left-bottom { border-left-width: 2px; border-bottom-width: 2px; }",
    ".cs-cyber-right-bottom { border-right-width: 2px; border-bottom-width: 2px; }",
    ".cs-cyber-label { font: 700 9px/1 Consolas, \"Courier New\", monospace; letter-spacing: .12em; color: #00e5ff; opacity: .8; white-space: nowrap; }",
    ".cs-cyber-barcode { background: linear-gradient(90deg, #fcee0a 0 2px, transparent 2px 4px, #fcee0a 4px 5px, transparent 5px 8px, #fcee0a 8px 11px, transparent 11px 12px, #fcee0a 12px 13px, transparent 13px 16px, #fcee0a 16px 18px, transparent 18px 19px, #fcee0a 19px 22px, transparent 22px 25px, #fcee0a 25px 26px, transparent 26px 28px, #fcee0a 28px 31px, transparent 31px 33px, #fcee0a 33px 34px, transparent 34px 37px, #fcee0a 37px 40px, transparent 40px 42px, #fcee0a 42px 46px); opacity: .75; }",
    ".cs-cyber-hazard { background: repeating-linear-gradient(-45deg, #fcee0a 0 5px, #0b0b14 5px 10px); opacity: .8; }",
    ".cs-cyber-glitch { opacity: 0; mix-blend-mode: screen; }",
    "@keyframes cs-cyber-glitch { 0% { opacity: 0; transform: translateX(0); } 91% { opacity: 0; } 92% { opacity: .9; transform: translateX(-8px); } 94% { opacity: .6; transform: translateX(10px) scaleY(1.8); } 96% { opacity: .85; transform: translateX(-3px); } 97%, 100% { opacity: 0; transform: translateX(0); } }",
  ],
  racing: [
    ".cs-racing-asphalt { background: radial-gradient(rgba(255,255,255,.05) 1px, transparent 1.4px) 0 0 / 5px 5px, radial-gradient(rgba(0,0,0,.25) 1px, transparent 1.4px) 2px 3px / 7px 7px; }",
    ".cs-racing-checker { background: conic-gradient(#f5f5f5 25%, #111111 0 50%, #f5f5f5 0 75%, #111111 0) 0 0 / 12px 12px; opacity: .85; }",
    ".cs-racing-skid { border-radius: 50%; background: repeating-linear-gradient(0deg, rgba(0,0,0,.55) 0 3px, transparent 3px 6px); filter: blur(.6px); opacity: .7; }",
    ".cs-racing-kerb { background: repeating-linear-gradient(180deg, #dc2626 0 14px, #f5f5f4 14px 28px); opacity: .85; animation: cs-racing-kerb .45s linear infinite; }",
    "@keyframes cs-racing-kerb { from { background-position: 0 0; } to { background-position: 0 28px; } }",
    ".cs-racing-speed { height: 1.5px; left: 110%; border-radius: 2px; background: linear-gradient(90deg, rgba(255,255,255,.55), rgba(255,255,255,0)); }",
    "@keyframes cs-racing-speed { from { left: 110%; } to { left: -40%; } }",
    "@keyframes cs-racing-flag { from { transform: skewY(-5deg) scaleX(.94); } to { transform: skewY(5deg) scaleX(1); } }",
    ".chat-scene .cs-racing-lights { display: flex; gap: 3px; padding: 2px 3px; border-radius: 4px; background: rgba(0,0,0,.65); }",
    ".cs-racing-lights i { flex: 1; border-radius: 50%; background: #3f0a0a; }",
    ...Array.from({ length: 5 }, (_, index) => `.cs-light${index} { animation: cs-light${index} 6s steps(1) infinite; }`),
    ...Array.from({ length: 5 }, (_, index) => `@keyframes cs-light${index} { 0% { background: #3f0a0a; box-shadow: none; } ${10 + index * 9}% { background: #ef4444; box-shadow: 0 0 6px #ef4444; } 60% { background: #22c55e; box-shadow: 0 0 6px #22c55e; } 70%, 100% { background: #3f0a0a; box-shadow: none; } }`),
  ],
  newspaper: [
    ".cs-paper-fox { border-radius: 50%; background: rgba(139,90,43,.28); }",
    ".cs-paper-rule { border-top: 3px solid rgba(43,33,24,.85); border-bottom: 1px solid rgba(43,33,24,.85); }",
    ".cs-paper-torn { background: radial-gradient(circle at 6px 8px, transparent 0 5px, rgba(110,70,30,.35) 5.5px 6.5px, transparent 7px) 0 0 / 12px 8px repeat-x; }",
  ],
  christmas: [
    ".cs-bulb { animation: cs-bulb 1.6s steps(1) infinite; }",
    "@keyframes cs-bulb { 0%, 49% { opacity: 1; } 50%, 100% { opacity: .35; } }",
    ".cs-star-top { animation: cs-twinkle 2.4s ease-in-out infinite; filter: drop-shadow(0 0 4px #fde047); }",
  ],
  halloween: [
    ".cs-glowface { animation: cs-glow .3s ease-in-out infinite alternate; filter: drop-shadow(0 0 3px #facc15); }",
  ],
  spring: [],
  desert: [
    ".cs-desert-haze { background: linear-gradient(180deg, transparent, rgba(254,243,199,.28), transparent); filter: blur(2px); }",
    "@keyframes cs-desert-haze { from { transform: skewX(-3deg) scaleY(.8); opacity: .5; } to { transform: skewX(3deg) scaleY(1.2); opacity: 1; } }",
  ],
  volcano: [
    ".cs-volcano-smoke { border-radius: 50%; background: radial-gradient(circle, rgba(68,64,60,.75), rgba(68,64,60,0) 70%); opacity: 0; }",
    "@keyframes cs-volcano-smoke { 0% { transform: translate(0, 0) scale(.4); opacity: 0; } 15% { opacity: .9; } 100% { transform: translate(24px, -90px) scale(2.3); opacity: 0; } }",
    ".cs-crater { animation: cs-glow 1.6s ease-in-out infinite alternate; filter: drop-shadow(0 0 4px #f97316); }",
    ".cs-lava { animation: cs-glow 2.2s ease-in-out infinite alternate; filter: drop-shadow(0 0 2px #f97316); }",
    ".cs-volcano-bomb { width: 5px; height: 5px; margin: -2.5px; border-radius: 50%; background: #fde047; box-shadow: 0 0 6px 2px #f97316; }",
    "@keyframes cs-volcano-y { 0% { transform: translateY(0); opacity: 1; animation-timing-function: ease-out; } 45% { transform: translateY(-70px); animation-timing-function: ease-in; } 100% { transform: translateY(90px); opacity: 0; } }",
    ...[-60, 50, -30, 70, 10].map((dx, index) => `@keyframes cs-volcano-x${index} { from { transform: translateX(0); } to { transform: translateX(${dx}px); } }`),
  ],
  pirate: [],
  horror: [
    ".cs-horror-flicker { background: rgba(0,0,0,.55); opacity: 0; animation: cs-horror-flicker 9s steps(1) infinite; }",
    "@keyframes cs-horror-flicker { 0%, 84% { opacity: 0; } 85% { opacity: 1; } 86% { opacity: 0; } 88% { opacity: .8; } 89%, 100% { opacity: 0; } }",
    ".cs-horror-drip { border-radius: 0 0 4px 4px; background: linear-gradient(180deg, #450a0a, #b91c1c); transform-origin: 50% 0; }",
    ".cs-horror-drip::after { content: \"\"; position: absolute; left: -1px; bottom: -4px; width: 7px; height: 7px; border-radius: 50%; background: #b91c1c; }",
    "@keyframes cs-horror-drip { 0% { transform: scaleY(.25); } 70% { transform: scaleY(1); } 100% { transform: scaleY(1.06); } }",
    ".chat-scene .cs-horror-eyes { display: flex; justify-content: space-between; }",
    ".cs-horror-eyes i { width: 6px; height: 4px; border-radius: 50%; background: #fde047; box-shadow: 0 0 6px #facc15; }",
    "@keyframes cs-horror-eyes { 0%, 60% { opacity: 0; } 61%, 68% { opacity: 1; } 69%, 70% { opacity: 0; } 71%, 80% { opacity: 1; } 81%, 100% { opacity: 0; } }",
  ],
  gothic: [
    ".cs-gothic-window { filter: drop-shadow(0 0 10px rgba(202,138,4,.35)); }",
    ".cs-candle { transform-box: fill-box; transform-origin: 50% 100%; animation: cs-candle .14s ease-in-out infinite alternate; filter: drop-shadow(0 0 4px #f59e0b); }",
    "@keyframes cs-candle { from { transform: scaleY(.85) skewX(-4deg); } to { transform: scaleY(1.1) skewX(4deg); } }",
  ],
  lilac: [".cs-lilac-bokeh { border-radius: 50%; background: radial-gradient(circle, rgba(216,180,254,.55), transparent 70%); }"],
  y2k: [".cs-y2k-blob { border-radius: 50%; background: radial-gradient(circle at 30% 30%, #ffffff, #c7d2fe 35%, #818cf8 70%, #4338ca); box-shadow: 0 0 10px rgba(199,210,254,.6); }"],
  synthwave: [
    ".cs-synth-sun { border-radius: 60px 60px 0 0; background: linear-gradient(180deg, #fde047, #fb923c 50%, #ec4899); -webkit-mask-image: linear-gradient(180deg, #000 50%, transparent 50% 56%, #000 56% 66%, transparent 66% 71%, #000 71% 80%, transparent 80% 84%, #000 84% 92%, transparent 92% 95%, #000 95%); mask-image: linear-gradient(180deg, #000 50%, transparent 50% 56%, #000 56% 66%, transparent 66% 71%, #000 71% 80%, transparent 80% 84%, #000 84% 92%, transparent 92% 95%, #000 95%); }",
    ".cs-synth-floor { background: linear-gradient(0deg, rgba(236,72,153,.85) 1.5px, transparent 1.5px) 0 0 / 100% 22px, linear-gradient(90deg, rgba(236,72,153,.85) 1.5px, transparent 1.5px) 0 0 / 40px 100%; transform: perspective(160px) rotateX(58deg); transform-origin: 50% 0; -webkit-mask-image: linear-gradient(180deg, transparent, #000 40%); mask-image: linear-gradient(180deg, transparent, #000 40%); animation: cs-synth-floor 1.2s linear infinite; }",
    "@keyframes cs-synth-floor { from { background-position: 0 0, 0 0; } to { background-position: 0 22px, 0 0; } }",
  ],
  vaporwave: [
    ".cs-synth-sun { border-radius: 60px 60px 0 0; background: linear-gradient(180deg, #fde047, #fb923c 50%, #ec4899); -webkit-mask-image: linear-gradient(180deg, #000 50%, transparent 50% 56%, #000 56% 66%, transparent 66% 71%, #000 71% 80%, transparent 80% 84%, #000 84%); mask-image: linear-gradient(180deg, #000 50%, transparent 50% 56%, #000 56% 66%, transparent 66% 71%, #000 71% 80%, transparent 80% 84%, #000 84%); }",
    ".cs-vapor-floor { background: linear-gradient(0deg, rgba(103,232,249,.75) 1.5px, transparent 1.5px) 0 0 / 100% 24px, linear-gradient(90deg, rgba(240,171,252,.75) 1.5px, transparent 1.5px) 0 0 / 44px 100%; transform: perspective(160px) rotateX(58deg); transform-origin: 50% 0; -webkit-mask-image: linear-gradient(180deg, transparent, #000 40%); mask-image: linear-gradient(180deg, transparent, #000 40%); animation: cs-vapor-floor 1.6s linear infinite; }",
    "@keyframes cs-vapor-floor { from { background-position: 0 0, 0 0; } to { background-position: 0 24px, 0 0; } }",
  ],
  neontokyo: [
    ".chat-scene .cs-tokyo-sign { display: flex; flex-direction: column; gap: 4px; padding: 4px 3px; border: 2px solid currentColor; border-radius: 3px; box-shadow: 0 0 8px currentColor, inset 0 0 6px currentColor; }",
    ".cs-tokyo-sign i { flex: 1; border-radius: 1px; background: currentColor; opacity: .85; }",
    ".cs-tokyo-sign i:nth-child(2) { margin: 0 2px; }",
    "@keyframes cs-tokyo-sign { 0%, 78% { opacity: 1; } 79%, 81% { opacity: .25; } 82%, 85% { opacity: 1; } 86%, 87% { opacity: .3; } 88%, 100% { opacity: 1; } }",
  ],
  arcade: [
    ".cs-arcade-score { font: 700 10px/1 Consolas, \"Courier New\", monospace; letter-spacing: .14em; color: #facc15; white-space: nowrap; }",
    ".cs-arcade-blink { font: 700 10px/1 Consolas, \"Courier New\", monospace; letter-spacing: .18em; color: #f8fafc; white-space: nowrap; transform: translateX(-50%); animation: cs-arcade-blink 1.2s steps(1) infinite; }",
    "@keyframes cs-arcade-blink { 0%, 59% { opacity: 1; } 60%, 100% { opacity: 0; } }",
    "@keyframes cs-arcade-march { from { transform: translateX(-6%); } to { transform: translateX(6%); } }",
  ],
  retro: ["@keyframes cs-retro-coin { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(.15); } }"],
  music: [
    ".chat-scene .cs-music-eq { display: flex; align-items: flex-end; gap: 3px; }",
    ".cs-music-eq i { flex: 1; height: 100%; border-radius: 2px 2px 0 0; background: linear-gradient(0deg, #a78bfa, #f472b6 60%, #facc15); transform-origin: 50% 100%; opacity: .8; animation: cs-eq .6s ease-in-out infinite alternate; }",
    "@keyframes cs-eq { from { transform: scaleY(.15); } to { transform: scaleY(1); } }",
  ],
  esport: [
    ".cs-esport-beam { background: linear-gradient(0deg, rgba(56,189,248,.5), rgba(56,189,248,0)); clip-path: polygon(40% 100%, 60% 100%, 100% 0, 0 0); filter: blur(3px); }",
    "@keyframes cs-esport-beama { from { transform: rotate(-32deg); } to { transform: rotate(12deg); } }",
    "@keyframes cs-esport-beamb { from { transform: rotate(32deg); } to { transform: rotate(-12deg); } }",
  ],
  fps: [
    ".cs-fps-radar { overflow: hidden; border-radius: 50%; border: 1.5px solid rgba(239,68,68,.75); background: radial-gradient(circle, transparent 0 32%, rgba(239,68,68,.3) 33% 34%, transparent 35% 65%, rgba(239,68,68,.3) 66% 67%, transparent 68%), rgba(0,0,0,.35); }",
    ".cs-fps-sweep { border-radius: 50%; background: conic-gradient(from 0deg, rgba(239,68,68,.6), transparent 25%); }",
    ".cs-fps-radar b { position: absolute; width: 4px; height: 4px; margin: -2px; border-radius: 50%; background: #fca5a5; animation: cs-twinkle 3s ease-in-out infinite; }",
    ".cs-fps-compass { border-top: 1px solid rgba(255,255,255,.35); background: repeating-linear-gradient(90deg, rgba(255,255,255,.55) 0 1px, transparent 1px 10px) 0 0 / 100% 6px no-repeat, repeating-linear-gradient(90deg, rgba(255,255,255,.9) 0 2px, transparent 2px 50px) 0 0 / 100% 12px no-repeat; animation: cs-fps-compass 8s ease-in-out infinite alternate; }",
    "@keyframes cs-fps-compass { from { background-position: 0 0, 0 0; } to { background-position: 60px 0, 60px 0; } }",
  ],
  noir: [
    ".cs-noir-blinds { background: repeating-linear-gradient(-28deg, rgba(255,255,255,.075) 0 16px, transparent 16px 34px); -webkit-mask-image: radial-gradient(ellipse at 30% 30%, #000, transparent 75%); mask-image: radial-gradient(ellipse at 30% 30%, #000, transparent 75%); }",
    "@keyframes cs-noir-blinds { from { transform: translate(-10px, 0); } to { transform: translate(10px, 6px); } }",
    ".cs-noir-bokeh { border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.22), transparent 70%); filter: blur(2px); }",
  ],
  hologram: [
    ".cs-holo-spin { transform-box: view-box; transform-origin: 50% 50%; animation: cs-holo 6s linear infinite; }",
    "@keyframes cs-holo { 0% { transform: scaleX(1); } 50% { transform: scaleX(-1); } 100% { transform: scaleX(1); } }",
    ".cs-holo-scan { background: linear-gradient(180deg, transparent, rgba(103,232,249,.22), transparent); }",
    "@keyframes cs-holo-scan { from { top: -10%; } to { top: 105%; } }",
  ],
  memphis: ["@keyframes cs-memphis-drift { from { transform: translate(-6px, 4px) rotate(-10deg); } to { transform: translate(6px, -6px) rotate(12deg); } }"],
  lavalamp: [
    ".cs-lava-blob { border-radius: 50%; filter: blur(1px); opacity: .6; }",
    "@keyframes cs-lava-rise { 0%, 100% { bottom: -15%; } 50% { bottom: 82%; } }",
    "@keyframes cs-lava-morph { from { border-radius: 50% 40% 60% 45%; transform: scale(1, .9); } to { border-radius: 40% 60% 45% 55%; transform: scale(.9, 1.1); } }",
  ],
  gold: [
    ".cs-gold-sweep { background: linear-gradient(90deg, transparent, rgba(253,230,138,.3), transparent); transform: skewX(-20deg); }",
    "@keyframes cs-gold-sweep { 0% { left: -60%; } 40%, 100% { left: 130%; } }",
  ],
  chalkboard: [".cs-chalk-doodle { font: 700 15px/1 \"Segoe Print\", \"Comic Sans MS\", cursive; color: rgba(248,250,252,.55); transform: rotate(-6deg); white-space: nowrap; }"],
  blueprint: [
    ".cs-draw { stroke-dasharray: 600; animation: cs-draw 9s ease-in-out infinite; }",
    "@keyframes cs-draw { 0% { stroke-dashoffset: 600; } 50%, 100% { stroke-dashoffset: 0; } }",
  ],
  comic: [
    ".cs-comic-burst { opacity: 0; }",
    ".cs-comic-burst b { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 900 14px/1 Impact, \"Arial Black\", sans-serif; color: #111111; }",
    "@keyframes cs-comic-pop { 0% { transform: scale(0) rotate(-12deg); opacity: 0; } 4% { transform: scale(1.15) rotate(4deg); opacity: 1; } 8% { transform: scale(1) rotate(0deg); } 22% { opacity: 1; } 28%, 100% { transform: scale(.9); opacity: 0; } }",
  ],
  corkboard: [
    ".cs-cork-photo { padding: 4px 4px 12px; box-shadow: 0 3px 6px rgba(0,0,0,.4); }",
    ".cs-cork-photo::after { content: \"\"; display: block; height: 100%; background: linear-gradient(160deg, #93c5fd, #a7f3d0 60%, #fde68a); }",
  ],
};

export type ChatSceneId = "none" | keyof typeof SCENES;

export const CHAT_SCENE_IDS: readonly ChatSceneId[] = ["none", ...(Object.keys(SCENES) as (keyof typeof SCENES)[])];

/** Whether a theme of this id has a scene of its own. */
export function chatSceneFor(id: string): ChatSceneId {
  return (CHAT_SCENE_IDS as readonly string[]).includes(id) ? (id as ChatSceneId) : "none";
}

/** What a message does to the scene right behind it: light text gets a dimmed picture, dark text a lightened one. */
export const CHAT_SCENE_BACKDROP = { light: "blur(6px) brightness(.5)", dark: "blur(6px) brightness(1.35)" } as const;

function hexLuminance(hex: string): number {
  const value = /^#([0-9a-f]{6})$/i.exec(hex)?.[1] ?? "ffffff";
  const channel = (offset: number) => {
    const c = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

const built = new Map<keyof typeof SCENES, Scene>();

function buildScene(id: keyof typeof SCENES): Scene {
  let scene = built.get(id);
  if (!scene) {
    const made = SCENES[id]();
    scene = { html: made.html, css: [...made.css, ...(SCENE_CSS[id] ?? [])] };
    built.set(id, scene);
  }
  return scene;
}

/** The scene's markup (fixed per scene); the renderers put it into `<div class="chat-scene">` behind the messages. */
export function chatSceneHtml(config: Pick<CameraChatConfig, "scene">): string {
  return config.scene === "none" ? "" : buildScene(config.scene).html;
}

/** Shared and scene rules; `panel` and `row` are the renderer's own selectors for the chat panel and a message row. */
export function getChatSceneCss(config: Pick<CameraChatConfig, "scene"> & Partial<Pick<CameraChatConfig, "textColor">>, panel: string, row: string): string {
  if (config.scene === "none") return "";
  const lightText = hexLuminance(config.textColor ?? "#ffffff") > 0.35;
  return [
    `${panel} { position: relative; isolation: isolate; }`,
    ".chat-scene { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; border-radius: inherit; }",
    ".chat-scene .cs { position: absolute; display: block; pointer-events: none; }",
    ".chat-scene svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; overflow: visible; }",
    ".chat-scene .cs-star { border-radius: 50%; }",
    ".chat-scene .cs-win { animation: cs-win 6s steps(1) infinite; }",
    // Messages blur the picture right behind them and dim it behind light text (or lighten it behind dark text), so
    // nothing in the scene, not even a flame or a bright aurora, competes with the words.
    `${row} { -webkit-backdrop-filter: ${CHAT_SCENE_BACKDROP[lightText ? "light" : "dark"]}; backdrop-filter: ${CHAT_SCENE_BACKDROP[lightText ? "light" : "dark"]}; }`,
    lightText ? ".chat-text { text-shadow: 0 1px 2px rgba(0,0,0,.6); }" : ".chat-text { text-shadow: 0 1px 1px rgba(255,255,255,.5); }",
    "@keyframes cs-fall { from { top: -12%; } to { top: 110%; } }",
    "@keyframes cs-rise { 0% { top: 104%; opacity: 0; } 12% { opacity: 1; } 85% { opacity: .9; } 100% { top: -10%; opacity: 0; } }",
    "@keyframes cs-sway { from { transform: translateX(-12px); } to { transform: translateX(12px); } }",
    "@keyframes cs-flutter { from { transform: rotateY(0deg) rotateZ(0deg); } to { transform: rotateY(360deg) rotateZ(200deg); } }",
    "@keyframes cs-rock { from { transform: rotate(-24deg); } to { transform: rotate(24deg); } }",
    "@keyframes cs-spin { to { transform: rotate(360deg); } }",
    "@keyframes cs-spin-back { to { transform: rotate(-360deg); } }",
    "@keyframes cs-drift { from { transform: translateX(0); } to { transform: translateX(-50%); } }",
    "@keyframes cs-drift-back { from { transform: translateX(-50%); } to { transform: translateX(0); } }",
    "@keyframes cs-bob { from { transform: translateY(-3px); } to { transform: translateY(3px); } }",
    "@keyframes cs-swell { from { transform: scaleY(.78); } to { transform: scaleY(1.22); } }",
    "@keyframes cs-swing { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }",
    "@keyframes cs-wiggle { from { transform: rotate(-4deg); } to { transform: rotate(4deg); } }",
    "@keyframes cs-flap { from { transform: scaleY(1); } to { transform: scaleY(.35); } }",
    "@keyframes cs-twinkle { 0%, 100% { opacity: .3; } 50% { opacity: 1; } }",
    "@keyframes cs-win { 0%, 62% { opacity: 1; } 63%, 71% { opacity: .15; } 72%, 100% { opacity: 1; } }",
    "@keyframes cs-glow { from { opacity: .6; } to { opacity: 1; } }",
    "@keyframes cs-summer-cloud { from { transform: translateX(-16px); } to { transform: translateX(22px); } }",
    "@keyframes cs-fantasy-float { from { transform: translate(-6px, 6px); opacity: .55; } to { transform: translate(6px, -10px); opacity: 1; } }",
    "@keyframes cs-spring-path0 { 0% { transform: translate(0, 0); } 25% { transform: translate(60px, -20px); } 50% { transform: translate(110px, 10px); } 75% { transform: translate(50px, 30px); } 100% { transform: translate(-20px, 0); } }",
    "@keyframes cs-spring-path1 { 0% { transform: translate(0, 0); } 30% { transform: translate(-70px, 16px); } 60% { transform: translate(-30px, -24px); } 100% { transform: translate(40px, 12px); } }",
    "@keyframes cs-spring-path2 { 0% { transform: translate(0, 0); } 35% { transform: translate(80px, -10px); } 70% { transform: translate(20px, -30px); } 100% { transform: translate(-40px, 10px); } }",
    ".cs-forest-fog { background: radial-gradient(ellipse at 30% 50%, rgba(203,213,225,.22), transparent 60%), radial-gradient(ellipse at 75% 60%, rgba(203,213,225,.18), transparent 55%); filter: blur(4px); }",
    "@keyframes cs-forest-fog { from { transform: translateX(-6%); opacity: .55; } to { transform: translateX(6%); opacity: 1; } }",
    ".cs-wing { transform-box: fill-box; transform-origin: 50% 100%; animation: cs-flap .3s ease-in-out infinite alternate; }",
    ".cs-wing-l, .cs-wing-r { transform-box: view-box; transform-origin: 13px 10px; animation: cs-wing .22s ease-in-out infinite alternate; }",
    "@keyframes cs-wing { from { transform: scaleX(1); } to { transform: scaleX(.2); } }",
    ".cs-roll { transform-box: fill-box; transform-origin: 50% 50%; animation: cs-spin 1.2s linear infinite; }",
    ".cs-flag { transform-box: fill-box; transform-origin: 0 50%; animation: cs-flagwave .8s ease-in-out infinite alternate; }",
    "@keyframes cs-flagwave { from { transform: skewY(-8deg) scaleX(.9); } to { transform: skewY(8deg) scaleX(1); } }",
    ".chat-scene .cs-sway { transform-origin: 50% 100%; }",
    ...buildScene(config.scene).css,
    "@media (prefers-reduced-motion: reduce) { .chat-scene .cs, .chat-scene svg, .chat-scene svg * { animation: none !important; } }",
  ].join("\n");
}
