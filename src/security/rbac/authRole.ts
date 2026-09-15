/**
 * UI-facing RBAC helpers. Server JWT / membership remain the source of truth;
 * these only read the session user profile for presentation and light UX gates.
 */
import { useAuthStore } from "@/stores/authStore";
import { matchUiRole } from "@/security/rbac/matchUiRole";

export { matchUiRole } from "@/security/rbac/matchUiRole";

export function useAuthRole(): string | null {
  return useAuthStore((state) => state.user?.roleName ?? null);
}

export function useSyncScope(): string | null {
  return useAuthStore((state) => state.user?.syncScope ?? null);
}

export function useScopeVersion(): number | null {
  return useAuthStore((state) => state.user?.scopeVersion ?? null);
}

/** Soft UI hint — never authorize PHI or sync from this alone. */
export function hasUiRole(...roles: string[]): boolean {
  return matchUiRole(useAuthStore.getState().user?.roleName, ...roles);
}
