import { memo, useMemo } from "react";
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
  accessibilityLabel = "Show section errors",
}: PatientFormSectionErrorTriggerProps) {
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
      accessibilityLabel={accessibilityLabel}
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
