import assert from "node:assert/strict";
import { layoutTimedDayColumn } from "./layoutTimedDayColumn";
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

function assertVisibleIds(
  result: ReturnType<typeof layoutTimedDayColumn>,
  ...ids: string[]
): void {
  const visibleIds = result.visible.map((item) => item.id).sort();
  assert.deepEqual(visibleIds, [...ids].sort(), "visible ids");
}

// Back-to-back touching → both col 0, full width
{
  const result = layoutTimedDayColumn([
    event("a", 3, 0, 3, 30),
    event("b", 3, 30, 4, 0),
  ]);
  assert.equal(result.overflows.length, 0);
  assertLayout(result.visible, "a", { column: 0, maxColumns: 1, clusterId: 0 });
  assertLayout(result.visible, "b", { column: 0, maxColumns: 1, clusterId: 1 });
}

// 5-minute gap → both col 0, full width
{
  const result = layoutTimedDayColumn([
    event("a", 3, 0, 3, 30),
    event("b", 3, 35, 4, 0),
  ]);
  assert.equal(result.overflows.length, 0);
  assertLayout(result.visible, "a", { column: 0, maxColumns: 1, clusterId: 0 });
  assertLayout(result.visible, "b", { column: 0, maxColumns: 1, clusterId: 1 });
}

// Two true overlaps → two columns
{
  const result = layoutTimedDayColumn([
    event("long", 3, 0, 4, 0),
    event("short", 3, 0, 3, 30),
  ]);
  assert.equal(result.overflows.length, 0);
  assertLayout(result.visible, "long", { column: 0, maxColumns: 2, clusterId: 0 });
  assertLayout(result.visible, "short", { column: 1, maxColumns: 2, clusterId: 0 });
}

// Six events at 3:00–4:00 → 3 visible + overflow 3
{
  const result = layoutTimedDayColumn(
    Array.from({ length: 6 }, (_, index) => event(`e${index}`, 3, 0, 4, 0)),
  );
  assert.equal(result.visible.length, 3);
  assert.equal(result.overflows.length, 1);
  assert.equal(result.overflows[0].count, 3);
  assert.equal(result.visible[0].maxColumns, 3);
}

// Complex priority: 2–4, 3–5, 3–3:30, three 3–4 → show spans + short, hide slots
{
  const result = layoutTimedDayColumn([
    event("span-2-4", 2, 0, 4, 0),
    event("span-3-5", 3, 0, 5, 0),
    event("short-3-330", 3, 0, 3, 30),
    event("slot-a", 3, 0, 4, 0),
    event("slot-b", 3, 0, 4, 0),
    event("slot-c", 3, 0, 4, 0),
  ]);
  assertVisibleIds(result, "span-2-4", "span-3-5", "short-3-330");
  assert.equal(result.overflows.length, 1);
  assert.equal(result.overflows[0].count, 3);
  assert.deepEqual(result.overflows[0].hiddenIds.sort(), [
    "slot-a",
    "slot-b",
    "slot-c",
  ]);
  assert.equal(result.visible[0].maxColumns, 3);
}

console.log("layoutTimedDayColumn.test.ts: all tests passed");
