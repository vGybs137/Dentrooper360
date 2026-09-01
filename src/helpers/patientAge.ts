import dayjs from "dayjs";

/** Whole years from birth date to today; null when birth date is missing or invalid. */
export function ageFromBirthDate(
  birthDate: Date | null | undefined,
): number | null {
  if (!birthDate || Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const years = dayjs().diff(dayjs(birthDate), "year");
  return years >= 0 ? years : null;
}

/** Approximate birth date from a whole-number age entered in a form. */
export function birthDateFromAge(age: number): Date | null {
  if (!Number.isFinite(age) || age < 0 || age > 150) {
    return null;
  }

  return dayjs().subtract(age, "year").startOf("day").toDate();
}

export function parseAgeInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 150) {
    return null;
  }

  return parsed;
}

export function formatAgeInput(
  birthDate: Date | null | undefined,
): string {
  const age = ageFromBirthDate(birthDate);
  return age == null ? "" : String(age);
}
