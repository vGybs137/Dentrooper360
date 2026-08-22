import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { View } from "react-native";

import {
  ColorSwatch,
  Stack,
  TextField,
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
import { AppointmentInlineSelect } from "./AppointmentInlineSelect";

type ExpandedField =
  | AppointmentDateTimeExpanded
  | "type"
  | "location"
  | null;

type AddAppointmentDetailsStepProps = {
  formState: AddAppointmentFormState;
  onNotesFocus?: () => void;
  onNotesBlur?: () => void;
};

type FormDividerProps = {
  className?: string;
};

function FormDivider({ className }: FormDividerProps) {
  return <View className={cn("h-px w-full bg-border-subtle", className)} />;
}

export function AddAppointmentDetailsStep({
  formState,
  onNotesFocus,
  onNotesBlur,
}: AddAppointmentDetailsStepProps) {
  const theme = useThemeTokens();
  const [expandedField, setExpandedField] = useState<ExpandedField>(null);
  const {
    form,
    options,
    selectedPatient,
    setAppointmentDate,
    setStartTime,
    setEndTime,
  } = formState;

  const { control } = form;
  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });
  const typeId = useWatch({ control, name: "typeId" });
  const locationId = useWatch({ control, name: "locationId" });

  const typeOptions: DropdownOption[] = [
    { value: "", label: "None" },
    ...options.types.map((type) => ({
      value: type.id,
      label: type.name,
      color: type.color,
    })),
  ];

  const selectedType = typeOptions.find((option) => option.value === typeId);
  const typeColor = selectedType?.color ?? theme.palette.foreground.muted;

  const locationOptions: DropdownOption[] = options.locations.map(
    (location) => ({
      value: location.id,
      label: location.name,
    }),
  );

  const setExpanded = (next: ExpandedField) => {
    setExpandedField(next);
  };

  const togglePanel = (panel: Exclude<ExpandedField, null>) => {
    setExpandedField((current) => (current === panel ? null : panel));
  };

  const dateTimeExpanded: AppointmentDateTimeExpanded =
    expandedField === "calendar" ||
    expandedField === "start" ||
    expandedField === "end"
      ? expandedField
      : null;

  return (
    <Stack space="default">
      <Controller
        control={control}
        name="subject"
        rules={{ required: !selectedPatient }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TextField
            error={error?.message}
            onChangeText={onChange}
            placeholder="Appointment subject"
            value={value}
            variant="bare"
          />
        )}
      />

      <FormDivider className="mt-2" />

      <AppointmentDateTimeField
        endTime={endTime}
        expanded={dateTimeExpanded}
        onChangeDate={setAppointmentDate}
        onChangeEnd={setEndTime}
        onChangeStart={setStartTime}
        onExpandedChange={setExpanded}
        startTime={startTime}
      />

      <FormDivider />

      <AppointmentInlineSelect
        leading={<ColorSwatch color={typeColor} />}
        onChange={(value) =>
          form.setValue("typeId", value, {
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
          <SymbolView
            name={locationIcon}
            size={20}
            tintColor={theme.palette.foreground.muted}
          />
        }
        onChange={(value) =>
          form.setValue("locationId", value, {
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

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <View className="w-full flex-row items-start gap-3">
            <View className="mt-stack-compact size-5 items-center justify-center">
              <SymbolView
                name={notesIcon}
                size={20}
                tintColor={theme.palette.foreground.muted}
              />
            </View>
            <View className="min-w-0 flex-1">
              <TextField
                className="min-h-[96px] w-full px-inline"
                multiline
                numberOfLines={4}
                onBlur={onNotesBlur}
                onChangeText={onChange}
                onFocus={() => {
                  setExpanded(null);
                  onNotesFocus?.();
                }}
                placeholder="Add notes"
                value={value}
                variant="bare"
              />
            </View>
          </View>
        )}
      />
    </Stack>
  );
}
