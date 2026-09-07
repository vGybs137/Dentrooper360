import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import {
  Button,
  ColorSwatch,
  ThemedIcon,
  ThemedText,
  type DropdownOption,
  type ThemedIconProps,
} from "@/components/ui";
import { splitTextBySearchQuery } from "@/helpers/searchHighlight";
import { useInlineCollapse } from "@/hooks/useInlineCollapse";
import { semantic } from "@/tokens";
import { cn } from "@/utils/cn";

export type InlineSelectOption = DropdownOption;

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

export type InlineSelectProps = {
  value: string;
  options: readonly InlineSelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  /** When omitted, the select spans the full row (e.g. inside an ml-8 indent). */
  leading?: ReactNode;
  /** `pill` matches appointment sheet selects; `bare` aligns with bare text inputs. */
  fieldVariant?: "pill" | "bare";
  visible: boolean;
  onToggle: () => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
};

function InlineSelectDivider() {
  return <View className="h-px w-full bg-border-subtle" />;
}

function InlineSelectOptionLabel({
  isSelected,
  label,
  searchQuery,
}: {
  isSelected: boolean;
  label: string;
  searchQuery: string;
}) {
  const parts = useMemo(
    () => splitTextBySearchQuery(label, searchQuery),
    [label, searchQuery],
  );
  const hasHighlight = Boolean(searchQuery.trim());
  const baseToneClass = isSelected
    ? "text-brand-default"
    : "text-foreground-default";

  if (!hasHighlight) {
    return (
      <ThemedText
        className={cn("flex-1", isSelected && "font-semibold")}
        tone={isSelected ? "brand" : "default"}
        variant="body"
      >
        {label}
      </ThemedText>
    );
  }

  return (
    <Text
      className={cn(
        "flex-1 text-body",
        baseToneClass,
        isSelected && "font-semibold",
      )}
      numberOfLines={1}
    >
      {parts.map((part, index) => (
        <Text
          key={`${part.value}-${index}`}
          className={
            part.highlighted
              ? "font-semibold text-brand-default"
              : baseToneClass
          }
        >
          {part.value}
        </Text>
      ))}
    </Text>
  );
}

const OPTION_ROW_HEIGHT = 48;
const DIVIDER_HEIGHT = 1;

function filterInlineSelectOptions(
  options: readonly InlineSelectOption[],
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

export function InlineSelect({
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  leading,
  fieldVariant = "pill",
  visible,
  onToggle,
  onSearchFocus,
  onSearchBlur,
}: InlineSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const hasLeading = leading != null;
  const isBare = fieldVariant === "bare";
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
      <View
        className={cn("w-full flex-row items-center", hasLeading && "gap-3")}
      >
        {hasLeading ? (
          <View className="size-5 shrink-0 items-center justify-center">
            {leading}
          </View>
        ) : null}

        <View className="min-w-0 flex-1 self-stretch">
          <Button
            accessibilityLabel={placeholder}
            accessibilityState={{ expanded: visible }}
            bottomSheet
            className={cn(
              "min-h-control w-full py-stack-compact",
              isBare
                ? "justify-start px-0"
                : "justify-center rounded-pill px-inline",
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
          <View
            className={cn("w-full flex-row items-start", hasLeading && "gap-3")}
          >
            {hasLeading ? <View className="size-5 shrink-0" /> : null}
            <View className="min-w-0 flex-1">
              <ThemedText
                as="input"
                autoCapitalize="none"
                autoCorrect={false}
                bottomSheetInput
                className={isBare ? "w-full px-inline" : undefined}
                containerClassName="w-full"
                fieldVariant="bare"
                onBlur={onSearchBlur}
                onChangeText={setSearchQuery}
                onFocus={onSearchFocus}
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
                          "h-full w-full flex-row items-center gap-2",
                          isBare ? "px-0" : "px-inline",
                          isSelected &&
                            !isBare &&
                            "rounded-pill bg-brand-subtle",
                          isSelected && isBare && "bg-brand-subtle",
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
                        <InlineSelectOptionLabel
                          isSelected={isSelected}
                          label={option.label}
                          searchQuery={searchQuery}
                        />
                      </Button>
                    );
                  })
                ) : (
                  <View
                    className={cn(
                      "w-full justify-center",
                      isBare ? "px-0" : "px-inline",
                    )}
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
