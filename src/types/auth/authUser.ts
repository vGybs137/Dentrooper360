export type AuthUser = {
  id: string;
  customerId: string | null;
  fullName: string;
  email: string | null;
  currencySymbol: string | null;
  color: number | null;
  syncScope: string | null;
  scopeVersion: number | null;
};
