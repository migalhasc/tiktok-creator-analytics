import { getServerEnv, type ServerEnv } from "../env";

export type TrpcContext = {
  env: ServerEnv;
  ip: string;
};

function readHeader(headers: Headers, key: string): string | null {
  return headers.get(key) ?? headers.get(key.toLowerCase());
}

export async function createContextFromRequest(request: Request): Promise<TrpcContext> {
  const ip = readHeader(request.headers, "x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  return {
    env: getServerEnv(),
    ip,
  };
}

export async function createContextFromHeaders(input: HeadersInit): Promise<TrpcContext> {
  const headers = new Headers(input);
  const ip = readHeader(headers, "x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  return {
    env: getServerEnv(),
    ip,
  };
}
