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

/** Routes are evaluated in order; the first matching eligible rule wins. */
export interface StreamElementsRouteInput extends Partial<StreamElementsTriggerOptions> {
  id: string;
  effectInstanceIds: string[];
}
export interface StreamElementsRoute extends StreamElementsTriggerOptions {
  id: string;
  effectInstanceIds: string[];
}

export const MAX_STREAM_ELEMENTS_ROUTES = 8;

export function normalizeStreamElementsRoutes(
  routes: readonly StreamElementsRouteInput[],
  enabledInstanceIds: readonly string[],
): StreamElementsRoute[] {
  const allowed = new Set(enabledInstanceIds);
  const seenIds = new Set<string>();
  const result: StreamElementsRoute[] = [];
  for (const candidate of routes.slice(0, MAX_STREAM_ELEMENTS_ROUTES)) {
    const id = typeof candidate?.id === "string" ? candidate.id.trim() : "";
    if (!/^[a-zA-Z0-9_-]{1,48}$/.test(id) || seenIds.has(id)) continue;
    const options = normalizeStreamElementsTriggerOptions(candidate);
    // Continuous effects still use the backwards-compatible single-rule exporter.
    if (options.mode === "always") continue;
    const effectInstanceIds = [...new Set(
      (Array.isArray(candidate.effectInstanceIds) ? candidate.effectInstanceIds : [])
        .filter((value): value is string => typeof value === "string" && allowed.has(value)),
    )];
    if (effectInstanceIds.length === 0) continue;
    seenIds.add(id);
    result.push({ ...options, id, effectInstanceIds });
  }
  return result;
}
