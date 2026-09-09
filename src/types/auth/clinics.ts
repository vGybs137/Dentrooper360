export type ClinicMembership = {
  customerId: string;
  providerId: string;
  clinicDisplayName: string | null;
  syncScope: string;
  scopeVersion: number;
  isActive: boolean;
};

export type ClinicsList = {
  activeCustomerId: string;
  clinics: ClinicMembership[];
};

export type SwitchClinicRequest = {
  customerId: string;
  refreshToken?: string | null;
};
