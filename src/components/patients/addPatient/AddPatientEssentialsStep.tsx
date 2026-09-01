import { memo, useCallback, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { View } from "react-native";

import { FormDivider } from "@/components/patients/addPatient/FormFieldSection";
import {
  PatientFormFieldRow,
  PatientFormInput,
} from "@/components/patients/addPatient/PatientFormField";
import { PatientFormInlineSelect } from "@/components/patients/addPatient/PatientFormInlineSelect";
import { ThemedView, type DropdownOption } from "@/components/ui";
import {
  addressIcon,
  ageIcon,
  emailIcon,
  personIcon,
  phoneIcon,
  referralIcon,
} from "@/constants";
import { PATIENT_GENDER_OPTIONS } from "@/constants/patientForm";
import type { AddPatientFormState } from "@/hooks/useAddPatientForm";

type ExpandedField = "gender" | "referral" | null;

type AddPatientEssentialsStepProps = {
  formState: AddPatientFormState;
  onInputBlur?: () => void;
};

function AddPatientEssentialsStepComponent({
  formState,
  onInputBlur,
}: AddPatientEssentialsStepProps) {
  const [expandedField, setExpandedField] = useState<ExpandedField>(null);
  const { control, setValue, referralPatientOptions } = formState;

  const gender = useWatch({ control, name: "gender" });
  const referralPatientId = useWatch({ control, name: "referralPatientId" });

  const genderOptions: DropdownOption[] = useMemo(
    () =>
      PATIENT_GENDER_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [],
  );

  const referralOptions: DropdownOption[] = useMemo(
    () => [{ value: "", label: "None" }, ...referralPatientOptions],
    [referralPatientOptions],
  );

  const togglePanel = useCallback((panel: Exclude<ExpandedField, null>) => {
    setExpandedField((current) => (current === panel ? null : panel));
  }, []);

  const collapsePanels = useCallback(() => {
    setExpandedField(null);
  }, []);

  const inputHandlers = useMemo(
    () => ({
      onInputBlur,
      onInputFocus: collapsePanels,
    }),
    [collapsePanels, onInputBlur],
  );

  return (
    <ThemedView space="default" variant="stack">
      <View className="items-start gap-2">
        <PatientFormFieldRow align="center" icon={personIcon}>
          <PatientFormInput
            autoCapitalize="words"
            autoCorrect={false}
            name="firstName"
            placeholder="First name"
            rules={{ required: true }}
            {...inputHandlers}
          />
        </PatientFormFieldRow>

        <View className="ml-8 gap-2 self-stretch">
          <PatientFormInput
            autoCapitalize="words"
            autoCorrect={false}
            name="fatherName"
            placeholder="Father name"
            {...inputHandlers}
          />
          <PatientFormInput
            autoCapitalize="words"
            autoCorrect={false}
            name="lastName"
            placeholder="Last name"
            rules={{ required: true }}
            {...inputHandlers}
          />
        </View>
      </View>

      <FormDivider />

      <View className="items-start gap-2">
        <PatientFormFieldRow align="center" icon={phoneIcon}>
          <PatientFormInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="phone-pad"
            name="countryCode"
            placeholder="Zip"
            rules={{ required: true }}
            {...inputHandlers}
          />
        </PatientFormFieldRow>

        <View className="ml-8 gap-2 self-stretch">
          <PatientFormInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="phone-pad"
            name="phoneNumber"
            placeholder="Phone number"
            rules={{ required: true }}
            {...inputHandlers}
          />
        </View>
      </View>

      <FormDivider />

      <View className="items-start gap-2">
        <PatientFormFieldRow align="center" icon={ageIcon}>
          <PatientFormInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="number-pad"
            name="age"
            placeholder="Age"
            {...inputHandlers}
          />
        </PatientFormFieldRow>

        <View className="ml-8 self-stretch">
          <PatientFormInlineSelect
            onBeforeSearchFocus={collapsePanels}
            onChange={(value) =>
              setValue("gender", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            onSearchBlur={onInputBlur}
            onToggle={() => togglePanel("gender")}
            options={genderOptions}
            placeholder="Select gender"
            searchPlaceholder="Search gender..."
            value={gender}
            visible={expandedField === "gender"}
          />
        </View>
      </View>

      <FormDivider />

      <PatientFormFieldRow icon={emailIcon}>
        <PatientFormInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          name="emailAddress"
          placeholder="Email"
          {...inputHandlers}
        />
      </PatientFormFieldRow>

      <FormDivider />

      <PatientFormFieldRow icon={referralIcon}>
        <PatientFormInlineSelect
          onBeforeSearchFocus={collapsePanels}
          onChange={(value) =>
            setValue("referralPatientId", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          onSearchBlur={onInputBlur}
          onToggle={() => togglePanel("referral")}
          options={referralOptions}
          placeholder="Select referral source"
          searchPlaceholder="Search patients..."
          value={referralPatientId}
          visible={expandedField === "referral"}
        />
      </PatientFormFieldRow>

      <FormDivider />

      <PatientFormFieldRow icon={addressIcon}>
        <PatientFormInput
          autoCapitalize="sentences"
          autoCorrect
          multiline
          name="address"
          numberOfLines={3}
          placeholder="Address"
          {...inputHandlers}
        />
      </PatientFormFieldRow>
    </ThemedView>
  );
}

export const AddPatientEssentialsStep = memo(AddPatientEssentialsStepComponent);
