import { buildOverlapClusters, eventsOverlap } from "./overlap";
import type { TimedEventInput, TimedEventLayout } from "./types";

function eventDurationMinutes(event: TimedEventInput): number {
  return Math.max(0, event.endMinutes - event.startMinutes);
}

function compareLayoutOrder(a: TimedEventInput, b: TimedEventInput): number {
  return (
    a.startMinutes - b.startMinutes ||
    eventDurationMinutes(b) - eventDurationMinutes(a) ||
    a.endMinutes - b.endMinutes ||
    a.id.localeCompare(b.id)
  );
}

/**
 * Greedy leftmost column assignment within one overlap cluster.
 * Non-overlapping events in the same stack reuse a column and stack vertically.
 */
export function assignColumnsInCluster(
  clusterId: number,
  events: TimedEventInput[],
): TimedEventLayout[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(compareLayoutOrder);
  const columnStacks: TimedEventInput[][] = [];
  const placements: Array<TimedEventInput & { column: number }> = [];

  for (const event of sorted) {
    let column = 0;
    for (; column < columnStacks.length; column += 1) {
      const stack = columnStacks[column];
      const overlapsAny = stack.some((placed) => eventsOverlap(placed, event));
      if (!overlapsAny) {
        break;
      }
    }

    if (column === columnStacks.length) {
      columnStacks.push([event]);
    } else {
      columnStacks[column].push(event);
    }

    placements.push({ ...event, column });
  }

  const usedColumns = [...new Set(placements.map((p) => p.column))].sort(
    (a, b) => a - b,
  );
  const columnMap = new Map(usedColumns.map((col, index) => [col, index]));
  const maxColumns = usedColumns.length;

  return placements.map((placement) => ({
    id: placement.id,
    startMinutes: placement.startMinutes,
    endMinutes: placement.endMinutes,
    column: columnMap.get(placement.column)!,
    maxColumns,
    clusterId,
  }));
}

/** Assign columns for all events on one day column, cluster by cluster. */
export function assignColumns(events: TimedEventInput[]): TimedEventLayout[] {
  const clusters = buildOverlapClusters(events);
  return clusters.flatMap((cluster) =>
    assignColumnsInCluster(cluster.clusterId, cluster.events),
  );
}
