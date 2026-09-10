/** Pure LRU ordering: oldest lastOpenedAt first; null/invalid timestamps sort first. */
export function sortClinicsByLru<T extends { lastOpenedAt: string | null }>(
  entries: T[],
): T[] {
  return [...entries].sort((a, b) => {
    const aAt = a.lastOpenedAt ? Date.parse(a.lastOpenedAt) : 0;
    const bAt = b.lastOpenedAt ? Date.parse(b.lastOpenedAt) : 0;
    const aTime = Number.isFinite(aAt) ? aAt : 0;
    const bTime = Number.isFinite(bAt) ? bAt : 0;
    return aTime - bTime;
  });
}
