import { parseQuickAddAppointment } from "../src/helpers/parseQuickAddAppointment";
import { addDays, toDayKey, type DayKey } from "../src/utils/calendar";

const patients = [
  {
    id: "p-gabriel",
    displayName: "Gabriel Al Chabab",
    phoneNumber: "03123456",
  },
  {
    id: "p-sara",
    displayName: "Sara Haddad",
    phoneNumber: "70111222",
  },
  {
    id: "p-john",
    displayName: "John Smith",
    phoneNumber: null,
  },
  {
    id: "p-marie",
    displayName: "Marie Claire",
    phoneNumber: "03999888",
  },
];

const types = [
  { id: "t-endo", names: ["Endo", "Endodontics"] },
  { id: "t-cleaning", names: ["Cleaning"] },
  { id: "t-consult", names: ["Consultation", "Consult"] },
  { id: "t-ortho", names: ["Ortho", "Orthodontics"] },
  // Common real-world type that collides with prose like "New appointment…"
  { id: "t-appointment", names: ["Appointment"] },
];

const locations = [
  { id: "l-beirut", names: ["Beirut"] },
  { id: "l-dbayeh", names: ["Dbayeh"] },
  { id: "l-achrafieh", names: ["Achrafieh"] },
];

const startHour = 8;
const endHour = 18;

/** Fixed anchor: Wednesday 2026-08-19 — makes "this Friday" → 2026-08-21. */
const REFERENCE_DAY_KEY = "2026-08-19" as DayKey;
const THIS_FRIDAY = toDayKey(
  addDays(
    { year: 2026, month: 7, day: 19 },
    2,
  ),
); // Fri Aug 21
const TOMORROW = toDayKey({ year: 2026, month: 7, day: 20 });

type Expectation = {
  patientId?: string | null;
  typeId?: string | null;
  locationId?: string | null;
  dayKey?: DayKey | null;
  /** minutes from midnight, or null if none expected */
  minutes?: number | null;
  /** substring that subject should contain / exact when `subjectExact` */
  subjectIncludes?: string;
  subjectExact?: string;
};

const cases: Array<{
  name: string;
  text: string;
  expect: Expectation;
}> = [
  {
    name: "canonical example",
    text: "Gabriel Al Chabab Endo appointment at 3PM, Beirut",
    expect: {
      patientId: "p-gabriel",
      typeId: "t-endo",
      locationId: "l-beirut",
      minutes: 15 * 60,
      subjectExact: "Gabriel Al Chabab 03123456",
    },
  },
  {
    name: "lowercase time am",
    text: "Sara Haddad cleaning at 9am in Dbayeh",
    expect: {
      patientId: "p-sara",
      typeId: "t-cleaning",
      locationId: "l-dbayeh",
      minutes: 9 * 60,
      subjectExact: "Sara Haddad 70111222",
    },
  },
  {
    name: "24h time",
    text: "John Smith consultation at 14:30 Achrafieh",
    expect: {
      patientId: "p-john",
      typeId: "t-consult",
      locationId: "l-achrafieh",
      minutes: 14 * 60 + 30,
      subjectExact: "John Smith",
    },
  },
  {
    name: "bare at hour (should prefer working-hours)",
    text: "Gabriel Al Chabab at 3, Beirut",
    expect: {
      patientId: "p-gabriel",
      locationId: "l-beirut",
      minutes: 15 * 60, // 3am outside window → prefer 3pm
      subjectExact: "Gabriel Al Chabab 03123456",
    },
  },
  {
    name: "time only + subject leftover",
    text: "Follow up at 10:00 AM",
    expect: {
      patientId: null,
      typeId: null,
      locationId: null,
      minutes: 10 * 60,
      subjectIncludes: "Follow up",
    },
  },
  {
    name: "patient only",
    text: "Marie Claire",
    expect: {
      patientId: "p-marie",
      minutes: null,
      subjectExact: "Marie Claire 03999888",
    },
  },
  {
    name: "type + location no patient",
    text: "Ortho appointment in Beirut",
    expect: {
      patientId: null,
      typeId: "t-ortho",
      locationId: "l-beirut",
      minutes: null,
      subjectExact: "appointment",
    },
  },
  {
    name: "pm with space",
    text: "Sara Haddad at 4 PM",
    expect: {
      patientId: "p-sara",
      minutes: 16 * 60,
      subjectExact: "Sara Haddad 70111222",
    },
  },
  {
    name: "messy commas and extra words",
    text: "see Gabriel Al Chabab for Endo, tomorrow-ish at 11am, Beirut clinic",
    expect: {
      patientId: "p-gabriel",
      typeId: "t-endo",
      locationId: "l-beirut",
      minutes: 11 * 60,
      subjectExact: "Gabriel Al Chabab 03123456",
    },
  },
  {
    name: "unknown person keeps cleaned subject",
    text: "Random Person cleaning at 2pm in Dbayeh",
    expect: {
      patientId: null,
      typeId: "t-cleaning",
      locationId: "l-dbayeh",
      minutes: 14 * 60,
      subjectExact: "Random Person",
    },
  },
  {
    name: "partial first name should not match multi-token patient",
    text: "Gabriel cleaning at 9am",
    expect: {
      patientId: null, // only first name — inclusion requires full multi-token name at >=0.85
      typeId: "t-cleaning",
      minutes: 9 * 60,
      subjectExact: "Gabriel",
    },
  },
  {
    name: "missing middle particle still fuzzy-matches",
    text: "Gabriel Chabab Endo at 3pm Beirut",
    expect: {
      // "Al" is a skippable particle; Gabriel + Chabab is enough.
      patientId: "p-gabriel",
      typeId: "t-endo",
      locationId: "l-beirut",
      minutes: 15 * 60,
      subjectExact: "Gabriel Al Chabab 03123456",
    },
  },
  {
    name: "full type name Endodontics",
    text: "Sara Haddad Endodontics at 10am Beirut",
    expect: {
      patientId: "p-sara",
      typeId: "t-endo",
      locationId: "l-beirut",
      minutes: 10 * 60,
      subjectExact: "Sara Haddad 70111222",
    },
  },
  {
    name: "with-preposition patient",
    text: "Endo with Gabriel Al Chabab at 2pm in Achrafieh",
    expect: {
      patientId: "p-gabriel",
      typeId: "t-endo",
      locationId: "l-achrafieh",
      minutes: 14 * 60,
      subjectExact: "Gabriel Al Chabab 03123456",
    },
  },
  {
    name: "noon supported",
    text: "John Smith at noon Beirut",
    expect: {
      patientId: "p-john",
      locationId: "l-beirut",
      minutes: 12 * 60,
      subjectExact: "John Smith",
    },
  },
  {
    name: "midnight supported",
    text: "John Smith at midnight Beirut",
    expect: {
      patientId: "p-john",
      locationId: "l-beirut",
      minutes: 0,
      subjectExact: "John Smith",
    },
  },
  {
    name: "tomorrow relative date",
    text: "Gabriel Al Chabab tomorrow at 3pm Beirut",
    expect: {
      patientId: "p-gabriel",
      locationId: "l-beirut",
      dayKey: TOMORROW,
      minutes: 15 * 60,
      subjectExact: "Gabriel Al Chabab 03123456",
    },
  },
  {
    name: "only location",
    text: "Beirut",
    expect: {
      patientId: null,
      locationId: "l-beirut",
      minutes: null,
      // location removed → empty cleanup falls back to original
      subjectExact: "Beirut",
    },
  },
  {
    name: "time glued after at",
    text: "Sara Haddad cleaning at3pm Dbayeh",
    expect: {
      patientId: "p-sara",
      typeId: "t-cleaning",
      locationId: "l-dbayeh",
      minutes: 15 * 60,
      subjectExact: "Sara Haddad 70111222",
    },
  },
  {
    name: "hour with minutes and pm",
    text: "Marie Claire at 3:45pm in Beirut",
    expect: {
      patientId: "p-marie",
      locationId: "l-beirut",
      minutes: 15 * 60 + 45,
      subjectExact: "Marie Claire 03999888",
    },
  },
  {
    name: "consult alias",
    text: "John Smith consult at 8am",
    expect: {
      patientId: "p-john",
      typeId: "t-consult",
      minutes: 8 * 60,
      subjectExact: "John Smith",
    },
  },
  {
    name: "location first",
    text: "Beirut: Gabriel Al Chabab Endo at 5pm",
    expect: {
      patientId: "p-gabriel",
      typeId: "t-endo",
      locationId: "l-beirut",
      minutes: 17 * 60,
      subjectExact: "Gabriel Al Chabab 03123456",
    },
  },
  {
    name: "no entities",
    text: "quick checkup",
    expect: {
      patientId: null,
      typeId: null,
      locationId: null,
      minutes: null,
      subjectExact: "quick checkup",
    },
  },
  {
    name: "a.m. with dots",
    text: "Sara Haddad at 9:15 a.m. Dbayeh",
    expect: {
      patientId: "p-sara",
      locationId: "l-dbayeh",
      minutes: 9 * 60 + 15,
      subjectExact: "Sara Haddad 70111222",
    },
  },
  {
    name: "evening outside window still parses explicit pm",
    text: "John Smith at 8pm Beirut",
    expect: {
      patientId: "p-john",
      locationId: "l-beirut",
      minutes: 20 * 60,
      subjectExact: "John Smith",
    },
  },
  {
    name: "mixed case / spacing",
    text: "GABRIEL AL CHABAB endo AT 3Pm , beirut",
    expect: {
      patientId: "p-gabriel",
      typeId: "t-endo",
      locationId: "l-beirut",
      minutes: 15 * 60,
      subjectExact: "Gabriel Al Chabab 03123456",
    },
  },
  {
    name: "user report: New appointment + endo (Appointment type exists)",
    text: "New appointment, Gabriel al chabab endo at 3pm, Beirut clinic.",
    expect: {
      patientId: "p-gabriel",
      typeId: "t-endo",
      locationId: "l-beirut",
      dayKey: null,
      minutes: 15 * 60,
      subjectExact: "Gabriel Al Chabab 03123456",
    },
  },
  {
    name: "user report: This friday + endo at 11",
    text: "This friday, endo appointment for gabriel al chabab at 11",
    expect: {
      patientId: "p-gabriel",
      typeId: "t-endo",
      dayKey: THIS_FRIDAY,
      minutes: 11 * 60,
      subjectExact: "Gabriel Al Chabab 03123456",
    },
  },
  {
    name: "next monday",
    text: "John Smith cleaning next monday at 9am",
    expect: {
      patientId: "p-john",
      typeId: "t-cleaning",
      dayKey: toDayKey({ year: 2026, month: 7, day: 24 }), // Mon Aug 24 from Wed 19
      minutes: 9 * 60,
      subjectExact: "John Smith",
    },
  },
];

function formatMinutes(minutes: number | null): string {
  if (minutes == null) return "null";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} (${minutes})`;
}

function check(
  actual: ReturnType<typeof parseQuickAddAppointment>,
  expectation: Expectation,
): string[] {
  const failures: string[] = [];

  if ("patientId" in expectation && actual.patientId !== expectation.patientId) {
    failures.push(
      `patientId: expected ${expectation.patientId}, got ${actual.patientId}`,
    );
  }
  if ("typeId" in expectation && actual.typeId !== expectation.typeId) {
    failures.push(`typeId: expected ${expectation.typeId}, got ${actual.typeId}`);
  }
  if (
    "locationId" in expectation &&
    actual.locationId !== expectation.locationId
  ) {
    failures.push(
      `locationId: expected ${expectation.locationId}, got ${actual.locationId}`,
    );
  }
  if ("dayKey" in expectation && actual.preferredDayKey !== expectation.dayKey) {
    failures.push(
      `dayKey: expected ${expectation.dayKey}, got ${actual.preferredDayKey}`,
    );
  }
  if (
    "minutes" in expectation &&
    actual.preferredStartMinutes !== expectation.minutes
  ) {
    failures.push(
      `time: expected ${formatMinutes(expectation.minutes ?? null)}, got ${formatMinutes(actual.preferredStartMinutes)}`,
    );
  }
  if (
    expectation.subjectExact != null &&
    actual.subject !== expectation.subjectExact
  ) {
    failures.push(
      `subject: expected "${expectation.subjectExact}", got "${actual.subject}"`,
    );
  }
  if (
    expectation.subjectIncludes != null &&
    !actual.subject
      .toLowerCase()
      .includes(expectation.subjectIncludes.toLowerCase())
  ) {
    failures.push(
      `subject: expected to include "${expectation.subjectIncludes}", got "${actual.subject}"`,
    );
  }

  return failures;
}

let passed = 0;
let failed = 0;

for (const testCase of cases) {
  const result = parseQuickAddAppointment({
    text: testCase.text,
    patients,
    types,
    locations,
    startHour,
    endHour,
    referenceDayKey: REFERENCE_DAY_KEY,
  });
  const failures = check(result, testCase.expect);

  if (failures.length === 0) {
    passed += 1;
    console.log(`PASS  ${testCase.name}`);
    console.log(`      "${testCase.text}"`);
    console.log(
      `      → patient=${result.patientId} type=${result.typeId} location=${result.locationId} day=${result.preferredDayKey} time=${formatMinutes(result.preferredStartMinutes)} subject="${result.subject}"`,
    );
  } else {
    failed += 1;
    console.log(`FAIL  ${testCase.name}`);
    console.log(`      "${testCase.text}"`);
    console.log(
      `      → patient=${result.patientId} type=${result.typeId} location=${result.locationId} day=${result.preferredDayKey} time=${formatMinutes(result.preferredStartMinutes)} subject="${result.subject}" conf=${JSON.stringify(result.confidence)}`,
    );
    for (const failure of failures) {
      console.log(`      ✗ ${failure}`);
    }
  }
  console.log("");
}

console.log(`Summary: ${passed} passed, ${failed} failed, ${cases.length} total`);
process.exit(failed > 0 ? 1 : 0);
