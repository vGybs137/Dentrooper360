import type { PatientCardData } from "@/helpers/patientDisplay";

const TRAILING_STOP_WORDS = new Set([
  "at",
  "on",
  "in",
  "for",
  "with",
  "today",
  "tomorrow",
  "am",
  "pm",
  "a.m.",
  "p.m.",
  "noon",
  "midnight",
  "this",
  "next",
]);

/**
 * Trailing name-like fragment from freeform quick-add text.
 * Skips trailing time/date glue words and tokens that contain digits.
 */
export function derivePatientSuggestionQuery(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < 2) {
    return "";
  }

  const words = trimmed.split(/\s+/);
  const nameWords: string[] = [];

  for (let index = words.length - 1; index >= 0 && nameWords.length < 3; index -= 1) {
    const word = words[index] ?? "";
    if (!word) {
      continue;
    }
    if (/\d/.test(word)) {
      break;
    }

    const stopKey = word.toLowerCase().replace(/[^a-z']/gi, "");
    if (stopKey && TRAILING_STOP_WORDS.has(stopKey)) {
      break;
    }

    nameWords.unshift(word);
  }

  const query = nameWords.join(" ").trim();
  return query.length >= 2 ? query : "";
}

/** Replace the matched suggestion query in text with the chosen display name. */
export function applyPatientNameToQuickAdd(
  text: string,
  query: string,
  displayName: string,
): string {
  const q = query.trim();
  if (!q) {
    if (text.toLowerCase().includes(displayName.toLowerCase())) {
      return text;
    }
    const trimmed = text.trim();
    return trimmed.length === 0 ? displayName : `${trimmed} ${displayName}`;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const index = lowerText.lastIndexOf(lowerQuery);
  if (index < 0) {
    const trimmed = text.trim();
    return trimmed.length === 0 ? displayName : `${trimmed} ${displayName}`;
  }

  return text.slice(0, index) + displayName + text.slice(index + q.length);
}

export function patientStillSelectedInText(
  text: string,
  patient: Pick<PatientCardData, "displayName">,
): boolean {
  return text.toLowerCase().includes(patient.displayName.toLowerCase());
}
