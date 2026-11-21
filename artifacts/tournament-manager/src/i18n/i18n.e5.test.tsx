// #323-E5 · server refusals in the viewer's language, labels that follow a switch, and two completeness gates:
// no Polish literal left in the source (outside CC-001) and an error catalog that matches the API.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterEach, test } from "node:test";
import { apiErrorText, localizeErrorData, localizeServerMessage, localizeServerTexts, resetLangForTests, serverError, serverText, setLang, stageLabel, t } from "@/i18n";
import { formatLocalSlot } from "@/lib/match-work-state";
import { deriveOrganizerNextStep } from "@/lib/organizer-next-step";

afterEach(() => { resetLangForTests("pl"); try { localStorage.clear(); } catch { /* */ } });

const script = (name: string) => fileURLToPath(new URL(`../../scripts/${name}`, import.meta.url));

test("E5 server message: Polish as sent; English by exact text, by template (values kept) or by the code's only text", () => {
  assert.equal(localizeServerMessage("Brak uprawnień do zmiany tego turnieju."), "Brak uprawnień do zmiany tego turnieju.");
  setLang("en");
  assert.equal(localizeServerMessage("Brak uprawnień do zmiany tego turnieju."), "No permission to change this tournament.");
  assert.equal(localizeServerMessage("Pole „Ranga” jest wymagane."), "The field “Ranga” is required.", "the field name is user data and stays as typed");
  assert.equal(
    localizeServerMessage("Godzina 02:30 dnia 2026-03-29 nie istnieje w strefie Europe/Warsaw (zmiana czasu). Wybierz inną godzinę."),
    "The time 02:30 on 2026-03-29 does not exist in the zone Europe/Warsaw (clock change). Choose another time.",
  );
  assert.equal(localizeServerMessage("Coś zupełnie innego się stało.", "FORBIDDEN"), "No permission to change this tournament.", "code with a single message");
  assert.equal(localizeServerMessage("Nieznany komunikat serwera."), undefined, "unknown Polish → the caller's own localized fallback");
  assert.equal(localizeServerMessage("Format engine for stage-1 emitted a bad match."), "Format engine for stage-1 emitted a bad match.", "English text passes");
});

test("E5 refusal bodies: generated-client data and field problems are localized once; the fallback stays localized", () => {
  setLang("en");
  const data = localizeErrorData({ error: "Mecz nie istnieje.", code: "MATCH_NOT_FOUND", problems: [{ message: "Pole „Klub” jest wymagane.", code: "REQUIRED" }, { message: "Coś nieznanego.", code: "WEIRD_PROBLEM" }] }) as { error: string; problems: Array<{ message: string }> };
  assert.equal(data.error, "The match does not exist.");
  assert.deepEqual(data.problems.map((p) => p.message), ["The field “Klub” is required.", "WEIRD_PROBLEM"]);
  assert.equal(serverError({ error: "Nieznany komunikat serwera." }), undefined);
  assert.equal(apiErrorText({ data: { error: "Nieznany komunikat serwera." } }, t("i18n.lang.en")), "English");
  resetLangForTests("pl");
  assert.deepEqual(localizeErrorData({ error: "Mecz nie istnieje." }), { error: "Mecz nie istnieje." }, "Polish: untouched");
});

test("E5 labels follow the language: league dates and the organizer's next step", () => {
  assert.equal(formatLocalSlot("2026-12-05", "18:00"), "sb 5 gru, 18:00");
  setLang("en");
  assert.equal(formatLocalSlot("2026-12-05", "18:00"), "Sat 5 Dec, 18:00");
  const step = deriveOrganizerNextStep({ tournament: { id: 1, status: "completed", currentRound: 1, totalRounds: 1 }, stages: [], surface: "host", capabilities: {} } as never);
  assert.equal(step.title, "Tournament finished");
  assert.ok(!/[ąćęłńóśźż]/i.test(JSON.stringify(step)), `no Polish in the English next step: ${JSON.stringify(step)}`);
});

test("E5 server texts: preset responses, shared-library labels and default stage names follow the language; typed names stay", () => {
  const preview = { presetId: "single_elimination", name: "Drabinka pucharowa", creation: { stagePlan: { stages: [{ name: "Drabinka pucharowa", format: "single_elimination" }] } }, reasons: ["Najmniej meczów — idealne na jedno popołudnie."], requirements: ["Przed startem lista musi liczyć dokładnie 8 uczestników."], custom: "Puchar Orłów" };
  assert.deepEqual(localizeServerTexts(preview), preview, "Polish: untouched");
  assert.equal(stageLabel("Etap 2"), "Etap 2");
  setLang("en");
  const en = localizeServerTexts(preview);
  assert.equal(en.name, "Knockout bracket");
  assert.equal(en.creation.stagePlan.stages[0]!.name, "Knockout bracket", "a stage created in English gets an English default name");
  assert.equal(en.presetId, "single_elimination", "ids are not touched");
  assert.deepEqual(en.reasons, ["The fewest matches — ideal for one afternoon."]);
  assert.deepEqual(en.requirements, ["Before the start the list must have exactly 8 participants."], "template value carried over");
  assert.equal(en.custom, "Puchar Orłów", "user text is never translated");
  assert.equal(serverText("Jedna gra ze zwycięzcą"), "One game with a winner");
  assert.equal(serverText("Turniej wystartował: 4 graczy, 2 rund (single_elimination)"), "Tournament started: 4 players, 2 rounds (single_elimination)");
  assert.equal(serverText("Etap „Etap 1” jest gotowy. Sprawdź rozstawienie i zatwierdź start."), "Stage “Stage 1” is ready. Check the seeding and confirm the start.");
  assert.equal(stageLabel("Etap 2"), "Stage 2");
  assert.equal(stageLabel("Etap finałowy"), "Etap finałowy", "only the exact generated default is localized");
});

test("E5 completeness: no Polish literal left in the source (CC-001 excluded) and the error catalog matches the API", () => {
  const scan = spawnSync(process.execPath, [script("i18n-scan.mjs"), "--max=0", "--ignore=core-clash"], { encoding: "utf8" });
  assert.equal(scan.status, 0, scan.stdout + scan.stderr);
  const errors = spawnSync(process.execPath, [script("i18n-api-errors.mjs"), "--check"], { encoding: "utf8" });
  assert.equal(errors.status, 0, errors.stdout + errors.stderr);
});
