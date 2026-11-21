import { t } from "@/i18n";
import { PrototypeHtml } from "@/components/prototype-html";

export default function WheelPrototypePage() {
  return (
    <PrototypeHtml
      title={t("randomizerPrototypeWheel.kolo")}
      description={t("randomizerPrototypeWheel.prototyp_losowania_html")}
      relativePath="prototypes/randomizers/wheel/index.html"
      backHref="/randomizers"
    />
  );
}
