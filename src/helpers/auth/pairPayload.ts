import type { PairRequest } from "../../types/auth/pairRequest";
import type { PairResponse } from "../../types/auth/pairResponse";
import { canonicalCustomerId } from "./customerId";

export type WirePairResponse = {
  device_id: string;
  customer_id: string;
  paired_at: string;
  pair_kind: "first" | "additional";
  device_api_key?: string;
};

export function mapPairResponse(response: WirePairResponse): PairResponse {
  return {
    deviceId: response.device_id,
    customerId:
      canonicalCustomerId(response.customer_id) ?? response.customer_id,
    pairedAt: new Date(response.paired_at),
    pairKind: response.pair_kind,
  };
}

export function toPairPayload(request: PairRequest) {
  return {
    customer_id: request.customerId,
    product_id: request.productId,
    device_id: request.deviceId,
    device_name: request.deviceName,
    platform: request.platform,
    version: request.version,
  };
}
