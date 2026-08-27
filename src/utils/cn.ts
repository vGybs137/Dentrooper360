import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge<"tint">({
  extend: {
    classGroups: {
      "font-size": [{ text: ["label", "body", "title", "display"] }],
      "text-color": [
        {
          text: [
            "foreground-default",
            "foreground-muted",
            "foreground-inverse",
            "brand-default",
            "brand-text",
            "accent-default",
            "accent-text",
            "success-default",
            "success-text",
            "alert-default",
            "alert-text",
          ],
        },
      ],
      "bg-color": [
        {
          bg: [
            "surface-default",
            "surface-sunken",
            "surface-raised",
            "surface-overlay",
            "surface-inverse",
            "brand-default",
            "brand-subtle",
            "accent-default",
            "accent-subtle",
            "success-default",
            "success-subtle",
            "alert-default",
            "alert-subtle",
            "calendar-default",
            "calendar-muted",
            "calendar-quickAdd",
          ],
        },
      ],
      "border-color": [
        {
          border: [
            "border-subtle",
            "border-default",
            "border-strong",
            "border-focus",
            "brand-default",
            "accent-default",
            "success-default",
            "alert-default",
            "foreground-default",
          ],
        },
      ],
      "border-w": [{ border: ["subtle", "strong", "focus"] }],
      rounded: [{ rounded: ["control", "card", "overlay", "dialog", "pill"] }],
      "min-h": [{ "min-h": ["control", "control-sm", "control-lg", "touch"] }],
      "p": [{ p: ["inset", "inset-compact", "inset-comfortable"] }],
      "px": [{ px: ["inline", "inline-compact", "inline-comfortable"] }],
      gap: [{ gap: ["gap", "gap-compact", "gap-comfortable"] }],
      tint: [
        {
          tint: [
            "foreground-default",
            "foreground-muted",
            "foreground-inverse",
            "brand-default",
            "accent-default",
            "success-default",
            "alert-default",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
