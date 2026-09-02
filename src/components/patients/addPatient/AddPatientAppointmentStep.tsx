import { memo } from "react";
import { Switch, View } from "react-native";
import { useWatch } from "react-hook-form";

import { AddAppointmentDetailsStep } from "@/components/schedule/addAppointment";
import { ThemedText, ThemedView } from "@/components/ui";
import { calendarIcon } from "@/constants";
import type { AddAppointmentFormState } from "@/hooks/useAddAppointmentForm";
import type { AddPatientFormState } from "@/hooks/useAddPatientForm";
import { useNativeColors } from "@/theme";

import { FormDivider } from "./FormFieldSection";
import { PatientFormFieldRow } from "./PatientFormField";

type AddPatientAppointmentStepProps = {
  formState: AddPatientFormState;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
};

function AddPatientAppointmentStepComponent({
  formState,
  onInputFocus,
  onInputBlur,
}: AddPatientAppointmentStepProps) {
  const native = useNativeColors();
  const { control, setValue, appointmentFormState } = formState;
  const addAppointment = useWatch({ control, name: "addAppointment" });

  return (
    <ThemedView space="default" variant="stack">
      <PatientFormFieldRow align="center" icon={calendarIcon}>
        <View className="w-full flex-row items-center justify-between gap-inline px-inline">
          <ThemedText tone={addAppointment ? "default" : "muted"} variant="body">
            Add appointment
          </ThemedText>
          <Switch
            accessibilityLabel="Add appointment"
            onValueChange={(value) =>
              setValue("addAppointment", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            trackColor={{
              false: native.border.subtle,
              true: native.brand.default,
            }}
            thumbColor={native.surface.raised}
            value={addAppointment}
          />
        </View>
      </PatientFormFieldRow>

      {addAppointment ? (
        <>
          <FormDivider className="mt-2" />
          <AddAppointmentDetailsStep
            formState={
              appointmentFormState as unknown as AddAppointmentFormState
            }
            onInputBlur={onInputBlur}
            onInputFocus={onInputFocus}
          />
        </>
      ) : null}
    </ThemedView>
  );
}

export const AddPatientAppointmentStep = memo(AddPatientAppointmentStepComponent);
