import { TRPCError } from "@trpc/server";

const requestLog = new Map<string, number[]>();

export function assertWithinRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = (requestLog.get(key) ?? []).filter((timestamp) => timestamp >= cutoff);

  if (bucket.length >= limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Muitas tentativas em sequência. Aguarde um instante e tente de novo.",
    });
  }

  bucket.push(now);
  requestLog.set(key, bucket);
}
