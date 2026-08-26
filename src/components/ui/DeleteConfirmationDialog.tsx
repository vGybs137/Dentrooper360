import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeTokens } from "@/theme";

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
  const theme = useThemeTokens();
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
        <Pressable
          accessibilityLabel="Dismiss confirmation"
          accessibilityRole="button"
          className="absolute inset-0"
          onPress={confirming ? undefined : onCancel}
          style={{
            backgroundColor: `rgba(0,0,0,${theme.semantic.opacity.scrim})`,
          }}
        />

        <View
          style={{
            marginHorizontal: theme.semantic.space.inline.default,
            marginBottom:
              theme.semantic.space.stack.compact + Math.max(insets.bottom, 0),
            paddingHorizontal: theme.semantic.space.inline.comfortable,
            paddingTop: theme.semantic.space.section,
            paddingBottom: theme.semantic.space.section,
            backgroundColor: theme.palette.surface.raised,
            borderRadius: theme.semantic.radius.dialog,
            gap: theme.semantic.space.stack.default,
          }}
        >
          <ThemedText
            align="center"
            style={{ fontWeight: theme.primitives.fontWeight.semibold }}
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
            style={{ gap: theme.semantic.space.gap.default }}
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
