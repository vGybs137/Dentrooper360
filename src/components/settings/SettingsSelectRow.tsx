import { View } from "react-native";
import Animated from "react-native-reanimated";

import { Button, ThemedIcon, ThemedText } from "@/components/ui";
import { chevronDownIcon } from "@/constants";
import { useInlineCollapse } from "@/hooks/useInlineCollapse";
import { semantic } from "@/tokens";
import { cn } from "@/utils/cn";

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
  const optionGap = semantic.space.gap.compact;
  const contentHeight =
    options.length * OPTION_ROW_HEIGHT +
    Math.max(options.length - 1, 0) * optionGap +
    semantic.space.stack.compact;
  const { containerStyle, chevronStyle, mounted } = useInlineCollapse(
    expanded,
    contentHeight,
  );
  const selected = options.find((option) => option.value === value);

  return (
    <View
      className={cn(!last && "border-b border-border-subtle")}
    >
      <Button
        accessibilityState={{ expanded }}
        className="w-full"
        onPress={onToggle}
        ripple={false}
        size="none"
        tone="neutral"
        variant="ghost"
      >
        <View
          style={{
            width: "100%",
            minHeight: semantic.size.touch,
            flexDirection: "row",
            alignItems: "center",
            gap: semantic.space.gap.default,
            paddingHorizontal: semantic.space.inline.comfortable,
            paddingVertical: semantic.space.stack.default,
          }}
        >
          <SettingsRowLabel
            description={description}
            icon={icon}
            title={title}
          />
          <View
            style={{
              flexShrink: 0,
              flexDirection: "row",
              alignItems: "center",
              gap: semantic.space.gap.compact,
            }}
          >
            <ThemedText className="font-semibold" tone="brand" variant="label">
              {selected?.label ?? "—"}
            </ThemedText>
            <Animated.View style={chevronStyle}>
              <ThemedIcon
                dimension={16}
                name={chevronDownIcon}
                tone="muted"
              />
            </Animated.View>
          </View>
        </View>
      </Button>

      {mounted ? (
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          style={containerStyle}
        >
          <View
            style={{
              paddingBottom: semantic.space.stack.compact,
              paddingHorizontal: semantic.space.inline.comfortable,
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
                    className={isSelected ? "font-semibold" : undefined}
                    tone={isSelected ? "brand" : "default"}
                    variant="body"
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
