import { assignColumnsInCluster } from "./assignColumns";
import { buildOverlapClusters } from "./overlap";
import { needsVisibilityCap, selectVisibleInCluster } from "./selectVisible";
import type { TimedDayLayout, TimedEventInput } from "./types";

export const DEFAULT_TIMED_GRID_MAX_OVERLAP = 3;

export type LayoutTimedDayColumnOptions = {
  maxVisible?: number;
};

/**
 * Layout timed events for one day column.
 * Each overlap cluster is processed independently — survivors are never
 * re-laid-out together across cluster boundaries.
 */
export function layoutTimedDayColumn(
  events: TimedEventInput[],
  options: LayoutTimedDayColumnOptions = {},
): TimedDayLayout {
  const maxVisible = options.maxVisible ?? DEFAULT_TIMED_GRID_MAX_OVERLAP;
  const clusters = buildOverlapClusters(events);
  const visible = [];
  const overflows = [];

  for (const cluster of clusters) {
    const assigned = assignColumnsInCluster(cluster.clusterId, cluster.events);
    const maxColumns = assigned[0]?.maxColumns ?? 0;

    if (!needsVisibilityCap(cluster.events, maxColumns, maxVisible)) {
      visible.push(...assigned);
      continue;
    }

    const selection = selectVisibleInCluster(
      cluster.clusterId,
      cluster.events,
      maxVisible,
    );
    const reAssigned = assignColumnsInCluster(
      cluster.clusterId,
      selection.kept,
    );
    visible.push(...reAssigned);
    if (selection.overflow) {
      overflows.push(selection.overflow);
    }
  }

  return { visible, overflows };
}
