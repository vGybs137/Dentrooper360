import axios from "axios";

import { API_BASE_URL, API_TIMEOUT_MS } from "./config";
import {
  attachAccessToken,
  toRejectedError,
  unwrapEnvelope,
} from "@/helpers/httpClient";

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use(attachAccessToken);
httpClient.interceptors.response.use(unwrapEnvelope, toRejectedError);
