import { t } from "@/i18n";
import { PrototypeHtml } from "@/components/prototype-html";

export default function PinballPrototypePage() {
  return (
    <PrototypeHtml
      title={t("randomizerPrototypePinball.pinball_marbles")}
      description={t("randomizerPrototypePinball.prototyp_losowania_html")}
      relativePath="prototypes/randomizers/pinball/index.html"
      backHref="/randomizers"
    />
  );
}
