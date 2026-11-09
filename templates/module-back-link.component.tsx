import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export function ModuleBackLink({
  href = "/",
  label = "Wszystkie projekty",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-semibold text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
