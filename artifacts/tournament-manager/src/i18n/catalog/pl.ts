// #323-E · Polish catalog (default language): hand-written core keys + texts extracted from the components.
import { plGenerated } from "./pl.generated";

export const plCore = {
  "i18n.switcher.label": "Język",
  "i18n.lang.pl": "Polski",
  "i18n.lang.en": "English",
} as const;

export const pl = { ...plCore, ...plGenerated } as const;
export type CatalogKey = keyof typeof pl;
