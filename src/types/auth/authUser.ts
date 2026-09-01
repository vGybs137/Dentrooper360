export type AuthUser = {
  id: string;
  fullName: string;
  email: string | null;
  currencySymbol: string | null;
  color: number | null;
  startingHour: string;
  endingHour: string;
};
