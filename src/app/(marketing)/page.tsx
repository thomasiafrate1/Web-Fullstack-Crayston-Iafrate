import Link from "next/link";

import { getSessionContext } from "@/lib/auth/session";

const BENEFITS = [
  {
    title: "Collecte centralisee",
    description: "Regroupe tous les avis clients et les interactions campagne au meme endroit.",
  },
  {
    title: "Roles clairs",
    description: "Owner, Admin et Member avec droits lisibles et securises par RLS.",
  },
  {
    title: "Pilotage simple",
    description: "KPIs essentiels, activite recente et modules operationnels connectes a Supabase.",
  },
];

export default async function LandingPage() {
  const { user } = await getSessionContext();
  const ctaHref = user ? "/dashboard" : "/login";
  const ctaText = user ? "Aller au dashboard" : "Se connecter";

  return (
    <main className="rf-fade-up py-10">
      <div className="rf-shell space-y-14">
        <header className="flex items-center justify-between rounded-2xl border border-[var(--border-1)] bg-white/80 px-4 py-3 backdrop-blur md:px-7">
          <Link href="/" className="font-mono text-lg font-bold tracking-tight">
            Review Flow
          </Link>
          <div className="flex items-center gap-2">
            <Link className="rf-btn rf-btn-outline" href="/tarifs">
              Voir tarifs
            </Link>
            <Link className="rf-btn rf-btn-primary" href={ctaHref}>
              {ctaText}
            </Link>
          </div>
        </header>

        <section className="rf-card overflow-hidden">
          <div className="grid gap-8 p-7 md:grid-cols-[1.1fr,0.9fr] md:p-10">
            <div className="space-y-6">
              <span className="rf-badge">V2 SaaS Reputation</span>
              <h1 className="rf-page-title text-4xl font-semibold leading-tight md:text-5xl">
                Centralisez vos avis et transformez vos campagnes en croissance.
              </h1>
              <p className="max-w-2xl text-[1.02rem] leading-relaxed text-[var(--text-1)]">
                Review Flow aide les PME, agences et reseaux multi-sites a collecter plus
                d&apos;avis, organiser leurs contacts et suivre les actions qui comptent.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link className="rf-btn rf-btn-primary" href={ctaHref}>
                  {ctaText}
                </Link>
                <Link className="rf-btn rf-btn-outline" href="/register">
                  Creer un compte
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--bg-soft)] p-6">
              <h2 className="rf-page-title text-xl font-semibold">Apercu Dashboard</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <article className="rf-kpi">
                  <p className="text-xs font-semibold uppercase text-[var(--text-1)]">Avis</p>
                  <p className="mt-2 text-3xl font-semibold">124</p>
                </article>
                <article className="rf-kpi">
                  <p className="text-xs font-semibold uppercase text-[var(--text-1)]">Contacts</p>
                  <p className="mt-2 text-3xl font-semibold">1,892</p>
                </article>
                <article className="rf-kpi">
                  <p className="text-xs font-semibold uppercase text-[var(--text-1)]">Campagnes</p>
                  <p className="mt-2 text-3xl font-semibold">17</p>
                </article>
                <article className="rf-kpi">
                  <p className="text-xs font-semibold uppercase text-[var(--text-1)]">Note moyenne</p>
                  <p className="mt-2 text-3xl font-semibold">4.6</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {BENEFITS.map((item) => (
            <article key={item.title} className="rf-card p-6">
              <h3 className="rf-page-title text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-[var(--text-1)]">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="rf-card p-8 text-center md:p-10">
          <h2 className="rf-page-title text-3xl font-semibold">
            Lancez votre V2 en quelques minutes
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-1)]">
            Architecture Next.js App Router, auth Supabase, roles robustes et base prete
            pour la facturation, l&apos;IA et les integrations.
          </p>
          <div className="mt-6">
            <Link className="rf-btn rf-btn-primary" href={ctaHref}>
              Commencer maintenant
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
