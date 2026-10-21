import { loadClinicRegistry } from "@/database/ClinicRegistry";
import { canonicalCustomerId, sameCustomerId } from "@/helpers/auth/customerId";
import { getDeviceApiKey } from "@/security/pairing/pairingVault";
import { useAuthStore } from "@/stores";

/**
 * Repairs a stale auth.customerId left after removing/unpairing a clinic
 * without clearing pairing (login then 401s "not paired to this clinic").
 *
 * - If other clinics remain locally, rebind customerId to the most recently opened.
 * - If none remain and this id has no device API key, clear all pairing state.
 */
export async function reconcilePairedClinicBinding(): Promise<void> {
  const store = useAuthStore.getState();
  const customerId = store.customerId;
  if (!customerId) {
    return;
  }

  const id = canonicalCustomerId(customerId) ?? customerId;
  const registry = await loadClinicRegistry();
  if (registry.clinics[id]) {
    return;
  }

  const remaining = Object.values(registry.clinics).sort((a, b) => {
    const aAt = a.lastOpenedAt ? Date.parse(a.lastOpenedAt) : 0;
    const bAt = b.lastOpenedAt ? Date.parse(b.lastOpenedAt) : 0;
    const aTime = Number.isFinite(aAt) ? aAt : 0;
    const bTime = Number.isFinite(bAt) ? bAt : 0;
    return bTime - aTime;
  });

  if (remaining.length > 0) {
    const nextId = remaining[0]?.customerId;
    if (nextId && !sameCustomerId(nextId, id)) {
      const { clearSession } = await import("@/security/session/sessionVault");
      await clearSession();
      useAuthStore.getState().setCustomerId(nextId);
    }
    return;
  }

  const apiKey = await getDeviceApiKey(id);
  if (apiKey) {
    return;
  }

  const { clearAllSecurityState } = await import(
    "@/security/session/sessionVault"
  );
  await clearAllSecurityState();
}
