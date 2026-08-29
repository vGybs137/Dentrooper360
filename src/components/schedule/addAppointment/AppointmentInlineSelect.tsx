import { type ReactNode, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import {
  Button,
  ColorSwatch,
  ThemedIcon,
  ThemedText,
  type DropdownOption,
  type ThemedIconProps,
} from "@/components/ui";
import { useInlineCollapse } from "@/hooks/useInlineCollapse";
import { semantic } from "@/tokens";
import { cn } from "@/utils/cn";

export type AppointmentInlineSelectOption = DropdownOption;

/** Matches ThemedIcon dimension={20} used for inline select leadings. */
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
  color?: string;
};

export function InlineSelectColorLeading({
  color,
}: InlineSelectColorLeadingProps) {
  return (
    <InlineSelectLeadingSlot>
      <View style={{ marginLeft: LEADING_SWATCH_NUDGE_X }}>
        {color ? (
          <ColorSwatch color={color} size={LEADING_SWATCH_SIZE} />
        ) : (
          <View
            className="rounded-full bg-foreground-muted"
            style={{
              width: LEADING_SWATCH_SIZE,
              height: LEADING_SWATCH_SIZE,
            }}
          />
        )}
      </View>
    </InlineSelectLeadingSlot>
  );
}

type InlineSelectSymbolLeadingProps = {
  name: NonNullable<ThemedIconProps["name"]>;
  tone?: ThemedIconProps["tone"];
};

export function InlineSelectSymbolLeading({
  name,
  tone = "muted",
}: InlineSelectSymbolLeadingProps) {
  return (
    <InlineSelectLeadingSlot>
      <ThemedIcon dimension={LEADING_SLOT_SIZE} name={name} tone={tone} />
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
  const [searchQuery, setSearchQuery] = useState("");
  const optionGap = semantic.space.stack.compact;
  const listPadTop = semantic.space.gap.compact;
  const searchRowHeight = semantic.size.control;
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

        <View className="min-w-0 flex-1 self-stretch">
          <Button
            accessibilityLabel={placeholder}
            accessibilityState={{ expanded: visible }}
            bottomSheet
            className={cn(
              "min-h-control w-full justify-center rounded-pill px-inline py-stack-compact",
              visible && "bg-brand-subtle",
            )}
            hitSlop={6}
            onPress={onToggle}
            size="none"
            style={{ width: "100%" }}
            tone="neutral"
            variant="ghost"
          >
            <ThemedText
              className="w-full"
              tone={hasValue ? "default" : "muted"}
              variant="body"
            >
              {hasValue ? (selected?.label ?? placeholder) : placeholder}
            </ThemedText>
          </Button>
        </View>
      </View>

      {mounted ? (
        <Animated.View
          className="w-full"
          pointerEvents={visible ? "auto" : "none"}
          style={containerStyle}
        >
          <View className="w-full flex-row items-start gap-3">
            <View className="size-5 shrink-0" />
            <View className="min-w-0 flex-1">
              <ThemedText
                as="input"
                autoCapitalize="none"
                autoCorrect={false}
                bottomSheetInput
                containerClassName="w-full"
                fieldVariant="bare"
                onChangeText={setSearchQuery}
                placeholder={resolvedSearchPlaceholder}
                returnKeyType="search"
                value={searchQuery}
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
                      <Button
                        key={option.value || `option-${index}`}
                        accessibilityLabel={option.label}
                        accessibilityState={{ selected: isSelected }}
                        bottomSheet
                        className={cn(
                          "h-full w-full flex-row items-center gap-2 px-inline",
                          isSelected && "rounded-pill bg-brand-subtle",
                        )}
                        onPress={() => selectOption(option.value)}
                        ripple={false}
                        size="none"
                        style={{ height: OPTION_ROW_HEIGHT, width: "100%" }}
                        tone="neutral"
                        variant="ghost"
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
                      </Button>
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
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
