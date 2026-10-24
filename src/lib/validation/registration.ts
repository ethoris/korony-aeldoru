// Walidacja rejestracji (docs/gdd/12-spolecznosc.md: pole „mam ukończone 16 lat”
// jest wymagane prawnie). Czysta funkcja – testowalna bez bazy.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export interface RegistrationInput {
  email: string;
  password: string;
  ageConfirmed: boolean;
}

export interface RegistrationErrors {
  email?: string;
  password?: string;
  ageConfirmed?: string;
}

export type RegistrationValidation =
  | { ok: true; email: string }
  | { ok: false; errors: RegistrationErrors };

export function validateRegistrationInput(input: RegistrationInput): RegistrationValidation {
  const errors: RegistrationErrors = {};
  const email = input.email.trim().toLowerCase();

  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.email = "Podaj prawidłowy adres e-mail.";
  }

  if (!input.password || input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`;
  }

  if (!input.ageConfirmed) {
    errors.ageConfirmed = "Musisz potwierdzić, że masz ukończone 16 lat.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, email };
}
