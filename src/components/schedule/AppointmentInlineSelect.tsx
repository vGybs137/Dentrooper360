import { type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { ColorSwatch, ThemedText, type DropdownOption } from "@/components/ui";
import { useInlineCollapse } from "@/hooks/useInlineCollapse";
import { cn } from "@/utils/cn";

export type AppointmentInlineSelectOption = DropdownOption;

type AppointmentInlineSelectProps = {
  value: string;
  options: readonly AppointmentInlineSelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  leading: ReactNode;
  visible: boolean;
  onToggle: () => void;
};

const OPTION_ROW_HEIGHT = 48;

export function AppointmentInlineSelect({
  value,
  options,
  onChange,
  placeholder,
  leading,
  visible,
  onToggle,
}: AppointmentInlineSelectProps) {
  const contentHeight = Math.max(options.length, 1) * OPTION_ROW_HEIGHT;
  const { containerStyle, mounted } = useInlineCollapse(visible, contentHeight);

  const selected = options.find((option) => option.value === value);
  const hasValue = value !== "";

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    if (visible) {
      onToggle();
    }
  };

  return (
    <View className="w-full">
      <View className="w-full flex-row items-center gap-3">
        <View className="size-5 shrink-0 items-center justify-center">
          {leading}
        </View>

        <Pressable
          accessibilityLabel={placeholder}
          accessibilityRole="button"
          accessibilityState={{ expanded: visible }}
          className={cn(
            "min-h-control min-w-0 flex-1 justify-center rounded-pill px-inline py-stack-compact",
            visible && "bg-brand-subtle",
          )}
          hitSlop={6}
          onPress={onToggle}
        >
          <ThemedText tone={hasValue ? "default" : "muted"} variant="body">
            {hasValue ? (selected?.label ?? placeholder) : placeholder}
          </ThemedText>
        </Pressable>
      </View>

      {mounted ? (
        <Animated.View
          className="ml-8 w-full"
          pointerEvents={visible ? "auto" : "none"}
          style={containerStyle}
        >
          <View className="w-full pt-gap-compact">
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={option.value || `option-${index}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className={cn(
                    "w-full flex-row items-center gap-2 px-inline",
                    index > 0 && "border-t border-border-subtle",
                    isSelected && "bg-brand-subtle",
                  )}
                  onPress={() => selectOption(option.value)}
                  style={{ height: OPTION_ROW_HEIGHT }}
                >
                  {option.color ? <ColorSwatch color={option.color} /> : null}
                  <ThemedText
                    className={cn("flex-1", isSelected && "font-semibold")}
                    tone={isSelected ? "brand" : "default"}
                    variant="body"
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
