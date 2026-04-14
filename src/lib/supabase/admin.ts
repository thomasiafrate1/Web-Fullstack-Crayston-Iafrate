import { createClient } from "@supabase/supabase-js";

import { env, hasServiceRoleKey } from "@/lib/env";

let adminClient: ReturnType<typeof createClient> | null = null;

export const createAdminClient = () => {
  if (!hasServiceRoleKey()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations are disabled.",
    );
  }

  if (!adminClient) {
    adminClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
};
