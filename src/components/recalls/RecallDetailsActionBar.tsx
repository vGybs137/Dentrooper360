import { View } from "react-native";

import { Button, ThemedIcon, ThemedText, type ThemedIconProps } from "@/components/ui";

const CHEVRON_LEFT_ICON = {
  ios: "chevron.left",
  android: "chevron_left",
  web: "chevron_left",
} as const;

const ACTION_BAR_HEIGHT = 64;

function DetailsActionItem({
  icon,
  label,
  onPress,
}: {
  icon: NonNullable<ThemedIconProps["name"]>;
  label: string;
  onPress: () => void;
}) {
  return (
    <Button
      accessibilityLabel={label}
      className="min-w-0 flex-1 items-center justify-center gap-1 py-stack-compact"
      hitSlop={6}
      onPress={onPress}
      size="none"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
      tone="neutral"
      variant="ghost"
    >
      <ThemedIcon dimension={22} name={icon} tone="default" />
      <ThemedText className="font-medium" tone="default" variant="label">
        {label}
      </ThemedText>
    </Button>
  );
}

type RecallDetailsActionBarProps = {
  onBack: () => void;
};

export function RecallDetailsActionBar({ onBack }: RecallDetailsActionBarProps) {
  return (
    <View className="px-inline pb-stack-compact">
      <View
        className="flex-row items-stretch rounded-card border-subtle border-border-subtle bg-surface-default"
        style={{ height: ACTION_BAR_HEIGHT }}
      >
        <DetailsActionItem
          icon={CHEVRON_LEFT_ICON}
          label="Back"
          onPress={onBack}
        />
      </View>
    </View>
  );
}
