import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Q } from "@nozbe/watermelondb";

import type { MonthDayEventPreview } from "@/components/schedule/monthView/types";
import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
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
  fallbackColor: string;
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
  typeColors: Map<string, string>,
  fallbackColor: string,
): MonthDayEventPreview {
  const typeId = appointment.type.id;
  return {
    id: appointment.id,
    title: appointment.subject?.trim() || "Appointment",
    color: (typeId && typeColors.get(typeId)) || fallbackColor,
  };
}

function buildDayMap(
  appointments: Appointment[],
  typeColors: Map<string, string>,
  fallbackColor: string,
): MonthEventsByDay {
  const sorted = [...appointments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
  const map: MonthEventsByDay = {};

  for (const appointment of sorted) {
    const dayKey = toDayKey(appointment.startTime);
    const bucket = map[dayKey] ?? (map[dayKey] = []);
    bucket.push(toPreview(appointment, typeColors, fallbackColor));
  }

  return map;
}

/**
 * WatermelonDB-backed month → day → events cache.
 * Prefetch prev/current/next; pause expands while the pager is dragging.
 */
export function useMonthAppointmentsCache({
  fallbackColor,
  isDragging,
}: UseMonthAppointmentsCacheOptions): UseMonthAppointmentsCacheResult {
  const [cache, setCache] = useState<MonthAppointmentsCache>({});
  const typeColorsRef = useRef(new Map<string, string>());
  const appointmentsByMonthRef = useRef(new Map<MonthKey, Appointment[]>());
  const subscriptionsRef = useRef(new Map<MonthKey, SubscriptionLike>());
  const pendingKeysRef = useRef(new Set<MonthKey>());
  const monthByKeyRef = useRef(new Map<MonthKey, YearMonth>());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackColorRef = useRef(fallbackColor);
  fallbackColorRef.current = fallbackColor;

  const clearTimer = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  const publishMonth = useCallback((monthKey: MonthKey, appointments: Appointment[]) => {
    appointmentsByMonthRef.current.set(monthKey, appointments);
    const dayMap = buildDayMap(
      appointments,
      typeColorsRef.current,
      fallbackColorRef.current,
    );
    setCache((prev) => ({ ...prev, [monthKey]: dayMap }));
  }, []);

  const republishAllMonths = useCallback(() => {
    setCache((prev) => {
      const next: MonthAppointmentsCache = {};
      for (const monthKey of Object.keys(prev) as MonthKey[]) {
        const appointments = appointmentsByMonthRef.current.get(monthKey) ?? [];
        next[monthKey] = buildDayMap(
          appointments,
          typeColorsRef.current,
          fallbackColorRef.current,
        );
      }
      // Also include months that have appointments but somehow missing from prev.
      for (const [monthKey, appointments] of appointmentsByMonthRef.current) {
        if (!next[monthKey]) {
          next[monthKey] = buildDayMap(
            appointments,
            typeColorsRef.current,
            fallbackColorRef.current,
          );
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
        .observe()
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

  const ensureVisibleWindow = useCallback(
    (visibleMonth: YearMonth) => {
      ensureMonthsLoaded([
        addMonths(visibleMonth, -1),
        visibleMonth,
        addMonths(visibleMonth, 1),
      ]);
    },
    [ensureMonthsLoaded],
  );

  useEffect(() => {
    const subscription = database
      .get<AppointmentType>("appointment_types")
      .query()
      .observe()
      .subscribe({
        next: (types) => {
          const next = new Map<string, string>();
          for (const type of types) {
            if (type.color) next.set(type.id, type.color);
          }
          typeColorsRef.current = next;
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
    };
  }, []);

  const getEventsForDay = useCallback(
    (dayKey: DayKey): MonthDayEventPreview[] => {
      const monthKey = dayKey.slice(0, 7) as MonthKey;
      return cache[monthKey]?.[dayKey] ?? [];
    },
    [cache],
  );

  const getEventsByDayForMonth = useCallback(
    (monthKey: MonthKey): MonthEventsByDay => cache[monthKey] ?? {},
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
