import { t } from "@/i18n";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export function ModuleBackLink({
  href = "/",
  label = t("moduleBackLink.wszystkie_projekty"),
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg min-h-11 min-w-11 px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
