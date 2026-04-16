"use server";

import { createHash, randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import {
  logAuditEvent,
  requireManagerContext,
  requireOwnerContext,
} from "@/actions/utils";
import { canInvite, canManageMemberRecord } from "@/lib/auth/roles";
import type { InviteRole } from "@/types/database";

type ActionResult = { ok: boolean; error?: string; inviteLink?: string };

// Met à jour le nom, slug et plan d'une organisation
export const updateOrganizationAction = async (
  formData: FormData,
): Promise<void> => {
  try {
    const context = await requireOwnerContext();
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
    const plan = String(formData.get("plan") ?? "").trim();

    if (!name || !slug) {
      return;
    }

    const { error } = await context.supabase
      .from("organizations")
      .update({
        name,
        slug,
        plan: ["free", "pro"].includes(plan) ? plan : "free",
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.orgId);

    if (error) {
      console.error("updateOrganizationAction error:", error.message);
      return;
    }

    await logAuditEvent(context, "organization.update", "organization", context.orgId, {
      name,
      slug,
      plan,
    });

    revalidatePath("/parametres");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("updateOrganizationAction exception:", error);
  }
};

// Génère un lien d'invitation pour un nouveau membre
export const inviteMemberAction = async (formData: FormData): Promise<ActionResult> => {
  try {
    const context = await requireManagerContext();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const role = String(formData.get("role") ?? "member") as InviteRole;

    if (!email) {
      return { ok: false, error: "Email requis pour l'invitation." };
    }

    if (role !== "admin" && role !== "member") {
      return { ok: false, error: "Role d'invitation invalide." };
    }

    if (!canInvite(context.role, role)) {
      return { ok: false, error: "Vous n'avez pas les droits pour inviter ce role." };
    }

    const rawToken = randomBytes(24).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    const { data, error } = await context.supabase
      .from("organization_invites")
      .upsert(
        {
          org_id: context.orgId,
          email,
          role,
          token_hash: tokenHash,
          status: "pending",
          invited_by: context.userId,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "token_hash",
        },
      )
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Creation invitation impossible." };
    }

    await logAuditEvent(context, "invite.create", "invite", data.id, {
      email,
      role,
    });

    revalidatePath("/parametres");
    return {
      ok: true,
      inviteLink: `/register?invite=${rawToken}`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invitation impossible.",
    };
  }
};

// Annule une invitation en attente d'acceptation
export const revokeInviteAction = async (formData: FormData): Promise<void> => {
  try {
    const context = await requireManagerContext();
    const inviteId = String(formData.get("inviteId") ?? "").trim();
    if (!inviteId) {
      return;
    }

    const { data: invite, error: inviteError } = await context.supabase
      .from("organization_invites")
      .select("id, role")
      .eq("id", inviteId)
      .eq("org_id", context.orgId)
      .single();

    if (inviteError || !invite) {
      return;
    }

    if (!canInvite(context.role, invite.role)) {
      return;
    }

    const { error } = await context.supabase
      .from("organization_invites")
      .update({
        status: "revoked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", inviteId)
      .eq("org_id", context.orgId);

    if (error) {
      console.error("revokeInviteAction error:", error.message);
      return;
    }

    await logAuditEvent(context, "invite.revoke", "invite", inviteId);
    revalidatePath("/parametres");
  } catch (error) {
    console.error("revokeInviteAction exception:", error);
  }
};

// Modifie le rôle d'un membre
export const updateMemberRoleAction = async (
  formData: FormData,
): Promise<void> => {
  try {
    const context = await requireOwnerContext();
    const targetUserId = String(formData.get("targetUserId") ?? "").trim();
    const targetRole = String(formData.get("targetRole") ?? "").trim();

    if (!targetUserId || !["admin", "member"].includes(targetRole)) {
      return;
    }

    const { data: targetProfile, error: targetError } = await context.supabase
      .from("profiles")
      .select("id, role")
      .eq("id", targetUserId)
      .eq("org_id", context.orgId)
      .single();

    if (targetError || !targetProfile) {
      return;
    }

    if (targetProfile.role === "owner") {
      return;
    }

    const { error } = await context.supabase
      .from("profiles")
      .update({
        role: targetRole as "admin" | "member",
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId)
      .eq("org_id", context.orgId);

    if (error) {
      console.error("updateMemberRoleAction error:", error.message);
      return;
    }

    await logAuditEvent(context, "member.role.update", "profile", targetUserId, {
      role: targetRole,
    });

    revalidatePath("/parametres");
  } catch (error) {
    console.error("updateMemberRoleAction exception:", error);
  }
};

// Supprime un membre de l'organisation
export const removeMemberAction = async (formData: FormData): Promise<void> => {
  try {
    const context = await requireManagerContext();
    const targetUserId = String(formData.get("targetUserId") ?? "").trim();
    if (!targetUserId) {
      return;
    }

    const { data: targetProfile, error: targetError } = await context.supabase
      .from("profiles")
      .select("id, role")
      .eq("id", targetUserId)
      .eq("org_id", context.orgId)
      .single();

    if (targetError || !targetProfile) {
      return;
    }

    if (
      !canManageMemberRecord(
        context.role,
        targetProfile.role,
        targetProfile.id,
        context.userId,
      )
    ) {
      return;
    }

    const { error } = await context.supabase
      .from("profiles")
      .update({
        org_id: null,
        role: "member",
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId)
      .eq("org_id", context.orgId);

    if (error) {
      console.error("removeMemberAction error:", error.message);
      return;
    }

    await logAuditEvent(context, "member.remove", "profile", targetUserId);
    revalidatePath("/parametres");
  } catch (error) {
    console.error("removeMemberAction exception:", error);
  }
};
