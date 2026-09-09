import { useDatabase } from "@nozbe/watermelondb/react";
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
} from "@/constants/patientForm";
import type Appointment from "@/database/models/Appointment";
import type Patient from "@/database/models/Patient";
import { combineDateAndTime } from "@/helpers/schedule/appointmentDate";
import { buildAppointmentSubjectFromPatient } from "@/helpers/schedule/appointmentSubject";
import {
  applyNewAppointmentFields,
  defaultAppointmentStart,
} from "@/helpers/schedule/createAppointment";
import { generateGuid } from "@/helpers/ui/guid";
import {
  birthDateFromAge,
  formatAgeInput,
  parseAgeInput,
} from "@/helpers/patients/patientAge";
import { formatPatientName } from "@/helpers/patients/patientDisplay";
import { findDuplicatePatient } from "@/helpers/patients/patientDuplicate";
import { requestSync } from "@/helpers/sync/requestSync";
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
} from "@/hooks/schedule/useAppointmentFormOptions";

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
  referralSource: string;
  isVip: boolean;
  addAppointment: boolean;
  subject: string;
  typeId: string;
  locationId: string;
  startTime: Date;
  endTime: Date;
  description: string;
};

function buildDefaultValues(): AddPatientFields {
  const start = defaultAppointmentStart();
  return {
    firstName: "",
    fatherName: "",
    lastName: "",
    age: "",
    gender: "",
    countryCode: DEFAULT_PATIENT_COUNTRY_CODE,
    phoneNumber: "",
    emailAddress: "",
    address: "",
    referralSource: "",
    isVip: false,
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

const ESSENTIALS_FIELDS = [
  "firstName",
  "lastName",
  "countryCode",
  "phoneNumber",
] as const satisfies readonly (keyof AddPatientFields)[];

export function useAddPatientForm() {
  const database = useDatabase();
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
  const [duplicatePatient, setDuplicatePatient] = useState<Patient | null>(null);
  const [essentialsValidationAttempted, setEssentialsValidationAttempted] =
    useState(false);

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
  const isVip = useWatch({ control, name: "isVip" });
  const addAppointment = useWatch({ control, name: "addAppointment" });
  const locationId = useWatch({ control, name: "locationId" });
  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });
  const subject = useWatch({ control, name: "subject" });

  const appointmentOptions = useAppointmentFormOptions({
    enabled: isPresented && step === "appointment" && addAppointment,
    loadPatients: false,
  });

  useEffect(() => {
    if (!isPresented || isEditing) {
      setDuplicatePatient(null);
      return;
    }

    const identity = {
      firstName: firstName ?? "",
      fatherName: fatherName ?? "",
      lastName: lastName ?? "",
      countryCode: countryCode ?? "",
      phoneNumber: phoneNumber ?? "",
    };

    if (!hasRequiredEssentials(identity)) {
      setDuplicatePatient(null);
      return;
    }

    let cancelled = false;

    void findDuplicatePatient(identity)
      .then((match) => {
        if (!cancelled) {
          setDuplicatePatient(match);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDuplicatePatient(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    countryCode,
    fatherName,
    firstName,
    isEditing,
    isPresented,
    lastName,
    phoneNumber,
  ]);

  useEffect(() => {
    if (!isPresented) {
      setIsSubmitting(false);
      return;
    }

    setSubmitError(null);
    setEssentialsValidationAttempted(false);
    setDuplicatePatient(null);

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
          gender: record.gender?.trim() ?? "",
          countryCode: record.countryCode?.trim() || DEFAULT_PATIENT_COUNTRY_CODE,
          phoneNumber: record.phoneNumber?.trim() ?? "",
          emailAddress: record.emailAddress?.trim() ?? "",
          address: record.address?.trim() ?? "",
          referralSource: record.referralSource?.trim() ?? "",
          isVip: record.isVip,
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
      isVip: isVip ?? false,
      balance: null,
      currency: null,
      profilePhoto: null,
      fileDate: null,
      nextVisit: null,
    }),
    [countryCode, draftDisplayName, editingPatientId, isVip, phoneNumber],
  );

  const duplicatePatientName = useMemo(() => {
    if (!duplicatePatient) {
      return null;
    }
    return formatPatientName(duplicatePatient);
  }, [duplicatePatient]);

  const canGoNext =
    hasRequiredEssentials({
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      countryCode: countryCode ?? "",
      phoneNumber: phoneNumber ?? "",
    }) &&
    (isEditing || !duplicatePatient);

  const canSubmit =
    !isSubmitting &&
    (!addAppointment ||
      (Boolean(locationId) &&
        Boolean((subject ?? "").trim()) &&
        dayjs(endTime).isAfter(dayjs(startTime))));

  const validateEssentials = useCallback(async () => {
    setEssentialsValidationAttempted(true);

    const fieldsValid = await form.trigger([...ESSENTIALS_FIELDS]);
    if (!fieldsValid) {
      return false;
    }

    if (isEditing) {
      return true;
    }

    const match = await findDuplicatePatient({
      firstName: firstName ?? "",
      fatherName: fatherName ?? "",
      lastName: lastName ?? "",
      countryCode: countryCode ?? "",
      phoneNumber: phoneNumber ?? "",
    });

    if (match) {
      setDuplicatePatient(match);
      return false;
    }

    setDuplicatePatient(null);
    return true;
  }, [
    countryCode,
    fatherName,
    firstName,
    form,
    isEditing,
    lastName,
    phoneNumber,
  ]);

  const goNext = useCallback(async () => {
    const valid = await validateEssentials();
    if (!valid) {
      setSubmitError(null);
      return;
    }

    setSubmitError(null);
    storeGoNext();
  }, [storeGoNext, validateEssentials]);

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
      setEssentialsValidationAttempted(true);
      await form.trigger([...ESSENTIALS_FIELDS]);
      setSubmitError(null);
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

    if (!isEditing) {
      const match = await findDuplicatePatient(
        {
          firstName: data.firstName,
          fatherName: data.fatherName,
          lastName: data.lastName,
          countryCode: data.countryCode,
          phoneNumber: data.phoneNumber,
        },
        editingPatientId,
      );

      if (match) {
        setDuplicatePatient(match);
        setEssentialsValidationAttempted(true);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const parsedAge = parseAgeInput(data.age);
    const birthDate = parsedAge == null ? null : birthDateFromAge(parsedAge);

    try {
      let patientId = editingPatientId;

      // Persist before dismissing so the details screen observes the new values
      // while it is still visible underneath the sheet.
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
            entry.referralSource = data.referralSource.trim() || null;
            entry.isVip = data.isVip;
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
              record.referralSource = data.referralSource.trim() || null;
              record.fileDate = new Date();
              record.isActive = true;
              record.isVip = data.isVip;
              record.balance = 0;
            });
          patientId = created.id;
        }

        if (data.addAppointment && user?.id && patientId) {
          const nextSubject =
            buildAppointmentSubjectFromPatient(syntheticSelectedPatient);

          await database.get<Appointment>("appointments").create((record) => {
            applyNewAppointmentFields(record, {
              providerId: user.id,
              patientId: patientId,
              typeId: data.typeId || null,
              locationId: data.locationId,
              subject: nextSubject,
              description: data.description.trim() || null,
              startTime: data.startTime,
              endTime: data.endTime,
            });
          });
        }
      });

      requestSync();
      requestClose();
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
    duplicatePatient,
    duplicatePatientName,
    essentialsValidationAttempted,
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
