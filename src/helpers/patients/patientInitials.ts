export type PatientInitialsColors = {
  background: string;
  foreground: string;
};

/** Spread hues for visually distinct avatars; anchored near brand teal (175deg). */
const AVATAR_HUES = [175, 205, 235, 265, 295, 325, 355, 25, 55, 95, 135];

export function initialsFromPatientName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }

  return Math.abs(hash);
}

/** Deterministic avatar colors from patient initials. */
export function colorFromPatientInitials(
  initials: string,
  options?: { isDark?: boolean },
): PatientInitialsColors {
  const key = initials.trim().toUpperCase() || "?";
  const hue = AVATAR_HUES[hashString(key) % AVATAR_HUES.length]!;

  if (options?.isDark) {
    return {
      background: `hsla(${hue}, 42%, 32%, 0.72)`,
      foreground: `hsl(${hue}, 72%, 78%)`,
    };
  }

  return {
    background: `hsl(${hue}, 58%, 91%)`,
    foreground: `hsl(${hue}, 48%, 30%)`,
  };
}

export function patientInitialsColorsFromName(
  name: string,
  options?: { isDark?: boolean },
): PatientInitialsColors {
  return colorFromPatientInitials(initialsFromPatientName(name), options);
}
