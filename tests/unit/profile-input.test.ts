import { describe, expect, it } from "vitest";
import { InvalidProfileInputError, normalizeProfileInput } from "../../shared/profile-input.ts";

describe("normalizeProfileInput", () => {
  it("normalizes usernames and strips @", () => {
    expect(normalizeProfileInput("@BlankSchool")).toEqual({
      rawInput: "@BlankSchool",
      username: "blankschool",
      profileUrl: "https://www.tiktok.com/@blankschool",
    });
  });

  it("extracts the username from a profile url", () => {
    expect(normalizeProfileInput("https://www.tiktok.com/@Data.Creator?lang=pt-BR").username).toBe("data.creator");
  });

  it("rejects video urls", () => {
    expect(() => normalizeProfileInput("https://www.tiktok.com/@creator/video/123")).toThrow(InvalidProfileInputError);
  });
});
