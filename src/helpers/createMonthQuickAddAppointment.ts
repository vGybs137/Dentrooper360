import { Q } from "@nozbe/watermelondb";
import dayjs from "dayjs";
import { Alert } from "react-native";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import type Location from "@/database/models/Location";
import type Patient from "@/database/models/Patient";
import { generateGuid } from "@/helpers/guid";
import {
  findFirstFreeSlotMinutes,
  parseQuickAddAppointment,
  type QuickAddNamedCandidate,
  type QuickAddPatientCandidate,
} from "@/helpers/parseQuickAddAppointment";
import { formatPatientName } from "@/helpers/patientDisplay";
import { requestSync } from "@/helpers/requestSync";
import { ADD_APPOINTMENT_SLOT_DURATION_MINUTES } from "@/stores/addAppointmentStore";
import { resolveDefaultLocationId } from "@/stores/schedulePreferencesStore";
import type { MonthDayEventPreview } from "@/types/schedule";
import {
  MINUTES_PER_HOUR,
  parseDayKey,
  toLocalDate,
  type DayKey,
} from "@/utils/calendar";

export type CreateMonthQuickAddArgs = {
  text: string;
  dayKey: DayKey;
  events: MonthDayEventPreview[];
  providerId: string;
  startHour: number;
  endHour: number;
};

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
  startHour,
  endHour,
}: CreateMonthQuickAddArgs): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const { patients, types, locations, fallbackLocationId } =
    await loadLookups();

  if (!fallbackLocationId) {
    Alert.alert(
      "Unable to add appointment",
      "No locations are available. Add a location first.",
    );
    return false;
  }

  const parsed = parseQuickAddAppointment({
    text: trimmed,
    patients,
    types,
    locations,
    startHour,
    endHour,
  });

  const resolvedDayKey = parsed.preferredDayKey ?? dayKey;
  const dayStartMs = toLocalDate(parseDayKey(resolvedDayKey)).getTime();

  const dayEvents =
    resolvedDayKey === dayKey
      ? events
      : await loadDayEventTimes(resolvedDayKey, providerId);

  const startMinutes =
    parsed.preferredStartMinutes ??
    findFirstFreeSlotMinutes(
      dayEvents,
      startHour,
      endHour,
      ADD_APPOINTMENT_SLOT_DURATION_MINUTES,
      dayStartMs,
    );

  const startTime = dateFromDayKeyAndMinutes(resolvedDayKey, startMinutes);
  const endTime = dayjs(startTime)
    .add(ADD_APPOINTMENT_SLOT_DURATION_MINUTES, "minute")
    .toDate();

  const locationId = parsed.locationId ?? fallbackLocationId;
  const subject = parsed.subject.trim() || trimmed;

  try {
    await database.write(async () => {
      await database.get<Appointment>("appointments").create((record) => {
        record._raw.id = generateGuid();
        record.providerId = providerId;
        record.patientId = parsed.patientId;
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
    return true;
  } catch (error) {
    Alert.alert(
      "Unable to add appointment",
      error instanceof Error ? error.message : "Please try again.",
    );
    return false;
  }
}
