/**
 * Third-party emote lists read straight from the public APIs of 7TV, BetterTTV and FrankerFaceZ (no key; they answer
 * browser pages, the sandboxed StreamElements frame included).
 *
 * - The OBS page and the native StreamElements widget use the channel's 7TV list for two things StreamElements does not
 *   give: which emotes are "zero-width" (drawn on top of the emote before them: rain, hearts, a hat…) and unlisted 7TV
 *   emotes. Everything StreamElements does send keeps its image. stream-elements-widget.ts carries a copy of these rules.
 * - The configurator loads all three lists for a channel name, so the preview shows the streamer's own emotes.
 *
 * Images keep going through safeChatImageUrl, so only the known emote CDNs are ever used.
 */
import { type ChatEmote, safeChatImageUrl } from "./chat-message-format";

export const SEVENTV_GLOBAL_URL = "https://7tv.io/v3/emote-sets/global";
export const SEVENTV_GQL_URL = "https://7tv.io/v4/gql";
export const sevenTvUserUrl = (twitchId: string) => `https://7tv.io/v3/users/twitch/${encodeURIComponent(twitchId)}`;
export const ffzRoomUrl = (login: string) => `https://api.frankerfacez.com/v1/room/${encodeURIComponent(login)}`;
export const bttvUserUrl = (twitchId: string) => `https://api.betterttv.net/3/cached/users/twitch/${encodeURIComponent(twitchId)}`;

/** 7TV marks a zero-width emote on the set entry (flag 1) and on the emote itself (flag 256). */
export const SEVENTV_ZERO_WIDTH_ACTIVE = 1;
export const SEVENTV_ZERO_WIDTH_EMOTE = 256;
/** Upper bound of one list (a 7TV set holds at most 1000 emotes today). */
export const EMOTE_LIST_LIMIT = 2000;
/** The OBS page asks 7TV again after this long, so emotes added during a stream show up. */
export const SEVENTV_REFRESH_MS = 15 * 60 * 1000;

export const isTwitchId = (value: string) => /^\d{1,20}$/.test(value);
export const isTwitchLogin = (value: string) => /^[a-z0-9_]{1,25}$/i.test(value);

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const text = (value: unknown, max = 100) => (typeof value === "string" ? value.slice(0, max) : "");
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const httpsUrl = (value: unknown) => (typeof value === "string" && value.startsWith("//") ? `https:${value}` : value);

/** Emotes of a 7TV emote set ({ emotes }) or a 7TV user ({ emote_set: { emotes } }). */
export function sevenTvEmotes(raw: unknown): ChatEmote[] {
  const root = record(raw);
  const set = record(root?.["emote_set"]) ?? root;
  return list(set?.["emotes"]).slice(0, EMOTE_LIST_LIMIT).flatMap((item): ChatEmote[] => {
    const entry = record(item);
    const data = record(entry?.["data"]);
    const host = record(data?.["host"]);
    const name = text(entry?.["name"]);
    const base = text(host?.["url"], 300);
    if (!name || !base) return [];
    const files = list(host?.["files"]).map((file) => text(record(file)?.["name"], 40));
    const file = ["2x.webp", "1x.webp", "2x.gif", "1x.gif"].find((candidate) => files.includes(candidate)) ?? "2x.webp";
    const url = safeChatImageUrl(httpsUrl(`${base}/${file}`));
    if (!url) return [];
    const zeroWidth = (Number(entry?.["flags"]) & SEVENTV_ZERO_WIDTH_ACTIVE) !== 0
      || (Number(data?.["flags"]) & SEVENTV_ZERO_WIDTH_EMOTE) !== 0;
    return [zeroWidth ? { name, url, zeroWidth: true } : { name, url }];
  });
}

/** Emotes of an FFZ room or set ({ sets: { id: { emoticons } } }); hidden emotes and effect modifiers stay out. */
export function ffzEmotes(raw: unknown): ChatEmote[] {
  const sets = record(record(raw)?.["sets"]);
  if (!sets) return [];
  return Object.values(sets).flatMap((set) => list(record(set)?.["emoticons"])).slice(0, EMOTE_LIST_LIMIT).flatMap((item): ChatEmote[] => {
    const emote = record(item);
    if (!emote || emote["hidden"] === true || emote["modifier"] === true) return [];
    const urls = record(emote["urls"]) ?? {};
    const name = text(emote["name"]);
    const url = safeChatImageUrl(httpsUrl(urls["2"] ?? urls["1"] ?? urls["4"]));
    return name && url ? [{ name, url }] : [];
  });
}

/** Emotes of a BTTV channel ({ channelEmotes, sharedEmotes }) or of the global list (an array). */
export function bttvEmotes(raw: unknown): ChatEmote[] {
  const root = record(raw);
  const items = Array.isArray(raw) ? raw : [...list(root?.["channelEmotes"]), ...list(root?.["sharedEmotes"])];
  return items.slice(0, EMOTE_LIST_LIMIT).flatMap((item): ChatEmote[] => {
    const emote = record(item);
    const id = text(emote?.["id"], 40);
    const name = text(emote?.["code"]);
    if (!name || !/^[a-f0-9]{24}$/i.test(id)) return [];
    const url = safeChatImageUrl(`https://cdn.betterttv.net/emote/${id}/2x`);
    return url ? [{ name, url }] : [];
  });
}

/** One list; the first list that has a name wins it (channel emotes before global ones). */
export function mergeEmotes(...lists: ReadonlyArray<readonly ChatEmote[]>): ChatEmote[] {
  const seen = new Set<string>();
  const merged: ChatEmote[] = [];
  for (const emotes of lists) {
    for (const emote of emotes) {
      if (seen.has(emote.name)) continue;
      seen.add(emote.name);
      merged.push(emote);
    }
  }
  return merged;
}

/**
 * The message's emotes with 7TV knowledge added: emotes 7TV draws on top of the previous one are marked, and 7TV emotes
 * StreamElements left out (unlisted ones) are added for words of this message only. Sent emotes keep their image.
 */
export function withSevenTvEmotes(
  emotes: readonly ChatEmote[],
  message: string,
  sevenTv: ReadonlyMap<string, ChatEmote> | null,
): ChatEmote[] {
  if (!sevenTv?.size) return [...emotes];
  const known = new Set<string>();
  const result = emotes.map((emote) => {
    known.add(emote.name);
    return sevenTv.get(emote.name)?.zeroWidth && !emote.zeroWidth ? { ...emote, zeroWidth: true } : emote;
  });
  for (const word of message.split(/\s+/)) {
    if (!word || known.has(word)) continue;
    const extra = sevenTv.get(word);
    if (!extra) continue;
    known.add(word);
    result.push(extra);
  }
  return result.slice(0, 100);
}

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/** JSON of a response; null for 404 (nothing there), undefined when the request failed. */
async function fetchJson(fetcher: Fetcher, url: string, init?: RequestInit): Promise<unknown> {
  try {
    const response = await fetcher(url, init);
    if (response.status === 404) return null;
    return response.ok ? await response.json() : undefined;
  } catch {
    return undefined;
  }
}

export type SevenTvCache = {
  /** The channel's 7TV emotes with the global ones, by name; null until the first answer for this channel. */
  get(roomId: string): ReadonlyMap<string, ChatEmote> | null;
};

/** One 7TV lookup per channel (Twitch room id from the message tags), asked again after SEVENTV_REFRESH_MS. */
export function createSevenTvCache(fetcher: Fetcher, now: () => number = () => Date.now()): SevenTvCache {
  let room = "";
  let askedAt = 0;
  let loading = false;
  let emotes: Map<string, ChatEmote> | null = null;
  function load(roomId: string) {
    loading = true;
    room = roomId;
    askedAt = now();
    void Promise.all([fetchJson(fetcher, sevenTvUserUrl(roomId)), fetchJson(fetcher, SEVENTV_GLOBAL_URL)]).then(([user, global]) => {
      if (room !== roomId) return;
      emotes = new Map(mergeEmotes(sevenTvEmotes(user), sevenTvEmotes(global)).map((emote) => [emote.name, emote]));
      loading = false;
    });
  }
  return {
    get(roomId) {
      if (!isTwitchId(roomId)) return null;
      if (roomId !== room) {
        emotes = null;
        load(roomId);
      } else if (!loading && now() - askedAt > SEVENTV_REFRESH_MS) {
        load(roomId);
      }
      return emotes;
    },
  };
}

export type ChannelEmotes = {
  login: string;
  twitchId: string;
  /** Channel emotes (7TV, then BTTV, then FFZ) followed by the global 7TV set. */
  emotes: ChatEmote[];
  counts: { sevenTv: number; bttv: number; ffz: number };
};

/** 7TV finds its users by name (a streamer with 7TV emotes has a 7TV account), with the Twitch id of the connection. */
async function sevenTvTwitchId(fetcher: Fetcher, login: string): Promise<string> {
  const query = "query ($q: String!) { users { search(query: $q, page: 1, perPage: 10) { items { mainConnection { platform platformId platformUsername } } } } }";
  const result = await fetchJson(fetcher, SEVENTV_GQL_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { q: login } }),
  });
  const items = list(record(record(record(record(result)?.["data"])?.["users"])?.["search"])?.["items"]);
  for (const item of items) {
    const connection = record(record(item)?.["mainConnection"]);
    if (connection?.["platform"] !== "TWITCH" || text(connection["platformUsername"]).toLowerCase() !== login) continue;
    const id = String(connection["platformId"] ?? "");
    if (isTwitchId(id)) return id;
  }
  return "";
}

/**
 * All emotes of a Twitch channel for the preview. FrankerFaceZ knows most channels by name and gives the Twitch id;
 * 7TV finds the rest of its users. "not-found" when neither knows the name, "error" when the services did not answer.
 */
export async function loadChannelEmotes(rawLogin: string, fetcher: Fetcher): Promise<ChannelEmotes | "not-found" | "error"> {
  const login = rawLogin.trim().replace(/^@/, "").toLowerCase();
  if (!isTwitchLogin(login)) return "not-found";
  const room = await fetchJson(fetcher, ffzRoomUrl(login));
  let twitchId = String(record(record(room)?.["room"])?.["twitch_id"] ?? "");
  if (!isTwitchId(twitchId)) twitchId = await sevenTvTwitchId(fetcher, login);
  if (!isTwitchId(twitchId)) return room === undefined ? "error" : "not-found";
  const [sevenTvUser, bttvUser, sevenTvGlobal] = await Promise.all([
    fetchJson(fetcher, sevenTvUserUrl(twitchId)),
    fetchJson(fetcher, bttvUserUrl(twitchId)),
    fetchJson(fetcher, SEVENTV_GLOBAL_URL),
  ]);
  const sevenTv = sevenTvEmotes(sevenTvUser);
  const bttv = bttvEmotes(bttvUser);
  const ffz = ffzEmotes(room);
  return {
    login,
    twitchId,
    emotes: mergeEmotes(sevenTv, bttv, ffz, sevenTvEmotes(sevenTvGlobal)),
    counts: { sevenTv: sevenTv.length, bttv: bttv.length, ffz: ffz.length },
  };
}
