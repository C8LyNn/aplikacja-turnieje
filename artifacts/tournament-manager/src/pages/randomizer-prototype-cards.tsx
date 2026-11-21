import { t } from "@/i18n";
import { PrototypeHtml } from "@/components/prototype-html";

export default function CardsPrototypePage() {
  return (
    <PrototypeHtml
      title={t("randomizerPrototypeCards.talia_kart")}
      description={t("randomizerPrototypeCards.prototyp_losowania_html")}
      relativePath="prototypes/randomizers/cards/index.html"
      backHref="/randomizers"
    />
  );
}
