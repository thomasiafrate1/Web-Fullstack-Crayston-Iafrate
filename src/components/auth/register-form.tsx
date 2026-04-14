"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { completeOnboardingAction } from "@/actions/auth";
import { createClient } from "@/lib/supabase/browser";

type RegisterFormProps = {
  hasSession: boolean;
  inviteToken?: string;
};

export const RegisterForm = ({ hasSession, inviteToken }: RegisterFormProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isOAuthPending, setIsOAuthPending] = useState(false);
  const router = useRouter();

  const buildOrgSlug = (name: string) => {
    const base = name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base || "organization"}-${suffix}`;
  };

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set(
      "next",
      inviteToken ? `/register?invite=${inviteToken}` : "/register",
    );
    return callbackUrl.toString();
  }, [inviteToken]);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      const fullName = String(formData.get("fullName") ?? "").trim();
      const organizationName = String(formData.get("organizationName") ?? "").trim();

      if (!hasSession) {
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        if (password.length < 8) {
          setErrorMessage("Le mot de passe doit contenir au moins 8 caracteres.");
          return;
        }

        if (password !== confirmPassword) {
          setErrorMessage("Les mots de passe ne correspondent pas.");
          return;
        }

        const supabase = createClient();
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setErrorMessage(signUpError.message);
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setErrorMessage(
            "Compte cree, mais session absente. Connectez-vous puis terminez l'onboarding.",
          );
          return;
        }
      }

      if (inviteToken) {
        const result = await completeOnboardingAction({
          fullName,
          organizationName: undefined,
          inviteToken,
        });

        if (!result.ok) {
          setErrorMessage(result.error ?? "Onboarding impossible.");
          return;
        }
      } else {
        const supabase = createClient();
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !currentUser?.id || !currentUser.email) {
          setErrorMessage("Session invalide. Reconnectez-vous puis recommencez.");
          return;
        }

        if (!organizationName) {
          setErrorMessage("Le nom de l'organisation est requis.");
          return;
        }

        const organizationId = crypto.randomUUID();
        const slug = buildOrgSlug(organizationName);

        const { error: orgError } = await supabase
          .from("organizations")
          .insert({
            id: organizationId,
            name: organizationName,
            slug,
          });

        if (orgError) {
          setErrorMessage(orgError?.message ?? "Creation organisation impossible.");
          return;
        }

        const { error: profileError } = await supabase.from("profiles").upsert({
          id: currentUser.id,
          email: currentUser.email.toLowerCase(),
          full_name: fullName || null,
          role: "owner",
          org_id: organizationId,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          setErrorMessage(profileError.message);
          return;
        }

        await supabase.auth.updateUser({
          data: { full_name: fullName || undefined },
        });
      }

      setSuccessMessage("Votre espace est pret. Redirection...");
      router.push("/dashboard");
      router.refresh();
    });
  };

  const onGoogleClick = async () => {
    setIsOAuthPending(true);
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo || undefined,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsOAuthPending(false);
    }
  };

  return (
    <form action={onSubmit} className="rf-card mx-auto w-full max-w-xl space-y-4 p-6 md:p-7">
      <div>
        <h1 className="rf-page-title text-3xl font-semibold">
          {hasSession ? "Finaliser l&apos;onboarding" : "Inscription"}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-1)]">
          {inviteToken
            ? "Cette inscription est liee a une invitation existante."
            : "Créez une organisation et devenez owner automatiquement."}
        </p>
      </div>

      {!hasSession ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="email" className="rf-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="rf-input"
              required
              autoComplete="email"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="rf-label">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="rf-input"
              required
              autoComplete="new-password"
              placeholder="8 caracteres minimum"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="rf-label">
              Confirmation
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="rf-input"
              required
              autoComplete="new-password"
              placeholder="Répétez le mot de passe"
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="rf-label">
            Nom complet
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            className="rf-input"
            placeholder="Ex: Marie Dupont"
          />
        </div>

        {!inviteToken ? (
          <div>
            <label htmlFor="organizationName" className="rf-label">
              Organisation
            </label>
            <input
              id="organizationName"
              name="organizationName"
              type="text"
              className="rf-input"
              required
              placeholder="Ex: Cafe des Arts"
            />
          </div>
        ) : (
          <div className="rounded-md border border-[var(--border-1)] bg-[var(--bg-soft)] px-3 py-3 text-sm text-[var(--text-1)]">
            Le role et l&apos;organisation viennent de votre invitation.
          </div>
        )}
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-[#efc3c0] bg-[#fff4f4] px-3 py-2 text-sm text-[var(--danger-500)]">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-md border border-[#bde4cb] bg-[#f3fbf7] px-3 py-2 text-sm text-[var(--success-500)]">
          {successMessage}
        </p>
      ) : null}

      <button className="rf-btn rf-btn-primary w-full" type="submit" disabled={isPending}>
        {isPending ? "Traitement..." : "Terminer"}
      </button>

      {!hasSession ? (
        <button
          className="rf-btn rf-btn-outline w-full"
          type="button"
          disabled={isOAuthPending}
          onClick={onGoogleClick}
        >
          {isOAuthPending ? "Redirection..." : "S&apos;inscrire avec Google"}
        </button>
      ) : null}
    </form>
  );
};
