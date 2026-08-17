import type { MobilePullRequest, MobilePullResponse, MobilePushRequest } from "@/types/sync";

import { mapPullChanges, toPullPayload, toPushPayload, type WireMobilePullResponse } from "@/helpers/sync";
import { httpClient } from "../httpClient";
import { SYNC_MOBILE_PULL_PATH, SYNC_MOBILE_PUSH_PATH } from "@/constants/sync";

export async function pullChanges(
  request: MobilePullRequest,
): Promise<MobilePullResponse> {
  const response = await httpClient.post<WireMobilePullResponse>(
    SYNC_MOBILE_PULL_PATH,
    toPullPayload(request),
  );

  return {
    timestamp: response.data.timestamp,
    changes: mapPullChanges(response.data.changes),
  };
}

export async function pushChanges(request: MobilePushRequest): Promise<void> {
  await httpClient.post(SYNC_MOBILE_PUSH_PATH, toPushPayload(request));
}
