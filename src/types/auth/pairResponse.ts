export type PairResponse = {
  deviceId: string;
  customerId: string;
  pairedAt: Date;
  pairKind: "first" | "additional";
};
