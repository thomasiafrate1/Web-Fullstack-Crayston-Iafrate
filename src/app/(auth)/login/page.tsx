import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next ?? "/dashboard";

  return (
    <section className="space-y-5">
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
