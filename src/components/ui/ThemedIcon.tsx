import { cva, type VariantProps } from "class-variance-authority";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { cssInterop } from "nativewind";

import { cn } from "@/utils/cn";

const themedIconVariants = cva("", {
  variants: {
    tone: {
      default: "tint-foreground-default",
      muted: "tint-foreground-muted",
      inverse: "tint-foreground-inverse",
      brand: "tint-brand-default",
      accent: "tint-accent-default",
      success: "tint-success-default",
      alert: "tint-alert-default",
    },
    size: {
      sm: "size-icon-sm",
      md: "size-icon",
      lg: "size-icon-lg",
    },
  },
  defaultVariants: {
    tone: "default",
    size: "md",
  },
});

function SymbolViewBase(props: SymbolViewProps) {
  return <SymbolView {...props} />;
}

const InteropSymbolView = cssInterop(SymbolViewBase, {
  className: {
    target: "style",
    nativeStyleToProp: {
      color: "tintColor",
      width: "size",
    },
  },
});

export type ThemedIconProps = Omit<SymbolViewProps, "size"> &
  VariantProps<typeof themedIconVariants> & {
    className?: string;
  };

export function ThemedIcon({
  tone = "default",
  size = "md",
  className,
  tintColor,
  ...props
}: ThemedIconProps) {
  return (
    <InteropSymbolView
      {...props}
      className={cn(
        themedIconVariants({
          size,
          tone: tintColor == null ? tone : null,
        }),
        className,
      )}
      tintColor={tintColor}
    />
  );
}
