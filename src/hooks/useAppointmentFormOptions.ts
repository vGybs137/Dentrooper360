import { Q } from "@nozbe/watermelondb";
import { useEffect, useState } from "react";

import database from "@/database";
import type AppointmentType from "@/database/models/AppointmentType";
import type Location from "@/database/models/Location";
import type { PatientCardData } from "@/helpers/patientDisplay";

import { useActivePatients } from "./useActivePatients";

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

export function useAppointmentFormOptions(patientSearch = "") {
  const {
    patients,
    allPatients,
    isLoading: patientsLoading,
    error: patientsError,
  } = useActivePatients(patientSearch);

  const [types, setTypes] = useState<AppointmentTypeOption[]>([]);
  const [locations, setLocations] = useState<AppointmentLocationOption[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<Error | null>(null);

  useEffect(() => {
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
  }, []);

  return {
    patients,
    allPatients,
    types,
    locations,
    isLoading: patientsLoading || typesLoading || locationsLoading,
    error: patientsError ?? optionsError,
  };
}

export type AppointmentFormOptions = ReturnType<typeof useAppointmentFormOptions>;
