/**
 * Pure UI role match — never authorize PHI or sync from this alone.
 * Server JWT / membership remain the source of truth.
 */
export function matchUiRole(
  roleName: string | null | undefined,
  ...roles: string[]
): boolean {
  if (!roleName) {
    return false;
  }

  const normalized = roleName.trim().toUpperCase();
  return roles.some((item) => item.trim().toUpperCase() === normalized);
}
