import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { View } from "react-native";

import { PatientFormInlineSelect } from "@/components/patients/addPatient/PatientFormInlineSelect";
import { usePatientFormFieldFocusHandlers } from "@/components/patients/addPatient/PatientFormInlineSelect";
import { PatientFormSection } from "@/components/patients/addPatient/PatientFormSection";
import {
  InlineSelectColorLeading,
  InlineSelectSymbolLeading,
  ThemedIcon,
  ThemedText,
  ThemedView,
  type DropdownOption,
} from "@/components/ui";
import { locationIcon, notesIcon } from "@/constants";
import { buildAppointmentSubjectFromPatient } from "@/helpers/appointmentSubject";
import type { AddAppointmentFormState } from "@/hooks/useAddAppointmentForm";
import { cn } from "@/utils/cn";
import {
  AppointmentDateTimeField,
  type AppointmentDateTimeExpanded,
} from "./AppointmentDateTimeField";

const SUBJECT_REQUIRED_MESSAGE = "Appointment subject is required.";

function fieldErrorMessage(message: unknown): string | null {
  return typeof message === "string" && message.trim().length > 0
    ? message.trim()
    : null;
}

type ExpandedField = AppointmentDateTimeExpanded | "type" | "location" | null;

type AddAppointmentDetailsStepProps = {
  formState: AddAppointmentFormState;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  /** @deprecated Use `onInputFocus`. */
  onNotesFocus?: () => void;
  /** @deprecated Use `onInputBlur`. */
  onNotesBlur?: () => void;
};

function FormDivider({ className }: { className?: string }) {
  return <View className={cn("h-px w-full bg-border-subtle", className)} />;
}

function AddAppointmentDetailsStepComponent({
  formState,
  onInputFocus,
  onInputBlur,
  onNotesFocus,
  onNotesBlur,
}: AddAppointmentDetailsStepProps) {
  const handleInputFocus = onInputFocus ?? onNotesFocus;
  const handleInputBlur = onInputBlur ?? onNotesBlur;
  const [expandedField, setExpandedField] = useState<ExpandedField>(null);
  const {
    control,
    setValue,
    options,
    selectedPatient,
    setAppointmentDate,
    setStartTime,
    setEndTime,
    detailsValidationAttempted,
    showOutsideHoursError,
  } = formState;

  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });
  const typeId = useWatch({ control, name: "typeId" });
  const locationId = useWatch({ control, name: "locationId" });
  const { errors } = useFormState({ control });

  const subjectSectionErrors = useMemo(() => {
    if (selectedPatient) {
      return [] as string[];
    }

    const subjectError = fieldErrorMessage(errors.subject?.message);
    return subjectError ? [subjectError] : [];
  }, [errors.subject?.message, selectedPatient]);

  const showSubjectErrors =
    detailsValidationAttempted && subjectSectionErrors.length > 0;

  const patientSubject = useMemo(
    () =>
      selectedPatient
        ? buildAppointmentSubjectFromPatient(selectedPatient)
        : null,
    [selectedPatient],
  );

  useEffect(() => {
    if (!patientSubject) {
      return;
    }

    setValue("subject", patientSubject, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [patientSubject, setValue]);

  const typeOptions: DropdownOption[] = useMemo(
    () => [
      { value: "", label: "None" },
      ...options.types.map((type) => ({
        value: type.id,
        label: type.name,
        color: type.color,
      })),
    ],
    [options.types],
  );

  const selectedType = typeOptions.find((option) => option.value === typeId);
  const typeColor = selectedType?.color ?? undefined;

  const locationOptions: DropdownOption[] = useMemo(
    () =>
      options.locations.map((location) => ({
        value: location.id,
        label: location.name,
      })),
    [options.locations],
  );

  const togglePanel = useCallback((panel: Exclude<ExpandedField, null>) => {
    setExpandedField((current) => (current === panel ? null : panel));
  }, []);

  const dateTimeExpanded: AppointmentDateTimeExpanded =
    expandedField === "calendar" ||
    expandedField === "start" ||
    expandedField === "end"
      ? expandedField
      : null;

  const collapsePanels = useCallback(() => {
    setExpandedField(null);
  }, []);

  // Subject must not call the notes focus handler — that scrolls the sheet to end.
  const subjectFocus = usePatientFormFieldFocusHandlers({
    onFocus: collapsePanels,
  });

  const notesFocus = usePatientFormFieldFocusHandlers({
    onBlur: handleInputBlur,
    onFocus: collapsePanels,
    onFocusWithoutMeasure: handleInputFocus,
  });

  return (
    <ThemedView space="default" variant="stack">
      <PatientFormSection
        errorAccessibilityLabel="Show subject errors"
        errorTitle="Subject issues"
        errors={subjectSectionErrors}
        showErrors={showSubjectErrors}
      >
        <View ref={subjectFocus.fieldRef} collapsable={false}>
          <ThemedText
            as="input"
            bottomSheetInput
            className="w-full px-inline"
            editable={!selectedPatient}
            fieldVariant="bare"
            hideInlineError
            name="subject"
            onBlur={subjectFocus.handleBlur}
            onFocus={subjectFocus.handleFocus}
            placeholder="Appointment subject"
            rules={
              selectedPatient
                ? undefined
                : { required: SUBJECT_REQUIRED_MESSAGE }
            }
            value={patientSubject ?? undefined}
          />
        </View>
      </PatientFormSection>

      <FormDivider className="mt-2" />

      <AppointmentDateTimeField
        endTime={endTime}
        expanded={dateTimeExpanded}
        onChangeDate={setAppointmentDate}
        onChangeEnd={setEndTime}
        onChangeStart={setStartTime}
        onExpandedChange={(next) => setExpandedField(next)}
        showOutsideHoursError={showOutsideHoursError}
        startTime={startTime}
      />

      <FormDivider />

      <PatientFormInlineSelect
        leading={<InlineSelectColorLeading color={typeColor} />}
        onBeforeSearchFocus={collapsePanels}
        onChange={(value) =>
          setValue("typeId", value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        onToggle={() => togglePanel("type")}
        options={typeOptions}
        placeholder="Select type"
        value={typeId}
        visible={expandedField === "type"}
      />

      <FormDivider />

      <PatientFormInlineSelect
        leading={<InlineSelectSymbolLeading name={locationIcon} />}
        onBeforeSearchFocus={collapsePanels}
        onChange={(value) =>
          setValue("locationId", value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        onToggle={() => togglePanel("location")}
        options={locationOptions}
        placeholder="Select location"
        value={locationId}
        visible={expandedField === "location"}
      />

      <FormDivider />

      <View className="w-full flex-row items-start gap-3">
        <View className="mt-stack-compact size-5 items-center justify-center">
          <ThemedIcon dimension={20} name={notesIcon} tone="muted" />
        </View>
        <View className="min-w-0 flex-1" ref={notesFocus.fieldRef} collapsable={false}>
          <ThemedText
            as="input"
            bottomSheetInput
            className="min-h-[96px] w-full px-inline"
            fieldVariant="bare"
            multiline
            name="description"
            numberOfLines={4}
            onBlur={notesFocus.handleBlur}
            onFocus={notesFocus.handleFocus}
            placeholder="Add notes"
          />
        </View>
      </View>
    </ThemedView>
  );
}

export const AddAppointmentDetailsStep = memo(
  AddAppointmentDetailsStepComponent,
);
