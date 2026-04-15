import { requireAppContext } from "@/lib/auth/session";
import BillingClient from "@/components/billing/billingclient";
import { formatDate } from "@/lib/utils";

export default async function BillingPage() {
  const { supabase, profile } = await requireAppContext();

  // 🔥 DEBUG IMPORTANT
  console.log("🔥 PROFILE FULL:", profile);
  console.log("🔥 USER ID:", profile.id);
  console.log("🔥 ORG ID:", profile.org_id);

  // 🔥 ON RÉCUPÈRE TOUTES LES SUBSCRIPTIONS DE L’ORG
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("org_id", profile.org_id);

  console.log("🧾 SUBSCRIPTIONS RAW RESULT:", subscriptions);
  console.log("❌ SUBSCRIPTIONS ERROR:", error);

  // 🔥 on prend la dernière subscription si elle existe
  const subscription =
    subscriptions && subscriptions.length > 0
      ? subscriptions[0]
      : null;

  console.log("🟢 PICKED SUBSCRIPTION:", subscription);

  // 🔥 org data
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, plan")
    .eq("id", profile.org_id)
    .single();

  console.log("🟡 ORGANIZATION:", organization);

  // 🔥 PLAN FINAL (PRIORITÉ SUBSCRIPTION STRIPE)
  const plan =
    subscription?.plan ||
    organization?.plan ||
    "free";

  const renewsAt = subscription?.renews_at;

  const isPro = plan === "pro";

  console.log("🔥 FINAL PLAN:", plan);
  console.log("🔥 RENEW DATE:", renewsAt);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <header>
        <h1 className="rf-page-title text-3xl font-semibold">
          Facturation
        </h1>
        <p className="rf-subtitle mt-2">
          Gère ton abonnement et tes paiements
        </p>
      </header>

      {/* PLAN CARD */}
      <section className="rf-card p-6">
        <div className="flex items-start justify-between gap-6">

          {/* LEFT INFO */}
          <div>
            <p className="text-lg font-semibold">
              Plan actuel
            </p>

            <h2 className="mt-2 text-5xl font-bold capitalize">
              {plan}
            </h2>

            <p className="mt-2 text-xl text-gray-500">
              {isPro ? "24.99 € / mois" : "0 € / mois"}
            </p>

            <p className="mt-5 text-sm text-gray-500">
              Mensuel :{" "}
              {renewsAt ? formatDate(renewsAt) : "—"}
            </p>

            <p className="text-xs text-gray-400">
              Paiement automatique via Stripe
            </p>
          </div>

          {/* RIGHT BUTTON (DYNAMIQUE) */}
          {isPro ? (
            <button className="rf-btn rf-btn-outline cursor-pointer">
              Se désabonner
            </button>
          ) : (
            <BillingClient
              userId={profile.id}
              orgId={profile.org_id}
              plan={plan}
            />
          )}

        </div>
      </section>

      {/* STRIPE PORTAL */}
      <section className="rf-card p-6 flex items-start justify-between">
        <div>
          <h2 className="rf-section-title">
            Portail client Stripe
          </h2>
          <p className="mt-2 text-gray-500">
            Gère ta carte, tes factures et ton abonnement
          </p>
        </div>

        <button className="rf-btn rf-btn-outline cursor-pointer">
          Ouvrir le portail
        </button>
      </section>

    </div>
  );
}