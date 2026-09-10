import { create } from "zustand";

type ClinicSwitchStoreState = {
  isSwitching: boolean;
  error: string | null;
  beginSwitch: () => void;
  endSwitch: () => void;
  failSwitch: (message: string) => void;
  clearError: () => void;
};

export const useClinicSwitchStore = create<ClinicSwitchStoreState>((set) => ({
  isSwitching: false,
  error: null,
  beginSwitch: () => set({ isSwitching: true, error: null }),
  endSwitch: () => set({ isSwitching: false }),
  failSwitch: (message) => set({ isSwitching: false, error: message }),
  clearError: () => set({ error: null }),
}));

export function useIsSwitchingClinic() {
  return useClinicSwitchStore((state) => state.isSwitching);
}

export function useClinicSwitchError() {
  return useClinicSwitchStore((state) => state.error);
}
