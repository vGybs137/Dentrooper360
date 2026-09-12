import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ActionMenu, ThemedIcon } from "@/components/ui";
import { infoIcon } from "@/constants";

type PatientFormSectionErrorTriggerProps = {
  errors: readonly string[];
  title: string;
  accessibilityLabel?: string;
};

function PatientFormSectionErrorTriggerComponent({
  errors,
  title,
  accessibilityLabel,
}: PatientFormSectionErrorTriggerProps) {
  const { t } = useTranslation("a11y");
  const resolvedAccessibilityLabel =
    accessibilityLabel ?? t("a11y:showSectionErrors");
  const items = useMemo(
    () =>
      errors.map((label, index) => ({
        key: String(index),
        label,
        tone: "alert" as const,
        onPress: () => {},
      })),
    [errors],
  );

  return (
    <ActionMenu
      accessibilityLabel={resolvedAccessibilityLabel}
      align="left"
      itemVariant="message"
      items={items}
      title={title}
      trigger={
        <View className="size-5 items-center justify-center">
          <ThemedIcon dimension={20} name={infoIcon} tone="alert" />
        </View>
      }
    />
  );
}

export const PatientFormSectionErrorTrigger = memo(
  PatientFormSectionErrorTriggerComponent,
);
