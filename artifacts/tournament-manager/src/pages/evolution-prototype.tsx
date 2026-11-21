import { t } from "@/i18n";
import { PrototypeHtml } from "@/components/prototype-html";

export default function EvolutionPrototypePage() {
  return (
    <PrototypeHtml
      title={t("evolutionPrototype.ewolucja_pojazdow")}
      description={t("evolutionPrototype.prototyp_html")}
      relativePath="prototypes/minigames/evolution/index.html"
      backHref="/minigames"
    />
  );
}
