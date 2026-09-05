import { create } from "zustand";

export type AddPatientStep = "essentials" | "appointment";

type AddPatientStoreState = {
  step: AddPatientStep;
  isPresented: boolean;
  /** Bumped on each open so the sheet re-presents even if already marked presented. */
  presentKey: number;
  /** When set, the sheet edits this patient instead of creating one. */
  editingPatientId: string | null;
  open: () => void;
  openForEdit: (patientId: string) => void;
  requestClose: () => void;
  finishClose: () => void;
  goNext: () => void;
  goBack: () => void;
};

const CLOSED_STATE = {
  isPresented: false,
  step: "essentials" as const,
  editingPatientId: null,
  presentKey: 0,
};

export const useAddPatientStore = create<AddPatientStoreState>((set, get) => ({
  step: "essentials",
  isPresented: false,
  presentKey: 0,
  editingPatientId: null,

  open: () => {
    set((state) => ({
      isPresented: true,
      step: "essentials",
      editingPatientId: null,
      presentKey: state.presentKey + 1,
    }));
  },

  openForEdit: (patientId) => {
    set((state) => ({
      isPresented: true,
      step: "essentials",
      editingPatientId: patientId,
      presentKey: state.presentKey + 1,
    }));
  },

  requestClose: () => {
    if (!get().isPresented) {
      return;
    }

    set({ isPresented: false });
  },

  finishClose: () => {
    set((state) => ({
      ...CLOSED_STATE,
      presentKey: state.presentKey,
    }));
  },

  goNext: () => {
    if (get().step === "essentials") {
      set({ step: "appointment" });
    }
  },

  goBack: () => {
    if (get().step === "appointment") {
      set({ step: "essentials" });
    }
  },
}));

export function useAddPatientIsPresented() {
  return useAddPatientStore((state) => state.isPresented);
}

export function useAddPatientStep() {
  return useAddPatientStore((state) => state.step);
}

export function useAddPatientPresentKey() {
  return useAddPatientStore((state) => state.presentKey);
}

export function useAddPatientEditingId() {
  return useAddPatientStore((state) => state.editingPatientId);
}
