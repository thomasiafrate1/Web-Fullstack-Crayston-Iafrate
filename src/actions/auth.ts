"use server";

import { createHash, randomBytes } from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasServiceRoleKey } from "@/lib/env";
import { slugify } from "@/lib/utils";
import type { InviteRole } from "@/types/database";

type InviteLookup = {
  id: string;
  org_id: string;
  email: string;
  role: InviteRole;
  status: string;
  expires_at: string;
};

type ActionResult = {
  ok: boolean;
  error?: string;
  inviteLink?: string;
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Une erreur inattendue est survenue.";
};

const buildUniqueSlug = (orgName: string) => {
  const base = slugify(orgName) || "organization";
  return `${base}-${randomBytes(3).toString("hex")}`;
};

export const completeOnboardingAction = async (payload: {
  fullName?: string;
  organizationName?: string;
  inviteToken?: string;
}): Promise<ActionResult> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return { ok: false, error: "Session invalide. Reconnectez-vous puis recommencez." };
    }

    const fullName = (payload.fullName ?? "").trim() || null;
    const inviteToken = (payload.inviteToken ?? "").trim();
    const normalizedEmail = user.email.toLowerCase();

    if (inviteToken) {
      const tokenHash = createHash("sha256").update(inviteToken).digest("hex");
      const db = hasServiceRoleKey() ? createAdminClient() : supabase;

      const inviteResult = await db
        .from("organization_invites")
        .select("id, org_id, email, role, status, expires_at")
        .eq("token_hash", tokenHash)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      const invite = inviteResult.data as InviteLookup | null;
      const inviteError = inviteResult.error;

      if (inviteError || !invite) {
        return { ok: false, error: "Invitation invalide, expiree ou deja utilisee." };
      }

      if (invite.email.toLowerCase() !== normalizedEmail) {
        return {
          ok: false,
          error: "Cette invitation est liee a une autre adresse email.",
        };
      }

      const { error: profileError } = await db.from("profiles").upsert({
        id: user.id,
        email: normalizedEmail,
        full_name: fullName,
        role: invite.role as InviteRole,
        org_id: invite.org_id,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        return { ok: false, error: profileError.message };
      }

      await db
        .from("organization_invites")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invite.id);

      await supabase.auth.updateUser({
        data: { full_name: fullName ?? undefined },
      });

      revalidatePath("/");
      revalidatePath("/dashboard");
      return { ok: true };
    }

    const orgName = (payload.organizationName ?? "").trim();
    if (!orgName) {
      return { ok: false, error: "Le nom de l'organisation est requis." };
    }

    const slug = buildUniqueSlug(orgName);

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: orgName,
        slug,
      })
      .select("id")
      .single();

    if (orgError || !organization) {
      const message =
        orgError?.message ??
        "Creation organisation impossible. Verifiez que le schema SQL V2 est applique.";
      return { ok: false, error: message };
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: normalizedEmail,
      full_name: fullName,
      role: "owner",
      org_id: organization.id,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      return { ok: false, error: profileError.message };
    }

    await supabase.auth.updateUser({
      data: { full_name: fullName ?? undefined },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
};
