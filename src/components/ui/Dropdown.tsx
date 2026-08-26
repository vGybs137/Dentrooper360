import { SymbolView } from "expo-symbols";
import { useRef, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  View,
  type LayoutRectangle,
} from "react-native";

import { chevronDownIcon } from "@/constants";
import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";

import { ColorSwatch } from "./ColorSwatch";
import { ThemedText } from "./ThemedText";

export type DropdownOption = {
  value: string;
  label: string;
  color?: string | null;
};

export type DropdownProps = {
  value: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  leading?: ReactNode;
  borderless?: boolean;
  showChevron?: boolean;
};

export function Dropdown({
  value,
  options,
  onChange,
  placeholder = "Select…",
  label,
  leading,
  borderless = false,
  showChevron = true,
}: DropdownProps) {
  const theme = useThemeTokens();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [menuLayout, setMenuLayout] = useState<LayoutRectangle | null>(null);

  const selected = options.find((option) => option.value === value);
  const hasValue = value !== "";

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuLayout({ x, y: y + height + 4, width, height: 0 });
      setOpen(true);
    });
  };

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <>
      <View className={cn(!label && "self-start")}>
        {label ? (
          <ThemedText className="mb-[4px]" variant="label">
            {label}
          </ThemedText>
        ) : null}
        <View ref={triggerRef} collapsable={false}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            className={cn(
              "min-h-control flex-row items-center gap-gap-compact py-stack-compact",
              borderless
                ? "rounded-none border-0 bg-transparent px-0"
                : "rounded-control border-subtle border-border-subtle bg-surface-raised px-inline",
            )}
            onPress={openMenu}
          >
            {leading}
            <ThemedText
              className={cn(label && "flex-1")}
              tone={hasValue ? "default" : "muted"}
              variant="body"
            >
              {hasValue ? (selected?.label ?? placeholder) : placeholder}
            </ThemedText>
            {showChevron ? (
              <SymbolView
                name={chevronDownIcon}
                size={18}
                tintColor={theme.palette.foreground.muted}
              />
            ) : null}
          </Pressable>
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={closeMenu}
        transparent
        visible={open}
      >
        <Pressable className="flex-1" onPress={closeMenu}>
          {menuLayout ? (
            <View
              className="absolute overflow-hidden rounded-control border-subtle border-border bg-surface-raised shadow-popover"
              style={{
                top: menuLayout.y,
                left: menuLayout.x,
                minWidth: Math.max(menuLayout.width, 140),
              }}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value || `option-${index}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    className={cn(
                      "flex-row items-center gap-2 px-inline py-stack",
                      index > 0 && "border-t border-border-subtle",
                      isSelected && "bg-brand-subtle",
                    )}
                    onPress={() => {
                      onChange(option.value);
                      closeMenu();
                    }}
                  >
                    {option.color ? <ColorSwatch color={option.color} /> : null}
                    <ThemedText
                      className={cn(isSelected && "font-semibold")}
                      tone={isSelected ? "brand" : "default"}
                      variant="body"
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}
