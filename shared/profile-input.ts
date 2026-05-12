const usernamePattern = /^[A-Za-z0-9._-]+$/;
const profilePathPattern = /^\/@([A-Za-z0-9._-]+)\/?$/;

export class InvalidProfileInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidProfileInputError";
  }
}

export type NormalizedProfileInput = {
  rawInput: string;
  username: string;
  profileUrl: string;
};

export function normalizeProfileInput(input: string): NormalizedProfileInput {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new InvalidProfileInputError("Informe um username ou link de perfil do TikTok.");
  }

  if (trimmed.includes("://")) {
    return normalizeProfileUrl(trimmed);
  }

  const sanitizedUsername = trimmed.replace(/^@/, "");
  if (!usernamePattern.test(sanitizedUsername)) {
    throw new InvalidProfileInputError("Use apenas username do perfil ou a URL pública do perfil.");
  }

  return {
    rawInput: input,
    username: sanitizedUsername.toLowerCase(),
    profileUrl: buildProfileUrl(sanitizedUsername),
  };
}

export function normalizeProfileUrl(inputUrl: string): NormalizedProfileInput {
  let url: URL;
  try {
    url = new URL(inputUrl);
  } catch {
    throw new InvalidProfileInputError("A URL informada não é válida.");
  }

  const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
  if (hostname !== "tiktok.com") {
    throw new InvalidProfileInputError("Use uma URL pública do TikTok.");
  }

  const match = url.pathname.match(profilePathPattern);
  if (!match) {
    throw new InvalidProfileInputError("Use o link do perfil, não o link de vídeo ou outro formato.");
  }

  return {
    rawInput: inputUrl,
    username: match[1].toLowerCase(),
    profileUrl: buildProfileUrl(match[1]),
  };
}

export function buildProfileUrl(username: string): string {
  return `https://www.tiktok.com/@${username.replace(/^@/, "").toLowerCase()}`;
}
