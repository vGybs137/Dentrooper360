import { View } from "react-native";

import { Button, ThemedIcon, ThemedText, type ThemedIconProps } from "@/components/ui";

const CHEVRON_LEFT_ICON = {
  ios: "chevron.left",
  android: "chevron_left",
  web: "chevron_left",
} as const;

const EDIT_ICON = {
  ios: "pencil",
  android: "edit",
  web: "edit",
} as const;

const DELETE_ICON = {
  ios: "trash",
  android: "delete",
  web: "delete",
} as const;

const ACTION_BAR_HEIGHT = 64;

function ActionSeparator() {
  return <View className="h-[80%] w-px self-center bg-border-subtle" />;
}

function DetailsActionItem({
  icon,
  label,
  onPress,
  tone = "default",
}: {
  icon: NonNullable<ThemedIconProps["name"]>;
  label: string;
  onPress: () => void;
  tone?: "default" | "alert";
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
      <ThemedIcon
        dimension={22}
        name={icon}
        tone={tone === "alert" ? "alert" : "default"}
      />
      <ThemedText
        className="font-medium"
        tone={tone === "alert" ? "alert" : "default"}
        variant="label"
      >
        {label}
      </ThemedText>
    </Button>
  );
}

type PatientDetailsActionBarProps = {
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function PatientDetailsActionBar({
  onBack,
  onEdit,
  onDelete,
}: PatientDetailsActionBarProps) {
  return (
    <View className="px-inline pb-stack-compact">
      <View
        className="flex-row items-stretch rounded-card border-subtle border-border-subtle bg-surface-default"
        style={{ height: ACTION_BAR_HEIGHT }}
      >
        <DetailsActionItem icon={CHEVRON_LEFT_ICON} label="Back" onPress={onBack} />
        <ActionSeparator />
        <DetailsActionItem icon={EDIT_ICON} label="Edit" onPress={onEdit} />
        <ActionSeparator />
        <DetailsActionItem
          icon={DELETE_ICON}
          label="Delete"
          onPress={onDelete}
          tone="alert"
        />
      </View>
    </View>
  );
}

export { ACTION_BAR_HEIGHT as PATIENT_DETAILS_ACTION_BAR_HEIGHT };
