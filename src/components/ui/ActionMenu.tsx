import { useEffect, useRef, useState, type ReactNode } from "react";
import { Modal, useWindowDimensions, View, type LayoutRectangle } from "react-native";

import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

import { Button } from "./Button";
import { ThemedText } from "./ThemedText";
import { cn } from "@/utils/cn";

export type ActionMenuItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  tone?: "default" | "alert";
  onPress: () => void;
};

export type ActionMenuAlign = "start" | "end" | "left";

export type ActionMenuProps = {
  accessibilityLabel?: string;
  align?: ActionMenuAlign;
  items: readonly ActionMenuItem[];
  /** `message` renders read-only rows; `action` renders tappable menu items. */
  itemVariant?: "action" | "message";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  titleTone?: "muted" | "warning";
  trigger: ReactNode | ((state: { open: boolean }) => ReactNode);
};

const MENU_MIN_WIDTH = 200;
const MENU_MAX_WIDTH = 280;
const ARROW_WIDTH = 18;
const ARROW_HEIGHT = 11;
/** Visible space between the trigger and the arrow tip (below placement). */
const TRIGGER_GAP = 10;
/** Visible space between the trigger and the arrow tip (leading placement). */
const LEADING_GAP = 8;
const ARROW_EDGE_INSET = 20;
const SCREEN_EDGE_INSET = semantic.space.inline.default;

type BelowMenuPlacement = LayoutRectangle & {
  kind: "below";
  arrowLeft: number;
};

type LeadingMenuPlacement = {
  kind: "leading";
  triggerX: number;
  triggerY: number;
  triggerHeight: number;
  menuMaxWidth: number;
};

type MenuPlacement = BelowMenuPlacement | LeadingMenuPlacement;

function MenuArrowUp({
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

function MenuArrowRight({ surfaceColor }: { surfaceColor: string }) {
  const half = ARROW_HEIGHT / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        width: 0,
        height: 0,
        borderTopWidth: half,
        borderBottomWidth: half,
        borderLeftWidth: ARROW_WIDTH,
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
        borderLeftColor: surfaceColor,
      }}
    />
  );
}

function clampArrowLeft(arrowLeft: number, menuWidth: number): number {
  /** Keep arrow on-panel but allow near-edge alignment with left-side triggers. */
  const minArrow = 4;
  const maxArrow = Math.max(minArrow, menuWidth - ARROW_WIDTH - 4);
  return Math.min(Math.max(arrowLeft, minArrow), maxArrow);
}

function computeMenuPlacement(
  triggerX: number,
  triggerY: number,
  triggerWidth: number,
  triggerHeight: number,
  align: ActionMenuAlign,
  windowWidth: number,
): MenuPlacement {
  const triggerCenterX = triggerX + triggerWidth / 2;
  const menuY = triggerY + triggerHeight + TRIGGER_GAP + ARROW_HEIGHT - 1;

  if (align === "left") {
    const menuMaxWidth = Math.max(
      MENU_MIN_WIDTH,
      triggerX - SCREEN_EDGE_INSET - LEADING_GAP - ARROW_WIDTH,
    );

    return {
      kind: "leading",
      triggerX,
      triggerY,
      triggerHeight,
      menuMaxWidth,
    };
  }

  const menuWidth = Math.min(
    MENU_MAX_WIDTH,
    Math.max(triggerWidth, MENU_MIN_WIDTH),
  );
  const preferredArrowLeft =
    align === "end"
      ? menuWidth - ARROW_EDGE_INSET - ARROW_WIDTH
      : ARROW_EDGE_INSET;

  let x = triggerCenterX - preferredArrowLeft - ARROW_WIDTH / 2;
  const maxX = windowWidth - SCREEN_EDGE_INSET - menuWidth;
  x = Math.min(Math.max(x, SCREEN_EDGE_INSET), maxX);

  return {
    kind: "below",
    x,
    y: menuY,
    width: menuWidth,
    height: 0,
    arrowLeft: clampArrowLeft(triggerCenterX - x - ARROW_WIDTH / 2, menuWidth),
  };
}

export function ActionMenu({
  accessibilityLabel = "Open menu",
  align = "end",
  items,
  itemVariant = "action",
  open: openProp,
  onOpenChange,
  title = "Actions",
  titleTone = "muted",
  trigger,
}: ActionMenuProps) {
  const native = useNativeColors();
  const { width: windowWidth } = useWindowDimensions();
  const triggerRef = useRef<View>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<MenuPlacement | null>(null);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const measureAndPlace = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPlacement(
        computeMenuPlacement(x, y, width, height, align, windowWidth),
      );
    });
  };

  const openMenu = () => {
    measureAndPlace();
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      measureAndPlace();
      return;
    }

    setMenuPlacement(null);
  }, [align, open, windowWidth]);

  const triggerContent =
    typeof trigger === "function" ? trigger({ open }) : trigger;

  const isLeadingMessage = align === "left" && itemVariant === "message";
  const cardRadius = semantic.radius.card;

  const menuPanel = menuPlacement ? (
    <View
      className={cn(
        "bg-surface-raised shadow-popover",
        !isLeadingMessage && "rounded-card",
      )}
      style={
        isLeadingMessage
          ? {
              borderTopLeftRadius: cardRadius,
              borderTopRightRadius: cardRadius,
              borderBottomLeftRadius: cardRadius,
              borderBottomRightRadius: cardRadius,
              borderWidth: semantic.borderWidth.subtle,
              borderColor: native.border.subtle,
            }
          : undefined
      }
    >
      <View className="px-inline-comfortable pb-stack-compact pt-stack">
        <ThemedText
          align="center"
          className="font-semibold"
          style={
            titleTone === "warning"
              ? { color: native.warning.DEFAULT }
              : undefined
          }
          tone={titleTone === "warning" ? "default" : "muted"}
          variant="label"
        >
          {title}
        </ThemedText>
      </View>

      {items.map((item) =>
        itemVariant === "message" ? (
          <View
            key={item.key}
            className="px-inline-comfortable py-stack"
          >
            <ThemedText
              className="w-full"
              tone={item.tone === "alert" ? "alert" : "default"}
              variant="body"
            >
              {item.label}
            </ThemedText>
          </View>
        ) : (
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
              className="flex-1 shrink"
              tone={item.tone === "alert" ? "alert" : "default"}
              variant="body"
            >
              {item.label}
            </ThemedText>
          </Button>
        ),
      )}
    </View>
  ) : null;

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
          {menuPlacement?.kind === "leading" ? (
            <View
              pointerEvents="box-none"
              style={{
                position: "absolute",
                top: menuPlacement.triggerY,
                left: SCREEN_EDGE_INSET,
                right: windowWidth - menuPlacement.triggerX + LEADING_GAP,
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  alignSelf: "flex-start",
                  maxWidth: menuPlacement.menuMaxWidth,
                  minWidth: MENU_MIN_WIDTH,
                }}
              >
                {menuPanel}
              </View>
              <View
                style={{
                  height: menuPlacement.triggerHeight,
                  justifyContent: "center",
                }}
              >
                <MenuArrowRight surfaceColor={native.surface.raised} />
              </View>
            </View>
          ) : menuPlacement?.kind === "below" ? (
            <View
              style={{
                position: "absolute",
                top: menuPlacement.y,
                left: menuPlacement.x,
                width: menuPlacement.width,
                overflow: "visible",
              }}
            >
              <MenuArrowUp
                left={menuPlacement.arrowLeft}
                surfaceColor={native.surface.raised}
              />
              {menuPanel}
            </View>
          ) : null}
        </Button>
      </Modal>
    </>
  );
}
