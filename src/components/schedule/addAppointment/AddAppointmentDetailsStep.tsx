import { memo, useCallback, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { View } from "react-native";

import {
  ThemedIcon,
  ThemedText,
  ThemedView,
  type DropdownOption,
} from "@/components/ui";
import { locationIcon, notesIcon } from "@/constants";
import type { AddAppointmentFormState } from "@/hooks/useAddAppointmentForm";
import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";

import {
  AppointmentDateTimeField,
  type AppointmentDateTimeExpanded,
} from "./AppointmentDateTimeField";
import {
  AppointmentInlineSelect,
  InlineSelectColorLeading,
  InlineSelectSymbolLeading,
} from "./AppointmentInlineSelect";

type ExpandedField = AppointmentDateTimeExpanded | "type" | "location" | null;

type AddAppointmentDetailsStepProps = {
  formState: AddAppointmentFormState;
  onNotesFocus?: () => void;
  onNotesBlur?: () => void;
};

function FormDivider({ className }: { className?: string }) {
  return <View className={cn("h-px w-full bg-border-subtle", className)} />;
}

function AddAppointmentDetailsStepComponent({
  formState,
  onNotesFocus,
  onNotesBlur,
}: AddAppointmentDetailsStepProps) {
  const theme = useThemeTokens();
  const [expandedField, setExpandedField] = useState<ExpandedField>(null);
  const {
    control,
    setValue,
    options,
    selectedPatient,
    setAppointmentDate,
    setStartTime,
    setEndTime,
  } = formState;

  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });
  const typeId = useWatch({ control, name: "typeId" });
  const locationId = useWatch({ control, name: "locationId" });

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
  const typeColor = selectedType?.color ?? theme.palette.foreground.muted;

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

  return (
    <ThemedView space="default" variant="stack">
      <ThemedText
        as="input"
        bottomSheetInput
        editable={!selectedPatient}
        fieldVariant="bare"
        name="subject"
        placeholder={
          selectedPatient
            ? "Patient name and phone"
            : "Appointment subject"
        }
        rules={{ required: !selectedPatient }}
      />

      <FormDivider className="mt-2" />

      <AppointmentDateTimeField
        endTime={endTime}
        expanded={dateTimeExpanded}
        onChangeDate={setAppointmentDate}
        onChangeEnd={setEndTime}
        onChangeStart={setStartTime}
        onExpandedChange={(next) => setExpandedField(next)}
        startTime={startTime}
      />

      <FormDivider />

      <AppointmentInlineSelect
        leading={<InlineSelectColorLeading color={typeColor} />}
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

      <AppointmentInlineSelect
        leading={
          <InlineSelectSymbolLeading
            name={locationIcon}
            tintColor={theme.palette.foreground.muted}
          />
        }
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
            <View className="min-w-0 flex-1">
              <ThemedText
                as="input"
                bottomSheetInput
                className="min-h-[96px] w-full px-inline"
                fieldVariant="bare"
                multiline
                name="description"
                numberOfLines={4}
                onBlur={onNotesBlur}
                onFocus={() => {
                  setExpandedField(null);
                  onNotesFocus?.();
                }}
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
