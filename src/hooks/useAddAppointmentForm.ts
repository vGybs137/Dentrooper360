import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import { combineDateAndTime } from "@/helpers/appointmentDate";
import { generateGuid } from "@/helpers/guid";
import {
  ADD_APPOINTMENT_SLOT_DURATION_MINUTES,
  useAddAppointmentIsPresented,
  useAddAppointmentSlot,
  useAddAppointmentStore,
  useAuthUser,
  useCustomerId,
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
  const customerId = useCustomerId();
  const slot = useAddAppointmentSlot();
  const isPresented = useAddAppointmentIsPresented();
  const step = useAddAppointmentStore((state) => state.step);
  const storeGoNext = useAddAppointmentStore((state) => state.goNext);
  const storeGoBack = useAddAppointmentStore((state) => state.goBack);
  const requestClose = useAddAppointmentStore((state) => state.requestClose);

  const [patientSearch, setPatientSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const options = useAppointmentFormOptions(patientSearch);

  const form = useForm<AddAppointmentFields>({
    defaultValues: EMPTY_VALUES,
    mode: "onChange",
  });

  const patientId = form.watch("patientId");
  const locationId = form.watch("locationId");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");

  useEffect(() => {
    if (!isPresented || !slot) {
      return;
    }

    setPatientSearch("");
    setSubmitError(null);
    form.reset({
      patientId: null,
      subject: "",
      typeId: "",
      locationId: "",
      startTime: slot.start,
      endTime: slot.end,
      description: "",
    });
  }, [form, isPresented, slot?.start.getTime(), slot?.end.getTime()]);

  const subject = form.watch("subject");

  const selectedPatient: AppointmentPatientOption | null = useMemo(() => {
    if (!patientId) {
      return null;
    }

    return (
      options.allPatients.find((patient) => patient.id === patientId) ?? null
    );
  }, [options.allPatients, patientId]);

  const canSubmit =
    Boolean(locationId) &&
    Boolean(subject.trim() || patientId) &&
    dayjs(endTime).isAfter(dayjs(startTime)) &&
    !isSubmitting;

  const goNext = () => {
    if (!form.getValues("subject").trim() && selectedPatient) {
      form.setValue("subject", selectedPatient.displayName, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    storeGoNext();
  };

  const selectPatient = (id: string | null) => {
    form.setValue("patientId", id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const setStartTime = (time: Date) => {
    form.setValue("startTime", time, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue(
      "endTime",
      dayjs(time).add(ADD_APPOINTMENT_SLOT_DURATION_MINUTES, "minute").toDate(),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const setEndTime = (time: Date) => {
    form.setValue("endTime", time, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const goBack = () => {
    storeGoBack();
  };

  const setAppointmentDate = (date: Date) => {
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
  };

  const submit = form.handleSubmit(async (data) => {
    if (!user?.id) {
      setSubmitError("You must be signed in to create an appointment.");
      return;
    }

    if (!dayjs(data.endTime).isAfter(dayjs(data.startTime))) {
      setSubmitError("End time must be after start time.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await database.write(async () => {
        await database.get<Appointment>("appointments").create((record) => {
          record._raw.id = generateGuid();
          record.providerId = user.id;
          record.patientId = data.patientId || null;
          record.typeId = data.typeId || null;
          record.locationId = data.locationId;
          record.subject =
            data.subject.trim() ||
            selectedPatient?.displayName ||
            "Appointment";
          record.status = "New";
          record.description = data.description.trim() || null;
          record.startTime = data.startTime;
          record.endTime = data.endTime;
        });
      });

      requestClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to create the appointment. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    form,
    options,
    step,
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
