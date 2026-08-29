import assert from "node:assert/strict";

import {
  chipCapacityForEventsHeight,
  estimateMonthViewLayout,
  eventsAvailableHeightForCell,
  monthViewCellChromeHeight,
  monthViewChromeHeight,
  monthViewChipRowHeight,
  monthViewSheetSnapHeight,
  visibleChipCount,
} from "./monthViewLayout";

const chipRow = monthViewChipRowHeight();

assert.equal(chipCapacityForEventsHeight(0), 0);
assert.equal(chipCapacityForEventsHeight(chipRow - 1), 0);
assert.equal(chipCapacityForEventsHeight(chipRow), 1);
assert.ok(chipCapacityForEventsHeight(chipRow * 8) <= 3);
assert.equal(visibleChipCount(chipRow, 1), 1);
assert.equal(visibleChipCount(chipRow, 5), 0);

const chrome = monthViewCellChromeHeight();
assert.equal(eventsAvailableHeightForCell(chrome), 0);
assert.equal(eventsAvailableHeightForCell(chrome + 20), 20);

const phone = estimateMonthViewLayout({
  windowHeight: 844,
  insets: { top: 47, bottom: 34 },
  tabBarInset: 80,
});

assert.ok(phone.chromeHeight === monthViewChromeHeight());
assert.ok(phone.pagerHeight > 0, "pager should be positive on a typical phone");
assert.ok(phone.cellHeight > 0);
assert.ok(phone.sheetSnapHeight > 0);
assert.ok(phone.chipCapacity >= 1);
assert.ok(phone.chipCapacity <= 3);

const noBottomInset = estimateMonthViewLayout({
  windowHeight: 844,
  insets: { top: 47, bottom: 0 },
  tabBarInset: 80,
});
assert.equal(noBottomInset.pagerHeight - phone.pagerHeight, 34);

const noTabBar = estimateMonthViewLayout({
  windowHeight: 844,
  insets: { top: 47, bottom: 34 },
  tabBarInset: 0,
});
assert.equal(noTabBar.pagerHeight - phone.pagerHeight, 80);

assert.equal(monthViewSheetSnapHeight(0, 80, 400), 0);
assert.equal(monthViewSheetSnapHeight(600, 80, 0), 0);
assert.equal(
  monthViewSheetSnapHeight(600, 80, 400),
  Math.round(600 - 80 - 400 / 6),
);

const tiny = estimateMonthViewLayout({
  windowHeight: 200,
  insets: { top: 47, bottom: 34 },
});
assert.equal(tiny.chipCapacity, 0);

console.log("monthViewLayout.test.ts: all tests passed");
