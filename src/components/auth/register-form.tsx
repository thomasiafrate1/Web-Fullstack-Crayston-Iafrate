"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { completeOnboardingAction } from "@/actions/auth";
import { createClient } from "@/lib/supabase/browser";
import type { AppRole } from "@/types/database";

type RegisterFormProps = {
  hasSession: boolean;
  userEmail?: string | null;
  inviteToken?: string;
};

const ROLE_OPTIONS: Array<{ value: AppRole; label: string }> = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Owner" },
];

const needsSignupCode = (role: AppRole) => role === "admin" || role === "owner";

export const RegisterForm = ({ hasSession, userEmail, inviteToken }: RegisterFormProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("member");
  const [isPending, startTransition] = useTransition();
  const [isOAuthPending, setIsOAuthPending] = useState(false);
  const router = useRouter();

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
      const supabase = createClient();

      const fullName = String(formData.get("fullName") ?? "").trim();
      const organizationName = String(formData.get("organizationName") ?? "").trim();
      const roleFromForm = String(formData.get("role") ?? "member") as AppRole;
      const signupCode = String(formData.get("signupCode") ?? "").trim();

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

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setErrorMessage("Session introuvable. Reconnectez-vous puis recommencez.");
        return;
      }

      const result = await completeOnboardingAction(
        inviteToken
          ? {
              fullName,
              inviteToken,
              accessToken: session.access_token,
            }
          : {
              fullName,
              organizationName,
              desiredRole: roleFromForm,
              signupCode,
              accessToken: session.access_token,
            },
      );

      if (!result.ok) {
        setErrorMessage(result.error ?? "Onboarding impossible.");
        return;
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

  const onSwitchAccount = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <form action={onSubmit} className="rf-card mx-auto w-full max-w-xl space-y-4 p-6 md:p-7">
      <div>
        <h1 className="rf-page-title text-3xl font-semibold">
          {hasSession ? "Finaliser l'onboarding" : "Inscription"}
        </h1>
        <p className="mt-2 text-sm text-[var(--rf-text-muted)]">
          {inviteToken
            ? "Cette inscription est liee a une invitation existante."
            : "Choisissez votre role et configurez votre organisation."}
        </p>
      </div>

      {hasSession ? (
        <div className="rounded-md border border-[var(--rf-border)] bg-[#141821] p-3 text-sm text-[var(--rf-text-muted)]">
          <p>
            Vous etes deja connecte{userEmail ? ` avec ${userEmail}` : ""}. Les champs email et
            mot de passe ne s'affichent plus dans ce mode.
          </p>
          <button
            type="button"
            className="rf-btn rf-btn-outline mt-3"
            onClick={onSwitchAccount}
          >
            Changer de compte
          </button>
        </div>
      ) : null}

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
              placeholder="Repetez le mot de passe"
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
          <div className="rounded-md border border-[var(--rf-border)] bg-[#141821] px-3 py-3 text-sm text-[var(--rf-text-muted)]">
            Le role et l&apos;organisation viennent de votre invitation.
          </div>
        )}
      </div>

      {!inviteToken ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="role" className="rf-label">
              Role souhaite
            </label>
            <select
              id="role"
              name="role"
              className="rf-select"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as AppRole)}
            >
              {ROLE_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {needsSignupCode(selectedRole) ? (
            <div>
              <label htmlFor="signupCode" className="rf-label">
                Code {selectedRole}
              </label>
              <input
                id="signupCode"
                name="signupCode"
                type="password"
                className="rf-input"
                required
                placeholder={`Entrez le code ${selectedRole}`}
              />
            </div>
          ) : (
            <div className="rounded-md border border-[var(--rf-border)] bg-[#141821] px-3 py-3 text-sm text-[var(--rf-text-muted)]">
              Le role member est accessible sans code.
            </div>
          )}
        </div>
      ) : null}

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
