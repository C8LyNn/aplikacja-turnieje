/**
 * V5.3 — league schedule: time-zone safe conversion between a local wall-clock time in the league's
 * IANA time zone and the UTC instant stored in matches.scheduled_at, plus a round-by-round date generator.
 *
 * No time is ever shifted implicitly: a local time that does not exist (spring-forward gap) or exists twice
 * (fall-back overlap) in the chosen zone is rejected with an explanation instead of being moved.
 */

export const DEFAULT_SCHEDULE_TIME_ZONE = "Europe/Warsaw";
export const MAX_SCHEDULE_INTERVAL_DAYS = 60;

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) return false;
  if (!/^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+){0,2}$/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

export interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    partsFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** Local wall-clock parts of a UTC instant in a time zone. */
export function localPartsOf(instant: Date, timeZone: string): LocalDateTimeParts {
  const values = Object.fromEntries(
    partsFormatter(timeZone).formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>;
  return { year: values.year!, month: values.month!, day: values.day!, hour: values.hour!, minute: values.minute! };
}

function partsKey(parts: LocalDateTimeParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
}

export type LocalTimeErrorCode =
  | "INVALID_LOCAL_DATE"
  | "INVALID_LOCAL_TIME"
  | "INVALID_TIME_ZONE"
  | "LOCAL_TIME_DOES_NOT_EXIST"
  | "LOCAL_TIME_AMBIGUOUS";

export type LocalTimeConversion =
  | { ok: true; instant: Date }
  | { ok: false; code: LocalTimeErrorCode; message: string };

export function parseLocalDate(value: unknown): { year: number; month: number; day: number } | null {
  if (typeof value !== "string") return null;
  const match = LOCAL_DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day };
}

export function parseLocalTime(value: unknown): { hour: number; minute: number } | null {
  if (typeof value !== "string") return null;
  const match = LOCAL_TIME.exec(value);
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

/**
 * Converts a local wall-clock time in `timeZone` to the UTC instant. Returns an error instead of guessing
 * when the local time is skipped or repeated by a daylight-saving change.
 */
export function localDateTimeToInstant(date: string, time: string, timeZone: string): LocalTimeConversion {
  if (!isValidTimeZone(timeZone)) return { ok: false, code: "INVALID_TIME_ZONE", message: "Nieznana strefa czasowa." };
  const day = parseLocalDate(date);
  if (!day) return { ok: false, code: "INVALID_LOCAL_DATE", message: "Data musi mieć postać RRRR-MM-DD." };
  const clock = parseLocalTime(time);
  if (!clock) return { ok: false, code: "INVALID_LOCAL_TIME", message: "Godzina musi mieć postać GG:MM (00:00–23:59)." };
  const wanted: LocalDateTimeParts = { ...day, ...clock };
  const wantedKey = partsKey(wanted);
  // Offsets in use around this moment: check candidates from both sides of a possible transition.
  const candidates = new Set<number>();
  for (const probeHours of [-36, -12, 0, 12, 36]) {
    const probe = new Date(wantedKey + probeHours * 3_600_000);
    const offset = partsKey(localPartsOf(probe, timeZone)) - probe.getTime();
    candidates.add(wantedKey - offset);
  }
  const matches = [...candidates]
    .filter((candidate) => partsKey(localPartsOf(new Date(candidate), timeZone)) === wantedKey)
    .sort((left, right) => left - right);
  if (matches.length === 0) {
    return {
      ok: false,
      code: "LOCAL_TIME_DOES_NOT_EXIST",
      message: `Godzina ${time} dnia ${date} nie istnieje w strefie ${timeZone} (zmiana czasu). Wybierz inną godzinę.`,
    };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      code: "LOCAL_TIME_AMBIGUOUS",
      message: `Godzina ${time} dnia ${date} występuje w strefie ${timeZone} dwa razy (zmiana czasu). Wybierz inną godzinę.`,
    };
  }
  return { ok: true, instant: new Date(matches[0]!) };
}

/** "2026-12-01" + n days, calendar-based (independent of DST). */
export function addLocalDays(date: string, days: number): string {
  const day = parseLocalDate(date);
  if (!day) throw new Error("INVALID_LOCAL_DATE");
  const shifted = new Date(Date.UTC(day.year, day.month - 1, day.day + days));
  return shifted.toISOString().slice(0, 10);
}

export interface LocalScheduleView {
  date: string;
  time: string;
  timeZone: string;
}

/** The local date/time of a stored instant, for display and editing in the league's zone. */
export function instantToLocal(instant: Date, timeZone: string): LocalScheduleView {
  const parts = localPartsOf(instant, timeZone);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    time: `${pad(parts.hour)}:${pad(parts.minute)}`,
    timeZone,
  };
}

export interface ScheduleGeneratorInput {
  startDate: string;
  intervalDays: number;
  defaultTime: string;
  timeZone: string;
}

export interface ScheduleGeneratorRound {
  round: number;
  date: string;
  time: string;
  scheduledAt: Date;
}

export type ScheduleGeneratorErrorCode =
  | LocalTimeErrorCode
  | "INVALID_INTERVAL"
  | "NO_ROUNDS";

export type ScheduleGeneratorResult =
  | { ok: true; rounds: ScheduleGeneratorRound[] }
  | { ok: false; code: ScheduleGeneratorErrorCode; message: string; round?: number };

/**
 * One date per round (kolejka): round N is played on startDate + (N − 1) × intervalDays at defaultTime,
 * local time in timeZone. Every match of a round gets that slot; the organiser can still edit single matches.
 */
export function generateRoundDates(input: ScheduleGeneratorInput, roundCount: number): ScheduleGeneratorResult {
  if (!Number.isInteger(roundCount) || roundCount < 1) return { ok: false, code: "NO_ROUNDS", message: "Etap nie ma jeszcze kolejek." };
  if (!Number.isInteger(input.intervalDays) || input.intervalDays < 1 || input.intervalDays > MAX_SCHEDULE_INTERVAL_DAYS) {
    return { ok: false, code: "INVALID_INTERVAL", message: `Odstęp między kolejkami to od 1 do ${MAX_SCHEDULE_INTERVAL_DAYS} dni.` };
  }
  if (!parseLocalDate(input.startDate)) return { ok: false, code: "INVALID_LOCAL_DATE", message: "Data startu musi mieć postać RRRR-MM-DD." };
  const rounds: ScheduleGeneratorRound[] = [];
  for (let round = 1; round <= roundCount; round += 1) {
    const date = addLocalDays(input.startDate, (round - 1) * input.intervalDays);
    const converted = localDateTimeToInstant(date, input.defaultTime, input.timeZone);
    if (!converted.ok) return { ok: false, code: converted.code, message: `Kolejka ${round}: ${converted.message}`, round };
    rounds.push({ round, date, time: input.defaultTime, scheduledAt: converted.instant });
  }
  return { ok: true, rounds };
}

export interface ScheduleMatchLike {
  id: number;
  round: number;
  status: string;
  player1Id: number | null;
  player2Id: number | null;
  scheduledAt: Date | null;
}

export type ScheduleState = "completed" | "postponed" | "cancelled" | "in_progress" | "awaiting_result" | "scheduled" | "unscheduled";

/**
 * Plain schedule state of a match at `now`:
 *  - completed / postponed / cancelled / in_progress follow the match status;
 *  - awaiting_result: pending and its date has passed (played but no result entered yet);
 *  - scheduled: pending with a future date; unscheduled: pending without a date.
 */
export function scheduleStateOf(match: Pick<ScheduleMatchLike, "status" | "scheduledAt">, now: Date): ScheduleState {
  if (match.status === "completed") return "completed";
  if (match.status === "postponed") return "postponed";
  if (match.status === "cancelled") return "cancelled";
  if (match.status === "in_progress") return "in_progress";
  if (match.scheduledAt == null) return "unscheduled";
  return match.scheduledAt.getTime() <= now.getTime() ? "awaiting_result" : "scheduled";
}

/** Participants without a match in a round (pause/bye in an odd-sized league). */
export function restingParticipantsByRound(
  participantIds: readonly number[],
  matches: readonly Pick<ScheduleMatchLike, "round" | "player1Id" | "player2Id">[],
): Map<number, number[]> {
  const playing = new Map<number, Set<number>>();
  for (const match of matches) {
    const set = playing.get(match.round) ?? new Set<number>();
    if (match.player1Id != null) set.add(match.player1Id);
    if (match.player2Id != null) set.add(match.player2Id);
    playing.set(match.round, set);
  }
  const result = new Map<number, number[]>();
  for (const [round, set] of [...playing.entries()].sort((left, right) => left[0] - right[0])) {
    result.set(round, participantIds.filter((id) => !set.has(id)));
  }
  return result;
}

/** Round-robin size facts used by the wizard and the AI preview (single source of truth). */
export function roundRobinFacts(participantCount: number, legs: 1 | 2): {
  matches: number;
  rounds: number;
  matchesPerRound: number;
  restingPerRound: number;
  matchesPerParticipant: number;
} {
  const n = Math.max(0, Math.floor(participantCount));
  const slots = n % 2 === 1 ? n + 1 : n;
  const roundsPerLeg = n < 2 ? 0 : slots - 1;
  return {
    matches: ((n * (n - 1)) / 2) * legs,
    rounds: roundsPerLeg * legs,
    matchesPerRound: Math.floor(n / 2),
    restingPerRound: n % 2,
    matchesPerParticipant: (n - 1) * legs,
  };
}

/** V5.3: dates chosen before the stage starts; applied automatically when its matches are generated. */
export interface SchedulePlan {
  startDate: string;
  intervalDays: number;
  defaultTime: string;
}

export interface SchedulePlanProblem {
  code: string;
  path: string;
  message: string;
}

const SCHEDULE_PLAN_FIELDS = new Set(["startDate", "intervalDays", "defaultTime"]);

/**
 * Validates a schedule template. When `roundCount` is known the dates are checked too, so a local time
 * skipped or repeated by a DST change is reported before the tournament is created.
 */
export function parseSchedulePlan(
  value: unknown,
  timeZone: unknown,
  roundCount: number | null,
  path = "schedulePlan",
): { ok: true; value: SchedulePlan | null } | { ok: false; problems: SchedulePlanProblem[] } {
  if (value === undefined || value === null) return { ok: true, value: null };
  const problems: SchedulePlanProblem[] = [];
  if (typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, problems: [{ code: "SCHEDULE_PLAN_NOT_OBJECT", path, message: "Terminarz musi być obiektem." }] };
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!SCHEDULE_PLAN_FIELDS.has(key)) problems.push({ code: "SCHEDULE_PLAN_UNKNOWN_FIELD", path: `${path}.${key}`, message: `Nieznane pole terminarza: „${key}”.` });
  }
  if (!isValidTimeZone(timeZone)) {
    problems.push({ code: "INVALID_TIME_ZONE", path: "scheduleTimeZone", message: "Terminarz wymaga strefy czasowej (np. Europe/Warsaw)." });
  }
  if (!parseLocalDate(record.startDate)) problems.push({ code: "INVALID_LOCAL_DATE", path: `${path}.startDate`, message: "Data startu musi mieć postać RRRR-MM-DD." });
  if (!Number.isInteger(record.intervalDays) || (record.intervalDays as number) < 1 || (record.intervalDays as number) > MAX_SCHEDULE_INTERVAL_DAYS) {
    problems.push({ code: "INVALID_INTERVAL", path: `${path}.intervalDays`, message: `Odstęp między kolejkami to od 1 do ${MAX_SCHEDULE_INTERVAL_DAYS} dni.` });
  }
  if (!parseLocalTime(record.defaultTime)) problems.push({ code: "INVALID_LOCAL_TIME", path: `${path}.defaultTime`, message: "Godzina musi mieć postać GG:MM." });
  if (problems.length > 0) return { ok: false, problems };
  const plan: SchedulePlan = {
    startDate: record.startDate as string,
    intervalDays: record.intervalDays as number,
    defaultTime: record.defaultTime as string,
  };
  if (roundCount != null && roundCount > 0) {
    const generated = generateRoundDates({ ...plan, timeZone: timeZone as string }, roundCount);
    if (!generated.ok) return { ok: false, problems: [{ code: generated.code, path, message: generated.message }] };
  }
  return { ok: true, value: plan };
}

export function schedulePlanFromStorage(value: unknown, timeZone: string | null): SchedulePlan | null {
  if (value == null || timeZone == null) return null;
  const parsed = parseSchedulePlan(value, timeZone, null);
  return parsed.ok ? parsed.value : null;
}
