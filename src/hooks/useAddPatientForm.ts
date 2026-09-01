import dayjs from "dayjs";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import { useForm, useWatch } from "react-hook-form";

import {
  DEFAULT_PATIENT_COUNTRY_CODE,
  DEFAULT_PATIENT_GENDER,
} from "@/constants/patientForm";
import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type Patient from "@/database/models/Patient";
import { combineDateAndTime } from "@/helpers/appointmentDate";
import { buildAppointmentSubjectFromPatient } from "@/helpers/appointmentSubject";
import { generateGuid } from "@/helpers/guid";
import {
  birthDateFromAge,
  formatAgeInput,
  parseAgeInput,
} from "@/helpers/patientAge";
import { formatPatientName } from "@/helpers/patientDisplay";
import { requestSync } from "@/helpers/requestSync";
import {
  useAddPatientEditingId,
  useAddPatientIsPresented,
  useAddPatientStep,
  useAddPatientStore,
} from "@/stores/addPatientStore";
import {
  ADD_APPOINTMENT_SLOT_DURATION_MINUTES,
  resolveDefaultLocationId,
  useAuthUser,
  useSchedulePreferencesStore,
} from "@/stores";

import {
  useAppointmentFormOptions,
  type AppointmentPatientOption,
} from "./useAppointmentFormOptions";
import { useActivePatients } from "./useActivePatients";

export type AddPatientFields = {
  firstName: string;
  fatherName: string;
  lastName: string;
  age: string;
  gender: string;
  countryCode: string;
  phoneNumber: string;
  emailAddress: string;
  address: string;
  referralPatientId: string;
  addAppointment: boolean;
  subject: string;
  typeId: string;
  locationId: string;
  startTime: Date;
  endTime: Date;
  description: string;
};

function defaultAppointmentStart(): Date {
  return dayjs().add(1, "hour").startOf("hour").toDate();
}

function buildDefaultValues(): AddPatientFields {
  const start = defaultAppointmentStart();
  return {
    firstName: "",
    fatherName: "",
    lastName: "",
    age: "",
    gender: DEFAULT_PATIENT_GENDER,
    countryCode: DEFAULT_PATIENT_COUNTRY_CODE,
    phoneNumber: "",
    emailAddress: "",
    address: "",
    referralPatientId: "",
    addAppointment: false,
    subject: "",
    typeId: "",
    locationId: useSchedulePreferencesStore.getState().defaultLocationId ?? "",
    startTime: start,
    endTime: dayjs(start)
      .add(ADD_APPOINTMENT_SLOT_DURATION_MINUTES, "minute")
      .toDate(),
    description: "",
  };
}

function hasRequiredEssentials(data: Pick<
  AddPatientFields,
  "firstName" | "lastName" | "countryCode" | "phoneNumber"
>) {
  return (
    data.firstName.trim().length > 0 &&
    data.lastName.trim().length > 0 &&
    data.countryCode.trim().length > 0 &&
    data.phoneNumber.trim().length > 0
  );
}

export function useAddPatientForm() {
  const user = useAuthUser();
  const isPresented = useAddPatientIsPresented();
  const step = useAddPatientStep();
  const editingPatientId = useAddPatientEditingId();
  const storeGoNext = useAddPatientStore((state) => state.goNext);
  const storeGoBack = useAddPatientStore((state) => state.goBack);
  const requestClose = useAddPatientStore((state) => state.requestClose);
  const isEditing = Boolean(editingPatientId);

  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AddPatientFields>({
    defaultValues: buildDefaultValues(),
    mode: "onTouched",
  });

  const { control } = form;
  const firstName = useWatch({ control, name: "firstName" });
  const fatherName = useWatch({ control, name: "fatherName" });
  const lastName = useWatch({ control, name: "lastName" });
  const countryCode = useWatch({ control, name: "countryCode" });
  const phoneNumber = useWatch({ control, name: "phoneNumber" });
  const addAppointment = useWatch({ control, name: "addAppointment" });
  const locationId = useWatch({ control, name: "locationId" });
  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });
  const subject = useWatch({ control, name: "subject" });

  const appointmentOptions = useAppointmentFormOptions({
    enabled: isPresented && step === "appointment" && addAppointment,
    loadPatients: false,
  });

  const { allPatients: referralPatients } = useActivePatients("", {
    enabled: isPresented && step === "essentials",
    sortBy: "name",
  });

  const referralPatientOptions = useMemo(
    () =>
      referralPatients
        .filter((patient) => patient.id !== editingPatientId)
        .map((patient) => ({
          value: patient.id,
          label: patient.displayName,
        })),
    [editingPatientId, referralPatients],
  );

  useEffect(() => {
    if (!isPresented) {
      setIsSubmitting(false);
      return;
    }

    setSubmitError(null);

    if (!editingPatientId) {
      form.reset(buildDefaultValues());
      return;
    }

    let cancelled = false;
    setIsLoadingPatient(true);

    void (async () => {
      try {
        const record = await database
          .get<Patient>("patients")
          .find(editingPatientId);
        if (cancelled) {
          return;
        }

        const start = defaultAppointmentStart();
        form.reset({
          firstName: record.firstName?.trim() ?? "",
          fatherName: record.fatherName?.trim() ?? "",
          lastName: record.lastName?.trim() ?? "",
          age: formatAgeInput(record.birthDate),
          gender: record.gender?.trim() || DEFAULT_PATIENT_GENDER,
          countryCode: record.countryCode?.trim() || DEFAULT_PATIENT_COUNTRY_CODE,
          phoneNumber: record.phoneNumber?.trim() ?? "",
          emailAddress: record.emailAddress?.trim() ?? "",
          address: record.address?.trim() ?? "",
          referralPatientId: record.referralPatientId ?? "",
          addAppointment: false,
          subject: formatPatientName(record) || "",
          typeId: "",
          locationId:
            useSchedulePreferencesStore.getState().defaultLocationId ?? "",
          startTime: start,
          endTime: dayjs(start)
            .add(ADD_APPOINTMENT_SLOT_DURATION_MINUTES, "minute")
            .toDate(),
          description: "",
        });
      } catch {
        if (!cancelled) {
          setSubmitError("Unable to load patient.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPatient(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editingPatientId, form, isPresented]);

  useEffect(() => {
    if (!isPresented || step !== "appointment" || !addAppointment) {
      return;
    }
    if (appointmentOptions.locations.length === 0) {
      return;
    }

    const availableIds = appointmentOptions.locations.map((item) => item.id);
    const current = form.getValues("locationId");
    if (current && availableIds.includes(current)) {
      return;
    }

    const resolved = resolveDefaultLocationId(availableIds);
    if (resolved) {
      form.setValue("locationId", resolved);
    }
  }, [
    addAppointment,
    appointmentOptions.locations,
    form,
    isPresented,
    step,
  ]);

  const draftDisplayName = useMemo(() => {
    return (
      [firstName, fatherName, lastName]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(" ") || "New patient"
    );
  }, [fatherName, firstName, lastName]);

  const syntheticSelectedPatient: AppointmentPatientOption | null = useMemo(
    () => ({
      id: editingPatientId ?? "draft",
      displayName: draftDisplayName,
      countryCode: countryCode?.trim() || null,
      phoneNumber: phoneNumber?.trim() || null,
      isVip: false,
      balance: null,
      currency: null,
      profilePhoto: null,
      fileDate: null,
      nextVisit: null,
    }),
    [countryCode, draftDisplayName, editingPatientId, phoneNumber],
  );

  const canGoNext = hasRequiredEssentials({
    firstName: firstName ?? "",
    lastName: lastName ?? "",
    countryCode: countryCode ?? "",
    phoneNumber: phoneNumber ?? "",
  });

  const canSubmit =
    !isSubmitting &&
    (!addAppointment ||
      (Boolean(locationId) &&
        Boolean((subject ?? "").trim()) &&
        dayjs(endTime).isAfter(dayjs(startTime))));

  const goNext = useCallback(() => {
    if (!canGoNext) {
      setSubmitError("First name, last name, zip, and phone are required.");
      return;
    }

    setSubmitError(null);
    storeGoNext();
  }, [canGoNext, storeGoNext]);

  const goBack = useCallback(() => {
    setSubmitError(null);
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

  const appointmentFormState = useMemo(
    () => ({
      control: form.control,
      setValue: form.setValue,
      options: appointmentOptions,
      selectedPatient: syntheticSelectedPatient,
      setAppointmentDate,
      setStartTime,
      setEndTime,
    }),
    [
      appointmentOptions,
      form.control,
      form.setValue,
      setAppointmentDate,
      setEndTime,
      setStartTime,
      syntheticSelectedPatient,
    ],
  );

  const submit = form.handleSubmit(async (data) => {
    if (isSubmitting) {
      return;
    }

    if (!hasRequiredEssentials(data)) {
      setSubmitError("First name, last name, zip, and phone are required.");
      return;
    }

    if (
      data.addAppointment &&
      !dayjs(data.endTime).isAfter(dayjs(data.startTime))
    ) {
      setSubmitError("End time must be after start time.");
      return;
    }

    if (data.addAppointment && !data.locationId) {
      setSubmitError("Select a location for the appointment.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    requestClose();

    const parsedAge = parseAgeInput(data.age);
    const birthDate = parsedAge == null ? null : birthDateFromAge(parsedAge);

    try {
      let patientId = editingPatientId;

      await database.write(async () => {
        if (editingPatientId) {
          const record = await database
            .get<Patient>("patients")
            .find(editingPatientId);
          await record.update((entry) => {
            entry.firstName = data.firstName.trim();
            entry.fatherName = data.fatherName.trim() || null;
            entry.lastName = data.lastName.trim();
            entry.birthDate = birthDate;
            entry.gender = data.gender.trim() || null;
            entry.countryCode = data.countryCode.trim();
            entry.phoneNumber = data.phoneNumber.trim();
            entry.emailAddress = data.emailAddress.trim() || null;
            entry.address = data.address.trim() || null;
            entry.referralPatientId = data.referralPatientId || null;
          });
        } else {
          const created = await database
            .get<Patient>("patients")
            .create((record) => {
              record._raw.id = generateGuid();
              record.firstName = data.firstName.trim();
              record.fatherName = data.fatherName.trim() || null;
              record.lastName = data.lastName.trim();
              record.birthDate = birthDate;
              record.gender = data.gender.trim() || null;
              record.countryCode = data.countryCode.trim();
              record.phoneNumber = data.phoneNumber.trim();
              record.emailAddress = data.emailAddress.trim() || null;
              record.address = data.address.trim() || null;
              record.referralPatientId = data.referralPatientId || null;
              record.fileDate = new Date();
              record.isActive = true;
              record.isVip = false;
              record.balance = 0;
            });
          patientId = created.id;
        }

        if (data.addAppointment && user?.id && patientId) {
          const nextSubject =
            buildAppointmentSubjectFromPatient(syntheticSelectedPatient);

          await database.get<Appointment>("appointments").create((record) => {
            record._raw.id = generateGuid();
            record.providerId = user.id;
            record.patientId = patientId;
            record.typeId = data.typeId || null;
            record.locationId = data.locationId;
            record.subject = nextSubject;
            record.status = "New";
            record.description = data.description.trim() || null;
            record.startTime = data.startTime;
            record.endTime = data.endTime;
          });
        }
      });

      requestSync();
    } catch (error) {
      Alert.alert(
        isEditing ? "Unable to update patient" : "Unable to add patient",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    form,
    control: form.control,
    setValue: form.setValue,
    step,
    isEditing,
    isLoadingPatient,
    referralPatientOptions,
    appointmentFormState,
    canGoNext,
    canSubmit,
    isSubmitting,
    submitError,
    goNext,
    goBack,
    submit,
    requestClose,
  };
}

export type AddPatientFormState = ReturnType<typeof useAddPatientForm>;
