import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  type Edge,
} from "react-native-safe-area-context";

import { semantic } from "@/tokens";
import { cn } from "@/helpers/ui/cn";

import { ThemedText } from "./ThemedText";

const themedViewVariants = cva("", {
  variants: {
    variant: {
      box: "",
      stack: "",
      container: "w-full self-center",
      card: "",
      chip: "self-start items-center rounded-pill px-inline-compact py-stack-compact",
      screen: "flex-1",
    },
    surface: {
      default: "bg-surface-default",
      sunken: "bg-surface-sunken",
      raised: "bg-surface-raised",
      overlay: "bg-surface-overlay",
      inverse: "bg-surface-inverse",
    },
    borderTone: {
      none: "border-0",
      subtle: "border-subtle border-border-subtle",
      default: "border-subtle border-border-default",
      strong: "border-subtle border-border-strong",
      focus: "border-subtle border-border-focus",
    },
    radius: {
      none: "rounded-none",
      control: "rounded-control",
      card: "rounded-card",
      overlay: "rounded-overlay",
      dialog: "rounded-dialog",
      pill: "rounded-pill",
    },
    inset: {
      none: "",
      compact: "p-inset-compact",
      default: "p-inset",
      comfortable: "p-inset-comfortable",
    },
    direction: {
      column: "flex-col",
      row: "flex-row",
    },
    space: {
      compact: "gap-gap-compact",
      default: "gap-gap",
      comfortable: "gap-gap-comfortable",
    },
    tone: {
      default: "bg-surface-sunken",
      muted: "bg-surface-sunken",
      brand: "bg-brand-subtle",
      accent: "bg-accent-subtle",
      success: "bg-success-subtle",
      alert: "bg-alert-subtle",
    },
  },
  compoundVariants: [
    {
      variant: "container",
      inset: "compact",
      class: "px-inline-compact",
    },
    {
      variant: "container",
      inset: "default",
      class: "px-inline",
    },
    {
      variant: "container",
      inset: "comfortable",
      class: "px-inline-comfortable",
    },
  ],
  defaultVariants: {
    variant: "box",
    borderTone: "none",
    radius: "none",
    inset: "none",
  },
});

export type ThemedViewHeader = {
  title: string;
  eyebrow?: string;
  description?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

export type ThemedViewProps = ViewProps &
  VariantProps<typeof themedViewVariants> & {
    className?: string;
    style?: StyleProp<ViewStyle>;
    align?: ViewStyle["alignItems"];
    justify?: ViewStyle["justifyContent"];
    scroll?: boolean;
    padBottom?: boolean;
    bottomInset?: number;
    edges?: Edge[];
    contentClassName?: string;
    contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
    header?: ThemedViewHeader;
    keyboardAvoiding?: boolean;
    transparent?: boolean;
    /** Rendered above the screen, outside SafeArea (floating chrome). */
    overlay?: React.ReactNode;
  };

function screenInsetClass(
  inset: ThemedViewProps["inset"],
) {
  if (inset === "none") return "";
  if (inset === "compact") return "px-inline-compact";
  if (inset === "comfortable") return "px-inline-comfortable";
  return "px-inline";
}

function ScreenHeader({ header }: { header: ThemedViewHeader }) {
  return (
    <View className="gap-gap-compact">
      {header.leading || header.trailing ? (
        <View className="flex-row items-center justify-between">
          {header.leading}
          {header.trailing}
        </View>
      ) : null}
      {header.eyebrow ? (
        <ThemedText tone="brand" variant="label">
          {header.eyebrow}
        </ThemedText>
      ) : null}
      <ThemedText variant="display">{header.title}</ThemedText>
      {header.description ? (
        <ThemedText tone="muted">{header.description}</ThemedText>
      ) : null}
    </View>
  );
}

function ThemedScreen({
  surface = "default",
  scroll = false,
  inset = "default",
  bottomInset = 0,
  padBottom = true,
  edges,
  className,
  contentClassName,
  contentContainerStyle,
  style,
  header,
  keyboardAvoiding = false,
  transparent = false,
  overlay,
  children,
  ...props
}: ThemedViewProps) {
  const bottomPadding = (padBottom ? semantic.space.page : 0) + bottomInset;
  const bodyClass = cn(
    themedViewVariants({
      variant: "screen",
      surface: transparent ? null : surface,
    }),
    className,
  );
  const paddedClass = cn(
    screenInsetClass(inset),
    inset !== "none" && "pt-page",
    contentClassName,
  );
  const headerAndChildren = header ? (
    <View className="gap-gap-comfortable">
      <ScreenHeader header={header} />
      {children}
    </View>
  ) : (
    children
  );

  let body = (
    <SafeAreaView className={bodyClass} edges={edges} style={style} {...props}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn("grow", paddedClass)}
          contentContainerStyle={[
            { paddingBottom: bottomPadding },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {headerAndChildren}
        </ScrollView>
      ) : (
        <View
          className={cn("flex-1", paddedClass)}
          style={{ paddingBottom: bottomPadding }}
        >
          {headerAndChildren}
        </View>
      )}
    </SafeAreaView>
  );

  if (keyboardAvoiding) {
    body = (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        pointerEvents={props.pointerEvents}
      >
        {body}
      </KeyboardAvoidingView>
    );
  }

  if (!overlay) {
    return body;
  }

  return (
    <View className="flex-1">
      {body}
      {overlay}
    </View>
  );
}

export function ThemedView({
  variant = "box",
  surface,
  borderTone = "none",
  radius = "none",
  inset,
  direction,
  space,
  tone = "default",
  align,
  justify,
  className,
  style,
  scroll,
  padBottom,
  bottomInset,
  edges,
  contentClassName,
  contentContainerStyle,
  header,
  keyboardAvoiding,
  transparent,
  overlay,
  ...props
}: ThemedViewProps) {
  if (variant === "screen") {
    return (
      <ThemedScreen
        {...props}
        bottomInset={bottomInset}
        className={className}
        contentClassName={contentClassName}
        contentContainerStyle={contentContainerStyle}
        edges={edges}
        header={header}
        inset={inset ?? "default"}
        keyboardAvoiding={keyboardAvoiding}
        overlay={overlay}
        padBottom={padBottom}
        scroll={scroll}
        style={style}
        surface={surface}
        transparent={transparent}
      />
    );
  }

  const resolvedSurface =
    surface ??
    (variant === "card"
      ? "raised"
      : variant === "chip" || variant === "stack" || variant === "container"
        ? null
        : "default");
  const resolvedRadius =
    radius === "none" && variant === "card" ? "card" : radius;
  const resolvedBorder =
    borderTone === "none" && variant === "card" ? "subtle" : borderTone;
  const resolvedInset =
    inset ??
    (variant === "card" || variant === "container" ? "default" : "none");
  const resolvedDirection =
    variant === "stack" ? (direction ?? "column") : direction;
  const resolvedSpace = variant === "stack" ? (space ?? "default") : space;
  const resolvedTone = variant === "chip" ? tone : null;

  return (
    <View
      className={cn(
        themedViewVariants({
          variant,
          surface: resolvedSurface,
          borderTone: resolvedBorder,
          radius: resolvedRadius,
          inset: variant === "container" ? "none" : resolvedInset,
          direction: resolvedDirection,
          space: resolvedSpace,
          tone: resolvedTone,
        }),
        variant === "container" && resolvedInset === "compact"
          ? "px-inline-compact"
          : null,
        variant === "container" && resolvedInset === "default"
          ? "px-inline"
          : null,
        variant === "container" && resolvedInset === "comfortable"
          ? "px-inline-comfortable"
          : null,
        className,
      )}
      style={
        align || justify || style
          ? [
              align ? { alignItems: align } : null,
              justify ? { justifyContent: justify } : null,
              style,
            ]
          : undefined
      }
      {...props}
    />
  );
}
