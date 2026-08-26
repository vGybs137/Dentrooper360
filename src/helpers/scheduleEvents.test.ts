import assert from "node:assert/strict";

import type { MonthDayEventPreview } from "../types/schedule";
import type { DayKey, MonthKey } from "../utils/calendar";

import {
  EMPTY_DAY_EVENTS,
  EMPTY_MONTH_EVENTS,
  eventsForDay,
  eventsForDayWithNeighbors,
  monthEventsSlice,
} from "./scheduleEvents";

function preview(
  id: string,
  overrides: Partial<MonthDayEventPreview> = {},
): MonthDayEventPreview {
  return {
    id,
    title: id,
    color: null,
    typeName: null,
    startTime: 0,
    endTime: 1,
    ...overrides,
  };
}

const augKey = "2026-08" as MonthKey;
const sepKey = "2026-09" as MonthKey;
const octKey = "2026-10" as MonthKey;

const augMap = {
  ["2026-08-31" as DayKey]: [preview("aug-31")],
};
const sepMap = {
  ["2026-09-15" as DayKey]: [preview("sep-15")],
};
const octMap = {
  ["2026-10-01" as DayKey]: [preview("oct-01")],
};

const cache = {
  [augKey]: augMap,
  [sepKey]: sepMap,
  [octKey]: octMap,
};

assert.equal(monthEventsSlice(cache, sepKey), sepMap);
assert.equal(monthEventsSlice(cache, "2099-01" as MonthKey), EMPTY_MONTH_EVENTS);

assert.equal(eventsForDay(sepMap, "2026-09-15" as DayKey), sepMap["2026-09-15"]);
assert.equal(eventsForDay(sepMap, "2026-09-01" as DayKey), EMPTY_DAY_EVENTS);
assert.equal(eventsForDay(undefined, "2026-09-01" as DayKey), EMPTY_DAY_EVENTS);

assert.equal(
  eventsForDayWithNeighbors(
    "2026-09-15" as DayKey,
    sepKey,
    sepMap,
    augKey,
    augMap,
    octKey,
    octMap,
  ),
  sepMap["2026-09-15"],
);
assert.equal(
  eventsForDayWithNeighbors(
    "2026-08-31" as DayKey,
    sepKey,
    sepMap,
    augKey,
    augMap,
    octKey,
    octMap,
  ),
  augMap["2026-08-31"],
);
assert.equal(
  eventsForDayWithNeighbors(
    "2026-10-01" as DayKey,
    sepKey,
    sepMap,
    augKey,
    augMap,
    octKey,
    octMap,
  ),
  octMap["2026-10-01"],
);
assert.equal(
  eventsForDayWithNeighbors(
    "2026-07-31" as DayKey,
    sepKey,
    sepMap,
    augKey,
    augMap,
    octKey,
    octMap,
  ),
  EMPTY_DAY_EVENTS,
);

// Empty sentinels must be stable identities for memoization.
assert.equal(EMPTY_DAY_EVENTS, eventsForDay(undefined, "2026-01-01" as DayKey));
assert.equal(EMPTY_MONTH_EVENTS, monthEventsSlice({}, "2026-01" as MonthKey));

console.log("scheduleEvents.test.ts: all tests passed");
