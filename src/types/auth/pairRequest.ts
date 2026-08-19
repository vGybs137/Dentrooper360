export type PairRequest = {
  customerId?: string | null;
  productId: string;
  deviceId: string;
  deviceName?: string | null;
  platform?: string | null;
  version?: string | null;
  xApiKey: string;
};
