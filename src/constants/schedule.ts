import { primitives, semantic } from "@/tokens";

/** Neighbor pages kept mounted in month/week PagerViews. */
export const MONTH_VIEW_PAGER_RENDER_RADIUS = 1;

/** Max title chips shown inside a month day cell. */
export const MONTH_VIEW_MAX_VISIBLE_EVENTS = 3;

/** Max type-colored dots when the sheet is open. */
export const MONTH_VIEW_MAX_VISIBLE_DOTS = 5;

/** Gap between day cells in the month grid (token: stack.compact). */
export const MONTH_VIEW_CELL_GAP = semantic.space.stack.compact;

/** Day-of-month badge size (token: space 24). */
export const MONTH_VIEW_DAY_NUMBER_SIZE = primitives.space[24];

/** Compact in-cell event rail width (token: border strong). */
export const MONTH_VIEW_EVENT_CHIP_RAIL_WIDTH = semantic.borderWidth.strong;

/** Sheet list card left rail width (token: space 4). */
export const MONTH_VIEW_EVENT_LIST_RAIL_WIDTH = primitives.space[4];

/** Event indicator dots when week-pinned (token: space 8). */
export const MONTH_VIEW_EVENT_DOT_SIZE = primitives.space[8];

/** Brand tint alpha for typed appointment list cards. */
export const MONTH_VIEW_EVENT_CARD_BRAND_ALPHA = 0.5;

/** Opacity for untyped event rails/dots (token: loading). */
export const MONTH_VIEW_UNTYPED_OPACITY = semantic.opacity.loading;

/** Opacity for out-of-month day numbers when not selected (token: disabled). */
export const MONTH_VIEW_MUTED_DAY_OPACITY = semantic.opacity.disabled;

/** Sheet open progress at which month/week pagers swap instantly. */
export const MONTH_VIEW_SHEET_SWAP_PROGRESS = 0.99;

/** Chip opacity fade-out end while opening the sheet. */
export const MONTH_VIEW_CHIP_FADE_END = 0.28;

/** Dot opacity fade-in range while opening the sheet. */
export const MONTH_VIEW_DOT_FADE_START = 0.08;
export const MONTH_VIEW_DOT_FADE_END = 0.32;

/** Bottom-sheet snap with no animation (finger-follow / instant). */
export const MONTH_VIEW_SHEET_SNAP_INSTANT = { duration: 0 } as const;

/** Timed grid row height in the week view (px). */
export const WEEK_VIEW_HOUR_HEIGHT = 60;

/** Gap inserted between each hour row in the week view (px). */
export const WEEK_VIEW_HOUR_GAP = 1;

/** Left time-gutter width in the week view (px). */
export const WEEK_VIEW_GUTTER_WIDTH = 36;

/** Time-gutter label line height; also used for top/bottom grid inset (px). */
export const WEEK_VIEW_GUTTER_LABEL_LINE_HEIGHT = 12;

export const WEEK_VIEW_GRID_EDGE_INSET =
  WEEK_VIEW_GUTTER_LABEL_LINE_HEIGHT / 2;

/** Initial scroll window hint for gutter labels (full grid remains 24h). */
export const WEEK_VIEW_DEFAULT_START_HOUR = 6;
export const WEEK_VIEW_DEFAULT_END_HOUR = 22;

/** Neighbor week pages kept mounted in WeekCalendarPager. */
export const WEEK_VIEW_PAGER_RENDER_RADIUS = 1;

/** Scroll-to-now padding above the current time (minutes). */
export const WEEK_VIEW_SCROLL_PADDING_MINUTES = 60;

/** Current-time indicator thickness (px). */
export const WEEK_VIEW_NOW_INDICATOR_HEIGHT = 2;
