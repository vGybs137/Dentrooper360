/**
 * Month-view performance bench for Phases 1–3.
 * Run: node scripts/bench-month-view-perf.mjs
 *
 * Measures JS-side costs that the plan targets (subscription growth,
 * cache-identity invalidation, sheet-open freeze). Not a substitute for
 * on-device Profiler, but reproducible without a device.
 */

function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function addMonths(year, monthIndex, delta) {
  const d = new Date(Date.UTC(year, monthIndex + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

function retainKeys(year, monthIndex) {
  const prev = addMonths(year, monthIndex, -1);
  const next = addMonths(year, monthIndex, 1);
  return new Set([
    monthKey(prev.year, prev.month),
    monthKey(year, monthIndex),
    monthKey(next.year, next.month),
  ]);
}

function bench(label, fn, iterations = 1) {
  // Warmup
  fn();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const ms = performance.now() - start;
  return { label, iterations, totalMs: ms, perOpMs: ms / iterations };
}

/** Phase 1: subscription count after navigating many months. */
function simulateSubscriptionGrowth(navigateCount, prune) {
  const subs = new Set();
  let year = 2024;
  let month = 0; // Jan
  for (let i = 0; i < navigateCount; i++) {
    const keys = retainKeys(year, month);
    for (const key of keys) subs.add(key);
    if (prune) {
      for (const key of [...subs]) {
        if (!keys.has(key)) subs.delete(key);
      }
    }
    const next = addMonths(year, month, 1);
    year = next.year;
    month = next.month;
  }
  return subs.size;
}

/** Synthetic appointments for buildDayMap-like work. */
function makeAppointments(count, year, monthIndex) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const day = (i % 28) + 1;
    const start = Date.UTC(year, monthIndex, day, 9 + (i % 8), i % 60);
    out.push({
      id: `a-${i}`,
      startTime: start,
      endTime: start + 30 * 60 * 1000,
      title: `Appt ${i}`,
      color: i % 3 === 0 ? "#3366ff" : null,
    });
  }
  return out;
}

function buildDayMap(appointments) {
  const sorted = [...appointments].sort((a, b) => a.startTime - b.startTime);
  const map = Object.create(null);
  for (const appointment of sorted) {
    const d = new Date(appointment.startTime);
    const dayKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const bucket = map[dayKey] ?? (map[dayKey] = []);
    bucket.push({
      id: appointment.id,
      title: appointment.title,
      color: appointment.color,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    });
  }
  return map;
}

/**
 * Phase 2: when one month publishes, how many mounted grids (+ day cells)
 * would see prop identity changes under full-cache vs scoped maps.
 */
function simulateScopedInvalidation() {
  const EMPTY = Object.freeze({});
  const EMPTY_DAY = Object.freeze([]);

  // Viewing September → mounted Aug / Sep / Oct
  const maps = {
    "2026-08": buildDayMap(makeAppointments(40, 2026, 7)),
    "2026-09": buildDayMap(makeAppointments(40, 2026, 8)),
    "2026-10": buildDayMap(makeAppointments(40, 2026, 9)),
  };

  const mounted = ["2026-08", "2026-09", "2026-10"];
  const gridDays = 42; // 6x7

  // Publish August only (new map identity; others unchanged)
  const nextAug = buildDayMap(makeAppointments(41, 2026, 7));
  const nextMaps = { ...maps, "2026-08": nextAug };

  // Full cache: whole cache object identity changes → all mounted grids rerender
  const fullCacheGridRerenders = mounted.length;

  // Scoped props: grid rerenders if own or neighbor map identity changed
  let scopedGridRerenders = 0;
  const scopedGridDetails = [];
  for (const month of mounted) {
    const [y, m] = month.split("-").map(Number);
    const ym = { year: y, month: m - 1 };
    const prevYm = addMonths(ym.year, ym.month, -1);
    const nextYm = addMonths(ym.year, ym.month, 1);
    const prevKey = monthKey(prevYm.year, prevYm.month);
    const nextKey = monthKey(nextYm.year, nextYm.month);

    const ownChanged = maps[month] !== nextMaps[month];
    const prevChanged =
      (maps[prevKey] ?? EMPTY) !== (nextMaps[prevKey] ?? EMPTY);
    const nextChanged =
      (maps[nextKey] ?? EMPTY) !== (nextMaps[nextKey] ?? EMPTY);
    const rerender = ownChanged || prevChanged || nextChanged;
    if (rerender) scopedGridRerenders += 1;
    scopedGridDetails.push({
      month,
      ownChanged,
      prevChanged,
      nextChanged,
      rerender,
    });
  }

  // DayCell-level on Sep grid: only cells whose event-array identity changes update.
  const sepBefore = maps["2026-09"];
  const sepAfter = nextMaps["2026-09"];
  const augBefore = maps["2026-08"];
  const augAfter = nextMaps["2026-08"];
  const augDayKeys = Object.keys(augBefore);
  // Leading out-of-month cells ≈ last few Aug days shown on Sep's first row
  const leadingAugDays = augDayKeys.slice(-3);
  let dayCellsUpdatedScoped = 0;
  for (const day of leadingAugDays) {
    const before = augBefore[day] ?? EMPTY_DAY;
    const after = augAfter[day] ?? EMPTY_DAY;
    if (before !== after) dayCellsUpdatedScoped += 1;
  }
  // Full-cache path: MonthGrid always re-renders → all 42 cells reconcile.
  const dayCellsUpdatedFull = gridDays;
  const dayCellsSkippedScoped = gridDays - dayCellsUpdatedScoped;

  return {
    fullCacheGridRerenders,
    scopedGridRerenders,
    scopedGridDetails,
    dayCellsUpdatedFull,
    dayCellsUpdatedScoped,
    dayCellsSkippedScoped,
    sepMapStable: sepBefore === sepAfter,
  };
}

/** Phase 3: MonthPager cache prop changes while sheet open. */
function simulateSheetFreeze(writes) {
  let liveCache = { version: 0 };
  let frozen = liveCache;
  let sheetOpen = true;

  let monthPagerPropChanges = 0;
  let weekPagerPropChanges = 0;
  let lastMonthProp = frozen;
  let lastWeekProp = liveCache;

  for (let i = 0; i < writes; i++) {
    liveCache = { version: i + 1 }; // new object each publish
    if (!sheetOpen) frozen = liveCache;
    const monthProp = sheetOpen ? frozen : liveCache;
    const weekProp = liveCache;
    if (monthProp !== lastMonthProp) {
      monthPagerPropChanges += 1;
      lastMonthProp = monthProp;
    }
    if (weekProp !== lastWeekProp) {
      weekPagerPropChanges += 1;
      lastWeekProp = weekProp;
    }
  }
  return { writes, monthPagerPropChanges, weekPagerPropChanges };
}

function simulatePagerPageRebuild(pageCount, iterations) {
  return bench(
    `rebuild ${pageCount} page descriptors`,
    () => {
      const pages = [];
      for (let i = 0; i < pageCount; i++) {
        pages.push({
          key: `m-${i}`,
          shouldRender: Math.abs(i - 120) <= 1,
          eventsByDay: null,
          prev: null,
          next: null,
        });
      }
      return pages.length;
    },
    iterations,
  );
}

// --- Run ---
const navigateCount = 36; // 3 years of months
const subsNoPrune = simulateSubscriptionGrowth(navigateCount, false);
const subsPrune = simulateSubscriptionGrowth(navigateCount, true);

const appts = makeAppointments(200, 2026, 8);
const buildBench = bench("buildDayMap(200 appts)", () => buildDayMap(appts), 200);

const scoped = simulateScopedInvalidation();
const freeze = simulateSheetFreeze(20);
const pager241 = simulatePagerPageRebuild(241, 500);

const results = {
  phase1: {
    navigateCount,
    subscriptionsWithoutPrune: subsNoPrune,
    subscriptionsWithPrune: subsPrune,
    pass: subsPrune <= 3 && subsNoPrune > 3,
  },
  phase2: {
    ...scoped,
    pass:
      scoped.sepMapStable &&
      scoped.dayCellsUpdatedScoped < scoped.dayCellsUpdatedFull &&
      scoped.scopedGridRerenders <= scoped.fullCacheGridRerenders,
  },
  phase3: {
    ...freeze,
    pass: freeze.monthPagerPropChanges === 0 && freeze.weekPagerPropChanges === freeze.writes,
  },
  micro: {
    buildDayMap: buildBench,
    pagerPageRebuild: pager241,
  },
};

console.log(JSON.stringify(results, null, 2));
