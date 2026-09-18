export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
    clinics: ["auth", "clinics"] as const,
    clinicRegistry: ["auth", "clinic-registry"] as const,
  },
  sync: {
    startup: (customerId: string) => ["sync", "startup", customerId] as const,
  },
} as const;
