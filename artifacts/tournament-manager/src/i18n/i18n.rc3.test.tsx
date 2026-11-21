// Release rehearsal (rc-3): texts the #323-E extractor missed because they have no Polish letters ("Klasyczna",
// "set do 21", "2 grupy po 4", "2:1 z Ola") — in English they must not stay Polish; in Polish nothing changes.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { resetLangForTests, setLang } from "@/i18n";
import { pl } from "@/i18n/catalog/pl";
import { en } from "@/i18n/catalog/en";
import * as appearance from "@/features/experimental-tournaments/experimental-appearance";
import { participantNoun, stageChain, stageDecisionText } from "@/features/experimental-tournaments/experimental-create-wizard-model";
import { BASKET_COLOR_DEFS } from "@/components/stage-baskets-panel";
import { DRAW_PRESENTERS } from "@/components/draw-presenters";
import { eventText } from "@/lib/broadcast-overlay-events";
import { matchFormatText } from "@/lib/broadcast-overlay";

afterEach(() => { resetLangForTests("pl"); try { localStorage.clear(); } catch { /* */ } });

const PROPER_NAMES = new Set(["Deadlock", "Arena", "Aura", "Neon", "Sport", "Arcade", "Cyberpunk", "Minimal pro"]);
const englishTexts = new Set(Object.values(en).filter((v): v is string => typeof v === "string"));
const polishTexts = new Set(Object.values(pl).filter((v): v is string => typeof v === "string" && !englishTexts.has(v)));
const optionLists = () => Object.entries(appearance)
  .filter(([, value]) => Array.isArray(value))
  .flatMap(([name, list]) => (list as Array<{ label?: unknown; hint?: unknown }>).map((item) => ({ name, label: item.label, hint: item.hint })));

test("rc-3 appearance options: every label and hint is English in English (proper names aside)", () => {
  setLang("en");
  const left = optionLists().flatMap(({ name, label, hint }) => [label, hint]
    .filter((text): text is string => typeof text === "string" && text.length > 0 && !PROPER_NAMES.has(text) && polishTexts.has(text))
    .map((text) => `${name}: ${text}`));
  assert.deepEqual(left, []);
  resetLangForTests("pl");
  assert.ok(optionLists().some(({ label }) => label === "Epoka miedzi"), "Polish labels unchanged");
});

test("rc-3 pots, draw presenters: colour and presenter names follow the language", () => {
  setLang("en");
  assert.deepEqual(BASKET_COLOR_DEFS.slice(0, 5).map((c) => c.label), ["Blue", "Red", "Green", "Yellow", "Purple"]);
  assert.deepEqual(DRAW_PRESENTERS.filter((p) => p.id === "automat" || p.id === "skan").map((p) => p.label), ["Slot machine", "Scan"]);
  resetLangForTests("pl");
  assert.equal(BASKET_COLOR_DEFS[0]!.label, "Niebieski");
});

test("rc-3 stage flow and set rules: no 'po', 'set do', 'przewaga' in English", () => {
  const preview = { stages: [{ name: "Group stage", groupSizes: [4, 4], participantCount: 8, bestOf: 1, advancingCount: 4 }] } as unknown as Parameters<typeof stageChain>[0];
  const sets = { kind: "sets", setsToWin: 2, pointsPerSet: 21, winBy: 2 } as unknown as Parameters<typeof stageDecisionText>[0];
  setLang("en");
  assert.match(stageChain(preview)[0]!, /2 groups of 4/);
  assert.equal(stageDecisionText(sets, 3), "first to 2 sets won (set to 21)");
  assert.match(matchFormatText({ bestOf: 3 }, { matchRules: sets, allowDraws: false } as never), /First to 2 sets · set to 21/);
  assert.equal(participantNoun("teams", 5), "teams");
  resetLangForTests("pl");
  assert.match(stageChain(preview)[0]!, /2 grupy po 4/);
  assert.equal(stageDecisionText(sets, 3), "do 2 wygranych setów (set do 21)");
});

test("rc-3 overlay banner: the loser is 'vs' in English, 'z' in Polish", () => {
  const event = { kind: "match_end", matchId: 1, winner: "Ala", loser: "Ola", score: "2:1", draw: false } as const;
  setLang("en");
  assert.equal(eventText(event).text, "Ala wins · 2:1 vs Ola");
  resetLangForTests("pl");
  assert.equal(eventText(event).text, "Wygrywa Ala · 2:1 z Ola");
});
