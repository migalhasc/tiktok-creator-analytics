import { describe, expect, it } from "vitest";
import {
  TikTokInfrastructureError,
  TikTokProviderError,
  translateProviderError,
} from "../../server/domain/provider-errors.ts";

describe("translateProviderError", () => {
  it("maps provider rate limits to PT-BR messaging", () => {
    const translated = translateProviderError(
      new TikTokProviderError({
        code: "RATE_LIMITED",
        message: "rate limited",
        status: 429,
        retryable: true,
      }),
    );

    expect(translated.httpStatus).toBe(429);
    expect(translated.publicMessage).toContain("Muitas tentativas");
  });

  it("maps infrastructure failures to a temporary-unavailable message", () => {
    const translated = translateProviderError(
      new TikTokInfrastructureError({
        message: "supabase route missing",
      }),
    );

    expect(translated.httpStatus).toBe(503);
    expect(translated.publicMessage).toContain("temporariamente indisponível");
  });
});
