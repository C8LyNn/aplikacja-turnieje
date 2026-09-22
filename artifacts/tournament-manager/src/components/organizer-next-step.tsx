import React from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganizerNextStepModel } from "@/lib/organizer-next-step";

export function OrganizerNextStep({
  step,
  onAction,
  pending = false,
}: {
  step: OrganizerNextStepModel;
  onAction?: () => void;
  pending?: boolean;
}) {
  const action = step.actionLabel && (onAction || step.actionHref);
  return (
    <section aria-labelledby="organizer-next-step-title" className="organizer-next-step rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Następny krok</p>
          <h2 id="organizer-next-step-title" className="mt-1 font-semibold">{step.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
        </div>
        {action && step.actionHref && !onAction && (
          <Button asChild className="organizer-next-action shrink-0">
            <Link href={step.actionHref}>{step.actionLabel}<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        )}
        {action && onAction && (
          <Button onClick={onAction} disabled={pending} className="organizer-next-action shrink-0">
            {step.actionLabel}<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {!action && step.kind === "completed" && <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />}
      </div>
    </section>
  );
}
