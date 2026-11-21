// #323-E · English catalog: the same keys as Polish (a missing key does not type-check).
import type { PluralForms } from "../index";
import type { plCore } from "./pl";
import { enGenerated } from "./en.generated";
import { errorsEn } from "./errors.en.generated";
import { serverEn } from "./server.en.generated";

export const enCore: Record<keyof typeof plCore, string | PluralForms> = {
  "i18n.switcher.label": "Language",
  "i18n.lang.pl": "Polski",
  "i18n.lang.en": "English",
  "i18n.stage.default": "Stage {n}",
  "i18n.word.of": "of",
  "i18n.word.from": "from",
};

export const en = { ...enCore, ...enGenerated, ...errorsEn, ...serverEn };
