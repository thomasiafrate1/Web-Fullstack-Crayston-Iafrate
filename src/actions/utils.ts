"use server";

import { createClient } from "@/lib/supabase/server";
import { isOwner, isOperationalManager } from "@/lib/auth/roles";
import type { AppRole } from "@/types/database";

export type ActionContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string;
  orgId: string;
  role: AppRole;
  fullName: string | null;
};

const fetchContext = async (): Promise<ActionContext> => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    throw new Error("Session invalide.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, org_id, role, email, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.org_id) {
    throw new Error("Profil organisation introuvable.");
  }

  return {
    supabase,
    userId: user.id,
    email: profile.email || user.email,
    orgId: profile.org_id,
    role: profile.role,
    fullName: profile.full_name,
  };
};

export const requireManagerContext = async () => {
  const context = await fetchContext();
  if (!isOperationalManager(context.role)) {
    throw new Error("Action reservee aux roles admin et owner.");
  }
  return context;
};

export const requireOwnerContext = async () => {
  const context = await fetchContext();
  if (!isOwner(context.role)) {
    throw new Error("Action reservee au owner.");
  }
  return context;
};

export const requireMemberContext = async () => fetchContext();

export const logAuditEvent = async (
  context: ActionContext,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
) => {
  await context.supabase.from("audit_logs").insert({
    org_id: context.orgId,
    actor_id: context.userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
};
