import { ExternalLink } from "lucide-react";
import { ModuleBackLink } from "@/components/module-back-link";

function coreClashUrl(): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return `${base}prototypes/minigames/core-clash/index.html`;
}

export default function CoreClashPrototypePage() {
  const src = coreClashUrl();

  return (
    <div className="h-[100dvh] overflow-hidden bg-background text-foreground dark">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background/95 px-3 sm:px-5">
          <ModuleBackLink href="/minigames" label="Minigry" />

          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-blue-500/40 hover:text-foreground"
          >
            Otwórz sam HTML
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <iframe
          title="Core Clash"
          src={src}
          className="min-h-0 flex-1 w-full border-0 bg-black"
          allow="fullscreen; autoplay; clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
