import dayjs from "dayjs";
import { create } from "zustand";

import type { PatientCardData } from "@/helpers/patientDisplay";

export type AppointmentSlot = {
  start: Date;
  end: Date;
};

export type AddAppointmentStep = "patient" | "details";

export const ADD_APPOINTMENT_SLOT_DURATION_MINUTES = 60;

export type EditAppointmentDraft = {
  appointmentId: string;
  patientId: string | null;
  patient: PatientCardData | null;
  subject: string;
  typeId: string;
  locationId: string;
  start: Date;
  end: Date;
  description: string;
};

type AddAppointmentStoreState = {
  slot: AppointmentSlot | null;
  step: AddAppointmentStep;
  /** Whether the sheet should be presented. */
  isPresented: boolean;
  /** When set, the sheet edits this appointment instead of creating one. */
  editingAppointmentId: string | null;
  editDraft: EditAppointmentDraft | null;
  /** When set, the sheet creates an appointment for this patient. */
  createPatientDraft: PatientCardData | null;
  selectSlot: (start: Date) => void;
  open: () => void;
  openForEdit: (draft: EditAppointmentDraft) => void;
  openWithPatient: (patient: PatientCardData) => void;
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

function defaultAppointmentStart(): Date {
  return dayjs().add(1, "hour").startOf("hour").toDate();
}

const CLOSED_STATE = {
  isPresented: false,
  slot: null,
  step: "patient" as const,
  editingAppointmentId: null,
  editDraft: null,
  createPatientDraft: null,
};

export const useAddAppointmentStore = create<AddAppointmentStoreState>(
  (set, get) => ({
    slot: null,
    step: "patient",
    isPresented: false,
    editingAppointmentId: null,
    editDraft: null,
    createPatientDraft: null,

    selectSlot: (start) => {
      set({
        slot: buildSlot(start),
        editingAppointmentId: null,
        editDraft: null,
        createPatientDraft: null,
      });
    },

    open: () => {
      const { slot } = get();
      if (!slot) {
        return;
      }

      set({
        isPresented: true,
        step: "patient",
        editingAppointmentId: null,
        editDraft: null,
        createPatientDraft: null,
      });
    },

    openForEdit: (draft) => {
      set({
        slot: { start: draft.start, end: draft.end },
        editingAppointmentId: draft.appointmentId,
        editDraft: draft,
        isPresented: true,
        step: "details",
        createPatientDraft: null,
      });
    },

    openWithPatient: (patient) => {
      set({
        slot: buildSlot(defaultAppointmentStart()),
        createPatientDraft: patient,
        isPresented: true,
        step: "details",
        editingAppointmentId: null,
        editDraft: null,
      });
    },

    requestClose: () => {
      if (!get().isPresented) {
        return;
      }

      set({ isPresented: false });
    },

    finishClose: () => {
      set(CLOSED_STATE);
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
      set(CLOSED_STATE);
    },

    clearOrClose: () => {
      if (get().isPresented) {
        set({ isPresented: false });
        return;
      }

      set(CLOSED_STATE);
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

export function useAddAppointmentEditingId() {
  return useAddAppointmentStore((state) => state.editingAppointmentId);
}
