# Review Flow V2

Application SaaS de gestion de reputation (Next.js App Router + Supabase), construite selon le plan `V2_PRODUCT_PLAN.md`.

## Fonctionnalites implantees

- Parcours marketing + auth: `/`, `/tarifs`, `/login`, `/register`
- Espace prive: `/dashboard`, `/contacts`, `/avis`, `/campagnes`, `/parametres`, `/facturation`
- Protection routes via `src/proxy.ts` (Next.js 16, remplace `middleware.ts`)
- Auth Supabase (email/password + Google OAuth callback)
- Onboarding org/profil (owner auto, ou rattachement via invitation token)
- CRUD principal:
  - contacts (ajout/suppression/import CSV + export CSV)
  - avis (ajout + changement statut + filtres)
  - campagnes (creation/suppression/envoi + recipients)
  - parametres equipe/organisation/invitations selon role
- Base billing UI (plan, abonnement, factures)
- Health check: `/api/health`

## Base de donnees et RLS

Migration SQL V2 complete:

- `supabase/migrations/20260414130000_review_flow_v2.sql`

Elle contient:

- schema tables V2
- index et contraintes
- fonctions helpers RLS (`current_org_id`, `is_org_admin`, etc.)
- policies role-based (`owner/admin/member`)
- vue `dashboard_summary`

## Edge Functions (stubs V2)

- `supabase/functions/send-campaign-emails`
- `supabase/functions/sync-google-reviews`
- `supabase/functions/generate-review-analysis`
- `supabase/functions/billing-webhook`

## Variables d'environnement

Le projet lit les variables Next **et** Vite:

- `NEXT_PUBLIC_SUPABASE_URL` ou `VITE_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (recommande pour invitations admin)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_RESEND_FUNCTION_NAME` (ou `VITE_SUPABASE_RESEND_FUNCTION_NAME`)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir:

- `http://localhost:3000`

## Verification locale

```bash
npm run lint
npm run build
```

Les deux commandes passent sur l'etat actuel du repo.
