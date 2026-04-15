"use server";

import { createHash, randomBytes } from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env, hasServiceRoleKey } from "@/lib/env";
import { slugify } from "@/lib/utils";
import type { AppRole, InviteRole } from "@/types/database";

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

const createUserClientWithAccessToken = (accessToken: string) =>
  createSupabaseClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

const normalizeDesiredRole = (value: string | undefined): AppRole => {
  if (value === "owner" || value === "admin" || value === "member") {
    return value;
  }
  return "member";
};

const validateSignupCodeForRole = (
  role: AppRole,
  signupCode: string,
): ActionResult | null => {
  if (role === "member") {
    return null;
  }

  if (role === "admin") {
    if (!env.adminSignupCode) {
      return { ok: false, error: "Code admin non configure sur le serveur." };
    }
    if (signupCode !== env.adminSignupCode) {
      return { ok: false, error: "Code admin invalide." };
    }
    return null;
  }

  if (!env.ownerSignupCode) {
    return { ok: false, error: "Code owner non configure sur le serveur." };
  }
  if (signupCode !== env.ownerSignupCode) {
    return { ok: false, error: "Code owner invalide." };
  }
  return null;
};

const isFunctionMissingError = (error: { code?: string; message?: string } | null) => {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "PGRST202" || message.includes("could not find the function");
};

export const completeOnboardingAction = async (payload: {
  fullName?: string;
  organizationName?: string;
  inviteToken?: string;
  desiredRole?: string;
  signupCode?: string;
  accessToken?: string;
}): Promise<ActionResult> => {
  try {
    const supabase = await createClient();
    const accessToken = (payload.accessToken ?? "").trim();
    const userClient = accessToken ? createUserClientWithAccessToken(accessToken) : supabase;
    const {
      data: { user },
      error: userError,
    } = accessToken
      ? await userClient.auth.getUser(accessToken)
      : await userClient.auth.getUser();

    if (userError || !user || !user.email) {
      return { ok: false, error: "Session invalide. Reconnectez-vous puis recommencez." };
    }

    const fullName = (payload.fullName ?? "").trim() || null;
    const inviteToken = (payload.inviteToken ?? "").trim();
    const desiredRole = normalizeDesiredRole(payload.desiredRole);
    const signupCode = (payload.signupCode ?? "").trim();
    const normalizedEmail = user.email.toLowerCase();

    if (inviteToken) {
      const tokenHash = createHash("sha256").update(inviteToken).digest("hex");
      const db = hasServiceRoleKey() ? createAdminClient() : userClient;

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

    const roleValidation = validateSignupCodeForRole(desiredRole, signupCode);
    if (roleValidation) {
      return roleValidation;
    }

    const slug = buildUniqueSlug(orgName);
    const { data: bootstrapOrgId, error: bootstrapError } = await userClient.rpc(
      "bootstrap_organization",
      {
        org_name: orgName,
        org_slug: slug,
        user_email: normalizedEmail,
        user_full_name: fullName,
        desired_role: desiredRole,
      },
    );

    if (!bootstrapError && typeof bootstrapOrgId === "string" && bootstrapOrgId) {
      await supabase.auth.updateUser({
        data: { full_name: fullName ?? undefined },
      });

      revalidatePath("/");
      revalidatePath("/dashboard");
      return { ok: true };
    }

    if (bootstrapError && !isFunctionMissingError(bootstrapError)) {
      if (bootstrapError.message?.includes("AUTH_REQUIRED")) {
        return { ok: false, error: "Session invalide. Reconnectez-vous puis recommencez." };
      }
      if (bootstrapError.message?.includes("ORG_NAME_REQUIRED")) {
        return { ok: false, error: "Le nom de l'organisation est requis." };
      }
      if (bootstrapError.message?.includes("EMAIL_REQUIRED")) {
        return { ok: false, error: "Email utilisateur introuvable pour l'onboarding." };
      }
      return { ok: false, error: bootstrapError.message };
    }

    // Legacy fallback for projects where the SQL function is not deployed yet.
    const db = hasServiceRoleKey() ? createAdminClient() : userClient;

    const { data: organization, error: orgError } = await db
      .from("organizations")
      .insert({
        name: orgName,
        slug,
      })
      .select("id")
      .single();

    if (orgError || !organization) {
      if (orgError?.message?.toLowerCase().includes("row-level security policy")) {
        return {
          ok: false,
          error:
            "Creation organisation bloquee par RLS. Applique la migration SQL qui ajoute la fonction bootstrap_organization (ou configure SUPABASE_SERVICE_ROLE_KEY).",
        };
      }
      const message =
        orgError?.message ??
        "Creation organisation impossible. Verifiez que le schema SQL V2 est applique.";
      return { ok: false, error: message };
    }

    const { error: profileError } = await db.from("profiles").upsert({
      id: user.id,
      email: normalizedEmail,
      full_name: fullName,
      role: desiredRole,
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
