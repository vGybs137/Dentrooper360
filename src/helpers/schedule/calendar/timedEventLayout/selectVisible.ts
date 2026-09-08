import type { TimedEventInput, TimedOverflowLayout } from "./types";

function eventDurationMinutes(event: TimedEventInput): number {
  return Math.max(0, event.endMinutes - event.startMinutes);
}

function compareByLongestFirst(a: TimedEventInput, b: TimedEventInput): number {
  return (
    eventDurationMinutes(b) - eventDurationMinutes(a) ||
    a.startMinutes - b.startMinutes ||
    a.id.localeCompare(b.id)
  );
}

function compareByShortestFirst(a: TimedEventInput, b: TimedEventInput): number {
  return (
    eventDurationMinutes(a) - eventDurationMinutes(b) ||
    a.startMinutes - b.startMinutes ||
    a.id.localeCompare(b.id)
  );
}

function eventsActiveAtMinute(
  events: TimedEventInput[],
  minute: number,
): TimedEventInput[] {
  return events.filter(
    (event) => event.startMinutes <= minute && minute < event.endMinutes,
  );
}

/** Sweep-line peak concurrency for half-open [start, end) intervals. */
export function peakConcurrentCount(events: TimedEventInput[]): number {
  if (events.length === 0) return 0;

  type Point = { minute: number; delta: number };
  const points: Point[] = [];
  for (const event of events) {
    points.push({ minute: event.startMinutes, delta: 1 });
    points.push({ minute: event.endMinutes, delta: -1 });
  }
  points.sort((a, b) => a.minute - b.minute || a.delta - b.delta);

  let current = 0;
  let peak = 0;
  for (const point of points) {
    current += point.delta;
    peak = Math.max(peak, current);
  }
  return peak;
}

function findPeakMinute(events: TimedEventInput[]): number {
  if (events.length === 0) return 0;

  type Point = { minute: number; delta: number };
  const points: Point[] = [];
  for (const event of events) {
    points.push({ minute: event.startMinutes, delta: 1 });
    points.push({ minute: event.endMinutes, delta: -1 });
  }
  points.sort((a, b) => a.minute - b.minute || a.delta - b.delta);

  let current = 0;
  let peak = 0;
  let peakMinute = events[0].startMinutes;
  for (const point of points) {
    current += point.delta;
    if (current > peak) {
      peak = current;
      peakMinute = point.minute;
    }
  }
  return peakMinute;
}

function medianDuration(events: TimedEventInput[]): number {
  const durations = events.map(eventDurationMinutes).sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  if (durations.length % 2 === 1) {
    return durations[mid];
  }
  return durations[mid - 1];
}

export function needsVisibilityCap(
  events: TimedEventInput[],
  maxColumns: number,
  maxVisible: number,
): boolean {
  return (
    events.length > maxVisible ||
    maxColumns > maxVisible ||
    peakConcurrentCount(events) > maxVisible
  );
}

export type VisibleSelection = {
  kept: TimedEventInput[];
  hidden: TimedEventInput[];
  overflow: TimedOverflowLayout | null;
};

/**
 * Pick up to `maxVisible` events from one cluster:
 * 1. Keep extended spans (duration > median at peak overlap minute)
 * 2. Fill remaining slots with shortest events
 */
export function selectVisibleInCluster(
  clusterId: number,
  events: TimedEventInput[],
  maxVisible: number,
): VisibleSelection {
  if (events.length <= maxVisible) {
    return { kept: [...events], hidden: [], overflow: null };
  }

  const peakMinute = findPeakMinute(events);
  const activeAtPeak = eventsActiveAtMinute(events, peakMinute);
  const typicalDuration = medianDuration(activeAtPeak);

  const remaining = [...events];
  const kept: TimedEventInput[] = [];

  const extended = remaining
    .filter((event) => eventDurationMinutes(event) > typicalDuration)
    .sort(compareByLongestFirst);

  for (const event of extended) {
    if (kept.length >= maxVisible) {
      break;
    }
    kept.push(event);
    const index = remaining.findIndex((candidate) => candidate.id === event.id);
    if (index >= 0) {
      remaining.splice(index, 1);
    }
  }

  while (kept.length < maxVisible && remaining.length > 0) {
    remaining.sort(compareByShortestFirst);
    kept.push(remaining.shift()!);
  }

  const keptIds = new Set(kept.map((event) => event.id));
  const hidden = events.filter((event) => !keptIds.has(event.id));

  if (hidden.length === 0) {
    return { kept, hidden, overflow: null };
  }

  return {
    kept,
    hidden,
    overflow: {
      id: `overflow-${clusterId}`,
      clusterId,
      count: hidden.length,
      startMinutes: Math.min(...hidden.map((event) => event.startMinutes)),
      endMinutes: Math.max(...hidden.map((event) => event.endMinutes)),
      hiddenIds: hidden.map((event) => event.id),
    },
  };
}
