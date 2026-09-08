import {
  MONTH_QUICK_ADD_COLLAPSED_HEIGHT,
  MONTH_VIEW_CELL_GAP,
  MONTH_VIEW_CHIP_LINE_HEIGHT,
  MONTH_VIEW_DAY_NUMBER_SIZE,
  MONTH_VIEW_MAX_VISIBLE_EVENTS,
} from "@/constants/schedule";
import { primitives, semantic } from "@/tokens";
import {
  MONTH_GRID_ROWS,
} from "@/helpers/schedule/calendar";

export type MonthViewLayoutInsets = {
  top: number;
  bottom: number;
};

export type EstimateMonthViewLayoutInput = {
  windowHeight: number;
  insets: MonthViewLayoutInsets;
  /** Sync-status banner height when visible. */
  bannerHeight?: number;
  /** Native tab bar height already subtracted from the window. */
  tabBarInset?: number;
};

export type MonthViewLayout = {
  chromeHeight: number;
  quickAddHeight: number;
  hostHeight: number;
  pagerHeight: number;
  weekHeight: number;
  cellHeight: number;
  eventsAvailableHeight: number;
  chipCapacity: number;
  sheetSnapHeight: number;
};

export function monthViewChipRowHeight(): number {
  return semantic.space.stack.comfortable + primitives.space[2];
}

export function monthViewOverflowRowHeight(): number {
  return MONTH_VIEW_CHIP_LINE_HEIGHT + primitives.space[2];
}

export function monthViewHeaderHeight(): number {
  return (
    Math.max(semantic.size.touch, semantic.type.title.lineHeight) +
    semantic.space.stack.compact
  );
}

export function monthViewWeekdayHeight(): number {
  return (
    semantic.type.label.lineHeight +
    semantic.space.stack.compact +
    semantic.space.stack.compact
  );
}

/** Header + weekday row above the pager. */
export function monthViewChromeHeight(): number {
  return monthViewHeaderHeight() + monthViewWeekdayHeight();
}

export function monthViewQuickAddHeight(): number {
  return MONTH_QUICK_ADD_COLLAPSED_HEIGHT + semantic.space.stack.compact * 2;
}

/**
 * Space below the calendar: native tab bar, system home/nav inset, and
 * ScheduleScreen's compact bottom padding.
 */
export function monthViewScreenBottomPadding(
  insets: MonthViewLayoutInsets,
  tabBarInset: number,
): number {
  return tabBarInset + insets.bottom + semantic.space.stack.compact;
}

/** Vertical padding inside a day cell that is not available for chips. */
export function monthViewCellChromeHeight(): number {
  return (
    semantic.space.stack.compact +
    primitives.space[2] +
    MONTH_VIEW_DAY_NUMBER_SIZE +
    semantic.space.stack.compact
  );
}

export function eventsAvailableHeightForCell(cellHeight: number): number {
  return Math.max(0, cellHeight - monthViewCellChromeHeight());
}

export function chipCapacityForEventsHeight(availableHeight: number): number {
  const chipRowHeight = Math.max(monthViewChipRowHeight(), 1);
  return Math.min(
    MONTH_VIEW_MAX_VISIBLE_EVENTS,
    Math.max(0, Math.floor(availableHeight / chipRowHeight)),
  );
}

/** How many chips to render for a day, leaving a `+N more` row when needed. */
export function visibleChipCount(
  availableHeight: number,
  eventCount: number,
): number {
  const maxBySpace = chipCapacityForEventsHeight(availableHeight);
  let visibleCount = Math.min(maxBySpace, eventCount);

  if (eventCount > visibleCount) {
    const chipRowHeight = Math.max(monthViewChipRowHeight(), 1);
    const maxWithOverflow = Math.max(
      0,
      Math.floor(
        (availableHeight - monthViewOverflowRowHeight()) / chipRowHeight,
      ),
    );
    visibleCount = Math.min(
      maxWithOverflow,
      Math.max(0, eventCount - 1),
      MONTH_VIEW_MAX_VISIBLE_EVENTS,
    );
  }

  return visibleCount;
}

/** Sheet height under the pinned week row. Zero until host and pager exist. */
export function monthViewSheetSnapHeight(
  hostHeight: number,
  chromeHeight: number,
  pagerHeight: number,
): number {
  if (hostHeight <= 0 || pagerHeight <= 0) return 0;
  const weekHeight = pagerHeight / MONTH_GRID_ROWS;
  return Math.max(0, Math.round(hostHeight - chromeHeight - weekHeight));
}

/**
 * First-frame geometry from window size and tokens.
 * `onLayout` may refine host/chrome/pager later without unmounting the grid.
 */
export function estimateMonthViewLayout({
  windowHeight,
  insets,
  bannerHeight = 0,
  tabBarInset = 80,
}: EstimateMonthViewLayoutInput): MonthViewLayout {
  const chromeHeight = monthViewChromeHeight();
  const quickAddHeight = monthViewQuickAddHeight();
  const screenChrome =
    insets.top +
    semantic.space.page +
    bannerHeight +
    monthViewScreenBottomPadding(insets, tabBarInset);

  const hostHeight = Math.max(
    0,
    windowHeight - screenChrome - quickAddHeight,
  );
  const pagerHeight = Math.max(0, hostHeight - chromeHeight);
  const weekHeight =
    pagerHeight > 0 ? pagerHeight / MONTH_GRID_ROWS : 0;
  const cellHeight = Math.max(
    0,
    (pagerHeight - MONTH_VIEW_CELL_GAP * (MONTH_GRID_ROWS - 1)) /
      MONTH_GRID_ROWS,
  );
  const eventsAvailableHeight = eventsAvailableHeightForCell(cellHeight);
  const chipCapacity = chipCapacityForEventsHeight(eventsAvailableHeight);
  const sheetSnapHeight = monthViewSheetSnapHeight(
    hostHeight,
    chromeHeight,
    pagerHeight,
  );

  return {
    chromeHeight,
    quickAddHeight,
    hostHeight,
    pagerHeight,
    weekHeight,
    cellHeight,
    eventsAvailableHeight,
    chipCapacity,
    sheetSnapHeight,
  };
}
