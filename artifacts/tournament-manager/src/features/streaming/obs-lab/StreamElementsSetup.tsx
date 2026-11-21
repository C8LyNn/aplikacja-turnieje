import { t } from "@/i18n";
import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { ToolButton, ToolDisclosure, ToolPanel } from "@/components/tool-ui";
import type { CameraChatConfig } from "./camera-chat-settings";
import { generateStreamElementsWidget } from "./stream-elements-widget";

type Props = {
  config: CameraChatConfig;
  width: number;
  height: number;
};

export function StreamElementsSetup({ config, width, height }: Props) {
  const [copied, setCopied] = useState<"html" | "css" | "js" | null>(null);
  const { html: htmlCode, css: cssCode, js: jsCode } = useMemo(
    () => generateStreamElementsWidget(config),
    [config],
  );

  async function copy(value: string, type: "html" | "css" | "js") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <ToolPanel
      title={t("streamElementsSetup.streamelements")}
      description={t("streamElementsSetup.eksport_tej_samej_konfiguracji_jako")}
      actions={
        <span className="rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          {width} × {height}{t("streamElementsSetup.px")}</span>
      }
    >
      <div className="space-y-3">
        <CodePanel title={t("streamElementsSetup.html")} code={htmlCode} copied={copied === "html"} onCopy={() => copy(htmlCode, "html")} />
        <CodePanel title={t("streamElementsSetup.css")} code={cssCode} copied={copied === "css"} onCopy={() => copy(cssCode, "css")} />
        <CodePanel title={t("streamElementsSetup.js")} code={jsCode} copied={copied === "js"} onCopy={() => copy(jsCode, "js")} />
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("streamElementsSetup.w_streamelements_utworz_custom_widget")}</p>
    </ToolPanel>
  );
}

function CodePanel({
  title,
  code,
  copied,
  onCopy,
}: {
  title: string;
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <ToolDisclosure title={title} description={t("streamElementsSetup.kod_widgetu")}>
      <div className="overflow-hidden rounded-xl border border-border bg-background/50">
        <div className="flex justify-end border-b border-border px-3 py-2">
          <ToolButton type="button" variant="ghost" onClick={onCopy} className="py-1.5 text-xs">
            <Copy className="h-3.5 w-3.5" /> {copied ? t("streamElementsSetup.skopiowano") : t("streamElementsSetup.kopiuj")}
          </ToolButton>
        </div>
        <pre className="max-h-56 overflow-auto bg-black/30 p-3 text-[11px] leading-5 text-slate-300">
          <code>{code}</code>
        </pre>
      </div>
    </ToolDisclosure>
  );
}
