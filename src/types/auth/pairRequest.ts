export type PairRequest = {
  customerId?: string | null;
  deviceId: string;
  deviceName?: string | null;
  platform?: string | null;
  version?: string | null;
  xApiKey: string;
};
