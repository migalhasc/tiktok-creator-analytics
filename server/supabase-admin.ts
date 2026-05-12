import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "./env";

let client: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const env = getServerEnv();
  client = createClient(env.SUPABASE_SERVER_URL ?? env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return client;
}
