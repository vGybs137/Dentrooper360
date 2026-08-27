import { View } from "react-native";
import Animated from "react-native-reanimated";

import { Button, ThemedIcon, ThemedText } from "@/components/ui";
import { chevronDownIcon } from "@/constants";
import { useInlineCollapse } from "@/hooks/useInlineCollapse";
import { useThemeTokens } from "@/theme";

import {
  SettingsRowLabel,
  type SettingsSelectOption,
  type SettingsSymbolName,
} from "./SettingsSection";

const OPTION_ROW_HEIGHT = 44;

export function SettingsSelectRow<T extends string | number>({
  title,
  description,
  icon,
  options,
  value,
  onChange,
  expanded,
  onToggle,
  last = false,
}: {
  title: string;
  description: string;
  icon: SettingsSymbolName;
  options: readonly SettingsSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  expanded: boolean;
  onToggle: () => void;
  last?: boolean;
}) {
  const theme = useThemeTokens();
  const optionGap = theme.semantic.space.gap.compact;
  const contentHeight =
    options.length * OPTION_ROW_HEIGHT +
    Math.max(options.length - 1, 0) * optionGap +
    theme.semantic.space.stack.compact;
  const { containerStyle, mounted } = useInlineCollapse(
    expanded,
    contentHeight,
  );
  const selected = options.find((option) => option.value === value);

  return (
    <View
      style={{
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.palette.border.subtle,
      }}
    >
      <Button
        accessibilityState={{ expanded }}
        className="w-full flex-row items-center"
        onPress={onToggle}
        ripple={false}
        size="none"
        style={{
          gap: theme.semantic.space.gap.default,
          paddingHorizontal: theme.semantic.space.inline.comfortable,
          paddingVertical: theme.semantic.space.stack.default,
          minHeight: theme.semantic.size.touch,
        }}
        tone="neutral"
        variant="ghost"
      >
        <SettingsRowLabel
          title={title}
          description={description}
          icon={icon}
        />
        <View
          style={{
            flexShrink: 0,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.semantic.space.gap.compact,
          }}
        >
          <ThemedText
            tone="brand"
            variant="label"
            style={{ fontWeight: theme.primitives.fontWeight.semibold }}
          >
            {selected?.label ?? "—"}
          </ThemedText>
          <ThemedIcon
            className={expanded ? "rotate-180" : undefined}
            dimension={16}
            name={chevronDownIcon}
            tone="muted"
          />
        </View>
      </Button>

      {mounted ? (
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          style={containerStyle}
        >
          <View
            style={{
              paddingBottom: theme.semantic.space.stack.compact,
              paddingHorizontal: theme.semantic.space.inline.comfortable,
              alignItems: "center",
              justifyContent: "center",
              gap: optionGap,
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Button
                  key={String(option.value)}
                  accessibilityState={{ selected: isSelected }}
                  className="w-full items-center justify-center"
                  onPress={() => {
                    onChange(option.value);
                    if (expanded) {
                      onToggle();
                    }
                  }}
                  ripple={false}
                  size="none"
                  style={{
                    height: OPTION_ROW_HEIGHT,
                  }}
                  tone="neutral"
                  variant="ghost"
                >
                  <ThemedText
                    align="center"
                    tone={isSelected ? "brand" : "default"}
                    variant="body"
                    style={{
                      fontWeight: isSelected
                        ? theme.primitives.fontWeight.semibold
                        : theme.primitives.fontWeight.regular,
                    }}
                  >
                    {option.label}
                  </ThemedText>
                </Button>
              );
            })}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
