import dayjs from "dayjs";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import { useForm, useWatch } from "react-hook-form";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import { combineDateAndTime } from "@/helpers/appointmentDate";
import { buildAppointmentSubjectFromPatient } from "@/helpers/appointmentSubject";
import { generateGuid } from "@/helpers/guid";
import { requestSync } from "@/helpers/requestSync";
import {
  ADD_APPOINTMENT_SLOT_DURATION_MINUTES,
  resolveDefaultLocationId,
  useAddAppointmentIsPresented,
  useAddAppointmentSlot,
  useAddAppointmentStep,
  useAddAppointmentStore,
  useAuthUser,
  useSchedulePreferencesStore,
} from "@/stores";

import {
  useAppointmentFormOptions,
  type AppointmentPatientOption,
} from "./useAppointmentFormOptions";

export type AddAppointmentFields = {
  patientId: string | null;
  subject: string;
  typeId: string;
  locationId: string;
  startTime: Date;
  endTime: Date;
  description: string;
};

const EMPTY_VALUES: AddAppointmentFields = {
  patientId: null,
  subject: "",
  typeId: "",
  locationId: "",
  startTime: new Date(0),
  endTime: new Date(0),
  description: "",
};

export function useAddAppointmentForm() {
  const user = useAuthUser();
  const slot = useAddAppointmentSlot();
  const isPresented = useAddAppointmentIsPresented();
  const step = useAddAppointmentStep();
  const editingAppointmentId = useAddAppointmentStore(
    (state) => state.editingAppointmentId,
  );
  const editDraft = useAddAppointmentStore((state) => state.editDraft);
  const storeGoNext = useAddAppointmentStore((state) => state.goNext);
  const storeGoBack = useAddAppointmentStore((state) => state.goBack);
  const requestClose = useAddAppointmentStore((state) => state.requestClose);
  const isEditing = Boolean(editingAppointmentId);

  const [patientSearch, setPatientSearch] = useState("");
  const deferredPatientSearch = useDeferredValue(patientSearch);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedPatientCache, setSelectedPatientCache] =
    useState<AppointmentPatientOption | null>(null);

  const options = useAppointmentFormOptions({
    patientSearch: deferredPatientSearch,
    loadPatients: isPresented && step === "patient",
    enabled: isPresented,
  });

  const form = useForm<AddAppointmentFields>({
    defaultValues: EMPTY_VALUES,
    mode: "onTouched",
  });

  const { control } = form;
  const patientId = useWatch({ control, name: "patientId" });
  const locationId = useWatch({ control, name: "locationId" });
  const subject = useWatch({ control, name: "subject" });
  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });

  useEffect(() => {
    if (!isPresented || !slot) {
      return;
    }

    setPatientSearch("");
    setSubmitError(null);

    if (editDraft && editingAppointmentId) {
      setSelectedPatientCache(editDraft.patient);
      form.reset({
        patientId: editDraft.patientId,
        subject: editDraft.patient
          ? buildAppointmentSubjectFromPatient(editDraft.patient)
          : editDraft.subject,
        typeId: editDraft.typeId,
        locationId: editDraft.locationId,
        startTime: editDraft.start,
        endTime: editDraft.end,
        description: editDraft.description,
      });
      return;
    }

    setSelectedPatientCache(null);
    form.reset({
      patientId: null,
      subject: "",
      typeId: "",
      locationId:
        useSchedulePreferencesStore.getState().defaultLocationId ?? "",
      startTime: slot.start,
      endTime: slot.end,
      description: "",
    });
  }, [
    editDraft,
    editingAppointmentId,
    form,
    isPresented,
    slot?.start.getTime(),
    slot?.end.getTime(),
  ]);

  useEffect(() => {
    if (!isPresented || !slot || editingAppointmentId) {
      return;
    }
    if (options.locations.length === 0) {
      return;
    }

    const availableIds = options.locations.map((item) => item.id);
    const current = form.getValues("locationId");
    if (current && availableIds.includes(current)) {
      return;
    }

    const resolved = resolveDefaultLocationId(availableIds);
    if (resolved) {
      form.setValue("locationId", resolved);
    }
  }, [
    editingAppointmentId,
    form,
    isPresented,
    options.locations,
    slot,
  ]);

  const selectedPatient: AppointmentPatientOption | null = useMemo(() => {
    if (!patientId) {
      return null;
    }

    return (
      options.allPatients.find((patient) => patient.id === patientId) ??
      selectedPatientCache
    );
  }, [options.allPatients, patientId, selectedPatientCache]);

  const canSubmit =
    Boolean(locationId) &&
    Boolean(patientId || (subject ?? "").trim()) &&
    dayjs(endTime).isAfter(dayjs(startTime)) &&
    !isSubmitting;

  const selectPatient = useCallback(
    (id: string | null, patient?: AppointmentPatientOption | null) => {
      form.setValue("patientId", id, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      if (id && patient) {
        setSelectedPatientCache(patient);
        form.setValue("subject", buildAppointmentSubjectFromPatient(patient), {
          shouldDirty: true,
          shouldValidate: true,
        });
      } else if (!id) {
        setSelectedPatientCache(null);
        form.setValue("subject", "", {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [form],
  );

  const goNext = useCallback(() => {
    if (selectedPatient) {
      form.setValue("subject", buildAppointmentSubjectFromPatient(selectedPatient), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    storeGoNext();
  }, [form, selectedPatient, storeGoNext]);

  const goBack = useCallback(() => {
    storeGoBack();
  }, [storeGoBack]);

  const setStartTime = useCallback(
    (time: Date) => {
      form.setValue("startTime", time, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue(
        "endTime",
        dayjs(time)
          .add(ADD_APPOINTMENT_SLOT_DURATION_MINUTES, "minute")
          .toDate(),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    },
    [form],
  );

  const setEndTime = useCallback(
    (time: Date) => {
      form.setValue("endTime", time, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const setAppointmentDate = useCallback(
    (date: Date) => {
      const currentStart = form.getValues("startTime");
      const currentEnd = form.getValues("endTime");
      const nextStart = combineDateAndTime(date, currentStart);
      const nextEnd = combineDateAndTime(date, currentEnd);

      form.setValue("startTime", nextStart, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      form.setValue("endTime", nextEnd, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const submit = form.handleSubmit(async (data) => {
    if (isSubmitting) {
      return;
    }

    if (!user?.id) {
      setSubmitError(
        isEditing
          ? "You must be signed in to update this appointment."
          : "You must be signed in to create an appointment.",
      );
      return;
    }

    if (!dayjs(data.endTime).isAfter(dayjs(data.startTime))) {
      setSubmitError("End time must be after start time.");
      return;
    }

    const nextSubject = selectedPatient
      ? buildAppointmentSubjectFromPatient(selectedPatient)
      : data.subject.trim() || "Appointment";

    setIsSubmitting(true);
    setSubmitError(null);
    requestClose();

    try {
      await database.write(async () => {
        if (editingAppointmentId) {
          const appointment = await database
            .get<Appointment>("appointments")
            .find(editingAppointmentId);
          if (appointment.providerId !== user.id) {
            throw new Error("You can only edit your own appointments.");
          }
          await appointment.update((record) => {
            record.patientId = data.patientId || null;
            record.typeId = data.typeId || null;
            record.locationId = data.locationId;
            record.subject = nextSubject;
            record.description = data.description.trim() || null;
            record.startTime = data.startTime;
            record.endTime = data.endTime;
          });
          return;
        }

        await database.get<Appointment>("appointments").create((record) => {
          record._raw.id = generateGuid();
          record.providerId = user.id;
          record.patientId = data.patientId || null;
          record.typeId = data.typeId || null;
          record.locationId = data.locationId;
          record.subject = nextSubject;
          record.status = "New";
          record.description = data.description.trim() || null;
          record.startTime = data.startTime;
          record.endTime = data.endTime;
        });
      });
      requestSync();
    } catch (error) {
      Alert.alert(
        isEditing ? "Unable to update appointment" : "Unable to add appointment",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    control: form.control,
    setValue: form.setValue,
    options,
    step,
    isEditing,
    patientSearch,
    setPatientSearch,
    selectedPatient,
    canSubmit,
    isSubmitting,
    submitError,
    goNext,
    goBack,
    selectPatient,
    setAppointmentDate,
    setStartTime,
    setEndTime,
    submit,
    requestClose,
  };
}

export type AddAppointmentFormState = ReturnType<typeof useAddAppointmentForm>;
