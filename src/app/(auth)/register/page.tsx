import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { getSessionContext } from "@/lib/auth/session";

type RegisterPageProps = {
  searchParams: Promise<{ invite?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const { user, profile } = await getSessionContext();

  if (user && profile?.org_id) {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto w-full max-w-xl space-y-5">
      <RegisterForm hasSession={Boolean(user)} inviteToken={params.invite} />
      <p className="text-center text-sm text-[var(--text-1)]">
        Deja inscrit ?{" "}
        <Link href="/login" className="font-semibold text-[var(--brand-600)] underline">
          Se connecter
        </Link>
      </p>
    </section>
  );
}
