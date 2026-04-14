import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AppRole, TableRow } from "@/types/database";

export type ProfileWithOrg = TableRow<"profiles"> & {
  organizations: Pick<TableRow<"organizations">, "id" | "name" | "slug" | "plan"> | null;
};

export const getSessionContext = async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
        id,
        org_id,
        email,
        full_name,
        role,
        avatar_url,
        last_seen_at,
        created_at,
        updated_at,
        organizations (
          id,
          name,
          slug,
          plan
        )
      `,
    )
    .eq("id", user.id)
    .maybeSingle<ProfileWithOrg>();

  if (profileError) {
    return { supabase, user, profile: null };
  }

  return { supabase, user, profile: profile ?? null };
};

export const requireSessionContext = async () => {
  const context = await getSessionContext();
  if (!context.user) {
    redirect("/login");
  }
  return context;
};

export const requireAppContext = async () => {
  const context = await requireSessionContext();
  if (!context.profile?.org_id) {
    redirect("/register?onboarding=1");
  }
  return context as typeof context & {
    profile: NonNullable<typeof context.profile> & { org_id: string; role: AppRole };
  };
};
