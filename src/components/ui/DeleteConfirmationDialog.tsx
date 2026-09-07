import { useCallback, useEffect, useState } from "react";
import { Modal, View } from "react-native";

import { semantic } from "@/tokens";

import { BottomSheet } from "./BottomSheet";
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
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  const handleExitComplete = useCallback(() => {
    setMounted(false);
  }, []);

  const handleDismiss = useCallback(() => {
    if (confirming) {
      return;
    }
    onCancel();
  }, [confirming, onCancel]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
      transparent
      visible={mounted}
    >
      <View className="flex-1 justify-end">
        <Button
          accessibilityLabel="Dismiss confirmation"
          className="absolute inset-0 rounded-none"
          onPress={handleDismiss}
          ripple={false}
          size="none"
          style={{
            backgroundColor: `rgba(0,0,0,${semantic.opacity.scrim})`,
          }}
          tone="neutral"
          variant="ghost"
        />

        <BottomSheet
          animated
          onExitComplete={handleExitComplete}
          space="default"
          variant="stack"
          visible={visible}
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

          <ThemedView
            className="flex-row"
            direction="row"
            space="default"
            variant="stack"
          >
            <Button
              className="min-w-0 flex-1"
              disabled={confirming}
              label={cancelLabel}
              onPress={handleDismiss}
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
        </BottomSheet>
      </View>
    </Modal>
  );
}
