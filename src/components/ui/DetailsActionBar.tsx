import { Fragment } from "react";
import { View } from "react-native";

import { Button } from "@/components/ui/Button";
import {
  ThemedIcon,
  type ThemedIconProps,
} from "@/components/ui/ThemedIcon";
import { ThemedText } from "@/components/ui/ThemedText";
import { DETAILS_ACTION_BAR_HEIGHT } from "@/constants/accents";

export type DetailsActionItemConfig = {
  icon: NonNullable<ThemedIconProps["name"]>;
  label: string;
  onPress: () => void;
  tone?: "default" | "alert";
};

export type DetailsActionBarProps = {
  items: readonly DetailsActionItemConfig[];
};

function ActionSeparator() {
  return <View className="h-[80%] w-px self-center bg-border-subtle" />;
}

function DetailsActionItem({
  icon,
  label,
  leadingSeparator = false,
  onPress,
  tone = "default",
}: DetailsActionItemConfig & { leadingSeparator?: boolean }) {
  return (
    <Fragment>
      {leadingSeparator ? <ActionSeparator /> : null}
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
    </Fragment>
  );
}

/** Bottom action strip for patient / recall / appointment details. */
export function DetailsActionBar({ items }: DetailsActionBarProps) {
  return (
    <View className="px-inline pb-stack-compact">
      <View
        className="flex-row items-stretch rounded-card border-subtle border-border-subtle bg-surface-default"
        style={{ height: DETAILS_ACTION_BAR_HEIGHT }}
      >
        {items.map((item, index) => (
          <DetailsActionItem
            key={`${item.label}-${index}`}
            {...item}
            leadingSeparator={index > 0}
          />
        ))}
      </View>
    </View>
  );
}

export { DETAILS_ACTION_BAR_HEIGHT };
