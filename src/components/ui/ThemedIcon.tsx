import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { semantic, type ThemePalette } from "@/tokens";
import { useNativeColors } from "@/theme";

type IconTone =
  | "default"
  | "muted"
  | "inverse"
  | "brand"
  | "accent"
  | "success"
  | "alert";

type IconSize = "sm" | "md" | "lg";

const ICON_SIZE: Record<IconSize, number> = {
  sm: semantic.size["icon-sm"],
  md: semantic.size.icon,
  lg: semantic.size["icon-lg"],
};

export type ThemedIconProps = Omit<SymbolViewProps, "size"> & {
  className?: string;
  tone?: IconTone;
  size?: IconSize;
  /** Pixel size when sm/md/lg tokens are not enough (avatars, badges). */
  dimension?: number;
};

function tintForTone(palette: ThemePalette, tone: IconTone) {
  switch (tone) {
    case "muted":
      return palette.foreground.muted;
    case "inverse":
      return palette.foreground.inverse;
    case "brand":
      return palette.brand.default;
    case "accent":
      return palette.accent.default;
    case "success":
      return palette.success.DEFAULT;
    case "alert":
      return palette.alert.DEFAULT;
    default:
      return palette.foreground.default;
  }
}

/** SymbolView cannot take a className tint — hex is resolved here only. */
export function ThemedIcon({
  tone = "default",
  size = "md",
  className: _className,
  tintColor,
  dimension,
  ...props
}: ThemedIconProps) {
  const palette = useNativeColors();

  return (
    <SymbolView
      {...props}
      size={dimension ?? ICON_SIZE[size]}
      tintColor={tintColor ?? tintForTone(palette, tone)}
    />
  );
}
