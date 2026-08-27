import type { ComponentProps, ReactNode } from "react";
import { View } from "react-native";

import { ThemedIcon, ThemedText } from "@/components/ui";
import { useNativeColors } from "@/theme";
import { primitives, semantic } from "@/tokens";

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
  const native = useNativeColors();

  return (
    <View style={{ gap: semantic.space.gap.compact }}>
      <ThemedText
        tone="muted"
        variant="label"
        style={{
          paddingHorizontal: semantic.space.inline.compact,
          fontWeight: primitives.fontWeight.medium,
        }}
      >
        {label}
      </ThemedText>
      <View
        style={{
          borderRadius: semantic.radius.card,
          backgroundColor: native.surface.raised,
          borderWidth: 1,
          borderColor: native.border.subtle,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

export function SettingsRowLabel({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: SettingsSymbolName;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: semantic.space.gap.default,
      }}
    >
      <View
        style={{
          width: semantic.size.icon,
          height: semantic.size.icon,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        <ThemedIcon name={icon} size="sm" />
      </View>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          gap: semantic.space.gap.compact,
        }}
      >
        <ThemedText
          numberOfLines={1}
          style={{ fontWeight: primitives.fontWeight.semibold }}
          variant="body"
        >
          {title}
        </ThemedText>
        <ThemedText tone="muted" variant="label">
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

export function SettingsRow({
  title,
  description,
  icon,
  trailing,
  last = false,
}: {
  title: string;
  description: string;
  icon: SettingsSymbolName;
  trailing: ReactNode;
  last?: boolean;
}) {
  const native = useNativeColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: semantic.space.gap.default,
        paddingHorizontal: semantic.space.inline.comfortable,
        paddingVertical: semantic.space.stack.default,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: native.border.subtle,
        minHeight: semantic.size.touch,
      }}
    >
      <SettingsRowLabel
        title={title}
        description={description}
        icon={icon}
      />
      <View style={{ flexShrink: 0, justifyContent: "center" }}>
        {trailing}
      </View>
    </View>
  );
}
