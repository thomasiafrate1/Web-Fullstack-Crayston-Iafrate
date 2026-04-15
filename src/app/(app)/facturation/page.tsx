import BillingClient from "@/components/billing/billingclient";
import { requireAppContext } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export default async function BillingPage() {
  const { supabase, profile } = await requireAppContext();

  // Suite à pas mal de problèmes, on ajoute des logs pour voir si on les récupère bien
  console.log("PROFILE FULL:", profile);
  console.log("USER ID:", profile.id);
  console.log("ORG ID:", profile.org_id);

  // On récupère tous les abonnements dans la table "subscriptions"
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("org_id", profile.org_id);

  console.log("SUBSCRIPTIONS RAW RESULT:", subscriptions);
  console.log("SUBSCRIPTIONS ERROR:", error);

  // On prend la dernière subscription si elle existe
  const subscription =
    subscriptions && subscriptions.length > 0
      ? subscriptions[0]
      : null;

  console.log("PICKED SUBSCRIPTION:", subscription);

  // On récupère les infos de l'organisation pour avoir le plan par défaut
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, plan")
    .eq("id", profile.org_id)
    .single();

  console.log("ORGANIZATION:", organization);

  // On prend d'abord le plan de Stripe (subscription), sinon l'org, sinon on reste en free
  const plan =
    subscription?.plan ||
    organization?.plan ||
    "free";

  // On récupère la date de renouvellement de l'abonnement + le plan = pro (=== pour vérif même valeur ET même type)
  const renewsAt = subscription?.renews_at;
  const isPro = plan === "pro";

  // Logs pour debug
  console.log("FINAL PLAN:", plan);
  console.log("RENEW DATE:", renewsAt);

  return (
    <div className="space-y-6">

      {/* Titre et description de la page facturation */}
      <header>
        <h1 className="rf-page-title text-3xl font-semibold">Facturation</h1>
        <p className="rf-subtitle mt-2">Gere ton abonnement et tes paiements</p>
      </header>

      {/* Affiche le plan actuel avec le prix et la date de renouvellement */}
      <section className="rf-card p-6">
        <div className="flex items-start justify-between gap-6">

          {/* Les infos du plan à gauche */}
          <div>
            <p className="text-lg font-semibold">Plan actuel</p>
            <h2 className="mt-2 text-5xl font-bold capitalize">{plan}</h2>
            <p className="mt-2 text-xl text-gray-500">{isPro ? "24.99 EUR / mois" : "0 EUR / mois"}</p>
            <p className="mt-5 text-sm text-gray-500">Mensuel : {renewsAt ? formatDate(renewsAt) : "-"}</p>
            <p className="text-xs text-gray-400">Paiement automatique via Stripe</p>
          </div>

          {/* Bouton pour se désabonner si en pro, sinon composant pour upgrade */}
          {isPro ? (
            <button className="rf-btn rf-btn-outline cursor-pointer">Se desabonner</button>
          ) : (
            <BillingClient userId={profile.id} orgId={profile.org_id} plan={plan} />
          )}
        </div>
      </section>

      {/* Lien vers le portail Stripe pour gérer la facturation */}
      <section className="rf-card p-6 flex items-start justify-between">
        <div>
          <h2 className="rf-section-title">Portail client Stripe</h2>
          <p className="mt-2 text-gray-500">Gere ta carte, tes factures et ton abonnement</p>
        </div>

        <button className="rf-btn rf-btn-outline cursor-pointer">Ouvrir le portail</button>
      </section>
    </div>
  );
}
