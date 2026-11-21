import { t } from "@/i18n";
import { ExternalLink } from "lucide-react";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";

function prototypeUrl(relativePath: string): string {
  // The Vite base is defined in the app, but not necessarily in a direct Node test.
  const configuredBase = import.meta.env?.BASE_URL || "/";
  const base = configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;
  return `${base}${relativePath.replace(/^\/+/, "")}`;
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
        description={description ?? t("prototypeHtml.samodzielny_prototyp_html")}
        accent="blue"
        backHref={backHref}
        backLabel={t("prototypeHtml.wroc")}
        status="HTML"
      />

      <div className="mb-3 flex justify-end">
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-blue-500/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2"
        >{t("prototypeHtml.otworz_sam_html")}{" "}<ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <iframe
        title={title}
        src={src}
        className="h-[65vh] min-h-[400px] w-full rounded-2xl border border-border bg-black sm:h-[calc(100vh-190px)] sm:min-h-[720px]"
        allow="fullscreen; autoplay; clipboard-read; clipboard-write"
      />
    </ModuleShell>
  );
}
