/**
 * @vitest-environment node
 */

import { describe, expect, it } from "vitest";
import { approvedFrameAncestors, buildFrameAncestorsPolicy, buildSecurityHeaders } from "../../server/security-headers";

describe("embed framing policy", () => {
  it("allows the approved member hub host", () => {
    expect(approvedFrameAncestors).toContain("https://ifp.blankschool.com.br");
    expect(buildFrameAncestorsPolicy()).toBe("frame-ancestors 'self' https://ifp.blankschool.com.br");
  });

  it("uses CSP instead of X-Frame-Options", () => {
    const headers = buildSecurityHeaders();

    expect(headers["Content-Security-Policy"]).toBe("frame-ancestors 'self' https://ifp.blankschool.com.br");
    expect("X-Frame-Options" in headers).toBe(false);
  });
});
