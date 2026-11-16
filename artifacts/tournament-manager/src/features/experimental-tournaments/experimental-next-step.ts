/**
 * Experimental wording for the organizer's next step: the title names the action
 * ("Rozegraj mecze · Etap 1") instead of only the stage name. Logic is unchanged.
 */
export function experimentalNextStep<T extends { kind: string; title: string }>(step: T): T;
export function experimentalNextStep<T extends { kind: string; title: string }>(step: T | null | undefined): T | null | undefined;
export function experimentalNextStep<T extends { kind: string; title: string }>(step: T | null | undefined) {
  if (!step) return step;
  switch (step.kind) {
    case "active_matches":
      return { ...step, title: `Rozegraj mecze · ${step.title}` };
    case "planned_stage":
      return { ...step, title: `Rozpocznij etap · ${step.title}` };
    case "next_stage":
      return { ...step, title: `Rozpocznij kolejny etap · ${step.title}` };
    default:
      return step;
  }
}
