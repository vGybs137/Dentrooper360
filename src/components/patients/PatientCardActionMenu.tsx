import { useCallback, useMemo, useState } from "react";

import {
  ActionMenu,
  DeleteConfirmationDialog,
  ThemedIcon,
} from "@/components/ui";
import { addAppointmentIcon, deleteIcon, editIcon, ellipsisIcon } from "@/constants";
import database from "@/database";
import type Patient from "@/database/models/Patient";
import type { PatientCardData } from "@/helpers/patientDisplay";
import { requestSync } from "@/helpers/requestSync";
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

  const handleConfirmDelete = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    void (async () => {
      try {
        await database.write(async () => {
          const record = await database
            .get<Patient>("patients")
            .find(patient.id);
          await record.update((entry) => {
            entry.isActive = false;
          });
        });
        requestSync();
        setDeleteVisible(false);
      } catch {
        setIsDeleting(false);
      }
    })();
  }, [isDeleting, patient.id]);

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
    </>
  );
}
