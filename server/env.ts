import { z } from "zod";
import { TikTokInfrastructureError } from "./domain/provider-errors";

const serverEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVER_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  BRIGHTDATA_API_TOKEN: z.string().min(1),
  BRIGHTDATA_TIKTOK_PROFILES_DATASET: z.string().min(1).default("gd_l1villgoiiidt09ci"),
  BRIGHTDATA_TIKTOK_POSTS_BY_PROFILE_DATASET: z.string().min(1).default("gd_m7n5v2gq296pex2f5m"),
  BRIGHTDATA_ASYNC_TIMEOUT_MS: z.coerce.number().int().positive().default(600_000),
  BRIGHTDATA_ASYNC_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2_000),
  CACHE_FRESHNESS_HOURS: z.coerce.number().int().positive().default(6),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new TikTokInfrastructureError({
      code: "CONFIGURATION",
      message: `Configuração ausente ou inválida: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
    });
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
