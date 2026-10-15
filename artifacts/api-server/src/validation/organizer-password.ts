export const ORGANIZER_PASSWORD_MIN_LENGTH = 8;
export const ORGANIZER_PASSWORD_TOO_SHORT_CODE = "ORGANIZER_PASSWORD_TOO_SHORT";
export const ORGANIZER_PASSWORD_TOO_SHORT_MESSAGE =
  `Hasło organizatora jest wymagane i musi mieć co najmniej ${ORGANIZER_PASSWORD_MIN_LENGTH} znaków.`;

export function organizerPasswordInputError(value: unknown): string | null {
  return typeof value !== "string" || value.length < ORGANIZER_PASSWORD_MIN_LENGTH
    ? ORGANIZER_PASSWORD_TOO_SHORT_MESSAGE
    : null;
}
