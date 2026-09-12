import { View } from "react-native";

import {
  ThemedIcon,
  type ThemedIconProps,
} from "@/components/ui/ThemedIcon";
import { ThemedText } from "@/components/ui/ThemedText";

export type MetricColumnAlign = "start" | "center" | "end" | "left" | "right";

export type MetricColumnProps = {
  align?: MetricColumnAlign;
  icon: NonNullable<ThemedIconProps["name"]>;
  iconSize?: number;
  label: string;
  value: string;
};

const ALIGN_CLASS: Record<MetricColumnAlign, string> = {
  start: "items-start",
  left: "items-start",
  center: "items-center",
  end: "items-end",
  right: "items-end",
};

const VALUE_ALIGN: Record<
  MetricColumnAlign,
  "start" | "center" | "end" | "left" | "right"
> = {
  start: "start",
  left: "start",
  center: "center",
  end: "end",
  right: "end",
};

/** Compact icon + label + value column used in list rows. */
export function MetricColumn({
  align = "start",
  icon,
  iconSize = 14,
  label,
  value,
}: MetricColumnProps) {
  return (
    <View className={`min-w-[72px] gap-0.5 ${ALIGN_CLASS[align]}`}>
      <View className="flex-row items-center gap-1">
        <ThemedIcon dimension={iconSize} name={icon} tone="muted" />
        <ThemedText className="text-xs" tone="muted" variant="label">
          {label}
        </ThemedText>
      </View>
      <ThemedText
        align={VALUE_ALIGN[align]}
        className="font-normal"
        numberOfLines={1}
        variant="label"
      >
        {value}
      </ThemedText>
    </View>
  );
}
