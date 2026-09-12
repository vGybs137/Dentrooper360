import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormState, useWatch } from "react-hook-form";
import { Switch, View } from "react-native";

import { PatientFormDivider } from "./PatientFormFieldSection";
import {
  PatientFormFieldRow,
  PatientFormInput,
} from "@/components/patients/addPatient/PatientFormField";
import { PatientFormInlineSelect } from "@/components/patients/addPatient/PatientFormInlineSelect";
import { PatientFormSection } from "@/components/patients/addPatient/PatientFormSection";
import { ThemedText, ThemedView, type DropdownOption } from "@/components/ui";
import {
  addressIcon,
  ageIcon,
  emailIcon,
  personIcon,
  personsIcon,
  phoneIcon,
  starIcon,
} from "@/constants";
import {
  PATIENT_FORM_VALIDATION_KEYS,
  PATIENT_GENDER_OPTIONS,
} from "@/constants/patientForm";
import type { AddPatientFormState } from "@/hooks/patients/useAddPatientForm";
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
  const { t } = useTranslation(["patients", "a11y", "validation", "common"]);
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
        label: t(option.labelKey),
      })),
    [t],
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
        t("patients:form.duplicate", { name: duplicatePatientName }),
      );
    }

    return messages;
  }, [
    duplicatePatient,
    duplicatePatientName,
    errors.firstName?.message,
    errors.lastName?.message,
    isEditing,
    t,
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
        errorAccessibilityLabel={t("a11y:showNameErrors")}
        errorTitle={t("patients:form.nameIssues")}
        errors={nameSectionErrors}
        showErrors={showNameSectionErrors}
      >
        <View className="items-start gap-2">
          <PatientFormFieldRow align="center" icon={personIcon}>
            <PatientFormInput
              autoCapitalize="words"
              autoCorrect={false}
              name="firstName"
              placeholder={t("patients:form.firstName")}
              rules={{
                required: t(PATIENT_FORM_VALIDATION_KEYS.firstNameRequired),
              }}
              {...sectionInputProps}
            />
          </PatientFormFieldRow>

          <View className="ml-8 gap-2 self-stretch">
            <PatientFormInput
              autoCapitalize="words"
              autoCorrect={false}
              name="fatherName"
              placeholder={t("patients:form.fatherName")}
              {...sectionInputProps}
            />
            <PatientFormInput
              autoCapitalize="words"
              autoCorrect={false}
              name="lastName"
              placeholder={t("patients:form.lastName")}
              rules={{
                required: t(PATIENT_FORM_VALIDATION_KEYS.lastNameRequired),
              }}
              {...sectionInputProps}
            />
          </View>
        </View>
      </PatientFormSection>

      <PatientFormDivider />

      <PatientFormSection
        errorAccessibilityLabel={t("a11y:showPhoneErrors")}
        errorTitle={t("patients:form.phoneIssues")}
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
              placeholder={t("patients:form.zip")}
              rules={{
                required: t(PATIENT_FORM_VALIDATION_KEYS.countryCodeRequired),
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
              placeholder={t("patients:form.phoneNumber")}
              rules={{
                required: t(PATIENT_FORM_VALIDATION_KEYS.phoneNumberRequired),
              }}
              {...sectionInputProps}
            />
          </View>
        </View>
      </PatientFormSection>

      <PatientFormDivider />

      <View className="items-start gap-2">
        <PatientFormFieldRow align="center" icon={ageIcon}>
          <PatientFormInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="number-pad"
            name="age"
            placeholder={t("patients:form.age")}
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
            placeholder={t("patients:form.selectGender")}
            searchPlaceholder={t("patients:form.searchGender")}
            value={gender}
            visible={expandedField === "gender"}
          />
        </View>
      </View>

      <PatientFormDivider />

      <PatientFormFieldRow icon={emailIcon}>
        <PatientFormInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          name="emailAddress"
          placeholder={t("patients:form.email")}
          {...inputHandlers}
        />
      </PatientFormFieldRow>

      <PatientFormDivider />

      <PatientFormFieldRow icon={personsIcon}>
        <PatientFormInput
          autoCapitalize="words"
          autoCorrect={false}
          name="referralSource"
          placeholder={t("patients:form.referralSource")}
          {...inputHandlers}
        />
      </PatientFormFieldRow>

      <PatientFormDivider />

      <PatientFormFieldRow align="center" icon={addressIcon}>
        <PatientFormInput
          autoCapitalize="sentences"
          autoCorrect
          name="address"
          placeholder={t("patients:form.address")}
          {...inputHandlers}
        />
      </PatientFormFieldRow>

      <PatientFormDivider />

      <PatientFormFieldRow align="center" icon={starIcon}>
        <View className="w-full flex-row items-center justify-between gap-inline px-inline">
          <ThemedText tone={isVip ? "default" : "muted"} variant="body">
            {t("patients:form.vipPatient")}
          </ThemedText>
          <Switch
            accessibilityLabel={t("a11y:markVip")}
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
