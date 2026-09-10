/**
 * Multi-clinic rollout flags (Phase 6).
 *
 * Env (build-time via EXPO_PUBLIC_*):
 * - EXPO_PUBLIC_FLAG_MULTI_CLINIC_REGISTRY — master multi-clinic path (default true)
 * - EXPO_PUBLIC_FLAG_MULTI_CLINIC_SWITCH_UI — allow switchClinic / Settings switcher (default true)
 * - EXPO_PUBLIC_FLAG_SYNC_SCOPE_PROVIDER_PANEL — persist/apply provider_panel echoes (default true)
 * - EXPO_PUBLIC_FLAG_WARM_LRU_DEMOTE — allow SQLite file demotion (default false)
 *
 * Rollback: set flags off / omit env. Do not auto-delete warm clinics. Named clinic
 * files remain openable as the sole active DB when switch + demote are disabled.
 */

export type MultiClinicFlags = {
  /** Per-customerId registry + ClinicSessionProvider path. */
  multiClinicRegistry: boolean;
  /** Clinic switch protocol + Settings switcher UI. */
  multiClinicSwitchUi: boolean;
  /** Persist server-applied provider_panel / scope_version on the device. */
  syncScopeProviderPanel: boolean;
  /** Delete LRU warm clinic SQLite files under disk/count budget. */
  warmLruDemote: boolean;
};

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") {
    return defaultValue;
  }

  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

let overrideFlags: Partial<MultiClinicFlags> | null = null;

/** Test/dogfood override — does not persist. */
export function setMultiClinicFlagsForTests(
  flags: Partial<MultiClinicFlags> | null,
): void {
  overrideFlags = flags;
}

export function getMultiClinicFlags(): MultiClinicFlags {
  const base: MultiClinicFlags = {
    multiClinicRegistry: envFlag(
      "EXPO_PUBLIC_FLAG_MULTI_CLINIC_REGISTRY",
      true,
    ),
    multiClinicSwitchUi: envFlag(
      "EXPO_PUBLIC_FLAG_MULTI_CLINIC_SWITCH_UI",
      true,
    ),
    syncScopeProviderPanel: envFlag(
      "EXPO_PUBLIC_FLAG_SYNC_SCOPE_PROVIDER_PANEL",
      true,
    ),
    warmLruDemote: envFlag("EXPO_PUBLIC_FLAG_WARM_LRU_DEMOTE", false),
  };

  if (!overrideFlags) {
    return base;
  }

  return { ...base, ...overrideFlags };
}

export function isClinicSwitchEnabled(): boolean {
  const flags = getMultiClinicFlags();
  return flags.multiClinicRegistry && flags.multiClinicSwitchUi;
}

export function isWarmLruDemoteEnabled(): boolean {
  const flags = getMultiClinicFlags();
  return flags.multiClinicRegistry && flags.warmLruDemote;
}

export function isSyncScopeProviderPanelEnabled(): boolean {
  return getMultiClinicFlags().syncScopeProviderPanel;
}
