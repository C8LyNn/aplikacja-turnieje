// #323-E · the translation system: catalogs agree (keys, placeholders, no empty or untranslated English), plural forms,
// fallback, formatting, stored choice, and a language switch that keeps component state.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { formatDate, formatNumber, getLang, resetLangForTests, setLang, t, tp, apiErrorText } from "@/i18n";
import { pl } from "@/i18n/catalog/pl";
import { en } from "@/i18n/catalog/en";
import { LanguageProvider, LanguageSwitcher } from "@/i18n/react";

afterEach(() => { cleanup(); resetLangForTests("pl"); try { localStorage.clear(); } catch { /* */ } });

const placeholders = (value: unknown) => [...new Set(JSON.stringify(value).match(/\{\w+\}/g) ?? [])].sort();
/** English texts that may keep Polish letters (language names, proper names). */
const POLISH_ALLOWED = new Set(["i18n.lang.pl"]);

test("E1 catalogs: every key in both languages, same placeholders, nothing empty, no Polish left in English", () => {
  const plKeys = Object.keys(pl);
  const enKeys = Object.keys(en);
  assert.deepEqual(enKeys.filter((k) => !(k in pl)), [], "no English-only keys");
  assert.deepEqual(plKeys.filter((k) => !(k in en)), [], "no Polish key without English");
  const problems: string[] = [];
  for (const key of plKeys) {
    const a = (pl as Record<string, unknown>)[key];
    const b = (en as Record<string, unknown>)[key];
    if (JSON.stringify(placeholders(a)) !== JSON.stringify(placeholders(b))) problems.push(`${key}: placeholders ${placeholders(a)} vs ${placeholders(b)}`);
    if (!String(typeof b === "string" ? b : JSON.stringify(b)).trim()) problems.push(`${key}: empty`);
    if (!POLISH_ALLOWED.has(key) && /[ąćęłńśźżĄĆĘŁŃŚŹŻ]/.test(typeof b === "string" ? b : JSON.stringify(b))) problems.push(`${key}: Polish letters in English`);
  }
  assert.deepEqual(problems, []);
});

test("E1 t/tp: current language, placeholders, Polish and English plurals, unknown key falls back to the key", () => {
  assert.equal(getLang(), "pl");
  assert.equal(t("i18n.switcher.label"), "Język");
  setLang("en");
  assert.equal(t("i18n.switcher.label"), "Language");
  assert.equal(t("nie.ma.takiego" as never), "nie.ma.takiego");
  assert.equal(localStorage.getItem("tm_lang"), "en", "the choice is stored in this browser");
  assert.equal(document.documentElement.lang, "en");
  assert.equal(formatNumber(1234.5), "1,234.5");
  assert.match(formatDate("2026-11-21T12:00:00Z"), /21 Nov 2026/);
  setLang("pl");
  assert.match(formatNumber(1234.5), /1\s?234,5/);
  assert.match(formatDate("2026-11-21T12:00:00Z"), /21 lis 2026/);
});

test("E1 plural rules: Polish one/few/many, English one/other", () => {
  const forms = { one: "{count} mecz", few: "{count} mecze", many: "{count} meczów", other: "{count} meczu" };
  (pl as Record<string, unknown>)["test.matches"] = forms;
  (en as Record<string, unknown>)["test.matches"] = { one: "{count} match", other: "{count} matches" };
  try {
    assert.deepEqual([1, 2, 5, 22, 25].map((n) => tp("test.matches" as never, n)), ["1 mecz", "2 mecze", "5 meczów", "22 mecze", "25 meczów"]);
    setLang("en");
    assert.deepEqual([1, 2, 5].map((n) => tp("test.matches" as never, n)), ["1 match", "2 matches", "5 matches"]);
  } finally {
    delete (pl as Record<string, unknown>)["test.matches"];
    delete (en as Record<string, unknown>)["test.matches"];
  }
});

test("E1 API errors: a localized text for a known code; logic never depends on the server's wording", () => {
  const error = { data: { code: "NO_SUCH_CODE_IN_CATALOG", error: "Nieznany błąd serwera" } };
  assert.equal(apiErrorText(error, "fallback"), "Nieznany błąd serwera", "Polish: the server's own message");
  setLang("en");
  assert.equal(apiErrorText(error, "Something went wrong."), "Something went wrong.", "English: no Polish server text, the localized fallback");
});

function Form() {
  const [value, setValue] = useState("");
  return <div><label htmlFor="name">{t("i18n.switcher.label")}</label><input id="name" value={value} onChange={(e) => setValue(e.target.value)} /><LanguageSwitcher /></div>;
}

test("E1 switch: texts change in place, typed input and component state are kept", () => {
  render(<LanguageProvider render={() => <Form />} />);
  const input = screen.getByLabelText("Język", { selector: "input" }) as HTMLInputElement;
  fireEvent.change(input, { target: { value: "Drużyna Orłów" } });
  act(() => { fireEvent.click(screen.getByRole("button", { name: "English" })); });
  assert.equal((screen.getByLabelText("Language", { selector: "input" }) as HTMLInputElement).value, "Drużyna Orłów", "nothing typed is lost, user text is not translated");
  assert.equal(screen.getByRole("button", { name: "English" }).getAttribute("aria-pressed"), "true");
  act(() => { fireEvent.click(screen.getByRole("button", { name: "Polski" })); });
  assert.ok(screen.getByLabelText("Język", { selector: "input" }));
});
