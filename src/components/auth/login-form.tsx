"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/browser";

type LoginFormProps = {
  nextPath?: string;
};

export const LoginForm = ({ nextPath = "/dashboard" }: LoginFormProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isOAuthPending, setIsOAuthPending] = useState(false);
  const router = useRouter();

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", nextPath);
    return callbackUrl.toString();
  }, [nextPath]);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      setErrorMessage(null);
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      router.push(nextPath);
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
    <form action={onSubmit} className="rf-card mx-auto w-full max-w-md space-y-4 p-6 md:p-7">
      <div>
        <h1 className="rf-page-title text-3xl font-semibold">Connexion</h1>
        <p className="mt-2 text-sm text-[var(--text-1)]">
          Connectez-vous pour acceder a votre organisation.
        </p>
      </div>

      <div>
        <label htmlFor="email" className="rf-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rf-input"
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
          required
          className="rf-input"
          autoComplete="current-password"
          placeholder="Votre mot de passe"
        />
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-[#efc3c0] bg-[#fff4f4] px-3 py-2 text-sm text-[var(--danger-500)]">
          {errorMessage}
        </p>
      ) : null}

      <button className="rf-btn rf-btn-primary w-full" type="submit" disabled={isPending}>
        {isPending ? "Connexion..." : "Se connecter"}
      </button>

      <button
        className="rf-btn rf-btn-outline w-full"
        type="button"
        disabled={isOAuthPending}
        onClick={onGoogleClick}
      >
        {isOAuthPending ? "Redirection..." : "Continuer avec Google"}
      </button>
    </form>
  );
};
