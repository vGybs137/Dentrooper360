import type { TimedEventInput } from "./types";

/** Half-open intervals [start, end) overlap when each starts before the other ends. */
export function eventsOverlap(
  a: Pick<TimedEventInput, "startMinutes" | "endMinutes">,
  b: Pick<TimedEventInput, "startMinutes" | "endMinutes">,
): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

export type OverlapCluster = {
  clusterId: number;
  events: TimedEventInput[];
};

/**
 * Groups events into connected overlap components (union-find).
 * Touching ends and gaps produce separate clusters.
 */
export function buildOverlapClusters(
  events: TimedEventInput[],
): OverlapCluster[] {
  if (events.length === 0) return [];

  const parent = events.map((_, index) => index);

  const find = (index: number): number => {
    if (parent[index] !== index) {
      parent[index] = find(parent[index]);
    }
    return parent[index];
  };

  const union = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent[rootB] = rootA;
    }
  };

  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      if (eventsOverlap(events[i], events[j])) {
        union(i, j);
      }
    }
  }

  const rootToClusterId = new Map<number, number>();
  const buckets = new Map<number, TimedEventInput[]>();
  let nextClusterId = 0;

  for (let i = 0; i < events.length; i += 1) {
    const root = find(i);
    let clusterId = rootToClusterId.get(root);
    if (clusterId == null) {
      clusterId = nextClusterId;
      nextClusterId += 1;
      rootToClusterId.set(root, clusterId);
    }

    const bucket = buckets.get(clusterId) ?? [];
    bucket.push(events[i]);
    buckets.set(clusterId, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([clusterId, clusterEvents]) => ({
      clusterId,
      events: clusterEvents.sort(
        (a, b) =>
          a.startMinutes - b.startMinutes ||
          a.endMinutes - b.endMinutes ||
          a.id.localeCompare(b.id),
      ),
    }));
}
