import { SymbolView } from "expo-symbols";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import {
  ColorSwatch,
  TextField,
  ThemedText,
  type DropdownOption,
} from "@/components/ui";
import { useInlineCollapse } from "@/hooks/useInlineCollapse";
import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";

export type AppointmentInlineSelectOption = DropdownOption;

/** Matches SymbolView size={20} used for inline select leadings. */
const LEADING_SLOT_SIZE = 20;
const LEADING_SWATCH_SIZE = 10;
/** Nudge swatch right so it aligns with SF Symbol optical inset. */
const LEADING_SWATCH_NUDGE_X = 3;

type LeadingSlotProps = {
  children: ReactNode;
};

function InlineSelectLeadingSlot({ children }: LeadingSlotProps) {
  return (
    <View
      className="shrink-0 items-center justify-center"
      style={{ width: LEADING_SLOT_SIZE, height: LEADING_SLOT_SIZE }}
    >
      {children}
    </View>
  );
}

type InlineSelectColorLeadingProps = {
  color: string;
};

export function InlineSelectColorLeading({
  color,
}: InlineSelectColorLeadingProps) {
  return (
    <InlineSelectLeadingSlot>
      <View style={{ marginLeft: LEADING_SWATCH_NUDGE_X }}>
        <ColorSwatch color={color} size={LEADING_SWATCH_SIZE} />
      </View>
    </InlineSelectLeadingSlot>
  );
}

type InlineSelectSymbolLeadingProps = {
  name: React.ComponentProps<typeof SymbolView>["name"];
  tintColor: string;
};

export function InlineSelectSymbolLeading({
  name,
  tintColor,
}: InlineSelectSymbolLeadingProps) {
  return (
    <InlineSelectLeadingSlot>
      <SymbolView name={name} size={LEADING_SLOT_SIZE} tintColor={tintColor} />
    </InlineSelectLeadingSlot>
  );
}

type AppointmentInlineSelectProps = {
  value: string;
  options: readonly AppointmentInlineSelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  leading: ReactNode;
  visible: boolean;
  onToggle: () => void;
};

function InlineSelectDivider() {
  return <View className="h-px w-full bg-border-subtle" />;
}

const OPTION_ROW_HEIGHT = 48;
const DIVIDER_HEIGHT = 1;

function filterInlineSelectOptions(
  options: readonly AppointmentInlineSelectOption[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return options;
  }

  return options.filter((option) =>
    option.label.toLowerCase().includes(normalizedQuery),
  );
}

export function AppointmentInlineSelect({
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  leading,
  visible,
  onToggle,
}: AppointmentInlineSelectProps) {
  const theme = useThemeTokens();
  const [searchQuery, setSearchQuery] = useState("");
  const optionGap = theme.semantic.space.stack.compact;
  const listPadTop = theme.semantic.space.gap.compact;
  const searchRowHeight = theme.semantic.size.control;
  const resolvedSearchPlaceholder =
    searchPlaceholder ??
    `Search ${placeholder.replace(/^Select\s+/i, "").toLowerCase()}...`;

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
    }
  }, [visible]);

  const filteredOptions = useMemo(
    () => filterInlineSelectOptions(options, searchQuery),
    [options, searchQuery],
  );

  const hasFilteredOptions = filteredOptions.length > 0;
  const optionCount = hasFilteredOptions ? filteredOptions.length : 1;
  const contentHeight =
    searchRowHeight +
    DIVIDER_HEIGHT +
    listPadTop +
    optionCount * OPTION_ROW_HEIGHT +
    Math.max(optionCount - 1, 0) * optionGap;
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
          className="ml-8 flex-1"
          pointerEvents={visible ? "auto" : "none"}
          style={containerStyle}
        >
          <View className="w-full">
            <TextField
              autoCapitalize="none"
              autoCorrect={false}
              bottomSheetInput
              containerClassName="w-full"
              onChangeText={setSearchQuery}
              placeholder={resolvedSearchPlaceholder}
              returnKeyType="search"
              value={searchQuery}
              variant="bare"
            />
            <InlineSelectDivider />

            <View
              className="w-full pt-gap-compact"
              style={{ gap: optionGap }}
            >
              {hasFilteredOptions ? (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  return (
                    <Pressable
                      key={option.value || `option-${index}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      className={cn(
                        "w-full flex-row items-center gap-2 px-inline",
                        isSelected && "rounded-pill bg-brand-subtle",
                      )}
                      onPress={() => selectOption(option.value)}
                      style={{ height: OPTION_ROW_HEIGHT }}
                    >
                      {option.color ? (
                        <ColorSwatch color={option.color} />
                      ) : null}
                      <ThemedText
                        className={cn("flex-1", isSelected && "font-semibold")}
                        tone={isSelected ? "brand" : "default"}
                        variant="body"
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                })
              ) : (
                <View
                  className="w-full justify-center px-inline"
                  style={{ height: OPTION_ROW_HEIGHT }}
                >
                  <ThemedText tone="muted" variant="body">
                    No results found.
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
