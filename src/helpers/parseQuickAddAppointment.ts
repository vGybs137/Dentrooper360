import {
  addDays,
  MINUTES_PER_HOUR,
  parseDayKey,
  todayCalendarDate,
  toDayKey,
  workingWindowMinutes,
  type DayKey,
} from "@/utils/calendar";

export type QuickAddPatientCandidate = {
  id: string;
  displayName: string;
  phoneNumber: string | null;
};

export type QuickAddNamedCandidate = {
  id: string;
  names: string[];
};

export type QuickAddMatchSpan = {
  kind: "patient" | "type" | "location" | "time" | "date";
  start: number;
  end: number;
};

export type ParsedQuickAdd = {
  subject: string;
  patientId: string | null;
  typeId: string | null;
  locationId: string | null;
  /** When set, overrides the selected calendar day. */
  preferredDayKey: DayKey | null;
  preferredStartMinutes: number | null;
  matchedSpans: QuickAddMatchSpan[];
  confidence: {
    patient: number;
    type: number;
    location: number;
    time: number;
    date: number;
  };
};

export type ParseQuickAddAppointmentArgs = {
  text: string;
  patients: QuickAddPatientCandidate[];
  types: QuickAddNamedCandidate[];
  locations: QuickAddNamedCandidate[];
  /** Inclusive working-hour window used to disambiguate bare hours. */
  startHour: number;
  endHour: number;
  /** Anchor for relative dates like "this Friday" (defaults to today). */
  referenceDayKey?: DayKey;
};

type SpanHit = {
  start: number;
  end: number;
  confidence: number;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function overlapsSpan(
  start: number,
  end: number,
  spans: QuickAddMatchSpan[],
): boolean {
  return spans.some((span) => start < span.end && end > span.start);
}

function findNormalizedPhrase(
  haystackNorm: string,
  original: string,
  phraseNorm: string,
): { start: number; end: number } | null {
  if (!phraseNorm || phraseNorm.length < 2) return null;

  const index = haystackNorm.indexOf(phraseNorm);
  if (index < 0) return null;

  // Map normalized index back approximately via token walk on original.
  // Prefer searching the original case-insensitively with flexible whitespace.
  const pattern = phraseNorm
    .split(" ")
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  const match = original.match(new RegExp(pattern, "i"));
  if (!match || match.index == null) {
    // Fallback: use normalized offsets clipped to original length.
    const start = Math.min(index, original.length);
    const end = Math.min(start + phraseNorm.length, original.length);
    return { start, end };
  }
  return { start: match.index, end: match.index + match[0].length };
}

/** Short middle-name particles that may be omitted in casual typing. */
const SKIPPABLE_NAME_PARTICLES = new Set([
  "al",
  "el",
  "de",
  "da",
  "di",
  "du",
  "van",
  "von",
  "bin",
  "ibn",
]);

function resolveBareHour(
  hour: number,
  startHour: number,
  endHour: number,
): number {
  const { startMinutes, endMinutes } = workingWindowMinutes(startHour, endHour);
  const am = hour * MINUTES_PER_HOUR;
  const pm = hour >= 1 && hour <= 11 ? (hour + 12) * MINUTES_PER_HOUR : null;

  const amInWindow = am >= startMinutes && am < endMinutes;
  const pmInWindow = pm != null && pm >= startMinutes && pm < endMinutes;

  if (hour <= 11 && !amInWindow && pmInWindow && pm != null) {
    return pm;
  }
  if (hour >= 13) return am;
  if (amInWindow) return am;
  if (pmInWindow && pm != null) return pm;
  return am;
}

const WEEKDAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Resolves a weekday relative to an anchor date.
 * - `this`: upcoming including today
 * - `next`: upcoming excluding today (at least +1 day)
 * - bare weekday: same as `this`
 */
function dayKeyForWeekday(
  anchor: ReturnType<typeof todayCalendarDate>,
  weekday: number,
  mode: "this" | "next",
): DayKey {
  const anchorDate = new Date(anchor.year, anchor.month, anchor.day);
  const current = anchorDate.getDay();
  let delta = weekday - current;
  if (mode === "next") {
    if (delta <= 0) delta += 7;
  } else if (delta < 0) {
    delta += 7;
  }
  return toDayKey(addDays(anchor, delta));
}

function extractDate(
  text: string,
  referenceDayKey?: DayKey,
): (SpanHit & { dayKey: DayKey }) | null {
  const anchor = referenceDayKey
    ? parseDayKey(referenceDayKey)
    : todayCalendarDate();

  const patterns: Array<{
    regex: RegExp;
    confidence: number;
    toDayKey: (match: RegExpMatchArray) => DayKey | null;
  }> = [
    {
      regex: /\b(today)\b/i,
      confidence: 1,
      toDayKey: () => toDayKey(anchor),
    },
    {
      regex: /\b(tomorrow)\b/i,
      confidence: 1,
      toDayKey: () => toDayKey(addDays(anchor, 1)),
    },
    {
      regex:
        /\b(this|next)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i,
      confidence: 0.95,
      toDayKey: (match) => {
        const mode = match[1].toLowerCase() as "this" | "next";
        const weekday = WEEKDAY_NAME_TO_INDEX[match[2].toLowerCase()];
        if (weekday == null) return null;
        return dayKeyForWeekday(anchor, weekday, mode);
      },
    },
    {
      regex:
        /\bon\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i,
      confidence: 0.9,
      toDayKey: (match) => {
        const weekday = WEEKDAY_NAME_TO_INDEX[match[1].toLowerCase()];
        if (weekday == null) return null;
        return dayKeyForWeekday(anchor, weekday, "this");
      },
    },
    {
      // Bare weekday at start / after comma — "Friday, endo…" / "This was already handled"
      regex:
        /(?:^|,\s*)(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i,
      confidence: 0.85,
      toDayKey: (match) => {
        const weekday = WEEKDAY_NAME_TO_INDEX[match[1].toLowerCase()];
        if (weekday == null) return null;
        return dayKeyForWeekday(anchor, weekday, "this");
      },
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (!match || match.index == null) continue;
    const dayKey = pattern.toDayKey(match);
    if (!dayKey) continue;
    // For patterns with optional prefix in the match, prefer the weekday token span
    // but keep the full matched phrase for subject cleanup.
    return {
      start: match.index,
      end: match.index + match[0].length,
      confidence: pattern.confidence,
      dayKey,
    };
  }

  return null;
}

function extractTime(
  text: string,
  startHour: number,
  endHour: number,
): (SpanHit & { minutes: number }) | null {
  const patterns: Array<{
    regex: RegExp;
    confidence: number;
    toMinutes: (match: RegExpMatchArray) => number | null;
  }> = [
    {
      regex: /\b(?:at\s+)?(noon|midnight)\b/i,
      confidence: 0.95,
      toMinutes: (match) => {
        const word = match[1].toLowerCase();
        return word === "noon" ? 12 * MINUTES_PER_HOUR : 0;
      },
    },
    {
      // Allows optional space after "at": "at 3pm", "at3pm", "at3:00pm".
      regex: /\b(?:at\s*)?(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)?\b/i,
      confidence: 1,
      toMinutes: (match) => {
        let hour = Number(match[1]);
        const minute = Number(match[2]);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
        if (minute < 0 || minute > 59) return null;
        const meridiem = match[3]?.toLowerCase();
        if (meridiem) {
          if (hour < 1 || hour > 12) return null;
          if (meridiem.startsWith("p") && hour < 12) hour += 12;
          if (meridiem.startsWith("a") && hour === 12) hour = 0;
        } else if (hour > 23) {
          return null;
        }
        return hour * MINUTES_PER_HOUR + minute;
      },
    },
    {
      regex: /\b(?:at\s*)?(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)\b/i,
      confidence: 0.9,
      toMinutes: (match) => {
        let hour = Number(match[1]);
        if (!Number.isFinite(hour) || hour < 1 || hour > 12) return null;
        const meridiem = match[2].toLowerCase();
        if (meridiem.startsWith("p") && hour < 12) hour += 12;
        if (meridiem.startsWith("a") && hour === 12) hour = 0;
        return hour * MINUTES_PER_HOUR;
      },
    },
    {
      regex: /\bat\s*(\d{1,2})\b/i,
      confidence: 0.7,
      toMinutes: (match) => {
        const hour = Number(match[1]);
        if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
        return resolveBareHour(hour, startHour, endHour);
      },
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (!match || match.index == null) continue;
    const minutes = pattern.toMinutes(match);
    if (minutes == null) continue;
    return {
      start: match.index,
      end: match.index + match[0].length,
      confidence: pattern.confidence,
      minutes,
    };
  }

  return null;
}

function scoreLocationHit(
  text: string,
  textNorm: string,
  name: string,
): SpanHit | null {
  const nameNorm = normalizeText(name);
  if (nameNorm.length < 3) return null;

  const found = findNormalizedPhrase(textNorm, text, nameNorm);
  if (!found) return null;

  const before = text.slice(0, found.start).trimEnd();
  const atEnd = found.end >= text.trimEnd().length;
  const afterSeparator = /(?:,|\bat\b|\bin\b)\s*$/i.test(before);

  let confidence = 0.6;
  if (normalizeText(text) === nameNorm) confidence = 1;
  else if (atEnd || afterSeparator) confidence = 0.8;

  if (confidence < 0.6) return null;
  return { ...found, confidence };
}

function extractLocation(
  text: string,
  textNorm: string,
  locations: QuickAddNamedCandidate[],
  used: QuickAddMatchSpan[],
): { id: string; hit: SpanHit } | null {
  let best: { id: string; hit: SpanHit; nameLen: number } | null = null;

  for (const location of locations) {
    for (const name of location.names) {
      const hit = scoreLocationHit(text, textNorm, name);
      if (!hit) continue;
      if (overlapsSpan(hit.start, hit.end, used)) continue;
      if (
        !best ||
        hit.confidence > best.hit.confidence ||
        (hit.confidence === best.hit.confidence &&
          name.length > best.nameLen)
      ) {
        best = { id: location.id, hit, nameLen: name.length };
      }
    }
  }

  return best ? { id: best.id, hit: best.hit } : null;
}

function extractPatient(
  text: string,
  textNorm: string,
  patients: QuickAddPatientCandidate[],
  used: QuickAddMatchSpan[],
): { patient: QuickAddPatientCandidate; hit: SpanHit } | null {
  let best: {
    patient: QuickAddPatientCandidate;
    hit: SpanHit;
    nameLen: number;
  } | null = null;

  for (const patient of patients) {
    const nameNorm = normalizeText(patient.displayName);
    if (!nameNorm || nameNorm.length < 2) continue;

    const found = findNormalizedPhrase(textNorm, text, nameNorm);
    if (!found) continue;
    if (overlapsSpan(found.start, found.end, used)) continue;

    const exact = textNorm === nameNorm;
    const tokenCount = nameNorm.split(" ").length;
    const confidence = exact ? 1 : tokenCount >= 2 ? 0.85 : 0.7;
    if (confidence < 0.85 && !exact) continue;

    if (
      !best ||
      patient.displayName.length > best.nameLen ||
      (patient.displayName.length === best.nameLen &&
        confidence > best.hit.confidence)
    ) {
      best = {
        patient,
        hit: { ...found, confidence },
        nameLen: patient.displayName.length,
      };
    }
  }

  // Light fuzzy fallback: significant name tokens appear in order.
  // Short particles (Al/El/De/…) may be omitted in casual typing.
  if (!best) {
    for (const patient of patients) {
      const allTokens = normalizeText(patient.displayName)
        .split(" ")
        .filter((token) => token.length > 0);
      const requiredTokens = allTokens.filter(
        (token) => !SKIPPABLE_NAME_PARTICLES.has(token),
      );
      if (requiredTokens.length < 2) continue;

      let cursor = 0;
      let firstStart = -1;
      let lastEnd = -1;
      let ok = true;
      for (const token of requiredTokens) {
        const idx = textNorm.indexOf(token, cursor);
        if (idx < 0) {
          ok = false;
          break;
        }
        if (firstStart < 0) firstStart = idx;
        lastEnd = idx + token.length;
        cursor = lastEnd;
      }
      if (!ok || firstStart < 0 || lastEnd < 0) continue;

      // Prefer contiguous phrase; otherwise span from first→last required token.
      const contiguous = findNormalizedPhrase(
        textNorm,
        text,
        requiredTokens.join(" "),
      );
      const found =
        contiguous ??
        findNormalizedPhrase(
          textNorm,
          text,
          textNorm.slice(firstStart, lastEnd),
        );
      if (!found) continue;
      if (overlapsSpan(found.start, found.end, used)) continue;

      const skippedParticle = requiredTokens.length < allTokens.length;
      const confidence = skippedParticle ? 0.7 : 0.65;

      if (
        !best ||
        patient.displayName.length > best.nameLen ||
        (patient.displayName.length === best.nameLen &&
          confidence > best.hit.confidence)
      ) {
        best = {
          patient,
          hit: { ...found, confidence },
          nameLen: patient.displayName.length,
        };
      }
    }
  }

  return best ? { patient: best.patient, hit: best.hit } : null;
}

/** Boilerplate type names that often appear as prose, not the clinical type. */
const GENERIC_TYPE_NAMES = new Set([
  "appointment",
  "visit",
  "checkup",
  "check up",
  "new",
  "other",
  "general",
]);

function extractType(
  text: string,
  textNorm: string,
  types: QuickAddNamedCandidate[],
  used: QuickAddMatchSpan[],
): { id: string; hit: SpanHit } | null {
  type Candidate = {
    id: string;
    hit: SpanHit;
    nameLen: number;
    generic: boolean;
  };
  const hits: Candidate[] = [];

  for (const type of types) {
    for (const name of type.names) {
      const nameNorm = normalizeText(name);
      if (!nameNorm) continue;
      const generic = GENERIC_TYPE_NAMES.has(nameNorm);

      // Whole-word / phrase match (avoid matching inside longer words).
      const found = findNormalizedPhrase(textNorm, text, nameNorm);
      if (
        found &&
        !overlapsSpan(found.start, found.end, used) &&
        isWholePhraseBoundary(text, found.start, found.end)
      ) {
        hits.push({
          id: type.id,
          hit: { ...found, confidence: 1 },
          nameLen: nameNorm.length,
          generic,
        });
        continue;
      }

      // Unique short alias / prefix (>= 3 chars) as whole token.
      if (nameNorm.length >= 3) {
        const alias = nameNorm.split(" ")[0] ?? nameNorm;
        if (alias.length >= 3) {
          const aliasFound = findNormalizedPhrase(textNorm, text, alias);
          if (
            aliasFound &&
            !overlapsSpan(aliasFound.start, aliasFound.end, used) &&
            isWholePhraseBoundary(text, aliasFound.start, aliasFound.end)
          ) {
            hits.push({
              id: type.id,
              hit: { ...aliasFound, confidence: 0.8 },
              nameLen: alias.length,
              generic: GENERIC_TYPE_NAMES.has(alias),
            });
          }
        }
      }
    }
  }

  const accepted = hits.filter((hit) => hit.hit.confidence >= 0.8);
  if (accepted.length === 0) return null;

  // Keep the best hit per type id.
  const bestByType = new Map<string, Candidate>();
  for (const hit of accepted) {
    const prev = bestByType.get(hit.id);
    if (
      !prev ||
      hit.hit.confidence > prev.hit.confidence ||
      (hit.hit.confidence === prev.hit.confidence &&
        hit.nameLen > prev.nameLen)
    ) {
      bestByType.set(hit.id, hit);
    }
  }

  const unique = [...bestByType.values()];
  const preferred = unique.filter((hit) => !hit.generic);
  const pool = preferred.length > 0 ? preferred : unique;

  // Prefer later mention among the remaining candidates (clinical type often
  // comes after boilerplate like "New appointment").
  pool.sort(
    (a, b) =>
      b.hit.start - a.hit.start ||
      b.hit.confidence - a.hit.confidence ||
      b.nameLen - a.nameLen,
  );
  const top = pool[0];
  return top ? { id: top.id, hit: top.hit } : null;
}

function isWholePhraseBoundary(
  text: string,
  start: number,
  end: number,
): boolean {
  const before = start > 0 ? text[start - 1] : " ";
  const after = end < text.length ? text[end] : " ";
  const boundary = /[^A-Za-z0-9]/;
  return boundary.test(before ?? " ") && boundary.test(after ?? " ");
}

function deriveSubject(
  original: string,
  spans: QuickAddMatchSpan[],
  patient: QuickAddPatientCandidate | null,
): string {
  if (patient) {
    return [patient.displayName, patient.phoneNumber?.trim()]
      .filter(Boolean)
      .join(" ");
  }

  // Strip structural matches including type so leftovers stay clean
  // (e.g. "Random Person cleaning at 2pm" → "Random Person").
  const removable = spans.filter(
    (span) =>
      span.kind === "time" ||
      span.kind === "date" ||
      span.kind === "location" ||
      span.kind === "patient" ||
      span.kind === "type",
  );
  const sorted = [...removable].sort((a, b) => b.start - a.start);
  let remaining = original;
  for (const span of sorted) {
    remaining = remaining.slice(0, span.start) + remaining.slice(span.end);
  }

  remaining = collapseWhitespace(
    remaining
      .replace(/\b(?:at|in|on|for|with|see|this|next|today|tomorrow)\b/gi, " ")
      .replace(/[|,/:]+/g, " "),
  );

  if (remaining.length < 2) {
    return collapseWhitespace(original);
  }
  return remaining;
}

/** Deterministic freeform quick-add parser (date → time → location → patient → type → subject). */
export function parseQuickAddAppointment({
  text,
  patients,
  types,
  locations,
  startHour,
  endHour,
  referenceDayKey,
}: ParseQuickAddAppointmentArgs): ParsedQuickAdd {
  const original = collapseWhitespace(text);
  const textNorm = normalizeText(original);
  const matchedSpans: QuickAddMatchSpan[] = [];
  const confidence = {
    patient: 0,
    type: 0,
    location: 0,
    time: 0,
    date: 0,
  };

  let preferredDayKey: DayKey | null = null;
  let preferredStartMinutes: number | null = null;
  let patientId: string | null = null;
  let typeId: string | null = null;
  let locationId: string | null = null;
  let matchedPatient: QuickAddPatientCandidate | null = null;

  const dateHit = extractDate(original, referenceDayKey);
  if (dateHit) {
    preferredDayKey = dateHit.dayKey;
    confidence.date = dateHit.confidence;
    matchedSpans.push({
      kind: "date",
      start: dateHit.start,
      end: dateHit.end,
    });
  }

  const timeHit = extractTime(original, startHour, endHour);
  if (timeHit) {
    preferredStartMinutes = timeHit.minutes;
    confidence.time = timeHit.confidence;
    matchedSpans.push({
      kind: "time",
      start: timeHit.start,
      end: timeHit.end,
    });
  }

  const locationHit = extractLocation(
    original,
    textNorm,
    locations,
    matchedSpans,
  );
  if (locationHit) {
    locationId = locationHit.id;
    confidence.location = locationHit.hit.confidence;
    matchedSpans.push({
      kind: "location",
      start: locationHit.hit.start,
      end: locationHit.hit.end,
    });
  }

  const patientHit = extractPatient(
    original,
    textNorm,
    patients,
    matchedSpans,
  );
  if (patientHit) {
    matchedPatient = patientHit.patient;
    patientId = patientHit.patient.id;
    confidence.patient = patientHit.hit.confidence;
    matchedSpans.push({
      kind: "patient",
      start: patientHit.hit.start,
      end: patientHit.hit.end,
    });
  }

  const typeHit = extractType(original, textNorm, types, matchedSpans);
  if (typeHit) {
    typeId = typeHit.id;
    confidence.type = typeHit.hit.confidence;
    matchedSpans.push({
      kind: "type",
      start: typeHit.hit.start,
      end: typeHit.hit.end,
    });
  }

  return {
    subject: deriveSubject(original, matchedSpans, matchedPatient),
    patientId,
    typeId,
    locationId,
    preferredDayKey,
    preferredStartMinutes,
    matchedSpans,
    confidence,
  };
}

export function findFirstFreeSlotMinutes(
  events: Array<{ startTime: number; endTime: number }>,
  startHour: number,
  endHour: number,
  durationMinutes: number,
  dayStartMs: number,
): number {
  const { startMinutes, endMinutes } = workingWindowMinutes(
    startHour,
    endHour,
  );
  const maxStart = endMinutes - durationMinutes;

  const overlaps = (start: number, end: number) =>
    events.some((event) => {
      const eventStart = (event.startTime - dayStartMs) / 60_000;
      const eventEnd = (event.endTime - dayStartMs) / 60_000;
      return start < eventEnd && end > eventStart;
    });

  for (
    let start = startMinutes;
    start <= maxStart;
    start += durationMinutes
  ) {
    if (!overlaps(start, start + durationMinutes)) {
      return start;
    }
  }

  return startMinutes;
}
