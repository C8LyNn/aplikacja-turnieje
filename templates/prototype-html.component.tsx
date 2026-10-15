import { ExternalLink } from "lucide-react";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";

function prototypeUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${relativePath.replace(/^\//, "")}`;
}

export function PrototypeHtml({
  title,
  description,
  relativePath,
  backHref,
}: {
  title: string;
  description?: string;
  relativePath: string;
  backHref: string;
}) {
  const src = prototypeUrl(relativePath);

  return (
    <ModuleShell wide>
      <ModuleHeader
        code="HTML PROTOTYPE"
        title={title}
        description={description ?? "Samodzielny prototyp HTML."}
        accent="blue"
        backHref={backHref}
        backLabel="Wróć"
        status="HTML"
      />

      <div className="mb-3 flex justify-end">
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-blue-500/40 hover:text-foreground"
        >
          Otwórz sam HTML <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <iframe
        title={title}
        src={src}
        className="h-[calc(100vh-190px)] min-h-[720px] w-full rounded-2xl border border-border bg-black"
        allow="fullscreen; autoplay; clipboard-read; clipboard-write"
      />
    </ModuleShell>
  );
}
