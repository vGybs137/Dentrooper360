import { Q } from "@nozbe/watermelondb";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MonthDayEventPreview } from "@/types/schedule";
import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import { useAuthUser } from "@/stores/authStore";
import {
  addDays,
  addWeeks,
  clipEventToDay,
  parseDayKey,
  toDayKey,
  toLocalDate,
  WEEK_DAYS,
  type DayKey,
} from "@/utils/calendar";

const LOADER_DELAY_MS = 200;

type SubscriptionLike = { unsubscribe: () => void };

/** Week-start day key (same ISO day string as {@link DayKey}). */
export type WeekStartDayKey = DayKey;

export type WeekEventsByDay = Record<DayKey, MonthDayEventPreview[]>;
export type WeekAppointmentsCache = Record<WeekStartDayKey, WeekEventsByDay>;

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

function buildWeekDayMap(
  appointments: Appointment[],
  types: Map<string, { color: string | null; name: string }>,
  weekStartKey: WeekStartDayKey,
): WeekEventsByDay {
  const sorted = [...appointments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
  const weekStart = parseDayKey(weekStartKey);
  const map: WeekEventsByDay = {};

  for (const appointment of sorted) {
    const preview = toPreview(appointment, types);
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

/**
 * WatermelonDB-backed week-start → day → events cache.
 * Prefetch prev/current/next weeks; pause expands while the pager is dragging.
 */
export function useWeekAppointmentsCache({
  isDragging,
}: UseWeekAppointmentsCacheOptions): UseWeekAppointmentsCacheResult {
  const providerId = useAuthUser()?.id ?? null;
  const [cache, setCache] = useState<WeekAppointmentsCache>({});
  const typesRef = useRef(
    new Map<string, { color: string | null; name: string }>(),
  );
  const appointmentsByWeekRef = useRef(
    new Map<WeekStartDayKey, Appointment[]>(),
  );
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
          const next = new Map<string, { color: string | null; name: string }>();
          for (const type of types) {
            next.set(type.id, {
              color: type.color || null,
              name: type.nameEn?.trim() || "",
            });
          }
          typesRef.current = next;
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
    }, LOADER_DELAY_MS);

    return clearTimer;
  }, [isDragging, flushPending]);

  // Tear down observers and cache when the signed-in provider changes.
  useEffect(() => {
    clearTimer();
    for (const subscription of subscriptionsRef.current.values()) {
      subscription.unsubscribe();
    }
    subscriptionsRef.current.clear();
    appointmentsByWeekRef.current.clear();
    pendingKeysRef.current.clear();
    setCache({});

    return () => {
      clearTimer();
      for (const subscription of subscriptionsRef.current.values()) {
        subscription.unsubscribe();
      }
      subscriptionsRef.current.clear();
      appointmentsByWeekRef.current.clear();
      pendingKeysRef.current.clear();
    };
  }, [providerId]);

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
