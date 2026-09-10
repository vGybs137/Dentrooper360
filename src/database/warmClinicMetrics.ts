/**
 * Lightweight in-memory counters for warm-clinic LRU (Phase 5 exit metrics).
 * Not persisted — useful for debug / future telemetry hooks.
 */
type WarmClinicMetrics = {
  warmCount: number;
  demoteSucceeded: number;
  demoteBlockedUnsynced: number;
  demoteSkippedActive: number;
  lastClinicDbBytesEstimate: number | null;
};

const metrics: WarmClinicMetrics = {
  warmCount: 0,
  demoteSucceeded: 0,
  demoteBlockedUnsynced: 0,
  demoteSkippedActive: 0,
  lastClinicDbBytesEstimate: null,
};

export function recordWarmCount(count: number): void {
  metrics.warmCount = count;
}

export function recordDemoteSucceeded(): void {
  metrics.demoteSucceeded += 1;
}

export function recordDemoteBlockedUnsynced(): void {
  metrics.demoteBlockedUnsynced += 1;
}

export function recordDemoteSkippedActive(): void {
  metrics.demoteSkippedActive += 1;
}

export function getWarmClinicMetrics(): Readonly<WarmClinicMetrics> {
  return { ...metrics };
}
