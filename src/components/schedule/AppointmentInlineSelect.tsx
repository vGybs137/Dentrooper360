import { useEffect, useState, type ReactNode } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
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

const OPTION_ROW_FALLBACK = 48;

export function AppointmentInlineSelect({
  value,
  options,
  onChange,
  placeholder,
  leading,
  visible,
  onToggle,
}: AppointmentInlineSelectProps) {
  const [contentHeight, setContentHeight] = useState(
    Math.max(options.length, 1) * OPTION_ROW_FALLBACK,
  );
  const { containerStyle } = useInlineCollapse(visible, contentHeight);

  const selected = options.find((option) => option.value === value);
  const hasValue = value !== "";

  useEffect(() => {
    setContentHeight((current) =>
      Math.max(current, Math.max(options.length, 1) * OPTION_ROW_FALLBACK),
    );
  }, [options.length]);

  const handleOptionsLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    if (nextHeight > 0 && nextHeight !== contentHeight) {
      setContentHeight(nextHeight);
    }
  };

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    if (visible) {
      onToggle();
    }
  };

  const renderOptions = (keyPrefix: string) => (
    <View className="w-full pt-gap-compact" onLayout={handleOptionsLayout}>
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={`${keyPrefix}-${option.value || index}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={cn(
              "w-full min-h-touch flex-row items-center gap-2 px-inline py-stack",
              index > 0 && "border-t border-border-subtle",
              isSelected && "bg-brand-subtle",
            )}
            onPress={() => selectOption(option.value)}
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
  );

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

      <View className="relative w-full">
        <View
          className="pointer-events-none absolute inset-x-0 top-0 opacity-0"
          pointerEvents="none"
        >
          <View className="ml-8">{renderOptions("measure")}</View>
        </View>

        <Animated.View
          className="ml-8 w-full"
          pointerEvents={visible ? "auto" : "none"}
          style={containerStyle}
        >
          {renderOptions("visible")}
        </Animated.View>
      </View>
    </View>
  );
}
