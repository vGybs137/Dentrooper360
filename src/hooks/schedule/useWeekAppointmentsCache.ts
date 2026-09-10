import { Q } from "@nozbe/watermelondb";
import { useDatabase } from "@nozbe/watermelondb/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MonthDayEventPreview } from "@/types/schedule";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import { getScheduleAppointmentsPrefetch } from "@/helpers/schedule/prefetchScheduleAppointments";
import {
  buildAppointmentTypesMap,
  buildWeekDayMap,
  type AppointmentTypeLookup,
  type MonthEventsByDay,
  type WeekAppointmentsCache,
} from "@/helpers/schedule/scheduleAppointmentPreview";
import {
  APPOINTMENT_WINDOW_OBSERVE_COLUMNS,
  APPOINTMENTS_CACHE_LOADER_DELAY_MS,
} from "@/hooks/schedule/appointmentsWindowCacheShared";
import { useAuthUser } from "@/stores/authStore";
import {
  addWeeks,
  parseDayKey,
  toLocalDate,
  WEEK_DAYS,
  type DayKey,
} from "@/helpers/schedule/calendar";

type SubscriptionLike = { unsubscribe: () => void };

/** Week-start day key (same ISO day string as {@link DayKey}). */
export type WeekStartDayKey = DayKey;
export type WeekEventsByDay = MonthEventsByDay;
export type { WeekAppointmentsCache };

export type UseWeekAppointmentsCacheOptions = {
  /** When true, new ensureWeeksLoaded calls are queued until idle. */
  isDragging: boolean;
};

export type UseWeekAppointmentsCacheResult = {
  cache: WeekAppointmentsCache;
  loadedWeekStartKeys: WeekStartDayKey[];
  ensureWeeksLoaded: (weekStartKeys: WeekStartDayKey[]) => void;
  ensureVisibleWindow: (visibleWeekStart: WeekStartDayKey) => void;
  getEventsForDay: (dayKey: DayKey) => MonthDayEventPreview[];
  getEventsForWeek: (weekStartKey: WeekStartDayKey) => WeekEventsByDay;
};

function seedFromPrefetch(providerId: string | null) {
  const snapshot = getScheduleAppointmentsPrefetch(providerId);
  if (!snapshot) {
    return {
      cache: {} as WeekAppointmentsCache,
      types: new Map() as AppointmentTypeLookup,
      appointments: new Map<WeekStartDayKey, Appointment[]>(),
    };
  }

  return {
    cache: snapshot.weekCache,
    types: snapshot.types,
    appointments: new Map(snapshot.appointmentsByWeek),
  };
}

/**
 * WatermelonDB-backed week-start → day → events cache.
 * Prefetch prev/current/next weeks; pause expands while the pager is dragging.
 */
export function useWeekAppointmentsCache({
  isDragging,
}: UseWeekAppointmentsCacheOptions): UseWeekAppointmentsCacheResult {
  const database = useDatabase();
  const providerId = useAuthUser()?.id ?? null;
  const initialSeedRef = useRef<ReturnType<typeof seedFromPrefetch> | null>(
    null,
  );
  if (initialSeedRef.current === null) {
    initialSeedRef.current = seedFromPrefetch(providerId);
  }
  const initialSeed = initialSeedRef.current;
  const [cache, setCache] = useState<WeekAppointmentsCache>(initialSeed.cache);
  const typesRef = useRef<AppointmentTypeLookup>(initialSeed.types);
  const appointmentsByWeekRef = useRef(initialSeed.appointments);
  const subscriptionsRef = useRef(
    new Map<WeekStartDayKey, SubscriptionLike>(),
  );
  const pendingKeysRef = useRef(new Set<WeekStartDayKey>());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  const publishWeek = useCallback(
    (weekStartKey: WeekStartDayKey, appointments: Appointment[]) => {
      appointmentsByWeekRef.current.set(weekStartKey, appointments);
      const dayMap = buildWeekDayMap(
        appointments,
        typesRef.current,
        weekStartKey,
      );
      setCache((prev) => ({ ...prev, [weekStartKey]: dayMap }));
    },
    [],
  );

  const republishAllWeeks = useCallback(() => {
    setCache((prev) => {
      const next: WeekAppointmentsCache = {};
      for (const weekStartKey of Object.keys(prev) as WeekStartDayKey[]) {
        const appointments =
          appointmentsByWeekRef.current.get(weekStartKey) ?? [];
        next[weekStartKey] = buildWeekDayMap(
          appointments,
          typesRef.current,
          weekStartKey,
        );
      }
      for (const [weekStartKey, appointments] of appointmentsByWeekRef.current) {
        if (!next[weekStartKey]) {
          next[weekStartKey] = buildWeekDayMap(
            appointments,
            typesRef.current,
            weekStartKey,
          );
        }
      }
      return next;
    });
  }, []);

  const subscribeWeek = useCallback(
    (weekStartKey: WeekStartDayKey) => {
      if (!providerId || subscriptionsRef.current.has(weekStartKey)) return;

      const weekStartMs = toLocalDate(parseDayKey(weekStartKey)).getTime();
      const weekEndMs = weekStartMs + WEEK_DAYS * 24 * 60 * 60 * 1000;

      const subscription = database
        .get<Appointment>("appointments")
        .query(
          Q.where("provider_id", providerId),
          Q.where("start_time", Q.gte(weekStartMs)),
          Q.where("start_time", Q.lt(weekEndMs)),
        )
        .observeWithColumns([...APPOINTMENT_WINDOW_OBSERVE_COLUMNS])
        .subscribe({
          next: (appointments) => {
            publishWeek(weekStartKey, appointments);
          },
          error: () => {
            // Keep prior cache for this week on observe errors.
          },
        });

      subscriptionsRef.current.set(weekStartKey, subscription);
    },
    [providerId, publishWeek],
  );

  const flushPending = useCallback(() => {
    const pending = [...pendingKeysRef.current];
    pendingKeysRef.current.clear();
    for (const weekStartKey of pending) {
      subscribeWeek(weekStartKey);
    }
  }, [subscribeWeek]);

  const ensureWeeksLoaded = useCallback(
    (weekStartKeys: WeekStartDayKey[]) => {
      for (const weekStartKey of weekStartKeys) {
        if (subscriptionsRef.current.has(weekStartKey)) continue;

        if (isDragging) {
          pendingKeysRef.current.add(weekStartKey);
          continue;
        }

        subscribeWeek(weekStartKey);
      }
    },
    [isDragging, subscribeWeek],
  );

  const ensureVisibleWindow = useCallback(
    (visibleWeekStart: WeekStartDayKey) => {
      ensureWeeksLoaded([
        addWeeks(visibleWeekStart, -1),
        visibleWeekStart,
        addWeeks(visibleWeekStart, 1),
      ]);
    },
    [ensureWeeksLoaded],
  );

  useEffect(() => {
    const subscription = database
      .get<AppointmentType>("appointment_types")
      .query()
      .observe()
      .subscribe({
        next: (types) => {
          typesRef.current = buildAppointmentTypesMap(types);
          if (appointmentsByWeekRef.current.size > 0) {
            republishAllWeeks();
          }
        },
      });

    return () => subscription.unsubscribe();
  }, [republishAllWeeks]);

  useEffect(() => {
    if (isDragging) {
      clearTimer();
      return;
    }

    clearTimer();
    debounceTimerRef.current = setTimeout(() => {
      flushPending();
    }, APPOINTMENTS_CACHE_LOADER_DELAY_MS);

    return clearTimer;
  }, [isDragging, flushPending]);

  // Tear down observers when the signed-in provider changes; keep prefetch.
  useEffect(() => {
    clearTimer();
    for (const subscription of subscriptionsRef.current.values()) {
      subscription.unsubscribe();
    }
    subscriptionsRef.current.clear();
    pendingKeysRef.current.clear();

    const nextSeed = seedFromPrefetch(providerId);
    typesRef.current = nextSeed.types;
    appointmentsByWeekRef.current = nextSeed.appointments;
    setCache(nextSeed.cache);

    return () => {
      clearTimer();
      for (const subscription of subscriptionsRef.current.values()) {
        subscription.unsubscribe();
      }
      subscriptionsRef.current.clear();
      pendingKeysRef.current.clear();
    };
  }, [database, providerId]);

  const getEventsForWeek = useCallback(
    (weekStartKey: WeekStartDayKey): WeekEventsByDay =>
      cache[weekStartKey] ?? {},
    [cache],
  );

  const getEventsForDay = useCallback(
    (dayKey: DayKey): MonthDayEventPreview[] => {
      for (const dayMap of Object.values(cache)) {
        const events = dayMap[dayKey];
        if (events) return events;
      }
      return [];
    },
    [cache],
  );

  const loadedWeekStartKeys = useMemo(
    () => Object.keys(cache).sort() as WeekStartDayKey[],
    [cache],
  );

  return {
    cache,
    loadedWeekStartKeys,
    ensureWeeksLoaded,
    ensureVisibleWindow,
    getEventsForDay,
    getEventsForWeek,
  };
}
