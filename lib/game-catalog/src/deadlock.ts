import {
  isPlainObject,
  TournamentGameConfigError,
  type GameDefinition,
} from "./core";

export const DEADLOCK_GAME_ID = "deadlock" as const;
export const DEADLOCK_CONFIG_VERSION = 1 as const;

export const DEADLOCK_HERO_IDS = [
  "abrams",
  "wraith",
  "shiv",
  "silver",
  "drifter",
  "the_doorman",
  "sinclair",
  "grey_talon",
  "mo_and_krill",
  "yamato",
  "holliday",
  "warden",
  "mina",
  "paradox",
  "mcginnis",
  "dynamo",
  "infernus",
  "haze",
  "mirage",
  "rem",
  "paige",
  "ivy",
  "venator",
  "vindicta",
  "viscous",
  "lash",
  "vyper",
  "kelvin",
  "calico",
  "victor",
  "graves",
  "bebop",
  "pocket",
  "seven",
  "billy",
  "lady_geist",
  "apollo",
  "celeste",
] as const;

export type DeadlockHeroId = (typeof DEADLOCK_HERO_IDS)[number];

export interface DeadlockHeroDefinition {
  readonly id: DeadlockHeroId;
  readonly displayName: string;
  /** Relative to the frontend public base URL. */
  readonly iconKey: string;
}

const hero = (
  id: DeadlockHeroId,
  displayName: string,
  assetName: string,
): DeadlockHeroDefinition => ({
  id,
  displayName,
  iconKey: `game-assets/deadlock/heroes/${assetName}.png`,
});

export const DEADLOCK_HEROES: readonly DeadlockHeroDefinition[] = [
  hero("abrams", "Abrams", "abrams"),
  hero("wraith", "Wraith", "wraith"),
  hero("shiv", "Shiv", "shiv"),
  hero("silver", "Silver", "silver"),
  hero("drifter", "Drifter", "drifter"),
  hero("the_doorman", "The Doorman", "the-doorman"),
  hero("sinclair", "Sinclair", "sinclair"),
  hero("grey_talon", "Grey Talon", "grey-talon"),
  hero("mo_and_krill", "Mo & Krill", "mo-and-krill"),
  hero("yamato", "Yamato", "yamato"),
  hero("holliday", "Holliday", "holliday"),
  hero("warden", "Warden", "warden"),
  hero("mina", "Mina", "mina"),
  hero("paradox", "Paradox", "paradox"),
  hero("mcginnis", "McGinnis", "mcginnis"),
  hero("dynamo", "Dynamo", "dynamo"),
  hero("infernus", "Infernus", "infernus"),
  hero("haze", "Haze", "haze"),
  hero("mirage", "Mirage", "mirage"),
  hero("rem", "Rem", "rem"),
  hero("paige", "Paige", "paige"),
  hero("ivy", "Ivy", "ivy"),
  hero("venator", "Venator", "venator"),
  hero("vindicta", "Vindicta", "vindicta"),
  hero("viscous", "Viscous", "viscous"),
  hero("lash", "Lash", "lash"),
  hero("vyper", "Vyper", "vyper"),
  hero("kelvin", "Kelvin", "kelvin"),
  hero("calico", "Calico", "calico"),
  hero("victor", "Victor", "victor"),
  hero("graves", "Graves", "graves"),
  hero("bebop", "Bebop", "bebop"),
  hero("pocket", "Pocket", "pocket"),
  hero("seven", "Seven", "seven"),
  hero("billy", "Billy", "billy"),
  hero("lady_geist", "Lady Geist", "lady-geist"),
  hero("apollo", "Apollo", "apollo"),
  hero("celeste", "Celeste", "celeste"),
] as const;

const DEADLOCK_HERO_ID_SET = new Set<string>(DEADLOCK_HERO_IDS);
const DEADLOCK_HERO_BY_ID = new Map(
  DEADLOCK_HEROES.map((definition) => [definition.id, definition] as const),
);

export type DeadlockBanMode = 'shared_pool' | 'opponent_only';

export interface DeadlockStageBansV1 {
  stageKey: string;
  bannedHeroIds: DeadlockHeroId[];
}

export interface DeadlockTournamentConfigV1 {
  forcedHeroId?: DeadlockHeroId;
  banMode?: DeadlockBanMode;
  bansPerPlayer?: number;
  /** Additional global bans introduced at a stage; effective bans are cumulative. */
  stageBans?: DeadlockStageBansV1[];
}

export function getDeadlockBanMode(config: DeadlockTournamentConfigV1): DeadlockBanMode {
  return config.banMode ?? 'shared_pool';
}

export function getDeadlockBansPerPlayer(config: DeadlockTournamentConfigV1): number {
  return config.bansPerPlayer ?? 5;
}

export function getDeadlockAdditionalStageBans(
  config: DeadlockTournamentConfigV1,
  stageKey: string,
): DeadlockHeroId[] {
  return [...(config.stageBans?.find((entry) => entry.stageKey === stageKey)?.bannedHeroIds ?? [])];
}

export function getDeadlockEffectiveStageBans(
  config: DeadlockTournamentConfigV1,
  orderedStageKeys: readonly string[],
  stageKey: string,
): DeadlockHeroId[] {
  const targetIndex = orderedStageKeys.indexOf(stageKey);
  if (targetIndex < 0) return [];
  const effective = new Set<DeadlockHeroId>();
  for (const key of orderedStageKeys.slice(0, targetIndex + 1)) {
    for (const heroId of getDeadlockAdditionalStageBans(config, key)) effective.add(heroId);
  }
  return [...effective];
}

export function isDeadlockHeroId(value: unknown): value is DeadlockHeroId {
  return typeof value === "string" && DEADLOCK_HERO_ID_SET.has(value);
}

export function getDeadlockHero(
  heroId: string | null | undefined,
): DeadlockHeroDefinition | undefined {
  return heroId == null ? undefined : DEADLOCK_HERO_BY_ID.get(heroId as DeadlockHeroId);
}

function parseDeadlockTournamentConfig(
  configVersion: number,
  config: unknown,
): DeadlockTournamentConfigV1 {
  if (configVersion !== DEADLOCK_CONFIG_VERSION) {
    throw new TournamentGameConfigError(
      "UNSUPPORTED_GAME_CONFIG_VERSION",
      `Unsupported Deadlock tournament config version: ${configVersion}.`,
    );
  }
  if (!isPlainObject(config)) {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      "Deadlock tournament config must be an object.",
    );
  }
  const allowedKeys = new Set(["forcedHeroId", "banMode", "bansPerPlayer", "stageBans"]);
  const unknownKeys = Object.keys(config).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      `Unknown Deadlock tournament config field: ${unknownKeys[0]}.`,
    );
  }

  const result: DeadlockTournamentConfigV1 = {};

  if (config.forcedHeroId != null) {
    if (!isDeadlockHeroId(config.forcedHeroId)) {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        `Unknown Deadlock hero: ${String(config.forcedHeroId)}.`,
      );
    }
    result.forcedHeroId = config.forcedHeroId;
  }

  if (config.banMode != null) {
    if (config.banMode !== 'shared_pool' && config.banMode !== 'opponent_only') {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        `Invalid Deadlock banMode: ${String(config.banMode)}. Must be 'shared_pool' or 'opponent_only'.`,
      );
    }
    result.banMode = config.banMode as DeadlockBanMode;
  }

  if (config.bansPerPlayer != null) {
    const n = Number(config.bansPerPlayer);
    if (!Number.isInteger(n) || n < 0 || n > 20) {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        `Invalid Deadlock bansPerPlayer: must be an integer between 0 and 20.`,
      );
    }
    result.bansPerPlayer = n;
  }

  if (config.stageBans != null) {
    if (!Array.isArray(config.stageBans) || config.stageBans.length > 10) {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        "Deadlock stageBans must be an array with at most 10 entries.",
      );
    }
    const stageKeys = new Set<string>();
    result.stageBans = config.stageBans.map((raw) => {
      if (!isPlainObject(raw) || typeof raw.stageKey !== "string" || !raw.stageKey.trim()) {
        throw new TournamentGameConfigError("INVALID_GAME_CONFIG", "Every Deadlock stage ban entry needs a stageKey.");
      }
      const unknownStageBanKeys = Object.keys(raw).filter(
        (key) => key !== "stageKey" && key !== "bannedHeroIds",
      );
      if (unknownStageBanKeys.length > 0) {
        throw new TournamentGameConfigError(
          "INVALID_GAME_CONFIG",
          `Unknown Deadlock stage ban field: ${unknownStageBanKeys[0]}.`,
        );
      }
      if (stageKeys.has(raw.stageKey)) {
        throw new TournamentGameConfigError("INVALID_GAME_CONFIG", `Duplicate Deadlock stageKey: ${raw.stageKey}.`);
      }
      stageKeys.add(raw.stageKey);
      if (!Array.isArray(raw.bannedHeroIds)) {
        throw new TournamentGameConfigError("INVALID_GAME_CONFIG", `Deadlock stage ${raw.stageKey} bans must be an array.`);
      }
      const bannedHeroIds = raw.bannedHeroIds.filter(isDeadlockHeroId);
      if (bannedHeroIds.length !== raw.bannedHeroIds.length || new Set(bannedHeroIds).size !== bannedHeroIds.length) {
        throw new TournamentGameConfigError("INVALID_GAME_CONFIG", `Deadlock stage ${raw.stageKey} contains an invalid or duplicate hero ban.`);
      }
      return { stageKey: raw.stageKey, bannedHeroIds };
    });
  }

  return result;
}

export function sortHeroesByName<T extends { displayName: string }>(heroes: readonly T[]): T[] {
  return [...heroes].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
  );
}

export const DEADLOCK_GAME_DEFINITION: GameDefinition<DeadlockTournamentConfigV1> = {
  id: DEADLOCK_GAME_ID,
  displayName: "Deadlock",
  currentConfigVersion: DEADLOCK_CONFIG_VERSION,
  parseTournamentConfig: parseDeadlockTournamentConfig,
};
