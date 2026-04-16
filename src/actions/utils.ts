"use server";

// Imports pour la gestion des contextes actions serveur
import { createClient } from "@/lib/supabase/server";
import { isOwner, isOperationalManager } from "@/lib/auth/roles";
import type { AppRole } from "@/types/database";

// Type contenant les informations de contexte pour les actions
export type ActionContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string;
  orgId: string;
  role: AppRole;
  fullName: string | null;
};

// Récupère le contexte utilisateur authentifié avec ses données de profil
const fetchContext = async (): Promise<ActionContext> => {
  const supabase = await createClient();

  // Récupération de l'utilisateur actuel
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    throw new Error("Session invalide.");
  }

  // Récupération du profil utilisateur avec ses rôles et organisation
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, org_id, role, email, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.org_id) {
    throw new Error("Profil organisation introuvable.");
  }

  // Retour du contexte complet
  return {
    supabase,
    userId: user.id,
    email: profile.email || user.email,
    orgId: profile.org_id,
    role: profile.role,
    fullName: profile.full_name,
  };
};

// Récupère le contexte et vérifie que l'utilisateur a au minimum le rôle manager
export const requireManagerContext = async () => {
  const context = await fetchContext();
  if (!isOperationalManager(context.role)) {
    throw new Error("Action reservee aux roles admin et owner.");
  }
  return context;
};

// Récupère le contexte et vérifie que l'utilisateur est propriétaire de l'organisation
export const requireOwnerContext = async () => {
  const context = await fetchContext();
  if (!isOwner(context.role)) {
    throw new Error("Action reservee au owner.");
  }
  return context;
};

// Récupère simplement le contexte sans restrictions de rôle
export const requireMemberContext = async () => fetchContext();

// Enregistre un événement dans l'audit trail pour la traçabilité
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
