export const ORGANIZER_PASSWORD_MIN_LENGTH = 8;

export function tournamentNameError(value: string): string | null {
  return value.trim() ? null : "Podaj nazwę turnieju.";
}

export function organizerPasswordRemaining(value: string): number {
  if (value.length === 0 || value.length >= ORGANIZER_PASSWORD_MIN_LENGTH) return 0;
  return ORGANIZER_PASSWORD_MIN_LENGTH - value.length;
}

export function organizerPasswordError(value: string): string | null {
  const remaining = organizerPasswordRemaining(value);
  return remaining > 0
    ? `Hasło organizatora musi mieć co najmniej ${ORGANIZER_PASSWORD_MIN_LENGTH} znaków.`
    : null;
}

export function focusInvalidCreateTournamentField(input: {
  name: string;
  organizerPassword: string;
  nameElement?: Pick<HTMLElement, "focus"> | null;
  organizerPasswordElement?: Pick<HTMLElement, "focus"> | null;
}): "name" | "organizerPassword" | null {
  if (tournamentNameError(input.name)) {
    input.nameElement?.focus();
    return "name";
  }
  if (organizerPasswordError(input.organizerPassword)) {
    input.organizerPasswordElement?.focus();
    return "organizerPassword";
  }
  return null;
}
