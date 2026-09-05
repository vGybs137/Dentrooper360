import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { Switch, View } from "react-native";

import { FormDivider } from "@/components/patients/addPatient/FormFieldSection";
import {
  PatientFormFieldRow,
  PatientFormInput,
} from "@/components/patients/addPatient/PatientFormField";
import { PatientFormInlineSelect } from "@/components/patients/addPatient/PatientFormInlineSelect";
import { PatientFormSection } from "@/components/patients/addPatient/PatientFormSection";
import {
  ThemedText,
  ThemedView,
  type DropdownOption,
} from "@/components/ui";
import {
  addressIcon,
  ageIcon,
  emailIcon,
  PATIENT_FORM_VALIDATION_MESSAGES,
  personIcon,
  personsIcon,
  phoneIcon,
  starIcon,
} from "@/constants";
import { PATIENT_GENDER_OPTIONS } from "@/constants/patientForm";
import type { AddPatientFormState } from "@/hooks/useAddPatientForm";
import { useNativeColors } from "@/theme";

type ExpandedField = "gender" | null;

type AddPatientEssentialsStepProps = {
  formState: AddPatientFormState;
  onInputBlur?: () => void;
  panelCollapseKey?: number;
};

function fieldErrorMessage(message: unknown): string | null {
  return typeof message === "string" && message.length > 0 ? message : null;
}

function AddPatientEssentialsStepComponent({
  formState,
  onInputBlur,
  panelCollapseKey = 0,
}: AddPatientEssentialsStepProps) {
  const native = useNativeColors();
  const [expandedField, setExpandedField] = useState<ExpandedField>(null);
  const {
    control,
    setValue,
    isEditing,
    duplicatePatient,
    duplicatePatientName,
    essentialsValidationAttempted,
  } = formState;

  const { errors, touchedFields } = useFormState({ control });

  const gender = useWatch({ control, name: "gender" });
  const isVip = useWatch({ control, name: "isVip" });

  const genderOptions: DropdownOption[] = useMemo(
    () =>
      PATIENT_GENDER_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [],
  );

  const nameSectionErrors = useMemo(() => {
    const messages: string[] = [];
    const firstNameError = fieldErrorMessage(errors.firstName?.message);
    const lastNameError = fieldErrorMessage(errors.lastName?.message);

    if (firstNameError) {
      messages.push(firstNameError);
    }
    if (lastNameError) {
      messages.push(lastNameError);
    }
    if (!isEditing && duplicatePatient && duplicatePatientName) {
      messages.push(
        `A patient named ${duplicatePatientName} with this phone number already exists.`,
      );
    }

    return messages;
  }, [
    duplicatePatient,
    duplicatePatientName,
    errors.firstName?.message,
    errors.lastName?.message,
    isEditing,
  ]);

  const phoneSectionErrors = useMemo(() => {
    const messages: string[] = [];
    const countryCodeError = fieldErrorMessage(errors.countryCode?.message);
    const phoneNumberError = fieldErrorMessage(errors.phoneNumber?.message);

    if (countryCodeError) {
      messages.push(countryCodeError);
    }
    if (phoneNumberError) {
      messages.push(phoneNumberError);
    }

    return messages;
  }, [errors.countryCode?.message, errors.phoneNumber?.message]);

  const showNameSectionErrors =
    essentialsValidationAttempted ||
    Boolean(touchedFields.firstName) ||
    Boolean(touchedFields.lastName) ||
    Boolean(duplicatePatient);

  const showPhoneSectionErrors =
    essentialsValidationAttempted ||
    Boolean(touchedFields.countryCode) ||
    Boolean(touchedFields.phoneNumber);

  const togglePanel = useCallback((panel: Exclude<ExpandedField, null>) => {
    setExpandedField((current) => (current === panel ? null : panel));
  }, []);

  const collapsePanels = useCallback(() => {
    setExpandedField(null);
  }, []);

  useEffect(() => {
    if (panelCollapseKey > 0) {
      collapsePanels();
    }
  }, [collapsePanels, panelCollapseKey]);

  const inputHandlers = useMemo(
    () => ({
      onInputBlur,
      onInputFocus: collapsePanels,
    }),
    [collapsePanels, onInputBlur],
  );

  const sectionInputProps = {
    hideInlineError: true,
    ...inputHandlers,
  } as const;

  return (
    <ThemedView space="default" variant="stack">
      <PatientFormSection
        errorAccessibilityLabel="Show name errors"
        errorTitle="Name issues"
        errors={nameSectionErrors}
        showErrors={showNameSectionErrors}
      >
        <View className="items-start gap-2">
          <PatientFormFieldRow align="center" icon={personIcon}>
            <PatientFormInput
              autoCapitalize="words"
              autoCorrect={false}
              name="firstName"
              placeholder="First name"
              rules={{
                required: PATIENT_FORM_VALIDATION_MESSAGES.firstNameRequired,
              }}
              {...sectionInputProps}
            />
          </PatientFormFieldRow>

          <View className="ml-8 gap-2 self-stretch">
            <PatientFormInput
              autoCapitalize="words"
              autoCorrect={false}
              name="fatherName"
              placeholder="Father name"
              {...sectionInputProps}
            />
            <PatientFormInput
              autoCapitalize="words"
              autoCorrect={false}
              name="lastName"
              placeholder="Last name"
              rules={{
                required: PATIENT_FORM_VALIDATION_MESSAGES.lastNameRequired,
              }}
              {...sectionInputProps}
            />
          </View>
        </View>
      </PatientFormSection>

      <FormDivider />

      <PatientFormSection
        errorAccessibilityLabel="Show phone errors"
        errorTitle="Phone issues"
        errors={phoneSectionErrors}
        showErrors={showPhoneSectionErrors}
      >
        <View className="items-start gap-2">
          <PatientFormFieldRow align="center" icon={phoneIcon}>
            <PatientFormInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="phone-pad"
              name="countryCode"
              placeholder="Zip"
              rules={{
                required: PATIENT_FORM_VALIDATION_MESSAGES.countryCodeRequired,
              }}
              {...sectionInputProps}
            />
          </PatientFormFieldRow>

          <View className="ml-8 gap-2 self-stretch">
            <PatientFormInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="phone-pad"
              name="phoneNumber"
              placeholder="Phone number"
              rules={{
                required: PATIENT_FORM_VALIDATION_MESSAGES.phoneNumberRequired,
              }}
              {...sectionInputProps}
            />
          </View>
        </View>
      </PatientFormSection>

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

      <PatientFormFieldRow icon={personsIcon}>
        <PatientFormInput
          autoCapitalize="words"
          autoCorrect={false}
          name="referralSource"
          placeholder="Referral source"
          {...inputHandlers}
        />
      </PatientFormFieldRow>

      <FormDivider />

      <PatientFormFieldRow align="center" icon={addressIcon}>
        <PatientFormInput
          autoCapitalize="sentences"
          autoCorrect
          name="address"
          placeholder="Address"
          {...inputHandlers}
        />
      </PatientFormFieldRow>

      <FormDivider />

      <PatientFormFieldRow align="center" icon={starIcon}>
        <View className="w-full flex-row items-center justify-between gap-inline px-inline">
          <ThemedText tone={isVip ? "default" : "muted"} variant="body">
            VIP patient
          </ThemedText>
          <Switch
            accessibilityLabel="Mark patient as VIP"
            onValueChange={(value) =>
              setValue("isVip", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            trackColor={{
              false: native.border.subtle,
              true: native.brand.default,
            }}
            thumbColor={native.surface.raised}
            value={isVip}
          />
        </View>
      </PatientFormFieldRow>
    </ThemedView>
  );
}

export const AddPatientEssentialsStep = memo(AddPatientEssentialsStepComponent);
