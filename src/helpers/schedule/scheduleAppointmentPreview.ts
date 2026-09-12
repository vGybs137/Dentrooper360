import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import { pickLocalizedName } from "@/helpers/i18n/pickLocalizedName";
import {
  addDays,
  clipEventToDay,
  parseDayKey,
  toDayKey,
  WEEK_DAYS,
  type DayKey,
  type MonthKey,
} from "@/helpers/schedule/calendar";
import { t } from "@/i18n";
import type { AppLocale } from "@/i18n/locales";
import { getResolvedLocale } from "@/stores";
import type { MonthDayEventPreview } from "@/types/schedule";

export type AppointmentTypeLookup = Map<
  string,
  { color: string | null; name: string }
>;

export type MonthEventsByDay = Record<DayKey, MonthDayEventPreview[]>;
export type MonthAppointmentsCache = Record<MonthKey, MonthEventsByDay>;
export type WeekAppointmentsCache = Record<DayKey, MonthEventsByDay>;

export function buildAppointmentTypesMap(
  types: AppointmentType[],
  locale: AppLocale = getResolvedLocale(),
): AppointmentTypeLookup {
  const next = new Map<string, { color: string | null; name: string }>();
  for (const type of types) {
    next.set(type.id, {
      color: type.color || null,
      name: pickLocalizedName(type, locale),
    });
  }
  return next;
}

export function toAppointmentPreview(
  appointment: Appointment,
  types: AppointmentTypeLookup,
): MonthDayEventPreview {
  const typeId = appointment.type.id;
  const type = typeId ? types.get(typeId) : undefined;
  return {
    id: appointment.id,
    title:
      appointment.subject?.trim() || t("schedule:add.defaultSubject"),
    color: type?.color ?? null,
    typeName: type?.name ? type.name : null,
    startTime: appointment.startTime.getTime(),
    endTime: appointment.endTime.getTime(),
  };
}

export function buildMonthDayMap(
  appointments: Appointment[],
  types: AppointmentTypeLookup,
): MonthEventsByDay {
  const sorted = [...appointments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
  const map: MonthEventsByDay = {};

  for (const appointment of sorted) {
    const dayKey = toDayKey(appointment.startTime);
    const bucket = map[dayKey] ?? (map[dayKey] = []);
    bucket.push(toAppointmentPreview(appointment, types));
  }

  return map;
}

export function buildWeekDayMap(
  appointments: Appointment[],
  types: AppointmentTypeLookup,
  weekStartKey: DayKey,
): MonthEventsByDay {
  const sorted = [...appointments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
  const weekStart = parseDayKey(weekStartKey);
  const map: MonthEventsByDay = {};

  for (const appointment of sorted) {
    const preview = toAppointmentPreview(appointment, types);
    const startMs = appointment.startTime.getTime();
    const endMs = appointment.endTime.getTime();

    for (let offset = 0; offset < WEEK_DAYS; offset++) {
      const dayKey = toDayKey(addDays(weekStart, offset));
      if (!clipEventToDay(startMs, endMs, dayKey)) continue;

      const bucket = map[dayKey] ?? (map[dayKey] = []);
      if (bucket.some((event) => event.id === preview.id)) continue;
      bucket.push(preview);
    }
  }

  return map;
}
