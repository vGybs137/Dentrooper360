import { View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ThemedIcon } from "@/components/ui/ThemedIcon";
import { chevronUpIcon } from "@/constants/icons";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

export type ScrollToTopButtonProps = {
  onPress: () => void;
  visible: boolean;
};

/** Floating pill used on entity list screens after scrolling past threshold. */
export function ScrollToTopButton({ onPress, visible }: ScrollToTopButtonProps) {
  const native = useNativeColors();

  if (!visible) {
    return null;
  }

  return (
    <View
      className="absolute inset-x-0 z-10 items-center"
      pointerEvents="box-none"
      style={{ top: semantic.space.stack.compact }}
    >
      <Button
        accessibilityLabel="Scroll to top"
        className="size-control-lg items-center justify-center rounded-pill shadow-sm"
        onPress={onPress}
        size="none"
        style={{
          backgroundColor: native.surface.raised,
          borderColor: native.border.subtle,
          borderWidth: semantic.borderWidth.subtle,
        }}
        tone="neutral"
        variant="ghost"
      >
        <ThemedIcon dimension={22} name={chevronUpIcon} tone="brand" />
      </Button>
    </View>
  );
}
