import BillingClient from "@/components/billing/billingclient";
import { requireAppContext } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export default async function BillingPage() {
  const { supabase, profile } = await requireAppContext();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("org_id", profile.org_id);

  const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, plan")
    .eq("id", profile.org_id)
    .single();

  const plan = subscription?.plan || organization?.plan || "free";
  const renewsAt = subscription?.renews_at;
  const isPro = plan === "pro";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="rf-page-title text-3xl font-semibold">Facturation</h1>
        <p className="rf-subtitle mt-2">Gere ton abonnement et tes paiements</p>
      </header>

      <section className="rf-card p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-lg font-semibold">Plan actuel</p>
            <h2 className="mt-2 text-5xl font-bold capitalize">{plan}</h2>
            <p className="mt-2 text-xl text-gray-500">{isPro ? "24.99 EUR / mois" : "0 EUR / mois"}</p>
            <p className="mt-5 text-sm text-gray-500">Mensuel : {renewsAt ? formatDate(renewsAt) : "-"}</p>
            <p className="text-xs text-gray-400">Paiement automatique via Stripe</p>
          </div>

          {isPro ? (
            <button className="rf-btn rf-btn-outline cursor-pointer">Se desabonner</button>
          ) : (
            <BillingClient userId={profile.id} orgId={profile.org_id} plan={plan} />
          )}
        </div>
      </section>

      <section className="rf-card flex items-start justify-between p-6">
        <div>
          <h2 className="rf-section-title">Portail client Stripe</h2>
          <p className="mt-2 text-gray-500">Gere ta carte, tes factures et ton abonnement</p>
        </div>

        <button className="rf-btn rf-btn-outline cursor-pointer">Ouvrir le portail</button>
      </section>
    </div>
  );
}
