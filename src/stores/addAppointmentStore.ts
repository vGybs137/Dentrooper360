import dayjs from "dayjs";
import { create } from "zustand";

export type AppointmentSlot = {
  start: Date;
  end: Date;
};

export type AddAppointmentStep = "patient" | "details";

export const ADD_APPOINTMENT_SLOT_DURATION_MINUTES = 60;

type AddAppointmentStoreState = {
  slot: AppointmentSlot | null;
  step: AddAppointmentStep;
  /** Whether the sheet should be presented. */
  isPresented: boolean;
  selectSlot: (start: Date) => void;
  open: () => void;
  requestClose: () => void;
  finishClose: () => void;
  goNext: () => void;
  goBack: () => void;
  /** Clears selection and closes without waiting for exit animation. */
  dismissImmediately: () => void;
  /** Animates the sheet closed if open; otherwise clears the selected slot. */
  clearOrClose: () => void;
};

function buildSlot(start: Date): AppointmentSlot {
  return {
    start,
    end: dayjs(start)
      .add(ADD_APPOINTMENT_SLOT_DURATION_MINUTES, "minute")
      .toDate(),
  };
}

export const useAddAppointmentStore = create<AddAppointmentStoreState>(
  (set, get) => ({
    slot: null,
    step: "patient",
    isPresented: false,

    selectSlot: (start) => {
      set({ slot: buildSlot(start) });
    },

    open: () => {
      const { slot } = get();
      if (!slot) {
        return;
      }

      set({
        isPresented: true,
        step: "patient",
      });
    },

    requestClose: () => {
      if (!get().isPresented) {
        return;
      }

      set({ isPresented: false });
    },

    finishClose: () => {
      set({
        isPresented: false,
        slot: null,
        step: "patient",
      });
    },

    goNext: () => {
      if (get().step === "patient") {
        set({ step: "details" });
      }
    },

    goBack: () => {
      if (get().step === "details") {
        set({ step: "patient" });
      }
    },

    dismissImmediately: () => {
      set({
        isPresented: false,
        slot: null,
        step: "patient",
      });
    },

    clearOrClose: () => {
      if (get().isPresented) {
        set({ isPresented: false });
        return;
      }

      set({
        isPresented: false,
        slot: null,
        step: "patient",
      });
    },
  }),
);

export function useAddAppointmentSlot() {
  return useAddAppointmentStore((state) => state.slot);
}

export function useAddAppointmentIsPresented() {
  return useAddAppointmentStore((state) => state.isPresented);
}

export function useAddAppointmentStep() {
  return useAddAppointmentStore((state) => state.step);
}
