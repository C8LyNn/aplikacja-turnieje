import {
  useMemo,
  useState,
} from "react";
import type { CameraChatConfig } from "./camera-chat-settings";
import { generateStreamElementsWidget } from "./stream-elements-widget";

type Props = {
  config: CameraChatConfig;
  width: number;
  height: number;
};

export function StreamElementsSetup({
  config,
  width,
  height,
}: Props) {
  const [
    copied,
    setCopied,
  ] = useState<
    "html" |
    "css" |
    "js" |
    null
  >(null);

  const { html: htmlCode, css: cssCode, js: jsCode } =
    useMemo(() => generateStreamElementsWidget(config), [config]);

  async function copy(
    value: string,
    type:
      | "html"
      | "css"
      | "js",
  ) {
    await navigator.clipboard.writeText(
      value,
    );

    setCopied(type);

    window.setTimeout(
      () => setCopied(null),
      1500,
    );
  }

  return (
    <section className="rounded-2xl border border-violet-500/30 bg-violet-500/[0.04] p-5">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-violet-400">
        STREAMELEMENTS
      </div>

      <h3 className="mt-2 text-lg font-bold">
        Prawdziwy chat ze StreamElements
      </h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Utwórz w StreamElements osobny
        Custom Widget i wklej poniższe
        trzy fragmenty do zakładek HTML,
        CSS i JS. Chat działa bez iframe
        i bez strony Replit.
      </p>

      <div className="mt-4 rounded-xl border border-border bg-background/60 p-3">
        <div className="text-xs text-muted-foreground">
          Rozmiar widgetu / overlayu
        </div>

        <div className="mt-1 text-xl font-black">
          {width} × {height}px
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <CodePanel
          title="HTML"
          code={htmlCode}
          copied={
            copied === "html"
          }
          onCopy={() =>
            copy(
              htmlCode,
              "html",
            )
          }
        />

        <CodePanel
          title="CSS"
          code={cssCode}
          copied={
            copied === "css"
          }
          onCopy={() =>
            copy(
              cssCode,
              "css",
            )
          }
        />

        <CodePanel
          title="JS"
          code={jsCode}
          copied={
            copied === "js"
          }
          onCopy={() =>
            copy(
              jsCode,
              "js",
            )
          }
        />
      </div>

      <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-3 text-xs leading-5 text-muted-foreground">
        OBS będzie używał adresu
        overlayu wygenerowanego przez
        StreamElements. Nie trzeba
        dodawać osobnego źródła czatu.
      </div>
    </section>
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
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border bg-background/70 px-3 py-2">
        <strong className="text-xs">
          {title}
        </strong>

        <button
          type="button"
          onClick={onCopy}
          className="text-xs font-bold text-violet-400"
        >
          {copied
            ? "Skopiowano ✓"
            : "Kopiuj"}
        </button>
      </div>

      <pre className="max-h-52 overflow-auto bg-black/30 p-3 text-[11px] leading-5 text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
