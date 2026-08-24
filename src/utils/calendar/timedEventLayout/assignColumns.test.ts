import assert from "node:assert/strict";
import { assignColumns } from "./assignColumns";
import type { TimedEventInput, TimedEventLayout } from "./types";

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

function layoutById(layout: TimedEventLayout[]): Map<string, TimedEventLayout> {
  return new Map(layout.map((item) => [item.id, item]));
}

function assertLayout(
  layout: TimedEventLayout[],
  id: string,
  expected: Pick<TimedEventLayout, "column" | "maxColumns" | "clusterId">,
): void {
  const item = layoutById(layout).get(id);
  assert(item, `missing layout for ${id}`);
  assert.equal(item.column, expected.column, `${id} column`);
  assert.equal(item.maxColumns, expected.maxColumns, `${id} maxColumns`);
  assert.equal(item.clusterId, expected.clusterId, `${id} clusterId`);
}

// Back-to-back touching (3:00–3:30 + 3:30–4:00) → separate clusters, both col 0
{
  const layout = assignColumns([
    event("a", 3, 0, 3, 30),
    event("b", 3, 30, 4, 0),
  ]);
  assert.equal(layout.length, 2);
  assertLayout(layout, "a", { column: 0, maxColumns: 1, clusterId: 0 });
  assertLayout(layout, "b", { column: 0, maxColumns: 1, clusterId: 1 });
}

// 5-minute gap (3:00–3:30 + 3:35–4:00) → separate clusters, both col 0
{
  const layout = assignColumns([
    event("a", 3, 0, 3, 30),
    event("b", 3, 35, 4, 0),
  ]);
  assert.equal(layout.length, 2);
  assertLayout(layout, "a", { column: 0, maxColumns: 1, clusterId: 0 });
  assertLayout(layout, "b", { column: 0, maxColumns: 1, clusterId: 1 });
}

// Two true overlaps → two side-by-side columns
{
  const layout = assignColumns([
    event("long", 3, 0, 4, 0),
    event("short", 3, 0, 3, 30),
  ]);
  assert.equal(layout.length, 2);
  assertLayout(layout, "long", { column: 0, maxColumns: 2, clusterId: 0 });
  assertLayout(layout, "short", { column: 1, maxColumns: 2, clusterId: 0 });
}

// Staggered overlaps reuse column when stack is free
{
  const layout = assignColumns([
    event("a", 9, 0, 10, 0),
    event("b", 9, 30, 10, 30),
    event("c", 10, 0, 11, 0),
  ]);
  assert.equal(layout.length, 3);
  assertLayout(layout, "a", { column: 0, maxColumns: 2, clusterId: 0 });
  assertLayout(layout, "b", { column: 1, maxColumns: 2, clusterId: 0 });
  // c starts when a ends — reuses column 0
  assertLayout(layout, "c", { column: 0, maxColumns: 2, clusterId: 0 });
}

// Six events overlapping 3:00–4:00 → six columns (cap comes in a later phase)
{
  const layout = assignColumns(
    Array.from({ length: 6 }, (_, index) => event(`e${index}`, 3, 0, 4, 0)),
  );
  assert.equal(layout.length, 6);
  for (let index = 0; index < 6; index += 1) {
    assertLayout(layout, `e${index}`, {
      column: index,
      maxColumns: 6,
      clusterId: 0,
    });
  }
}

// Complex cluster: extended spans claim columns first
{
  const layout = assignColumns([
    event("span-2-4", 2, 0, 4, 0),
    event("span-3-5", 3, 0, 5, 0),
    event("short-3-330", 3, 0, 3, 30),
    event("slot-a", 3, 0, 4, 0),
    event("slot-b", 3, 0, 4, 0),
    event("slot-c", 3, 0, 4, 0),
  ]);
  assert.equal(layout.length, 6);
  assertLayout(layout, "span-2-4", { column: 0, maxColumns: 6, clusterId: 0 });
  assertLayout(layout, "span-3-5", { column: 1, maxColumns: 6, clusterId: 0 });
  assertLayout(layout, "slot-a", { column: 2, maxColumns: 6, clusterId: 0 });
  assertLayout(layout, "slot-b", { column: 3, maxColumns: 6, clusterId: 0 });
  assertLayout(layout, "slot-c", { column: 4, maxColumns: 6, clusterId: 0 });
  // shortest event is placed last — cap phase will prefer keeping it over slots
  assertLayout(layout, "short-3-330", { column: 5, maxColumns: 6, clusterId: 0 });
}

// Disjoint morning / afternoon groups each get their own column layout
{
  const layout = assignColumns([
    event("morning-a", 9, 0, 10, 0),
    event("morning-b", 9, 30, 10, 30),
    event("afternoon-a", 14, 0, 15, 0),
    event("afternoon-b", 14, 30, 15, 30),
  ]);
  assert.equal(layout.length, 4);
  assertLayout(layout, "morning-a", { column: 0, maxColumns: 2, clusterId: 0 });
  assertLayout(layout, "morning-b", { column: 1, maxColumns: 2, clusterId: 0 });
  assertLayout(layout, "afternoon-a", { column: 0, maxColumns: 2, clusterId: 1 });
  assertLayout(layout, "afternoon-b", { column: 1, maxColumns: 2, clusterId: 1 });
}

console.log("assignColumns.test.ts: all tests passed");
