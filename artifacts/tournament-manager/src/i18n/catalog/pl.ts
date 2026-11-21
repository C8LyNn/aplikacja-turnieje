// #323-E · Polish catalog (default language): hand-written core keys + texts extracted from the components.
import { plGenerated } from "./pl.generated";
import { errorsPl } from "./errors.pl.generated";
import { serverPl } from "./server.pl.generated";

export const plCore = {
  "i18n.switcher.label": "Język",
  "i18n.lang.pl": "Polski",
  "i18n.lang.en": "English",
  "i18n.stage.default": "Etap {n}",
  "i18n.word.of": "z",
  "i18n.word.from": "z",
} as const;

export const pl = { ...plCore, ...plGenerated, ...errorsPl, ...serverPl } as const;
export type CatalogKey = keyof typeof pl;
