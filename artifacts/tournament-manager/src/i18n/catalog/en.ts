// #323-E · English catalog: the same keys as Polish (a missing key does not type-check).
import type { PluralForms } from "../index";
import type { plCore } from "./pl";
import { enGenerated } from "./en.generated";

export const enCore: Record<keyof typeof plCore, string | PluralForms> = {
  "i18n.switcher.label": "Language",
  "i18n.lang.pl": "Polski",
  "i18n.lang.en": "English",
};

export const en = { ...enCore, ...enGenerated };
