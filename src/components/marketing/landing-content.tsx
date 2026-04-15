"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type LandingContentProps = {
  ctaHref: string;
  ctaText: string;
};

const problemCards = [
  {
    title: "Suivis manuels",
    description:
      "Des heures perdues a relancer les clients par email, SMS et telephone apres chaque passage.",
  },
  {
    title: "Trop peu d'avis",
    description:
      "Vos concurrents gagnent en visibilite pendant que vos meilleurs retours restent invisibles en ligne.",
  },
  {
    title: "Opportunites ratees",
    description:
      "Chaque avis manquant freine la confiance, le bouche a oreille et la conversion de nouveaux clients.",
  },
];

const steps = [
  {
    title: "Connectez votre entreprise",
    description: "Liez votre activite en quelques clics. Tout est pret en moins de 2 minutes.",
  },
  {
    title: "Automatisez les campagnes",
    description: "Declenchez des sequences email et SMS au bon moment, sans effort quotidien.",
  },
  {
    title: "Pilotez la croissance",
    description: "Suivez les avis, les tendances et les performances depuis un seul tableau de bord.",
  },
];

const featureCards = [
  {
    title: "Campagnes automatisees",
    description: "Relances intelligentes et personnalisees pour augmenter le taux de reponse.",
  },
  {
    title: "Page d'avis optimisee",
    description: "Un parcours rapide et mobile-first pour laisser un avis sans friction.",
  },
  {
    title: "Dashboard centralise",
    description: "Une vue claire de vos contacts, avis, campagnes et actions prioritaires.",
  },
  {
    title: "Multi-plateforme",
    description: "Google et vos canaux internes reunis dans un pilotage simple et lisible.",
  },
];

const testimonials = [
  {
    quote:
      "Nous sommes passes de 40 a 280 avis en 3 mois. L'automatisation nous a fait gagner un temps enorme.",
    name: "Sarah M.",
    role: "Dirigeante, cabinet dentaire",
  },
  {
    quote:
      "Avant, on suivait tout a la main. Maintenant, les campagnes tournent seules et les resultats sont visibles.",
    name: "James P.",
    role: "Directeur, groupe auto",
  },
  {
    quote:
      "Notre reputation locale a vraiment accelere. Plus d'avis, plus de preuves sociales, plus de clients.",
    name: "Maria G.",
    role: "Fondatrice, institut beaute",
  },
];

const plans = [
  {
    name: "Gratuit",
    price: "0 EUR",
    description: "Parfait pour demarrer",
    features: [
      "1 organisation",
      "200 contacts inclus",
      "Collecte d'avis de base",
      "Dashboard essentiel",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "99 EUR / mois",
    description: "Pour accelerer votre croissance",
    features: [
      "Contacts illimites",
      "Campagnes avancees",
      "Analyse prioritaire",
      "Support prioritaire",
    ],
    highlight: true,
  },
];

const navItems = [
  { href: "#fonctionnalites", label: "Fonctionnalites" },
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#temoignages", label: "Temoignages" },
  { href: "#tarifs", label: "Tarifs" },
];

const reveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const floatingTransition = {
  duration: 4.8,
  repeat: Infinity,
  repeatType: "mirror" as const,
  ease: "easeInOut" as const,
};

export const LandingContent = ({ ctaHref, ctaText }: LandingContentProps) => {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <main className="relative overflow-hidden pb-24 pt-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(140,82,255,0.24),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(174,146,255,0.16),transparent_32%),linear-gradient(180deg,#130f22_0%,#0f0b1a_60%,#0a0813_100%)]" />

      <div className="rf-shell space-y-20">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="sticky top-4 z-20 flex items-center justify-between rounded-2xl border border-[var(--rf-border)] bg-[#171128]/85 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur md:px-6"
        >
          <Link href="/" className="rf-page-title text-2xl font-semibold text-[#f1e9ff]">
            ReviewFlow
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[var(--rf-text-muted)] md:flex">
            {navItems.map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                className="relative px-1.5 py-1"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.16 }}
                onHoverStart={() => setHoveredNav(item.href)}
                onHoverEnd={() =>
                  setHoveredNav((current) => (current === item.href ? null : current))
                }
              >
                <span className="relative z-10 transition-colors hover:text-[#f5efff]">{item.label}</span>
                <AnimatePresence>
                  {hoveredNav === item.href ? (
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.18 }}
                      className="absolute inset-x-0 -bottom-[5px] h-[2px] rounded-full bg-[#b8a0ff]"
                    />
                  ) : null}
                </AnimatePresence>
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <motion.div whileHover={{ y: -1, scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link href="/login" className="rf-btn rf-btn-outline">
                Connexion
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 20 }}
            >
              <Link href={ctaHref} className="rf-btn rf-btn-primary">
                {ctaText}
              </Link>
            </motion.div>
          </div>
        </motion.header>

        <section className="relative px-1 pt-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mx-auto max-w-4xl space-y-7 text-center"
          >
            <motion.div variants={reveal}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#4a3a78] bg-[#1d1631] px-4 py-1.5 text-sm font-semibold text-[#b8a0ff]">
                Rejoint par plus de 1 200 entreprises cette semaine
              </span>
            </motion.div>

            <motion.h1
              variants={reveal}
              className="rf-page-title text-5xl font-semibold leading-[1.04] text-[#f5efff] md:text-7xl"
            >
              Dominez votre marche
              <span className="block bg-gradient-to-r from-[#ae92ff] to-[#8c52ff] bg-clip-text text-transparent">
                grace aux avis.
              </span>
            </motion.h1>

            <motion.p
              variants={reveal}
              className="mx-auto max-w-3xl text-lg leading-relaxed text-[var(--rf-text-muted)]"
            >
              Automatisez la collecte des avis clients a grande echelle. Transformez chaque
              interaction en preuve sociale concrete et durable.
            </motion.p>

            <motion.div variants={reveal} className="flex flex-wrap items-center justify-center gap-3">
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 360, damping: 22 }}
              >
                <Link href={ctaHref} className="rf-btn rf-btn-primary px-7 py-3 text-base">
                  Demarrer maintenant
                </Link>
              </motion.div>
              <motion.a
                href="#tarifs"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 360, damping: 22 }}
                className="rf-btn rf-btn-outline px-7 py-3 text-base"
              >
                Voir les tarifs
              </motion.a>
            </motion.div>

            <motion.div
              variants={reveal}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--rf-text-muted)]"
            >
              <span>Sans carte de credit</span>
              <span>Configuration en 2 minutes</span>
              <span>Support reactif</span>
            </motion.div>
          </motion.div>

          <motion.article
            initial={{ opacity: 0, x: -20, y: 6 }}
            animate={{ opacity: 1, x: 0, y: [-2, 10] }}
            transition={floatingTransition}
            className="pointer-events-none absolute left-0 top-8 hidden w-[230px] rounded-2xl border border-[#4a3a78] bg-[#19122c]/90 p-3 text-left shadow-[0_18px_45px_rgba(0,0,0,0.35)] xl:block"
          >
            <p className="text-sm font-semibold text-[#eee6ff]">Thomas D.</p>
            <p className="mt-1 text-xs text-[var(--rf-text-muted)]">
              Le meilleur outil de collecte d&apos;avis que j&apos;ai teste.
            </p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, x: 20, y: 8 }}
            animate={{ opacity: 1, x: 0, y: [8, -8] }}
            transition={{ ...floatingTransition, duration: 5.4 }}
            className="pointer-events-none absolute right-0 top-20 hidden w-[230px] rounded-2xl border border-[#4a3a78] bg-[#19122c]/90 p-3 text-left shadow-[0_18px_45px_rgba(0,0,0,0.35)] xl:block"
          >
            <p className="text-sm font-semibold text-[#eee6ff]">Sophie R.</p>
            <p className="mt-1 text-xs text-[var(--rf-text-muted)]">
              Simple, rapide, efficace. Je recommande.
            </p>
          </motion.article>
        </section>

        <motion.section
          id="probleme"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={reveal} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#b8a0ff]">
              Le probleme
            </p>
            <h2 className="rf-page-title mt-3 text-4xl font-semibold text-[#f5efff] md:text-5xl">
              Collecter manuellement des avis est epuisant
            </h2>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-3">
            {problemCards.map((card) => (
              <motion.article
                key={card.title}
                variants={reveal}
                whileHover={{ y: -4 }}
                className="rf-card p-6"
              >
                <h3 className="rf-page-title text-2xl font-semibold text-[#f5efff]">{card.title}</h3>
                <p className="mt-3 text-[var(--rf-text-muted)]">{card.description}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          id="fonctionnement"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={reveal} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#b8a0ff]">
              Fonctionnement
            </p>
            <h2 className="rf-page-title mt-3 text-4xl font-semibold text-[#f5efff] md:text-5xl">
              Trois etapes vers des avis sans effort
            </h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.article key={step.title} variants={reveal} className="rf-card p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#24193c] text-lg font-semibold text-[#b8a0ff]">
                  {`0${index + 1}`}
                </span>
                <h3 className="rf-page-title mt-4 text-2xl font-semibold text-[#f5efff]">{step.title}</h3>
                <p className="mt-3 text-[var(--rf-text-muted)]">{step.description}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          id="fonctionnalites"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={reveal} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#b8a0ff]">
              Fonctionnalites
            </p>
            <h2 className="rf-page-title mt-3 text-4xl font-semibold text-[#f5efff] md:text-5xl">
              Tout ce qu&apos;il faut pour multiplier vos avis
            </h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            {featureCards.map((feature) => (
              <motion.article key={feature.title} variants={reveal} whileHover={{ y: -4 }} className="rf-card p-6">
                <h3 className="rf-page-title text-2xl font-semibold text-[#f5efff]">{feature.title}</h3>
                <p className="mt-3 text-[var(--rf-text-muted)]">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          id="temoignages"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={reveal} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["10,000+", "Avis collectes"],
              ["500+", "Entreprises clientes"],
              ["4.9", "Note moyenne"],
              ["3x", "Croissance plus rapide"],
            ].map(([value, label]) => (
              <div key={label} className="rf-card p-5 text-center">
                <p className="rf-page-title text-4xl font-semibold text-[#b8a0ff]">{value}</p>
                <p className="mt-2 text-sm text-[var(--rf-text-muted)]">{label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={reveal} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#b8a0ff]">
              Temoignages
            </p>
            <h2 className="rf-page-title mt-3 text-4xl font-semibold text-[#f5efff] md:text-5xl">
              Apprecie par les dirigeants
            </h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <motion.article key={item.name} variants={reveal} className="rf-card p-6">
                <p className="text-[#b8a0ff]">*****</p>
                <p className="mt-3 text-lg italic text-[#eee6ff]">{item.quote}</p>
                <p className="mt-6 font-semibold text-[#f5efff]">{item.name}</p>
                <p className="text-sm text-[var(--rf-text-muted)]">{item.role}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-7"
        >
          <motion.div variants={reveal} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#b8a0ff]">
              Tableau de bord
            </p>
            <h2 className="rf-page-title mt-3 text-4xl font-semibold text-[#f5efff] md:text-5xl">
              Votre centre de commandement reputation
            </h2>
          </motion.div>

          <motion.article variants={reveal} className="rf-card p-6 md:p-8">
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ["Total avis", "1,284", "+23%"],
                ["Ce mois-ci", "147", "+31%"],
                ["Note moyenne", "4.8", "+0.3"],
                ["Taux de reponse", "72%", "+11%"],
              ].map(([label, value, delta]) => (
                <div key={label} className="rounded-xl border border-[var(--rf-border)] bg-[#19122c] p-4">
                  <p className="text-sm text-[var(--rf-text-muted)]">{label}</p>
                  <p className="mt-1 text-3xl font-semibold text-[#f5efff]">{value}</p>
                  <p className="mt-1 text-sm text-[#7dd6a7]">{delta}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-[var(--rf-border)] bg-[#19122d] p-4">
              <div className="flex h-56 items-end gap-2 md:gap-3">
                {[28, 36, 31, 42, 34, 48, 40, 52, 45, 58, 54, 63].map((height, index) => (
                  <motion.div
                    key={`${height}-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    whileInView={{ height: `${height}%`, opacity: 1 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.45, delay: index * 0.03 }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-[#8c52ff] to-[#b8a0ff]"
                  />
                ))}
              </div>
            </div>
          </motion.article>
        </motion.section>

        <motion.section
          id="tarifs"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={reveal} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#b8a0ff]">Tarifs</p>
            <h2 className="rf-page-title mt-3 text-4xl font-semibold text-[#f5efff] md:text-5xl">
              Des offres simples et transparentes
            </h2>
            <p className="mt-3 text-[var(--rf-text-muted)]">
              Commencez gratuitement puis passez en Pro quand vous voulez accelerer.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <motion.article
                key={plan.name}
                variants={reveal}
                whileHover={{ y: -4 }}
                onHoverStart={() => setHoveredPlan(plan.name)}
                onHoverEnd={() => setHoveredPlan((current) => (current === plan.name ? null : current))}
                className={`rf-card p-7 ${
                  plan.highlight ? "border-[#8c52ff] bg-[linear-gradient(180deg,#261b41_0%,#201732_100%)]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#b8a0ff]">
                    {plan.name}
                  </p>
                  <AnimatePresence>
                    {hoveredPlan === plan.name || plan.highlight ? (
                      <motion.span
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-full border border-[#5d4b8f] bg-[#2b1f46] px-3 py-1 text-xs font-semibold text-[#b8a0ff]"
                      >
                        {plan.highlight ? "Le plus choisi" : "Populaire"}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                <p className="rf-page-title mt-3 text-5xl font-semibold text-[#f5efff]">{plan.price}</p>
                <p className="mt-3 text-[var(--rf-text-muted)]">{plan.description}</p>
                <ul className="mt-5 space-y-2 text-[var(--rf-text-muted)]">
                  {plan.features.map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>
                <motion.div whileHover={{ y: -1, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/register" className="rf-btn rf-btn-primary mt-6 w-full py-3">
                    Choisir {plan.name}
                  </Link>
                </motion.div>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={reveal}
          className="rounded-3xl border border-[#5c3f8f] bg-[linear-gradient(160deg,#261a42_0%,#1e1435_55%,#201634_100%)] px-6 py-14 text-center md:px-10"
        >
          <h2 className="rf-page-title text-4xl font-semibold text-[#f5efff] md:text-5xl">
            Plus d&apos;avis. Zero effort.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--rf-text-muted)]">
            Rejoignez les equipes qui transforment leur reputation en ligne avec un systeme simple
            et fiable.
          </p>
          <motion.div
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
          >
            <Link href={ctaHref} className="rf-btn rf-btn-primary mt-7 px-8 py-3 text-base">
              Commencer a collecter des avis
            </Link>
          </motion.div>
          <p className="mt-5 text-sm text-[var(--rf-text-muted)]">
            Sans carte de credit - Configuration en 2 minutes - Annulation libre
          </p>
        </motion.section>

        <footer className="border-t border-[var(--rf-border)] pt-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="rf-page-title text-3xl font-semibold text-[#f1e9ff]">ReviewFlow</p>
              <p className="mt-3 text-[var(--rf-text-muted)]">
                Outil de collecte et gestion d&apos;avis pour PME, agences et reseaux.
              </p>
            </div>
            <div className="space-y-2 text-[var(--rf-text-muted)]">
              <p className="font-semibold text-[#f5efff]">Produit</p>
              <p>
                <a href="#fonctionnalites">Fonctionnalites</a>
              </p>
              <p>
                <a href="#tarifs">Tarifs</a>
              </p>
              <p>
                <Link href="/dashboard">Dashboard</Link>
              </p>
            </div>
            <div className="space-y-2 text-[var(--rf-text-muted)]">
              <p className="font-semibold text-[#f5efff]">Compte</p>
              <p>
                <Link href="/login">Connexion</Link>
              </p>
              <p>
                <Link href="/register">Inscription</Link>
              </p>
            </div>
          </div>
          <p className="mt-10 border-t border-[var(--rf-border)] py-5 text-center text-sm text-[var(--rf-text-muted)]">
            (c) 2026 ReviewFlow. Tous droits reserves.
          </p>
        </footer>
      </div>
    </main>
  );
};
