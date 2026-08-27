import { Modal, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { semantic } from "@/tokens";

import { Button } from "./Button";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

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

        <ThemedView
          className="mx-inline px-inline-comfortable py-section"
          inset="none"
          radius="dialog"
          space="default"
          style={{
            marginBottom:
              semantic.space.stack.compact + Math.max(insets.bottom, 0),
          }}
          variant="card"
        >
          <ThemedText
            align="center"
            className="font-semibold"
            tone="alert"
            variant="title"
          >
            {title}
          </ThemedText>

          <ThemedText align="center" variant="body">
            {message}
          </ThemedText>

          <ThemedView className="flex-row" space="default" variant="stack" direction="row">
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
          </ThemedView>
        </ThemedView>
      </View>
    </Modal>
  );
}
