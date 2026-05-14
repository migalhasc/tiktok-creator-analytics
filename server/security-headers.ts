import type { ServerResponse } from "node:http";

export const approvedFrameAncestors = ["'self'", "https://ifp.blankschool.com.br"] as const;

export function buildFrameAncestorsPolicy() {
  return `frame-ancestors ${approvedFrameAncestors.join(" ")}`;
}

export function buildSecurityHeaders() {
  return {
    "Content-Security-Policy": buildFrameAncestorsPolicy(),
    "X-Content-Type-Options": "nosniff",
  } as const;
}

export function applySecurityHeaders(res: ServerResponse) {
  const headers = buildSecurityHeaders();

  for (const [headerName, headerValue] of Object.entries(headers)) {
    res.setHeader(headerName, headerValue);
  }
}
