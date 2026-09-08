import { View } from "react-native";

import { Button } from "@/components/ui/Button";
import {
  ThemedIcon,
  type ThemedIconProps,
} from "@/components/ui/ThemedIcon";
import { ThemedText } from "@/components/ui/ThemedText";
import { cn } from "@/helpers/ui/cn";

export const EMPTY_STATE_ICON_SIZE = 72;
const EMPTY_STATE_GLYPH_SIZE = 32;

export type EmptyStateAction = {
  label: string;
  onPress: () => void;
};

export type EmptyStateProps = {
  icon: NonNullable<ThemedIconProps["name"]>;
  title: string;
  description?: string;
  action?: EmptyStateAction | null;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <View
      className={cn(
        "flex-1 items-center justify-center gap-stack px-page py-section",
        className,
      )}
    >
      <View
        className="items-center justify-center rounded-full bg-brand-subtle"
        style={{
          width: EMPTY_STATE_ICON_SIZE,
          height: EMPTY_STATE_ICON_SIZE,
        }}
      >
        <ThemedIcon dimension={EMPTY_STATE_GLYPH_SIZE} name={icon} tone="brand" />
      </View>

      <View className="items-center gap-stack-compact">
        <ThemedText align="center" className="font-semibold" variant="body">
          {title}
        </ThemedText>
        {description ? (
          <ThemedText align="center" tone="muted" variant="body">
            {description}
          </ThemedText>
        ) : null}
      </View>

      {action ? (
        <Button
          className="mt-stack-compact min-w-[160px]"
          label={action.label}
          onPress={action.onPress}
          tone="brand"
          variant="solid"
        />
      ) : null}
    </View>
  );
}
