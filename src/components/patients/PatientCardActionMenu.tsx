import { useCallback, useMemo, useState } from "react";
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
      title: "Deleting...",
      message: "Removing this patient and related records.",
    });

    void (async () => {
      try {
        await deletePatientAndRelated(patient.id);
        requestSync();
        setDeleteFeedback({
          stage: "success",
          title: "Patient deleted",
          message: "The patient and related records were removed.",
          continueLabel: "Done",
          onContinue: dismissDeleteFeedback,
        });
      } catch (err) {
        setIsDeleting(false);
        setDeleteFeedback({
          stage: "error",
          title: "Unable to delete",
          message:
            err instanceof Error ? err.message : "Please try again.",
          retryLabel: "OK",
          onRetry: dismissDeleteFeedback,
          onDismiss: dismissDeleteFeedback,
        });
      }
    })();
  }, [dismissDeleteFeedback, isDeleting, patient.id]);

  const items = useMemo(
    () => [
      {
        key: "edit",
        label: "Edit",
        icon: <ThemedIcon dimension={20} name={editIcon} tone="muted" />,
        onPress: handleEdit,
      },
      {
        key: "add-appointment",
        label: "Add appointment",
        icon: <ThemedIcon dimension={20} name={addAppointmentIcon} tone="muted" />,
        onPress: handleAddAppointment,
      },
      {
        key: "delete",
        label: "Delete",
        icon: <ThemedIcon dimension={20} name={deleteIcon} tone="alert" />,
        tone: "alert" as const,
        onPress: handleDelete,
      },
    ],
    [handleAddAppointment, handleDelete, handleEdit],
  );

  return (
    <>
      <ActionMenu
        accessibilityLabel={`Actions for ${patient.displayName}`}
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
        message={`Are you sure you want to delete ${patient.displayName}?`}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete patient"
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
