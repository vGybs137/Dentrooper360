import { useEffect, useState } from "react";

import database from "@/database";
import type AppointmentType from "@/database/models/AppointmentType";
import type Location from "@/database/models/Location";
import type { PatientCardData } from "@/helpers/patients/patientDisplay";

import { useActivePatients } from "@/hooks/patients/useActivePatients";

export type AppointmentPatientOption = PatientCardData;

export type AppointmentTypeOption = {
  id: string;
  name: string;
  color: string | null;
};

export type AppointmentLocationOption = {
  id: string;
  name: string;
};

type UseAppointmentFormOptionsArgs = {
  patientSearch?: string;
  /** Load patients (search list). Types/locations load whenever `enabled`. */
  loadPatients?: boolean;
  enabled?: boolean;
};

export function useAppointmentFormOptions({
  patientSearch = "",
  loadPatients = true,
  enabled = true,
}: UseAppointmentFormOptionsArgs = {}) {
  const {
    patients,
    allPatients,
    isLoading: patientsLoading,
    error: patientsError,
  } = useActivePatients(patientSearch, {
    enabled: enabled && loadPatients,
  });

  const [types, setTypes] = useState<AppointmentTypeOption[]>([]);
  const [locations, setLocations] = useState<AppointmentLocationOption[]>([]);
  const [typesLoading, setTypesLoading] = useState(enabled);
  const [locationsLoading, setLocationsLoading] = useState(enabled);
  const [optionsError, setOptionsError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setTypesLoading(false);
      setLocationsLoading(false);
      return;
    }

    setTypesLoading(true);
    setLocationsLoading(true);

    const typesQuery = database.get<AppointmentType>("appointment_types").query();
    const locationsQuery = database.get<Location>("locations").query();

    const typesSub = typesQuery.observe().subscribe({
      next: (records) => {
        setTypes(
          records
            .map((type) => ({
              id: type.id,
              name: type.nameEn,
              color: type.color,
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setTypesLoading(false);
        setOptionsError(null);
      },
      error: (err) => {
        setOptionsError(err instanceof Error ? err : new Error(String(err)));
        setTypesLoading(false);
      },
    });

    const locationsSub = locationsQuery.observe().subscribe({
      next: (records) => {
        setLocations(
          records
            .map((location) => ({
              id: location.id,
              name: location.nameEn,
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setLocationsLoading(false);
        setOptionsError(null);
      },
      error: (err) => {
        setOptionsError(err instanceof Error ? err : new Error(String(err)));
        setLocationsLoading(false);
      },
    });

    return () => {
      typesSub.unsubscribe();
      locationsSub.unsubscribe();
    };
  }, [enabled]);

  return {
    patients,
    allPatients,
    types,
    locations,
    isLoading:
      (loadPatients && patientsLoading) || typesLoading || locationsLoading,
    patientsLoading,
    error: patientsError ?? optionsError,
  };
}

export type AppointmentFormOptions = ReturnType<typeof useAppointmentFormOptions>;
