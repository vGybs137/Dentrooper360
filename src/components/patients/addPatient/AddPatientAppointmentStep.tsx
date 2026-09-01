import { memo } from "react";
import { Switch, View } from "react-native";
import { useWatch } from "react-hook-form";

import { AddAppointmentDetailsStep } from "@/components/schedule/addAppointment";
import { ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import { calendarIcon } from "@/constants";
import type { AddAppointmentFormState } from "@/hooks/useAddAppointmentForm";
import type { AddPatientFormState } from "@/hooks/useAddPatientForm";
import { useNativeColors } from "@/theme";

import { FormDivider } from "./FormFieldSection";

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
      <View className="flex-row items-center justify-between gap-inline">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View className="size-5 shrink-0 items-center justify-center">
            <ThemedIcon dimension={20} name={calendarIcon} tone="muted" />
          </View>
          <View className="min-w-0 flex-1">
            <ThemedText className="font-semibold" variant="body">
              Add appointment
            </ThemedText>
            <ThemedText tone="muted" variant="label">
              Schedule a visit for this patient
            </ThemedText>
          </View>
        </View>
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
      ) : (
        <ThemedText tone="muted" variant="body">
          Turn on the switch to add an appointment now, or save the patient
          without scheduling.
        </ThemedText>
      )}
    </ThemedView>
  );
}

export const AddPatientAppointmentStep = memo(AddPatientAppointmentStepComponent);
