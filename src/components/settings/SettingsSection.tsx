import type { ComponentProps, ReactNode } from "react";
import { View } from "react-native";

import { ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import { semantic } from "@/tokens";
import { cn } from "@/helpers/ui/cn";

export type SettingsSymbolName = NonNullable<
  ComponentProps<typeof ThemedIcon>["name"]
>;

export type SettingsSelectOption<T extends string | number> = {
  value: T;
  label: string;
};

export function SettingsSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <ThemedView space="compact" variant="stack">
      <ThemedText
        style={{ paddingHorizontal: semantic.space.inline.compact }}
        tone="muted"
        variant="label"
      >
        {label}
      </ThemedText>
      <ThemedView
        className="overflow-hidden"
        inset="none"
        surface="sunken"
        variant="card"
      >
        {children}
      </ThemedView>
    </ThemedView>
  );
}

export function SettingsRowLabel({
  title,
  icon,
  description,
}: {
  title: string;
  icon: SettingsSymbolName;
  description?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: description ? "flex-start" : "center",
        gap: semantic.space.gap.default,
      }}
    >
      <View
        style={{
          width: semantic.size.icon,
          height: semantic.size.icon,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ThemedIcon name={icon} size="sm" />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: semantic.space.gap.compact }}>
        <ThemedText
          className="font-semibold"
          numberOfLines={1}
          variant="body"
        >
          {title}
        </ThemedText>
        {description ? (
          <ThemedText numberOfLines={1} tone="muted" variant="label">
            {description}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

export const settingsRowContentStyle = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: semantic.space.gap.default,
  paddingHorizontal: semantic.space.inline.comfortable,
  paddingVertical: semantic.space.inset.comfortable,
  minHeight: semantic.size["control-lg"],
};

export function SettingsRow({
  title,
  icon,
  description,
  trailing,
  last = false,
}: {
  title: string;
  icon: SettingsSymbolName;
  description?: string;
  trailing: ReactNode;
  last?: boolean;
}) {
  return (
    <View className={cn(!last && "border-b border-border-subtle")}>
      <View style={settingsRowContentStyle}>
        <SettingsRowLabel
          description={description}
          icon={icon}
          title={title}
        />
        <View style={{ flexShrink: 0, justifyContent: "center" }}>
          {trailing}
        </View>
      </View>
    </View>
  );
}
