"use client";

import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | undefined;

export const createClient = () => {
  if (!client) {
    client = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return client;
};
