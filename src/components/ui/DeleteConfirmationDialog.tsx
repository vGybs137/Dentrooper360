import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, View } from "react-native";

import { t as translate } from "@/i18n";
import { semantic } from "@/tokens";

import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export const DELETE_CONFIRMATION_TITLE = translate("common:confirm.deleteTitle");
export const DELETE_CONFIRMATION_MESSAGE = translate(
  "common:confirm.deleteMessage",
);

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
  /** Label while `confirming` is true. Defaults to translated "Deleting...". */
  confirmingLabel?: string;
  /** Disables actions while a delete is in progress. */
  confirming?: boolean;
};

export function DeleteConfirmationDialog({
  visible,
  onCancel,
  onConfirm,
  title,
  message,
  cancelLabel,
  confirmLabel,
  confirmingLabel,
  confirming = false,
}: DeleteConfirmationDialogProps) {
  const { t } = useTranslation(["common", "a11y"]);
  const [mounted, setMounted] = useState(visible);
  const resolvedTitle = title ?? t("common:confirm.deleteTitle");
  const resolvedMessage = message ?? t("common:confirm.deleteMessage");
  const resolvedCancelLabel = cancelLabel ?? t("common:actions.cancel");
  const resolvedConfirmLabel = confirmLabel ?? t("common:confirm.yesDelete");
  const resolvedConfirmingLabel =
    confirmingLabel ?? t("common:confirm.deleting");

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
          accessibilityLabel={t("a11y:dismissConfirmation")}
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
            {resolvedTitle}
          </ThemedText>

          <ThemedText align="center" variant="body">
            {resolvedMessage}
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
              label={resolvedCancelLabel}
              onPress={handleDismiss}
              tone="brand"
              variant="soft"
            />
            <Button
              className="min-w-0 flex-1"
              disabled={confirming}
              label={confirming ? resolvedConfirmingLabel : resolvedConfirmLabel}
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
