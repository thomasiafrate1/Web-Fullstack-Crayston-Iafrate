import Link from "next/link";

import { AppShell } from "@/components/app/app-shell";
import { requireSessionContext } from "@/lib/auth/session";

export default async function ProductLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile } = await requireSessionContext();

  if (!profile?.org_id || !profile.organizations) {
    return (
      <main className="rf-fade-up py-10">
        <div className="rf-shell">
          <section className="rf-card mx-auto max-w-xl space-y-4 p-7 text-center">
            <h1 className="rf-page-title text-2xl font-semibold">Onboarding incomplet</h1>
            <p className="text-[var(--text-1)]">
              Votre compte existe mais n&apos;est pas encore rattache a une organisation.
            </p>
            <div>
              <Link href="/register" className="rf-btn rf-btn-primary">
                Finaliser l&apos;inscription
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <AppShell
      user={{
        fullName: profile.full_name,
        email: user.email ?? profile.email,
        organizationName: profile.organizations.name,
        plan: profile.organizations.plan,
      }}
    >
      {children}
    </AppShell>
  );
}
