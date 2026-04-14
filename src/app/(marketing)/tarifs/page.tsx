import Link from "next/link";

const PLANS = [
  {
    name: "Gratuit",
    price: "0 EUR",
    description: "Pour tester ReviewFlow avec un petit volume.",
    features: ["1 organisation", "Jusqu'a 200 contacts", "Dashboard de base"],
  },
  {
    name: "Pro",
    price: "99 EUR / mois",
    description: "Pour les PME qui veulent piloter leur reputation en continu.",
    features: ["Membres illimites", "Priorite support", "Preparation IA avis"],
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <main className="rf-fade-up py-12">
      <div className="rf-shell space-y-10">
        <header className="text-center">
          <p className="rf-badge">Tarifs V2</p>
          <h1 className="rf-page-title mt-4 text-4xl font-semibold">
            Un plan clair pour chaque etape de croissance
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-1)]">
            La page est statique en V2, avec une architecture deja prete pour Stripe.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`rf-card p-6 ${
                plan.highlight ? "border-[var(--brand-500)] ring-2 ring-[var(--ring-1)]" : ""
              }`}
            >
              <h2 className="rf-page-title text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-xl font-semibold">{plan.price}</p>
              <p className="mt-2 text-sm text-[var(--text-1)]">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-1)]">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <Link className="rf-btn rf-btn-primary mt-6 w-full" href="/register">
                Choisir {plan.name}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
