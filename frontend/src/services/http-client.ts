import { ApiError } from "@lib/api-error";
import { getApiBaseUrl } from "@lib/config";
import type { ApiErrorBody } from "@models/product";

interface RequestOptions {
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(path, getApiBaseUrl());

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(buildUrl(path, options.params), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: options.signal,
    cache: "no-store",
  });

  if (!response.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = undefined;
    }

    const message = body?.message ?? body?.error ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  return (await response.json()) as T;
}
