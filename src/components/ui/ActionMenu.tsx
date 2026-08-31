import { useRef, useState, type ReactNode } from "react";
import { Modal, View, type LayoutRectangle } from "react-native";

import { useNativeColors } from "@/theme";

import { Button } from "./Button";
import { ThemedText } from "./ThemedText";

export type ActionMenuItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  tone?: "default" | "alert";
  onPress: () => void;
};

export type ActionMenuProps = {
  accessibilityLabel?: string;
  align?: "start" | "end";
  items: readonly ActionMenuItem[];
  title?: string;
  trigger: ReactNode | ((state: { open: boolean }) => ReactNode);
};

const MENU_MIN_WIDTH = 200;
const ARROW_WIDTH = 18;
const ARROW_HEIGHT = 11;
/** Visible space between the trigger and the arrow tip. */
const TRIGGER_GAP = 10;
const ARROW_EDGE_INSET = 20;

type MenuPlacement = LayoutRectangle & {
  arrowLeft: number;
};

function MenuArrow({
  left,
  surfaceColor,
}: {
  left: number;
  surfaceColor: string;
}) {
  const half = ARROW_WIDTH / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -ARROW_HEIGHT + 1,
        left,
        width: 0,
        height: 0,
        borderLeftWidth: half,
        borderRightWidth: half,
        borderBottomWidth: ARROW_HEIGHT,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: surfaceColor,
      }}
    />
  );
}

function computeMenuPlacement(
  triggerX: number,
  triggerY: number,
  triggerWidth: number,
  triggerHeight: number,
  align: "start" | "end",
): MenuPlacement {
  const menuWidth = Math.max(triggerWidth, MENU_MIN_WIDTH);
  const triggerCenterX = triggerX + triggerWidth / 2;
  const arrowLeft =
    align === "end"
      ? menuWidth - ARROW_EDGE_INSET - ARROW_WIDTH
      : ARROW_EDGE_INSET;

  return {
    x: triggerCenterX - arrowLeft - ARROW_WIDTH / 2,
    y: triggerY + triggerHeight + TRIGGER_GAP + ARROW_HEIGHT - 1,
    width: menuWidth,
    height: 0,
    arrowLeft,
  };
}

export function ActionMenu({
  accessibilityLabel = "Open menu",
  align = "end",
  items,
  title = "Actions",
  trigger,
}: ActionMenuProps) {
  const native = useNativeColors();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<MenuPlacement | null>(null);

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPlacement(computeMenuPlacement(x, y, width, height, align));
      setOpen(true);
    });
  };

  const closeMenu = () => {
    setOpen(false);
  };

  const triggerContent =
    typeof trigger === "function" ? trigger({ open }) : trigger;

  return (
    <>
      <View ref={triggerRef} className="shrink-0" collapsable={false}>
        <Button
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ expanded: open }}
          hitSlop={8}
          onPress={openMenu}
          ripple={false}
          size="none"
          tone="neutral"
          variant="ghost"
        >
          {triggerContent}
        </Button>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={closeMenu}
        transparent
        visible={open}
      >
        <Button
          accessibilityLabel="Dismiss menu"
          className="flex-1 rounded-none"
          onPress={closeMenu}
          ripple={false}
          size="none"
          tone="neutral"
          variant="ghost"
        >
          {menuPlacement ? (
            <View
              style={{
                position: "absolute",
                top: menuPlacement.y,
                left: menuPlacement.x,
                minWidth: menuPlacement.width,
                overflow: "visible",
              }}
            >
              <MenuArrow
                left={menuPlacement.arrowLeft}
                surfaceColor={native.surface.raised}
              />
              <View className="overflow-hidden rounded-card bg-surface-raised shadow-popover">
                <View className="px-inline-comfortable pb-stack-compact pt-stack">
                  <ThemedText
                    align="center"
                    className="font-semibold"
                    tone="muted"
                    variant="label"
                  >
                    {title}
                  </ThemedText>
                </View>

                {items.map((item) => (
                  <Button
                    key={item.key}
                    className="flex-row items-center justify-start gap-gap-default px-inline-comfortable py-stack"
                    onPress={() => {
                      closeMenu();
                      item.onPress();
                    }}
                    ripple={false}
                    size="none"
                    tone="neutral"
                    variant="ghost"
                  >
                    {item.icon ? (
                      <View className="w-5 items-center">{item.icon}</View>
                    ) : null}
                    <ThemedText
                      tone={item.tone === "alert" ? "alert" : "default"}
                      variant="body"
                    >
                      {item.label}
                    </ThemedText>
                  </Button>
                ))}
              </View>
            </View>
          ) : null}
        </Button>
      </Modal>
    </>
  );
}
