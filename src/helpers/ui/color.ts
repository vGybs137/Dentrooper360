/**
 * Apply an alpha channel to a 6-digit hex color.
 * Returns the original string when the input is not `#RRGGBB` / `RRGGBB`.
 */
export function withOpacity(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
