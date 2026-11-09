import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import { ModuleBackLink } from "@/components/module-back-link";

type Accent =
  | "primary"
  | "emerald"
  | "blue"
  | "fuchsia"
  | "amber"
  | "cyan"
  | "rose";

const ACCENTS: Record<
  Accent,
  {
    gradient: string;
    stripe: string;
    text: string;
    borderHover: string;
    iconBg: string;
  }
> = {
  primary: {
    gradient: "from-primary/28 via-primary/6 to-transparent",
    stripe: "bg-primary/70",
    text: "text-primary",
    borderHover: "hover:border-primary/60",
    iconBg: "bg-primary/14",
  },
  emerald: {
    gradient: "from-emerald-500/28 via-emerald-500/6 to-transparent",
    stripe: "bg-emerald-500/70",
    text: "text-emerald-400",
    borderHover: "hover:border-emerald-500/60",
    iconBg: "bg-emerald-500/14",
  },
  blue: {
    gradient: "from-blue-500/28 via-blue-500/6 to-transparent",
    stripe: "bg-blue-500/70",
    text: "text-blue-400",
    borderHover: "hover:border-blue-500/60",
    iconBg: "bg-blue-500/14",
  },
  fuchsia: {
    gradient: "from-fuchsia-500/28 via-fuchsia-500/6 to-transparent",
    stripe: "bg-fuchsia-500/70",
    text: "text-fuchsia-400",
    borderHover: "hover:border-fuchsia-500/60",
    iconBg: "bg-fuchsia-500/14",
  },
  amber: {
    gradient: "from-amber-500/28 via-amber-500/6 to-transparent",
    stripe: "bg-amber-500/70",
    text: "text-amber-400",
    borderHover: "hover:border-amber-500/60",
    iconBg: "bg-amber-500/14",
  },
  cyan: {
    gradient: "from-cyan-500/28 via-cyan-500/6 to-transparent",
    stripe: "bg-cyan-500/70",
    text: "text-cyan-400",
    borderHover: "hover:border-cyan-500/60",
    iconBg: "bg-cyan-500/14",
  },
  rose: {
    gradient: "from-rose-500/28 via-rose-500/6 to-transparent",
    stripe: "bg-rose-500/70",
    text: "text-rose-400",
    borderHover: "hover:border-rose-500/60",
    iconBg: "bg-rose-500/14",
  },
};

export function ModuleShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground dark sm:py-8">
      <div className={`mx-auto w-full ${wide ? "max-w-[1800px]" : "max-w-6xl"}`}>
        {children}
      </div>
    </div>
  );
}

export function ModuleHeader({
  code,
  title,
  description,
  accent,
  backHref = "/",
  backLabel = "Wszystkie projekty",
  status,
}: {
  code: string;
  title: string;
  description: string;
  accent: Accent;
  backHref?: string;
  backLabel?: string;
  status?: string;
}) {
  const style = ACCENTS[accent];

  return (
    <div className="mb-6 space-y-4">
      <ModuleBackLink href={backHref} label={backLabel} />
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/70 p-5 sm:p-6">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.gradient}`} />
        <div className={`absolute left-5 top-0 h-1.5 w-20 rounded-b-lg ${style.stripe}`} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className={`mb-3 text-xs font-black uppercase tracking-[0.18em] ${style.text}`}>
              {code}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          {status && (
            <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
              {status}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

export function ProjectCard({
  code,
  title,
  description,
  href,
  icon: Icon,
  accent,
  status,
  actionLabel = "Otwórz →",
  centerContent = false,
}: {
  code: string;
  title: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  accent: Accent;
  status?: string;
  actionLabel?: string;
  centerContent?: boolean;
}) {
  const style = ACCENTS[accent];

  return (
    <Link
      href={href}
      className={`group relative min-h-[205px] overflow-hidden rounded-2xl border border-border/90 bg-card/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(0,0,0,.22)] ${style.borderHover}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.gradient}`} />
      <div className={`absolute left-5 top-0 h-1.5 w-16 rounded-b-lg transition-all group-hover:w-20 ${style.stripe}`} />
      <div className={`relative flex h-full flex-col ${centerContent ? "items-center text-center" : ""}`}>
        <div className={`mb-5 flex items-start gap-3 ${centerContent ? "justify-center" : "justify-between"}`}>
          <div className={`grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/65 ${style.text}`}>
            <Icon className="h-5 w-5" />
          </div>
          {status && (
            <span className="rounded-full border border-border bg-background/55 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {status}
            </span>
          )}
        </div>
        <div className={`text-[11px] font-black uppercase tracking-[0.16em] ${style.text}`}>
          {code}
        </div>
        <h2 className="mt-1 text-lg font-bold leading-tight">{title}</h2>
        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
        <div className={`mt-auto pt-5 text-xs font-bold opacity-75 transition group-hover:opacity-100 ${style.text}`}>
          {actionLabel}
        </div>
      </div>
    </Link>
  );
}


export function CollectionCard({
  code,
  title,
  description,
  imageUrl,
  accent,
  status,
  onClick,
  actionLabel = "Otwórz →",
}: {
  code: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  accent: Accent;
  status?: string;
  onClick: () => void;
  actionLabel?: string;
}) {
  const style = ACCENTS[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[220px] overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 ${style.borderHover}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.gradient}`} />
      <div className={`absolute left-5 top-0 z-10 h-1.5 w-16 rounded-b-lg transition-all group-hover:w-20 ${style.stripe}`} />

      {imageUrl ? (
        <div className="relative h-28 overflow-hidden border-b border-border/70 bg-background/40">
          <img src={imageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/70 via-transparent to-transparent" />
        </div>
      ) : null}

      <div className="relative flex min-h-[190px] flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className={`text-[11px] font-black uppercase tracking-[0.16em] ${style.text}`}>
            {code}
          </div>
          {status && (
            <span className="rounded-full border border-border bg-background/55 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {status}
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
        <div className={`mt-auto pt-5 text-xs font-bold opacity-75 transition group-hover:opacity-100 ${style.text}`}>
          {actionLabel}
        </div>
      </div>
    </button>
  );
}

export function EmptyProjectCard({ label = "Wolne miejsce" }: { label?: string }) {
  return (
    <div className="flex min-h-[205px] flex-col justify-between rounded-2xl border border-dashed border-border bg-card/20 p-5 text-muted-foreground">
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-dashed border-border bg-background/30">
        <Plus className="h-5 w-5 opacity-45" />
      </div>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="mt-1 text-xs opacity-60">Do wykorzystania później</div>
      </div>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  accent,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  accent: Accent;
}) {
  const style = ACCENTS[accent];
  return (
    <div className="mb-4">
      <div className={`text-xs font-black uppercase tracking-[0.18em] ${style.text}`}>
        {eyebrow}
      </div>
      <h2 className="mt-1 text-xl font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
