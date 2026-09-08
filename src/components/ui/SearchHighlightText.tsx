import { useMemo } from "react";
import { Text } from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { splitTextBySearchQuery } from "@/helpers/ui/searchHighlight";

export type SearchHighlightTextProps = {
  className?: string;
  numberOfLines?: number;
  searchQuery?: string;
  text: string;
  tone?: "default" | "muted";
  toneClassName?: string;
  variant?: "body" | "label";
};

/** Themed text that bold-highlights case-insensitive query matches. */
export function SearchHighlightText({
  className,
  numberOfLines,
  searchQuery,
  text,
  tone = "default",
  toneClassName = "text-foreground-default",
  variant = "body",
}: SearchHighlightTextProps) {
  const parts = useMemo(
    () => splitTextBySearchQuery(text, searchQuery ?? ""),
    [searchQuery, text],
  );
  const hasHighlight = Boolean(searchQuery?.trim());
  const sizeClass = variant === "label" ? "text-label" : "text-body";

  if (!hasHighlight) {
    return (
      <ThemedText
        className={className}
        numberOfLines={numberOfLines}
        tone={tone}
        variant={variant}
      >
        {text}
      </ThemedText>
    );
  }

  return (
    <Text
      className={`${sizeClass} ${toneClassName}${className ? ` ${className}` : ""}`}
      numberOfLines={numberOfLines}
    >
      {parts.map((part, index) => (
        <Text
          key={`${part.value}-${index}`}
          className={
            part.highlighted
              ? "font-semibold text-brand-default"
              : toneClassName
          }
        >
          {part.value}
        </Text>
      ))}
    </Text>
  );
}
