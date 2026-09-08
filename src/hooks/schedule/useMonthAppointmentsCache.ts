import { Q } from "@nozbe/watermelondb";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MonthDayEventPreview } from "@/types/schedule";
import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import { getScheduleAppointmentsPrefetch } from "@/helpers/schedule/prefetchScheduleAppointments";
import {
  buildAppointmentTypesMap,
  buildMonthDayMap,
  type AppointmentTypeLookup,
  type MonthAppointmentsCache,
  type MonthEventsByDay,
} from "@/helpers/schedule/scheduleAppointmentPreview";
import {
  EMPTY_DAY_EVENTS,
  EMPTY_MONTH_EVENTS,
} from "@/helpers/schedule/scheduleEvents";
import {
  APPOINTMENT_WINDOW_OBSERVE_COLUMNS,
  APPOINTMENTS_CACHE_LOADER_DELAY_MS,
} from "@/hooks/schedule/appointmentsWindowCacheShared";
import { useAuthUser } from "@/stores/authStore";
import {
  addMonths,
  parseMonthKey,
  startOfMonthDate,
  startOfNextMonthDate,
  toMonthKey,
  type DayKey,
  type MonthKey,
  type YearMonth,
} from "@/helpers/schedule/calendar";

/** Active Watermelon observers: visible month ± this radius. */
const SUBSCRIBE_RADIUS = 1;
/**
 * Keep last-known day maps for months outside the subscribe window so
 * scrolling back does not flash empty cells while observe re-emits.
 */
const SOFT_CACHE_RADIUS = 6;

type SubscriptionLike = { unsubscribe: () => void };

export type { MonthAppointmentsCache, MonthEventsByDay };

export type UseMonthAppointmentsCacheOptions = {
  /** When true, new ensureMonthsLoaded calls are queued until idle. */
  isDragging: boolean;
};

export type UseMonthAppointmentsCacheResult = {
  cache: MonthAppointmentsCache;
  loadedMonthKeys: MonthKey[];
  ensureMonthsLoaded: (months: YearMonth[]) => void;
  ensureVisibleWindow: (visibleMonth: YearMonth) => void;
  getEventsForDay: (dayKey: DayKey) => MonthDayEventPreview[];
  getEventsByDayForMonth: (monthKey: MonthKey) => MonthEventsByDay;
  getEventCountForMonth: (monthKey: MonthKey) => number;
};

function monthKeyFromYearMonth(yearMonth: YearMonth): MonthKey {
  return toMonthKey(yearMonth);
}

function seedFromPrefetch(providerId: string | null) {
  const snapshot = getScheduleAppointmentsPrefetch(providerId);
  if (!snapshot) {
    return {
      cache: {} as MonthAppointmentsCache,
      types: new Map() as AppointmentTypeLookup,
      appointments: new Map<MonthKey, Appointment[]>(),
    };
  }

  return {
    cache: snapshot.monthCache,
    types: snapshot.types,
    appointments: new Map(snapshot.appointmentsByMonth),
  };
}

function monthByKeyFromCache(cache: MonthAppointmentsCache) {
  const map = new Map<MonthKey, YearMonth>();
  for (const monthKey of Object.keys(cache) as MonthKey[]) {
    map.set(monthKey, parseMonthKey(monthKey));
  }
  return map;
}

/**
 * WatermelonDB-backed month → day → events cache.
 * Live observers for visible ±1; soft-keep day maps ±6 so scroll-back
 * does not flash empty cells. Pause expands while the pager is dragging.
 */
export function useMonthAppointmentsCache({
  isDragging,
}: UseMonthAppointmentsCacheOptions): UseMonthAppointmentsCacheResult {
  const providerId = useAuthUser()?.id ?? null;
  const initialSeedRef = useRef<ReturnType<typeof seedFromPrefetch> | null>(
    null,
  );
  if (initialSeedRef.current === null) {
    initialSeedRef.current = seedFromPrefetch(providerId);
  }
  const initialSeed = initialSeedRef.current;
  const [cache, setCache] = useState<MonthAppointmentsCache>(initialSeed.cache);
  const typesRef = useRef<AppointmentTypeLookup>(initialSeed.types);
  const appointmentsByMonthRef = useRef(initialSeed.appointments);
  const subscriptionsRef = useRef(new Map<MonthKey, SubscriptionLike>());
  const pendingKeysRef = useRef(new Set<MonthKey>());
  const monthByKeyRef = useRef(monthByKeyFromCache(initialSeed.cache));
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  const publishMonth = useCallback(
    (monthKey: MonthKey, appointments: Appointment[]) => {
      appointmentsByMonthRef.current.set(monthKey, appointments);
      const dayMap = buildMonthDayMap(appointments, typesRef.current);
      setCache((prev) => ({ ...prev, [monthKey]: dayMap }));
    },
    [],
  );

  const republishAllMonths = useCallback(() => {
    setCache((prev) => {
      const next: MonthAppointmentsCache = {};
      for (const monthKey of Object.keys(prev) as MonthKey[]) {
        const appointments = appointmentsByMonthRef.current.get(monthKey) ?? [];
        next[monthKey] = buildMonthDayMap(appointments, typesRef.current);
      }
      // Also include months that have appointments but somehow missing from prev.
      for (const [monthKey, appointments] of appointmentsByMonthRef.current) {
        if (!next[monthKey]) {
          next[monthKey] = buildMonthDayMap(appointments, typesRef.current);
        }
      }
      return next;
    });
  }, []);

  const subscribeMonth = useCallback(
    (yearMonth: YearMonth) => {
      const monthKey = monthKeyFromYearMonth(yearMonth);
      if (!providerId || subscriptionsRef.current.has(monthKey)) return;

      monthByKeyRef.current.set(monthKey, yearMonth);
      const startMs = startOfMonthDate(yearMonth).getTime();
      const endMs = startOfNextMonthDate(yearMonth).getTime();

      const subscription = database
        .get<Appointment>("appointments")
        .query(
          Q.where("provider_id", providerId),
          Q.where("start_time", Q.gte(startMs)),
          Q.where("start_time", Q.lt(endMs)),
        )
        .observeWithColumns([...APPOINTMENT_WINDOW_OBSERVE_COLUMNS])
        .subscribe({
          next: (appointments) => {
            publishMonth(monthKey, appointments);
          },
          error: () => {
            // Keep prior cache for this month on observe errors.
          },
        });

      subscriptionsRef.current.set(monthKey, subscription);
    },
    [providerId, publishMonth],
  );

  const flushPending = useCallback(() => {
    const pending = [...pendingKeysRef.current];
    pendingKeysRef.current.clear();
    for (const monthKey of pending) {
      const yearMonth = monthByKeyRef.current.get(monthKey);
      if (yearMonth) subscribeMonth(yearMonth);
    }
  }, [subscribeMonth]);

  const ensureMonthsLoaded = useCallback(
    (months: YearMonth[]) => {
      for (const yearMonth of months) {
        const monthKey = monthKeyFromYearMonth(yearMonth);
        monthByKeyRef.current.set(monthKey, yearMonth);
        if (subscriptionsRef.current.has(monthKey)) continue;

        if (isDragging) {
          pendingKeysRef.current.add(monthKey);
          continue;
        }

        subscribeMonth(yearMonth);
      }
    },
    [isDragging, subscribeMonth],
  );

  /** Drop live observers outside the subscribe window; keep soft-cached maps. */
  const pruneSubscriptionsOutside = useCallback((retainKeys: Set<MonthKey>) => {
    for (const monthKey of [...subscriptionsRef.current.keys()]) {
      if (retainKeys.has(monthKey)) continue;
      subscriptionsRef.current.get(monthKey)?.unsubscribe();
      subscriptionsRef.current.delete(monthKey);
    }

    for (const monthKey of [...pendingKeysRef.current]) {
      if (retainKeys.has(monthKey)) continue;
      pendingKeysRef.current.delete(monthKey);
    }
  }, []);

  /** Bound memory: drop soft-cached months far from the visible window. */
  const pruneSoftCacheOutside = useCallback((retainKeys: Set<MonthKey>) => {
    for (const monthKey of [...appointmentsByMonthRef.current.keys()]) {
      if (retainKeys.has(monthKey)) continue;
      appointmentsByMonthRef.current.delete(monthKey);
      monthByKeyRef.current.delete(monthKey);
    }

    setCache((prev) => {
      const keys = Object.keys(prev) as MonthKey[];
      if (keys.length === 0 || keys.every((key) => retainKeys.has(key))) {
        return prev;
      }
      const next: MonthAppointmentsCache = {};
      for (const key of keys) {
        if (retainKeys.has(key)) next[key] = prev[key];
      }
      return next;
    });
  }, []);

  /**
   * Prefetch visible ±SUBSCRIBE_RADIUS; soft-keep maps ±SOFT_CACHE_RADIUS.
   * While dragging, only queue loads + scrub pending; prune after idle so
   * settled neighbor grids keep their subscriptions until the page commits.
   */
  const ensureVisibleWindow = useCallback(
    (visibleMonth: YearMonth) => {
      const subscribeMonths: YearMonth[] = [];
      for (let offset = -SUBSCRIBE_RADIUS; offset <= SUBSCRIBE_RADIUS; offset++) {
        subscribeMonths.push(addMonths(visibleMonth, offset));
      }
      const subscribeKeys = new Set(
        subscribeMonths.map((month) => monthKeyFromYearMonth(month)),
      );

      const softCacheKeys = new Set<MonthKey>();
      for (let offset = -SOFT_CACHE_RADIUS; offset <= SOFT_CACHE_RADIUS; offset++) {
        softCacheKeys.add(monthKeyFromYearMonth(addMonths(visibleMonth, offset)));
      }

      ensureMonthsLoaded(subscribeMonths);

      // Cancelled / reversed swipes should not keep far months queued.
      for (const monthKey of [...pendingKeysRef.current]) {
        if (!subscribeKeys.has(monthKey)) {
          pendingKeysRef.current.delete(monthKey);
        }
      }

      if (isDragging) return;

      pruneSubscriptionsOutside(subscribeKeys);
      pruneSoftCacheOutside(softCacheKeys);
    },
    [
      ensureMonthsLoaded,
      isDragging,
      pruneSoftCacheOutside,
      pruneSubscriptionsOutside,
    ],
  );

  useEffect(() => {
    const subscription = database
      .get<AppointmentType>("appointment_types")
      .query()
      .observe()
      .subscribe({
        next: (types) => {
          typesRef.current = buildAppointmentTypesMap(types);
          if (appointmentsByMonthRef.current.size > 0) {
            republishAllMonths();
          }
        },
      });

    return () => subscription.unsubscribe();
  }, [republishAllMonths]);

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
    appointmentsByMonthRef.current = nextSeed.appointments;
    monthByKeyRef.current = monthByKeyFromCache(nextSeed.cache);
    setCache(nextSeed.cache);

    return () => {
      clearTimer();
      for (const subscription of subscriptionsRef.current.values()) {
        subscription.unsubscribe();
      }
      subscriptionsRef.current.clear();
      pendingKeysRef.current.clear();
    };
  }, [providerId]);

  const getEventsForDay = useCallback(
    (dayKey: DayKey): MonthDayEventPreview[] => {
      const monthKey = dayKey.slice(0, 7) as MonthKey;
      return cache[monthKey]?.[dayKey] ?? EMPTY_DAY_EVENTS;
    },
    [cache],
  );

  const getEventsByDayForMonth = useCallback(
    (monthKey: MonthKey): MonthEventsByDay =>
      cache[monthKey] ?? EMPTY_MONTH_EVENTS,
    [cache],
  );

  const getEventCountForMonth = useCallback(
    (monthKey: MonthKey): number => {
      const days = cache[monthKey];
      if (!days) return 0;
      return Object.values(days).reduce((sum, list) => sum + list.length, 0);
    },
    [cache],
  );

  const loadedMonthKeys = useMemo(
    () => Object.keys(cache).sort() as MonthKey[],
    [cache],
  );

  return {
    cache,
    loadedMonthKeys,
    ensureMonthsLoaded,
    ensureVisibleWindow,
    getEventsForDay,
    getEventsByDayForMonth,
    getEventCountForMonth,
  };
}
