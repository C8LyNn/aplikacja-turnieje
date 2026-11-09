import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";

export function ExperimentalSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function ExperimentalMetricCard({
  label,
  value,
  meta,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="experimental-metric-card rounded-xl border border-border/80 bg-card/55 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{value}</div>
      {meta && <div className="mt-1 text-xs text-muted-foreground">{meta}</div>}
    </div>
  );
}

export function ExperimentalStatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "active" | "success" | "danger";
}) {
  const toneClass =
    tone === "active"
      ? "border-primary/40 bg-primary/10 text-primary"
      : tone === "success"
        ? "border-secondary/45 bg-secondary/10 text-secondary-foreground"
        : tone === "danger"
          ? "border-destructive/45 bg-destructive/10 text-destructive"
          : "border-border bg-muted/35 text-muted-foreground";

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function ExperimentalStatePanel({
  title,
  description,
  icon: Icon,
  action,
  tone = "neutral",
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <section
      role={tone === "danger" ? "alert" : undefined}
      className={`rounded-xl border p-5 ${
        tone === "danger"
          ? "border-destructive/40 bg-destructive/8"
          : "border-border bg-card/45"
      }`}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background/55">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </section>
  );
}

export function ExperimentalQuickLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="experimental-quick-link group flex min-h-24 items-start gap-3 rounded-xl border border-border/80 bg-background/35 p-3.5 transition hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-card/65 text-muted-foreground transition group-hover:text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

export function ExperimentalActionBar({
  children,
  label = "Działania",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div
      aria-label={label}
      className="experimental-action-bar flex flex-wrap items-center justify-end gap-2 rounded-xl border border-border/80 bg-background/75 p-2.5"
    >
      {children}
    </div>
  );
}
