import { Q } from "@nozbe/watermelondb";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import {
  buildAppointmentTypesMap,
  buildMonthDayMap,
  buildWeekDayMap,
  type AppointmentTypeLookup,
  type MonthAppointmentsCache,
  type WeekAppointmentsCache,
} from "@/helpers/scheduleAppointmentPreview";
import { useAuthStore } from "@/stores/authStore";
import { useSchedulePreferencesStore } from "@/stores/schedulePreferencesStore";
import {
  addMonths,
  addWeeks,
  startOfMonthDate,
  startOfNextMonthDate,
  toDayKey,
  toLocalDate,
  toMonthKey,
  toYearMonth,
  weekStartDayKey,
  parseDayKey,
  WEEK_DAYS,
  type DayKey,
  type MonthKey,
  type YearMonth,
} from "@/utils/calendar";

/** Matches {@link useMonthAppointmentsCache} subscribe window. */
const PREFETCH_MONTH_RADIUS = 1;
/** Don't block splash if preferences persist is slow. */
const PREFS_HYDRATE_TIMEOUT_MS = 400;

function waitForSchedulePreferencesHydrated(): Promise<void> {
  if (useSchedulePreferencesStore.getState().hasHydrated) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let unsubscribe = () => {};
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve();
    }, PREFS_HYDRATE_TIMEOUT_MS);

    unsubscribe = useSchedulePreferencesStore.subscribe((state) => {
      if (!state.hasHydrated) return;
      clearTimeout(timeout);
      unsubscribe();
      resolve();
    });
  });
}

export type ScheduleAppointmentsPrefetchSnapshot = {
  providerId: string;
  types: AppointmentTypeLookup;
  monthCache: MonthAppointmentsCache;
  weekCache: WeekAppointmentsCache;
  appointmentsByMonth: Map<MonthKey, Appointment[]>;
  appointmentsByWeek: Map<DayKey, Appointment[]>;
};

let snapshot: ScheduleAppointmentsPrefetchSnapshot | null = null;
let inflight: Promise<ScheduleAppointmentsPrefetchSnapshot | null> | null =
  null;
let inflightProviderId: string | null = null;

export function getScheduleAppointmentsPrefetch(
  providerId: string | null | undefined,
): ScheduleAppointmentsPrefetchSnapshot | null {
  if (!providerId || snapshot?.providerId !== providerId) {
    return null;
  }
  return snapshot;
}

export function clearScheduleAppointmentsPrefetch(providerId?: string): void {
  if (providerId === undefined) {
    snapshot = null;
    inflight = null;
    inflightProviderId = null;
    return;
  }

  if (snapshot?.providerId === providerId) {
    snapshot = null;
  }
  if (inflightProviderId === providerId) {
    inflight = null;
    inflightProviderId = null;
  }
}

async function fetchAppointmentTypesMap(): Promise<AppointmentTypeLookup> {
  const types = await database
    .get<AppointmentType>("appointment_types")
    .query()
    .fetch();
  return buildAppointmentTypesMap(types);
}

async function fetchMonthAppointments(
  providerId: string,
  yearMonth: YearMonth,
): Promise<Appointment[]> {
  const startMs = startOfMonthDate(yearMonth).getTime();
  const endMs = startOfNextMonthDate(yearMonth).getTime();

  return database
    .get<Appointment>("appointments")
    .query(
      Q.where("provider_id", providerId),
      Q.where("start_time", Q.gte(startMs)),
      Q.where("start_time", Q.lt(endMs)),
    )
    .fetch();
}

async function fetchWeekAppointments(
  providerId: string,
  weekStartKey: DayKey,
): Promise<Appointment[]> {
  const weekStartMs = toLocalDate(parseDayKey(weekStartKey)).getTime();
  const weekEndMs = weekStartMs + WEEK_DAYS * 24 * 60 * 60 * 1000;

  return database
    .get<Appointment>("appointments")
    .query(
      Q.where("provider_id", providerId),
      Q.where("start_time", Q.gte(weekStartMs)),
      Q.where("start_time", Q.lt(weekEndMs)),
    )
    .fetch();
}

/**
 * Load the schedule's initial month/week windows from WatermelonDB so the
 * calendar can render populated cells on first paint.
 */
export async function prefetchScheduleAppointments(
  providerId: string,
): Promise<ScheduleAppointmentsPrefetchSnapshot | null> {
  if (!providerId) {
    return null;
  }

  if (snapshot?.providerId === providerId) {
    return snapshot;
  }

  if (inflight && inflightProviderId === providerId) {
    return inflight;
  }

  inflightProviderId = providerId;
  inflight = (async () => {
    const weekStartsOn = useSchedulePreferencesStore.getState().weekStartsOn;
    const todayKey = toDayKey(new Date());
    const visibleMonth = toYearMonth(new Date());
    const visibleWeekStart = weekStartDayKey(todayKey, weekStartsOn);

    const monthTargets: YearMonth[] = [];
    for (
      let offset = -PREFETCH_MONTH_RADIUS;
      offset <= PREFETCH_MONTH_RADIUS;
      offset++
    ) {
      monthTargets.push(addMonths(visibleMonth, offset));
    }

    const weekTargets: DayKey[] = [
      addWeeks(visibleWeekStart, -1),
      visibleWeekStart,
      addWeeks(visibleWeekStart, 1),
    ];

    const [types, ...monthAndWeekResults] = await Promise.all([
      fetchAppointmentTypesMap(),
      ...monthTargets.map((yearMonth) =>
        fetchMonthAppointments(providerId, yearMonth),
      ),
      ...weekTargets.map((weekStartKey) =>
        fetchWeekAppointments(providerId, weekStartKey),
      ),
    ]);

    const monthAppointments = monthAndWeekResults.slice(
      0,
      monthTargets.length,
    ) as Appointment[][];
    const weekAppointments = monthAndWeekResults.slice(
      monthTargets.length,
    ) as Appointment[][];

    const appointmentsByMonth = new Map<MonthKey, Appointment[]>();
    const monthCache: MonthAppointmentsCache = {};

    for (let index = 0; index < monthTargets.length; index++) {
      const monthKey = toMonthKey(monthTargets[index]!);
      const appointments = monthAppointments[index] ?? [];
      appointmentsByMonth.set(monthKey, appointments);
      monthCache[monthKey] = buildMonthDayMap(appointments, types);
    }

    const appointmentsByWeek = new Map<DayKey, Appointment[]>();
    const weekCache: WeekAppointmentsCache = {};

    for (let index = 0; index < weekTargets.length; index++) {
      const weekStartKey = weekTargets[index]!;
      const appointments = weekAppointments[index] ?? [];
      appointmentsByWeek.set(weekStartKey, appointments);
      weekCache[weekStartKey] = buildWeekDayMap(
        appointments,
        types,
        weekStartKey,
      );
    }

    snapshot = {
      providerId,
      types,
      monthCache,
      weekCache,
      appointmentsByMonth,
      appointmentsByWeek,
    };

    return snapshot;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
    inflightProviderId = null;
  }
}

/** Prefetch the signed-in provider's visible schedule windows, if any. */
export async function prepareScheduleAppointments(): Promise<void> {
  const providerId = useAuthStore.getState().user?.id;
  if (!providerId) return;
  await waitForSchedulePreferencesHydrated();
  try {
    await prefetchScheduleAppointments(providerId);
  } catch {
    // Calendar observers still load after mount if the snapshot fails.
  }
}
