import { ExternalLink } from "lucide-react";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";

const VENEDI_PREVIEW_URL =
  "https://docs.google.com/spreadsheets/d/17zIRU2WFtu_wRj77i9bODCsHy6OyQZ6l-bnG-eFDaXU/preview";

export default function VenediDatabasePage() {
  return (
    <ModuleShell wide>
      <ModuleHeader
        code="RES 01 / DATA"
        title="Wenedowie — baza badawcza"
        description="Oryginalna baza Google Sheets udostępniona bezpośrednio do przeglądania."
        accent="cyan"
        backHref="/research/venedi"
        backLabel="Wenedowie"
        status="tylko odczyt"
      />

      <div className="mb-3 flex justify-end">
        <a
          href={VENEDI_PREVIEW_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-cyan-500/40 hover:text-foreground"
        >
          Otwórz w nowej karcie <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <iframe
        title="Wenedowie — baza badawcza — podgląd"
        src={VENEDI_PREVIEW_URL}
        className="h-[calc(100vh-190px)] min-h-[720px] w-full rounded-2xl border border-border bg-white"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </ModuleShell>
  );
}
