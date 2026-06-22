export const config = {
  // Empty = same-origin requests proxied by Next.js rewrites (avoids CORS in dev)
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  defaultPageSize: 50,
  maxPageSize: 100,
} as const;

function resolveApiOrigin(): string {
  if (config.apiBaseUrl) return config.apiBaseUrl;
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
}

export function getApiBaseUrl(): string {
  return resolveApiOrigin();
}
