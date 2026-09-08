import assert from "node:assert/strict";
import { buildOverlapClusters, eventsOverlap } from "./overlap";
import type { TimedEventInput } from "./types";

function event(
  id: string,
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number,
): TimedEventInput {
  return {
    id,
    startMinutes: startHour * 60 + startMin,
    endMinutes: endHour * 60 + endMin,
  };
}

function clusterIdsByEventId(events: TimedEventInput[]): Map<string, number> {
  const clusters = buildOverlapClusters(events);
  const map = new Map<string, number>();
  for (const cluster of clusters) {
    for (const item of cluster.events) {
      map.set(item.id, cluster.clusterId);
    }
  }
  return map;
}

function assertSeparateClusters(
  events: TimedEventInput[],
  idA: string,
  idB: string,
): void {
  const map = clusterIdsByEventId(events);
  assert.notEqual(
    map.get(idA),
    map.get(idB),
    `expected ${idA} and ${idB} in separate clusters`,
  );
}

function assertSameCluster(
  events: TimedEventInput[],
  ...ids: string[]
): void {
  const map = clusterIdsByEventId(events);
  const clusterId = map.get(ids[0]);
  assert(clusterId != null, `missing cluster for ${ids[0]}`);
  for (const id of ids.slice(1)) {
    assert.equal(
      map.get(id),
      clusterId,
      `expected ${id} in same cluster as ${ids[0]}`,
    );
  }
}

function assertClusterCount(events: TimedEventInput[], expected: number): void {
  assert.equal(buildOverlapClusters(events).length, expected);
}

// --- eventsOverlap ---

assert.equal(
  eventsOverlap(
    { startMinutes: 180, endMinutes: 210 },
    { startMinutes: 210, endMinutes: 240 },
  ),
  false,
  "touching ends do not overlap",
);

assert.equal(
  eventsOverlap(
    { startMinutes: 180, endMinutes: 210 },
    { startMinutes: 215, endMinutes: 240 },
  ),
  false,
  "gapped events do not overlap",
);

assert.equal(
  eventsOverlap(
    { startMinutes: 180, endMinutes: 240 },
    { startMinutes: 180, endMinutes: 210 },
  ),
  true,
  "nested span overlaps",
);

// --- buildOverlapClusters ---

assertClusterCount([], 0);

// Back-to-back touching (3:00–3:30 + 3:30–4:00)
{
  const events = [
    event("a", 3, 0, 3, 30),
    event("b", 3, 30, 4, 0),
  ];
  assertClusterCount(events, 2);
  assertSeparateClusters(events, "a", "b");
}

// 5-minute gap (3:00–3:30 + 3:35–4:00)
{
  const events = [
    event("a", 3, 0, 3, 30),
    event("b", 3, 35, 4, 0),
  ];
  assertClusterCount(events, 2);
  assertSeparateClusters(events, "a", "b");
}

// Two true overlaps (3:00–4:00 + 3:00–3:30)
{
  const events = [
    event("long", 3, 0, 4, 0),
    event("short", 3, 0, 3, 30),
  ];
  assertClusterCount(events, 1);
  assertSameCluster(events, "long", "short");
}

// Six events overlapping 3:00–4:00
{
  const events = Array.from({ length: 6 }, (_, index) =>
    event(`e${index}`, 3, 0, 4, 0),
  );
  assertClusterCount(events, 1);
  assertSameCluster(events, "e0", "e1", "e2", "e3", "e4", "e5");
}

// Complex: 2–4, 3–5, 3–3:30, three 3–4 slots — one transitive cluster
{
  const events = [
    event("span-2-4", 2, 0, 4, 0),
    event("span-3-5", 3, 0, 5, 0),
    event("short-3-330", 3, 0, 3, 30),
    event("slot-a", 3, 0, 4, 0),
    event("slot-b", 3, 0, 4, 0),
    event("slot-c", 3, 0, 4, 0),
  ];
  assertClusterCount(events, 1);
  assertSameCluster(
    events,
    "span-2-4",
    "span-3-5",
    "short-3-330",
    "slot-a",
    "slot-b",
    "slot-c",
  );
}

// Disjoint overlap groups stay separate
{
  const events = [
    event("morning-a", 9, 0, 10, 0),
    event("morning-b", 9, 30, 10, 30),
    event("afternoon-a", 14, 0, 15, 0),
    event("afternoon-b", 14, 30, 15, 30),
  ];
  assertClusterCount(events, 2);
  assertSameCluster(events, "morning-a", "morning-b");
  assertSameCluster(events, "afternoon-a", "afternoon-b");
  assertSeparateClusters(events, "morning-a", "afternoon-a");
}

console.log("overlap.test.ts: all tests passed");
