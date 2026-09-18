import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import {
  DEFAULT_PATIENT_COUNTRY_CODE,
  PATIENT_COUNTRY_CODE_OPTIONS,
} from "@/constants/patientForm";
import { PATIENT_PREFERENCES_STORE_KEY } from "@/constants/storage";
import { getItem, setItem } from "@/security/vault/secureStorage";

type PersistedPatientPreferences = {
  defaultCountryCode: string;
};

type PatientPreferencesState = PersistedPatientPreferences & {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setDefaultCountryCode: (value: string) => void;
};

const securePersistStorage: PersistStorage<PersistedPatientPreferences> =
  createJSONStorage<PersistedPatientPreferences>(() => ({
    getItem: (name) => getItem(name),
    setItem: (name, value) => setItem(name, value),
    removeItem: (name) => setItem(name, null),
  }))!;

function normalizeCountryCode(value: string | undefined): string {
  if (
    value &&
    (PATIENT_COUNTRY_CODE_OPTIONS as readonly string[]).includes(value)
  ) {
    return value;
  }
  return DEFAULT_PATIENT_COUNTRY_CODE;
}

export const usePatientPreferencesStore = create<PatientPreferencesState>()(
  persist(
    (set, get) => ({
      defaultCountryCode: DEFAULT_PATIENT_COUNTRY_CODE,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setDefaultCountryCode: (defaultCountryCode) => {
        const next = normalizeCountryCode(defaultCountryCode);
        if (get().defaultCountryCode === next) return;
        set({ defaultCountryCode: next });
      },
    }),
    {
      name: PATIENT_PREFERENCES_STORE_KEY,
      storage: securePersistStorage,
      partialize: ({ defaultCountryCode }) => ({ defaultCountryCode }),
      merge: (persisted, current) => {
        const stored =
          (persisted as Partial<PersistedPatientPreferences> | undefined) ??
          {};
        return {
          ...current,
          ...stored,
          defaultCountryCode: normalizeCountryCode(stored.defaultCountryCode),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function useDefaultPatientCountryCode() {
  return usePatientPreferencesStore((state) => state.defaultCountryCode);
}

export function getDefaultPatientCountryCode(): string {
  return usePatientPreferencesStore.getState().defaultCountryCode;
}

export function usePatientPreferencesHasHydrated() {
  return usePatientPreferencesStore((state) => state.hasHydrated);
}
