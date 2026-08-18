export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  sync: {
    startup: (customerId: string) => ["sync", "startup", customerId] as const,
  },
} as const;
