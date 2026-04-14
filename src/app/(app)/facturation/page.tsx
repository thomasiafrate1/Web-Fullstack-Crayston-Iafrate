import Link from "next/link";

import { canAccessBilling } from "@/lib/auth/roles";
import { requireAppContext } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export default async function BillingPage() {
  const { supabase, profile } = await requireAppContext();
  const ownerAccess = canAccessBilling(profile.role);

  const [organizationRes, subscriptionRes] = await Promise.all([
    supabase.from("organizations").select("id, name, plan").eq("id", profile.org_id).single(),
    supabase
      .from("subscriptions")
      .select("plan, status, renews_at, provider")
      .eq("org_id", profile.org_id)
      .maybeSingle(),
  ]);

  if (!ownerAccess) {
    return (
      <section className="rf-card p-6">
        <h1 className="rf-page-title text-3xl font-semibold">Facturation</h1>
        <p className="mt-2 text-[var(--rf-text-muted)]">
          Cette page est reservee au owner de l&apos;organisation.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="rf-page-title text-3xl font-semibold">Facturation</h1>
        <p className="rf-subtitle mt-2">Gerez votre abonnement et vos factures</p>
      </header>

      <section className="rf-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Plan actuel</p>
            <h2 className="rf-page-title mt-2 text-5xl font-semibold capitalize">
              {subscriptionRes.data?.plan || organizationRes.data?.plan || "free"}
            </h2>
            <p className="mt-2 text-2xl text-[var(--rf-text-muted)]">29 EUR / mois</p>
          </div>
          <Link className="rf-btn rf-btn-primary" href="/tarifs">
            Upgrader vers Pro
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-[var(--rf-text-muted)]">Avis ce mois-ci</p>
            <div className="mt-2 h-2 rounded-full bg-[#1f2634]">
              <div className="h-2 w-[50%] rounded-full bg-[var(--rf-primary)]" />
            </div>
            <p className="mt-2 text-lg font-semibold">250 / 500 avis</p>
          </div>
          <div>
            <p className="text-sm text-[var(--rf-text-muted)]">Utilisateurs</p>
            <div className="mt-2 h-2 rounded-full bg-[#1f2634]">
              <div className="h-2 w-[33%] rounded-full bg-[var(--rf-primary)]" />
            </div>
            <p className="mt-2 text-lg font-semibold">1 / 3 utilisateurs</p>
          </div>
          <div>
            <p className="text-sm text-[var(--rf-text-muted)]">Prochain renouvellement</p>
            <p className="mt-3 text-lg font-semibold">
              {formatDate(subscriptionRes.data?.renews_at || null)}
            </p>
            <p className="text-sm text-[var(--rf-text-muted)]">Prelevement automatique</p>
          </div>
        </div>
      </section>

      <section className="rf-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="rf-section-title">Portail client Stripe</h2>
            <p className="mt-2 text-[var(--rf-text-muted)]">
              Accedez a votre portail pour modifier votre moyen de paiement et gerer votre abonnement.
            </p>
          </div>
          <button className="rf-btn rf-btn-outline">Ouvrir le portail</button>
        </div>
      </section>
    </div>
  );
}
