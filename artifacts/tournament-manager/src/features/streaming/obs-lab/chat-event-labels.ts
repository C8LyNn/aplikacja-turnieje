import { t } from "@/i18n";
import type { ChatEventLabels } from "./chat-events";

/** Event templates in the site's language for the preview, the OBS page and the exported StreamElements widget. */
export function chatEventLabels(): ChatEventLabels {
  return {
    follow: t("obsLab.zdarzenie_obserwacja"),
    sub: t("obsLab.zdarzenie_sub"),
    resub: t("obsLab.zdarzenie_resub"),
    gift: t("obsLab.zdarzenie_prezent"),
    giftBulk: t("obsLab.zdarzenie_prezenty"),
    cheer: t("obsLab.zdarzenie_bitsy"),
    raid: t("obsLab.zdarzenie_raid"),
    tip: t("obsLab.zdarzenie_napiwek"),
    tipCurrency: t("obsLab.zdarzenie_waluta"),
    goalFollow: t("obsLab.cel_obserwujacych"),
    goalSub: t("obsLab.cel_subow"),
    goalBits: t("obsLab.cel_bitsow"),
    goalTip: t("obsLab.cel_napiwkow"),
  };
}
