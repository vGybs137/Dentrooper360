import type { ComponentProps, ReactNode } from "react";
import { View } from "react-native";
import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";

export type SettingsSymbolName = ComponentProps<typeof SymbolView>["name"];

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
  const theme = useThemeTokens();

  return (
    <View style={{ gap: theme.semantic.space.gap.compact }}>
      <ThemedText
        tone="muted"
        variant="label"
        style={{
          paddingHorizontal: theme.semantic.space.inline.compact,
          fontWeight: theme.primitives.fontWeight.medium,
        }}
      >
        {label}
      </ThemedText>
      <View
        style={{
          borderRadius: theme.semantic.radius.card,
          backgroundColor: theme.palette.surface.raised,
          borderWidth: 1,
          borderColor: theme.palette.border.subtle,
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
  const theme = useThemeTokens();

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: theme.semantic.space.gap.default,
      }}
    >
      <View
        style={{
          width: theme.semantic.size.icon,
          height: theme.semantic.size.icon,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        <SymbolView
          name={icon}
          size={theme.semantic.size["icon-sm"]}
          tintColor={theme.palette.foreground.default}
        />
      </View>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          gap: theme.semantic.space.gap.compact,
        }}
      >
        <ThemedText
          numberOfLines={1}
          style={{ fontWeight: theme.primitives.fontWeight.semibold }}
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
  const theme = useThemeTokens();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.semantic.space.gap.default,
        paddingHorizontal: theme.semantic.space.inline.comfortable,
        paddingVertical: theme.semantic.space.stack.default,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.palette.border.subtle,
        minHeight: theme.semantic.size.touch,
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
