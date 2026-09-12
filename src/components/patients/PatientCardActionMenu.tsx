import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, View } from "react-native";

import {
  FeedbackOverlay,
  type FeedbackOverlayProps,
} from "@/components/app/FeedbackOverlay";
import {
  ActionMenu,
  DeleteConfirmationDialog,
  ThemedIcon,
} from "@/components/ui";
import { addAppointmentIcon, deleteIcon, editIcon, ellipsisIcon } from "@/constants";
import type { PatientCardData } from "@/helpers/patients/patientDisplay";
import { deletePatientAndRelated } from "@/helpers/patients/deletePatient";
import { requestSync } from "@/helpers/sync/requestSync";
import { useAddAppointmentStore, useAddPatientStore } from "@/stores";

type PatientCardActionMenuProps = {
  patient: PatientCardData;
};

export function PatientCardActionMenu({ patient }: PatientCardActionMenuProps) {
  const { t } = useTranslation(["patients", "common", "errors", "a11y"]);
  const openWithPatient = useAddAppointmentStore(
    (state) => state.openWithPatient,
  );
  const openForEdit = useAddPatientStore((state) => state.openForEdit);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] =
    useState<FeedbackOverlayProps | null>(null);

  const handleEdit = useCallback(() => {
    openForEdit(patient.id);
  }, [openForEdit, patient.id]);

  const handleAddAppointment = useCallback(() => {
    openWithPatient(patient);
  }, [openWithPatient, patient]);

  const handleDelete = useCallback(() => {
    setDeleteVisible(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setDeleteVisible(false);
  }, [isDeleting]);

  const dismissDeleteFeedback = useCallback(() => {
    setDeleteFeedback(null);
    setIsDeleting(false);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteVisible(false);
    setDeleteFeedback({
      stage: "loading",
      title: t("patients:details.deletingTitle"),
      message: t("patients:details.deletingMessage"),
    });

    void (async () => {
      try {
        await deletePatientAndRelated(patient.id);
        requestSync();
        setDeleteFeedback({
          stage: "success",
          title: t("patients:details.deletedTitle"),
          message: t("patients:details.deletedMessage"),
          continueLabel: t("common:actions.done"),
          onContinue: dismissDeleteFeedback,
        });
      } catch (err) {
        setIsDeleting(false);
        setDeleteFeedback({
          stage: "error",
          title: t("errors:delete.unable"),
          message:
            err instanceof Error
              ? err.message
              : t("errors:generic.pleaseTryAgain"),
          retryLabel: t("common:actions.ok"),
          onRetry: dismissDeleteFeedback,
          onDismiss: dismissDeleteFeedback,
        });
      }
    })();
  }, [dismissDeleteFeedback, isDeleting, patient.id, t]);

  const items = useMemo(
    () => [
      {
        key: "edit",
        label: t("common:actions.edit"),
        icon: <ThemedIcon dimension={20} name={editIcon} tone="muted" />,
        onPress: handleEdit,
      },
      {
        key: "add-appointment",
        label: t("patients:menu.addAppointment"),
        icon: <ThemedIcon dimension={20} name={addAppointmentIcon} tone="muted" />,
        onPress: handleAddAppointment,
      },
      {
        key: "delete",
        label: t("common:actions.delete"),
        icon: <ThemedIcon dimension={20} name={deleteIcon} tone="alert" />,
        tone: "alert" as const,
        onPress: handleDelete,
      },
    ],
    [handleAddAppointment, handleDelete, handleEdit, t],
  );

  return (
    <>
      <ActionMenu
        accessibilityLabel={t("a11y:actionsForPatient", { name: patient.displayName })}
        items={items}
        trigger={({ open }) => (
          <ThemedIcon
            dimension={22}
            name={ellipsisIcon}
            tone={open ? "brand" : "muted"}
          />
        )}
      />

      <DeleteConfirmationDialog
        confirming={isDeleting}
        message={t("patients:details.deleteMessage", {
          name: patient.displayName,
        })}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={t("patients:details.deleteTitle")}
        visible={deleteVisible}
      />

      {deleteFeedback ? (
        <Modal
          animationType="fade"
          statusBarTranslucent
          transparent
          visible
        >
          <View className="flex-1">
            <FeedbackOverlay {...deleteFeedback} />
          </View>
        </Modal>
      ) : null}
    </>
  );
}
