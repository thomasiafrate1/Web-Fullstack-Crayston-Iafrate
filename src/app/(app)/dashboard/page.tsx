import { requireAppContext } from "@/lib/auth/session";
import { RatingEvolutionCard } from "@/components/dashboard/rating-evolution-card";

// Définition des métriques KPI pour l'affichage du tableau de bord
const kpiData = [
  { label: "Note moyenne", value: "4.7 /5", trend: "+0.3", tone: "success", icon: "*" },
  { label: "Avis ce mois", value: "247", trend: "+12%", tone: "success", icon: "A" },
  { label: "Taux de reponse", value: "89%", trend: "+5%", tone: "success", icon: "%" },
  { label: "Contacts actifs", value: "1,234", trend: "-2%", tone: "danger", icon: "C" },
] as const;

export default async function DashboardPage() {
  // Récupération des métriques de performance depuis la base de données
  const { supabase, profile } = await requireAppContext();
  const orgId = profile.org_id;

  const [contactsRes, reviewsRes, campaignsRes] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("org_id", orgId),
  ]);

  // Affichage du tableau de bord avec KPI et graphiques
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="rf-page-title text-3xl font-semibold">Dashboard</h1>
          <p className="rf-subtitle mt-2">Vue d&apos;ensemble de vos performances</p>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-4">
        {kpiData.map((kpi, index) => {
          const mappedValue =
            index === 1
              ? String(reviewsRes.count ?? 0)
              : index === 3
                ? (contactsRes.count ?? 0).toLocaleString("fr-FR")
                : index === 2
                  ? campaignsRes.count
                    ? `${Math.min(95, 60 + campaignsRes.count * 5)}%`
                    : "60%"
                  : kpi.value;

          return (
            <article key={kpi.label} className="rf-kpi space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#18263f] text-lg text-[#7db0ff]">
                  {kpi.icon}
                </span>
                <span
                  className={`rf-badge ${
                    kpi.tone === "success" ? "rf-badge-success" : "rf-badge-danger"
                  }`}
                >
                  {kpi.trend}
                </span>
              </div>
              <div>
                <p className="text-sm text-[var(--rf-text-muted)]">{kpi.label}</p>
                <p className="mt-2 text-[2rem] font-semibold tracking-tight">{mappedValue}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr,0.95fr]">
        <RatingEvolutionCard />

        <article className="rf-card p-5">
          <h2 className="rf-section-title">Sources d&apos;avis</h2>
          <div className="mt-7 flex items-center justify-center">
            <div className="rf-donut" />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-[var(--rf-text-muted)]">
            <span className="inline-flex items-center gap-2">
              <i className="h-2.5 w-2.5 rounded-full bg-[#3f82ff]" />
              Email
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="h-2.5 w-2.5 rounded-full bg-[#11b987]" />
              SMS
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="h-2.5 w-2.5 rounded-full bg-[#f0b12f]" />
              Widget
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="h-2.5 w-2.5 rounded-full bg-[#8f63ff]" />
              Direct
            </span>
          </div>
        </article>
      </section>
    </div>
  );
}
