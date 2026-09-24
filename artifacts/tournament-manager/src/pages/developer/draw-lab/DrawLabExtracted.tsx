import { useEffect, useMemo, useRef } from "react";

import hostHtml from "./engines/cards/cards-host.html?raw";
import cardsCss from "./engines/cards/cards.css?raw";
import cardsJs from "./engines/cards/cards-engine.js?raw";

export function DrawLabExtracted() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => {
    const safeJs = cardsJs.replace(/<\/script>/gi, "<\\/script>");

    return hostHtml
      .replace(
        '<link rel="stylesheet" href="./cards.css">',
        `<style>${cardsCss}</style>`
      )
      .replace(
        '<script src="./cards-engine.js"></script>',
        `<script>${safeJs}</script>`
      );
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let frame = 0;

    const resizeIframe = () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const doc = iframe.contentDocument;
        if (!doc) return;

        const height = Math.max(
          doc.documentElement.scrollHeight,
          doc.body?.scrollHeight ?? 0
        );

        iframe.style.height = `${height}px`;
      });
    };

    const handleLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      resizeIframe();

      resizeObserver = new ResizeObserver(resizeIframe);
      resizeObserver.observe(doc.documentElement);

      if (doc.body) {
        resizeObserver.observe(doc.body);

        mutationObserver = new MutationObserver(resizeIframe);
        mutationObserver.observe(doc.body, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
      }

      doc.defaultView?.addEventListener("resize", resizeIframe);
    };

    iframe.addEventListener("load", handleLoad);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="w-full">
      <iframe
        ref={iframeRef}
        title="Cards extracted engine test"
        srcDoc={srcDoc}
        scrolling="no"
        className="w-full rounded-xl border border-border bg-background"
        style={{ height: "1200px", overflow: "hidden" }}
      />
    </div>
  );
}
