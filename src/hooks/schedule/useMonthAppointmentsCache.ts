import { Q } from "@nozbe/watermelondb";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MonthDayEventPreview } from "@/types/schedule";
import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import {
  EMPTY_DAY_EVENTS,
  EMPTY_MONTH_EVENTS,
} from "@/helpers/scheduleEvents";
import {
  addMonths,
  startOfMonthDate,
  startOfNextMonthDate,
  toDayKey,
  toMonthKey,
  type DayKey,
  type MonthKey,
  type YearMonth,
} from "@/utils/calendar";

const LOADER_DELAY_MS = 200;

type SubscriptionLike = { unsubscribe: () => void };

export type MonthEventsByDay = Record<DayKey, MonthDayEventPreview[]>;
export type MonthAppointmentsCache = Record<MonthKey, MonthEventsByDay>;

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

function toPreview(
  appointment: Appointment,
  types: Map<string, { color: string | null; name: string }>,
): MonthDayEventPreview {
  const typeId = appointment.type.id;
  const type = typeId ? types.get(typeId) : undefined;
  return {
    id: appointment.id,
    title: appointment.subject?.trim() || "Appointment",
    color: type?.color ?? null,
    typeName: type?.name ? type.name : null,
    startTime: appointment.startTime.getTime(),
    endTime: appointment.endTime.getTime(),
  };
}

function buildDayMap(
  appointments: Appointment[],
  types: Map<string, { color: string | null; name: string }>,
): MonthEventsByDay {
  const sorted = [...appointments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
  const map: MonthEventsByDay = {};

  for (const appointment of sorted) {
    const dayKey = toDayKey(appointment.startTime);
    const bucket = map[dayKey] ?? (map[dayKey] = []);
    bucket.push(toPreview(appointment, types));
  }

  return map;
}

/**
 * WatermelonDB-backed month → day → events cache.
 * Prefetch prev/current/next; pause expands while the pager is dragging.
 */
export function useMonthAppointmentsCache({
  isDragging,
}: UseMonthAppointmentsCacheOptions): UseMonthAppointmentsCacheResult {
  const [cache, setCache] = useState<MonthAppointmentsCache>({});
  const typesRef = useRef(
    new Map<string, { color: string | null; name: string }>(),
  );
  const appointmentsByMonthRef = useRef(new Map<MonthKey, Appointment[]>());
  const subscriptionsRef = useRef(new Map<MonthKey, SubscriptionLike>());
  const pendingKeysRef = useRef(new Set<MonthKey>());
  const monthByKeyRef = useRef(new Map<MonthKey, YearMonth>());
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
      const dayMap = buildDayMap(appointments, typesRef.current);
      setCache((prev) => ({ ...prev, [monthKey]: dayMap }));
    },
    [],
  );

  const republishAllMonths = useCallback(() => {
    setCache((prev) => {
      const next: MonthAppointmentsCache = {};
      for (const monthKey of Object.keys(prev) as MonthKey[]) {
        const appointments = appointmentsByMonthRef.current.get(monthKey) ?? [];
        next[monthKey] = buildDayMap(appointments, typesRef.current);
      }
      // Also include months that have appointments but somehow missing from prev.
      for (const [monthKey, appointments] of appointmentsByMonthRef.current) {
        if (!next[monthKey]) {
          next[monthKey] = buildDayMap(appointments, typesRef.current);
        }
      }
      return next;
    });
  }, []);

  const subscribeMonth = useCallback(
    (yearMonth: YearMonth) => {
      const monthKey = monthKeyFromYearMonth(yearMonth);
      if (subscriptionsRef.current.has(monthKey)) return;

      monthByKeyRef.current.set(monthKey, yearMonth);
      const startMs = startOfMonthDate(yearMonth).getTime();
      const endMs = startOfNextMonthDate(yearMonth).getTime();

      const subscription = database
        .get<Appointment>("appointments")
        .query(
          Q.where("start_time", Q.gte(startMs)),
          Q.where("start_time", Q.lt(endMs)),
        )
        .observeWithColumns([
          "patient_id",
          "type_id",
          "location_id",
          "subject",
          "status",
          "description",
          "start_time",
          "end_time",
        ])
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
    [publishMonth],
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

  /** Drop observers + cache for months outside the retain window. */
  const pruneOutsideRetain = useCallback((retainKeys: Set<MonthKey>) => {
    for (const monthKey of [...subscriptionsRef.current.keys()]) {
      if (retainKeys.has(monthKey)) continue;
      subscriptionsRef.current.get(monthKey)?.unsubscribe();
      subscriptionsRef.current.delete(monthKey);
      appointmentsByMonthRef.current.delete(monthKey);
      monthByKeyRef.current.delete(monthKey);
    }

    for (const monthKey of [...pendingKeysRef.current]) {
      if (retainKeys.has(monthKey)) continue;
      pendingKeysRef.current.delete(monthKey);
    }

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
   * Prefetch visible ±1 and drop everything else.
   * While dragging, only queue loads + scrub pending; prune after idle so
   * settled neighbor grids keep their subscriptions until the page commits.
   */
  const ensureVisibleWindow = useCallback(
    (visibleMonth: YearMonth) => {
      const retainMonths = [
        addMonths(visibleMonth, -1),
        visibleMonth,
        addMonths(visibleMonth, 1),
      ];
      const retainKeys = new Set(
        retainMonths.map((month) => monthKeyFromYearMonth(month)),
      );

      ensureMonthsLoaded(retainMonths);

      // Cancelled / reversed swipes should not keep far months queued.
      for (const monthKey of [...pendingKeysRef.current]) {
        if (!retainKeys.has(monthKey)) {
          pendingKeysRef.current.delete(monthKey);
        }
      }

      if (isDragging) return;

      pruneOutsideRetain(retainKeys);
    },
    [ensureMonthsLoaded, isDragging, pruneOutsideRetain],
  );

  useEffect(() => {
    const subscription = database
      .get<AppointmentType>("appointment_types")
      .query()
      .observe()
      .subscribe({
        next: (types) => {
          const next = new Map<string, { color: string | null; name: string }>();
          for (const type of types) {
            next.set(type.id, {
              color: type.color || null,
              name: type.nameEn?.trim() || "",
            });
          }
          typesRef.current = next;
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
    }, LOADER_DELAY_MS);

    return clearTimer;
  }, [isDragging, flushPending]);

  useEffect(() => {
    return () => {
      clearTimer();
      for (const subscription of subscriptionsRef.current.values()) {
        subscription.unsubscribe();
      }
      subscriptionsRef.current.clear();
      appointmentsByMonthRef.current.clear();
      pendingKeysRef.current.clear();
      monthByKeyRef.current.clear();
    };
  }, []);

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
