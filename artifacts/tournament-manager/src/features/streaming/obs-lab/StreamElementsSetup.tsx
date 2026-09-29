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
      title="StreamElements"
      description="Eksport tej samej konfiguracji jako Custom Widget."
      actions={
        <span className="rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          {width} × {height}px
        </span>
      }
    >
      <div className="space-y-3">
        <CodePanel title="HTML" code={htmlCode} copied={copied === "html"} onCopy={() => copy(htmlCode, "html")} />
        <CodePanel title="CSS" code={cssCode} copied={copied === "css"} onCopy={() => copy(cssCode, "css")} />
        <CodePanel title="JS" code={jsCode} copied={copied === "js"} onCopy={() => copy(jsCode, "js")} />
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        W StreamElements utwórz Custom Widget i wklej trzy fragmenty do odpowiednich zakładek.
      </p>
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
    <ToolDisclosure title={title} description="Kod widgetu">
      <div className="overflow-hidden rounded-xl border border-border bg-background/50">
        <div className="flex justify-end border-b border-border px-3 py-2">
          <ToolButton type="button" variant="ghost" onClick={onCopy} className="py-1.5 text-xs">
            <Copy className="h-3.5 w-3.5" /> {copied ? "Skopiowano" : "Kopiuj"}
          </ToolButton>
        </div>
        <pre className="max-h-56 overflow-auto bg-black/30 p-3 text-[11px] leading-5 text-slate-300">
          <code>{code}</code>
        </pre>
      </div>
    </ToolDisclosure>
  );
}
