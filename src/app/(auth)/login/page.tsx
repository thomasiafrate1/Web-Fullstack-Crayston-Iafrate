import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Extraction de la destination de redirection depuis les paramètres URL
  const params = await searchParams;
  const nextPath = params.next ?? "/dashboard";

  // Affichage du formulaire de connexion avec redirection vers inscription
  return (
    <section className="mx-auto w-full max-w-md space-y-5">
      <LoginForm nextPath={nextPath} />
      <p className="text-center text-sm text-[var(--text-1)]">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-semibold text-[var(--brand-600)] underline">
          Creer un compte
        </Link>
      </p>
    </section>
  );
}
