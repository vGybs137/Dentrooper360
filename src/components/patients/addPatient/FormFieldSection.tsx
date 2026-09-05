import { type ReactNode } from "react";
import { View } from "react-native";

import { ThemedIcon, ThemedText } from "@/components/ui";
import type { ThemedIconProps } from "@/components/ui";
import { cn } from "@/utils/cn";

type FormFieldSectionProps = {
  icon: NonNullable<ThemedIconProps["name"]>;
  title: string;
  children: ReactNode;
  className?: string;
};

export function FormFieldSection({
  icon,
  title,
  children,
  className,
}: FormFieldSectionProps) {
  return (
    <View className={cn("w-full gap-gap-compact", className)}>
      <View className="flex-row items-center gap-3">
        <View className="size-5 shrink-0 items-center justify-center">
          <ThemedIcon dimension={20} name={icon} tone="muted" />
        </View>
        <ThemedText className="font-semibold" variant="label">
          {title}
        </ThemedText>
      </View>
      <View className="min-w-0 flex-1 gap-gap-compact pl-8">{children}</View>
    </View>
  );
}

export function FormDivider({ className }: { className?: string }) {
  return <View className={cn("h-px w-full bg-border-subtle", className)} />;
}
