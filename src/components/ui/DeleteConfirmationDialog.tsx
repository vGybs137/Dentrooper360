import { Modal, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNativeColors } from "@/theme";
import { primitives, semantic } from "@/tokens";

import { Button } from "./Button";
import { ThemedText } from "./ThemedText";

export const DELETE_CONFIRMATION_TITLE = "Delete";
export const DELETE_CONFIRMATION_MESSAGE =
  "Are you sure you want to delete this.";

export type DeleteConfirmationDialogProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** Defaults to the shared generic copy. */
  title?: string;
  /** Defaults to the shared generic copy. */
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  /** Label while `confirming` is true. Defaults to "Deleting...". */
  confirmingLabel?: string;
  /** Disables actions while a delete is in progress. */
  confirming?: boolean;
};

export function DeleteConfirmationDialog({
  visible,
  onCancel,
  onConfirm,
  title = DELETE_CONFIRMATION_TITLE,
  message = DELETE_CONFIRMATION_MESSAGE,
  cancelLabel = "Cancel",
  confirmLabel = "Yes, delete",
  confirmingLabel = "Deleting...",
  confirming = false,
}: DeleteConfirmationDialogProps) {
  const native = useNativeColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View className="flex-1 justify-end">
        <Button
          accessibilityLabel="Dismiss confirmation"
          className="absolute inset-0 rounded-none"
          onPress={confirming ? undefined : onCancel}
          ripple={false}
          size="none"
          style={{
            backgroundColor: `rgba(0,0,0,${semantic.opacity.scrim})`,
          }}
          tone="neutral"
          variant="ghost"
        />

        <View
          style={{
            marginHorizontal: semantic.space.inline.default,
            marginBottom:
              semantic.space.stack.compact + Math.max(insets.bottom, 0),
            paddingHorizontal: semantic.space.inline.comfortable,
            paddingTop: semantic.space.section,
            paddingBottom: semantic.space.section,
            backgroundColor: native.surface.raised,
            borderRadius: semantic.radius.dialog,
            gap: semantic.space.stack.default,
          }}
        >
          <ThemedText
            align="center"
            style={{ fontWeight: primitives.fontWeight.semibold }}
            tone="alert"
            variant="title"
          >
            {title}
          </ThemedText>

          <ThemedText align="center" variant="body">
            {message}
          </ThemedText>

          <View
            className="flex-row"
            style={{ gap: semantic.space.gap.default }}
          >
            <Button
              className="min-w-0 flex-1"
              disabled={confirming}
              label={cancelLabel}
              onPress={onCancel}
              tone="brand"
              variant="soft"
            />
            <Button
              className="min-w-0 flex-1"
              disabled={confirming}
              label={confirming ? confirmingLabel : confirmLabel}
              onPress={onConfirm}
              tone="brand"
              variant="solid"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
