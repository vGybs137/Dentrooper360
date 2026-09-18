import { Q } from "@nozbe/watermelondb";

import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import type Appointment from "@/database/models/Appointment";
import type Patient from "@/database/models/Patient";
import type Payment from "@/database/models/Payment";
import type Recall from "@/database/models/Recall";
import type Service from "@/database/models/Service";
import { t } from "@/i18n";

export class PatientHasOutstandingBalanceError extends Error {
  constructor() {
    super(t("patients:delete.outstandingBalance"));
    this.name = "PatientHasOutstandingBalanceError";
  }
}

/**
 * Soft-deletes the patient and all linked records (appointments, payments,
 * services, recalls) via WatermelonDB deleted marks for sync push.
 * Throws if the patient has an outstanding (positive) balance.
 */
export async function deletePatientAndRelated(
  patientId: string,
): Promise<void> {
  const database = clinicDatabaseManager.requireActive();
  const patient = await database.get<Patient>("patients").find(patientId);

  if ((patient.balance ?? 0) > 0) {
    throw new PatientHasOutstandingBalanceError();
  }

  await database.write(async () => {
    const [appointments, payments, services, recalls] = await Promise.all([
      database
        .get<Appointment>("appointments")
        .query(Q.where("patient_id", patientId))
        .fetch(),
      database
        .get<Payment>("payments")
        .query(Q.where("patient_id", patientId))
        .fetch(),
      database
        .get<Service>("services")
        .query(Q.where("patient_id", patientId))
        .fetch(),
      database
        .get<Recall>("recalls")
        .query(Q.where("patient_id", patientId))
        .fetch(),
    ]);

    await database.batch(
      patient.prepareMarkAsDeleted(),
      ...appointments.map((record) => record.prepareMarkAsDeleted()),
      ...payments.map((record) => record.prepareMarkAsDeleted()),
      ...services.map((record) => record.prepareMarkAsDeleted()),
      ...recalls.map((record) => record.prepareMarkAsDeleted()),
    );
  });
}
