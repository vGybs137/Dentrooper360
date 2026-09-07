import { Q } from "@nozbe/watermelondb";
import dayjs from "dayjs";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import type Location from "@/database/models/Location";
import type Patient from "@/database/models/Patient";
import { selectionOutsideWorkingHours } from "@/helpers/dayFreeHours";
import { generateGuid } from "@/helpers/guid";
import {
  findFirstFreeSlotMinutes,
  parseQuickAddAppointment,
  type QuickAddNamedCandidate,
  type QuickAddPatientCandidate,
} from "@/helpers/parseQuickAddAppointment";
import { formatPatientName } from "@/helpers/patientDisplay";
import { requestSync } from "@/helpers/requestSync";
import type { ScheduleHourRange } from "@/helpers/scheduleHours";
import { ADD_APPOINTMENT_SLOT_DURATION_MINUTES } from "@/stores/addAppointmentStore";
import { resolveDefaultLocationId } from "@/stores/schedulePreferencesStore";
import type { MonthDayEventPreview } from "@/types/schedule";
import {
  MINUTES_PER_HOUR,
  parseDayKey,
  toLocalDate,
  type DayKey,
} from "@/utils/calendar";

const OUTSIDE_WORKING_DAY_MESSAGE =
  "This day is outside your working days.";
const OUTSIDE_WORKING_HOURS_MESSAGE =
  "This time is outside your working hours for this day.";

export type CreateMonthQuickAddArgs = {
  text: string;
  dayKey: DayKey;
  events: MonthDayEventPreview[];
  providerId: string;
  /** Hours used to disambiguate bare times while parsing. */
  parseStartHour: number;
  parseEndHour: number;
  /** Resolve working hours for the targeted day (null = closed). */
  hoursForDayKey: (dayKey: DayKey) => ScheduleHourRange | null;
  /** When set (e.g. from suggestion picker), wins over parser patient match. */
  patientId?: string | null;
};

export type CreateMonthQuickAddResult =
  | { ok: true }
  | { ok: false; title: string; message: string };

function failure(title: string, message: string): CreateMonthQuickAddResult {
  return { ok: false, title, message };
}

function dateFromDayKeyAndMinutes(dayKey: DayKey, minutes: number): Date {
  const date = toLocalDate(parseDayKey(dayKey));
  date.setHours(
    Math.floor(minutes / MINUTES_PER_HOUR),
    minutes % MINUTES_PER_HOUR,
    0,
    0,
  );
  return date;
}

function toNamedCandidate(
  id: string,
  nameEn: string,
  nameAr: string | null,
  nameFr: string | null,
): QuickAddNamedCandidate {
  const names = [nameEn, nameAr, nameFr]
    .map((name) => name?.trim() ?? "")
    .filter(Boolean);
  return { id, names: names.length > 0 ? names : [nameEn].filter(Boolean) };
}

async function loadLookups(): Promise<{
  patients: QuickAddPatientCandidate[];
  types: QuickAddNamedCandidate[];
  locations: QuickAddNamedCandidate[];
  fallbackLocationId: string | null;
}> {
  const [patientRecords, typeRecords, locationRecords] = await Promise.all([
    database
      .get<Patient>("patients")
      .query(Q.where("is_active", true))
      .fetch(),
    database.get<AppointmentType>("appointment_types").query().fetch(),
    database.get<Location>("locations").query().fetch(),
  ]);

  const patients: QuickAddPatientCandidate[] = patientRecords
    .map((patient) => ({
      id: patient.id,
      displayName: formatPatientName(patient) || "Unnamed patient",
      phoneNumber: patient.phoneNumber?.trim() || null,
    }))
    .filter((patient) => patient.displayName.trim().length > 0);

  const types = typeRecords.map((type) =>
    toNamedCandidate(type.id, type.nameEn, type.nameAr, type.nameFr),
  );

  const locations = locationRecords
    .map((location) =>
      toNamedCandidate(
        location.id,
        location.nameEn,
        location.nameAr,
        location.nameFr,
      ),
    )
    .sort((a, b) => {
      const aName = a.names[0] ?? "";
      const bName = b.names[0] ?? "";
      return aName.localeCompare(bName);
    });

  const fallbackLocationId = resolveDefaultLocationId(
    locations.map((location) => location.id),
  );

  return { patients, types, locations, fallbackLocationId };
}

async function loadDayEventTimes(
  dayKey: DayKey,
  providerId: string,
): Promise<Array<{ startTime: number; endTime: number }>> {
  const dayStart = toLocalDate(parseDayKey(dayKey));
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const appointments = await database
    .get<Appointment>("appointments")
    .query(
      Q.where("provider_id", providerId),
      Q.where("start_time", Q.gte(dayStart.getTime())),
      Q.where("start_time", Q.lt(dayEnd.getTime())),
    )
    .fetch();

  return appointments.map((appointment) => ({
    startTime: appointment.startTime.getTime(),
    endTime: appointment.endTime.getTime(),
  }));
}

/** Parse freeform text and create an appointment for the selected month day. */
export async function createMonthQuickAddAppointment({
  text,
  dayKey,
  events,
  providerId,
  parseStartHour,
  parseEndHour,
  hoursForDayKey,
  patientId: forcedPatientId = null,
}: CreateMonthQuickAddArgs): Promise<CreateMonthQuickAddResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return failure("Unable to add appointment", "Enter an appointment subject.");
  }

  const { patients, types, locations, fallbackLocationId } =
    await loadLookups();

  if (!fallbackLocationId) {
    return failure(
      "Unable to add appointment",
      "No locations are available. Add a location first.",
    );
  }

  const parsed = parseQuickAddAppointment({
    text: trimmed,
    patients,
    types,
    locations,
    startHour: parseStartHour,
    endHour: parseEndHour,
    referenceDayKey: dayKey,
  });

  const resolvedDayKey = parsed.preferredDayKey ?? dayKey;
  const dayStartMs = toLocalDate(parseDayKey(resolvedDayKey)).getTime();
  const targetHours = hoursForDayKey(resolvedDayKey);

  if (!targetHours) {
    return failure("Unable to add appointment", OUTSIDE_WORKING_DAY_MESSAGE);
  }

  const dayEvents =
    resolvedDayKey === dayKey
      ? events
      : await loadDayEventTimes(resolvedDayKey, providerId);

  const startMinutes =
    parsed.preferredStartMinutes ??
    findFirstFreeSlotMinutes(
      dayEvents,
      targetHours.startHour,
      targetHours.endHour,
      ADD_APPOINTMENT_SLOT_DURATION_MINUTES,
      dayStartMs,
    );

  const startTime = dateFromDayKeyAndMinutes(resolvedDayKey, startMinutes);
  const endTime = dayjs(startTime)
    .add(ADD_APPOINTMENT_SLOT_DURATION_MINUTES, "minute")
    .toDate();

  if (
    selectionOutsideWorkingHours(
      startTime.getTime(),
      endTime.getTime(),
      dayStartMs,
      targetHours,
    )
  ) {
    return failure("Unable to add appointment", OUTSIDE_WORKING_HOURS_MESSAGE);
  }

  const locationId = parsed.locationId ?? fallbackLocationId;
  const subject = parsed.subject.trim() || trimmed;
  const patientId = forcedPatientId || parsed.patientId;

  try {
    await database.write(async () => {
      await database.get<Appointment>("appointments").create((record) => {
        record._raw.id = generateGuid();
        record.providerId = providerId;
        record.patientId = patientId;
        record.typeId = parsed.typeId;
        record.locationId = locationId;
        record.subject = subject;
        record.status = "New";
        record.description = null;
        record.startTime = startTime;
        record.endTime = endTime;
      });
    });
    requestSync();
    return { ok: true };
  } catch (error) {
    return failure(
      "Unable to add appointment",
      error instanceof Error ? error.message : "Please try again.",
    );
  }
}
