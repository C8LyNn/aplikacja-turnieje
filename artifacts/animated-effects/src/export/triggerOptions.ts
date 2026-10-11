/**
 * Runtime activation policy for StreamElements Custom Widget exports.
 * An exported widget is standalone: it never calls back to the editor site.
 */
export type StreamElementsTriggerMode =
  | "always"
  | "chat-command"
  | "follower"
  | "subscriber"
  | "tip"
  | "cheer"
  | "raid";

export interface StreamElementsTriggerOptions {
  mode: StreamElementsTriggerMode;
  chatCommand: string;
  activeDurationMs: number;
  cooldownMs: number;
}

export const DEFAULT_STREAM_ELEMENTS_TRIGGER_OPTIONS: StreamElementsTriggerOptions = {
  mode: "always",
  chatCommand: "!hype",
  activeDurationMs: 5000,
  cooldownMs: 10000,
};

const MODES: ReadonlySet<string> = new Set([
  "always", "chat-command", "follower", "subscriber", "tip", "cheer", "raid",
]);

function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  const number = typeof value === "string" && value.trim() === ""
    ? NaN
    : Number(value);
  return Number.isFinite(number) ? Math.round(Math.max(min, Math.min(max, number))) : fallback;
}

export function normalizeStreamElementsTriggerOptions(
  input: Partial<StreamElementsTriggerOptions> = {},
): StreamElementsTriggerOptions {
  const defaults = DEFAULT_STREAM_ELEMENTS_TRIGGER_OPTIONS;
  const mode = typeof input.mode === "string" && MODES.has(input.mode)
    ? input.mode as StreamElementsTriggerMode
    : defaults.mode;
  const command = typeof input.chatCommand === "string"
    ? input.chatCommand.trim().toLowerCase()
    : defaults.chatCommand;
  return {
    mode,
    chatCommand: /^![a-z0-9_]{1,24}$/.test(command) ? command : defaults.chatCommand,
    activeDurationMs: boundedInteger(input.activeDurationMs, defaults.activeDurationMs, 500, 60000),
    cooldownMs: boundedInteger(input.cooldownMs, defaults.cooldownMs, 0, 300000),
  };
}
