/**
 * Chat sounds drawn with the Web Audio API: short note recipes, so nothing is downloaded and the exported
 * StreamElements widget (which carries the same recipes) stays standalone. OBS plays Browser Source audio without a
 * click; a normal browser tab may stay silent until the page gets one.
 */
export type ChatSoundMode = "none" | "events" | "all";
export type ChatSoundStyle = "ding" | "pop" | "arcade" | "chime";

export const CHAT_SOUND_MODES: readonly ChatSoundMode[] = ["none", "events", "all"];
export const CHAT_SOUND_STYLES: readonly ChatSoundStyle[] = ["ding", "pop", "arcade", "chime"];

export type ChatSoundNote = {
  freq: number;
  /** Pitch at the end of the note (a slide). */
  to?: number;
  /** Start and length in seconds. */
  at: number;
  dur: number;
  wave: "sine" | "square" | "triangle";
  /** Share of the volume (0-1). */
  gain: number;
};

/** Event sounds by style; "tick" is the quiet sound of a chat message. */
export const CHAT_SOUND_RECIPES: Record<ChatSoundStyle | "tick", readonly ChatSoundNote[]> = {
  ding: [
    { freq: 880, at: 0, dur: 0.45, wave: "sine", gain: 1 },
    { freq: 1318.5, at: 0.09, dur: 0.55, wave: "sine", gain: 0.7 },
  ],
  pop: [
    { freq: 520, to: 1040, at: 0, dur: 0.12, wave: "sine", gain: 1 },
    { freq: 780, to: 1560, at: 0.1, dur: 0.14, wave: "sine", gain: 0.8 },
  ],
  arcade: [
    { freq: 523.25, at: 0, dur: 0.08, wave: "square", gain: 0.45 },
    { freq: 659.25, at: 0.07, dur: 0.08, wave: "square", gain: 0.45 },
    { freq: 783.99, at: 0.14, dur: 0.08, wave: "square", gain: 0.45 },
    { freq: 1046.5, at: 0.21, dur: 0.2, wave: "square", gain: 0.45 },
  ],
  chime: [
    { freq: 783.99, at: 0, dur: 0.9, wave: "triangle", gain: 0.9 },
    { freq: 987.77, at: 0.12, dur: 0.9, wave: "triangle", gain: 0.8 },
    { freq: 1174.66, at: 0.24, dur: 1, wave: "triangle", gain: 0.7 },
  ],
  tick: [
    { freq: 1400, to: 900, at: 0, dur: 0.05, wave: "sine", gain: 0.5 },
  ],
};

/** A flood of messages ticks at most this often. */
export const CHAT_TICK_GAP_MS = 150;

/** 0-100 on a curve that sounds even; at most a third of full scale, so it never drowns out the stream. */
export function chatSoundGain(volume: number): number {
  const share = Math.max(0, Math.min(100, volume)) / 100;
  return share * share * 0.35;
}

type AudioParamLike = {
  setValueAtTime: (value: number, time: number) => unknown;
  exponentialRampToValueAtTime: (value: number, time: number) => unknown;
};

/** The part of AudioContext the player uses (so tests can count notes). */
export type ChatAudio = {
  currentTime: number;
  destination: unknown;
  createOscillator: () => {
    type: string;
    frequency: AudioParamLike;
    connect: (node: unknown) => unknown;
    start: (time: number) => void;
    stop: (time: number) => void;
  };
  createGain: () => { gain: AudioParamLike; connect: (node: unknown) => unknown };
};

export function playChatNotes(context: ChatAudio, notes: readonly ChatSoundNote[], volume: number): number {
  const peak = chatSoundGain(volume);
  if (peak <= 0) return 0;
  const start = context.currentTime + 0.01;
  for (const note of notes) {
    const from = start + note.at;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = note.wave;
    oscillator.frequency.setValueAtTime(note.freq, from);
    if (note.to) oscillator.frequency.exponentialRampToValueAtTime(note.to, from + note.dur);
    gain.gain.setValueAtTime(0.0001, from);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * note.gain), from + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, from + note.dur);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(from);
    oscillator.stop(from + note.dur + 0.05);
  }
  return notes.length;
}

let sharedAudio: (ChatAudio & { state?: string; resume?: () => Promise<void> }) | null = null;

/** One audio context for the page, made on first use; null where the browser has no Web Audio. */
export function chatAudio(): ChatAudio | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudio) {
    const Context = (window as unknown as { AudioContext?: new () => ChatAudio; webkitAudioContext?: new () => ChatAudio }).AudioContext
      ?? (window as unknown as { webkitAudioContext?: new () => ChatAudio }).webkitAudioContext;
    if (!Context) return null;
    try {
      sharedAudio = new Context();
    } catch {
      return null;
    }
  }
  if (sharedAudio.state === "suspended") void sharedAudio.resume?.().catch(() => undefined);
  return sharedAudio;
}

/** Forgets the shared context (tests swap the browser's AudioContext). */
export function resetChatAudio() {
  sharedAudio = null;
}
