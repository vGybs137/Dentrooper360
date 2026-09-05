import { memo, type ReactNode } from "react";
import { View } from "react-native";

import { FormSectionErrorTrigger } from "./FormSectionErrorTrigger";

type PatientFormSectionProps = {
  children: ReactNode;
  errors: readonly string[];
  showErrors: boolean;
  errorTitle: string;
  errorAccessibilityLabel: string;
};

function PatientFormSectionComponent({
  children,
  errors,
  showErrors,
  errorTitle,
  errorAccessibilityLabel,
}: PatientFormSectionProps) {
  const hasErrors = showErrors && errors.length > 0;

  return (
    <View className="w-full flex-row items-center gap-2">
      <View className="min-w-0 flex-1">{children}</View>
      {hasErrors ? (
        <View className="shrink-0 self-center">
          <FormSectionErrorTrigger
            accessibilityLabel={errorAccessibilityLabel}
            errors={errors}
            title={errorTitle}
          />
        </View>
      ) : null}
    </View>
  );
}

export const PatientFormSection = memo(PatientFormSectionComponent);
