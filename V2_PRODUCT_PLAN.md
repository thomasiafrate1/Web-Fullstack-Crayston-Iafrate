# Review Flow V2

## Objectif

Construire une V2 plus solide, plus claire et plus vendable de `Review Flow`, en gardant le produit simple a utiliser mais beaucoup plus propre dans ses logiques metier, ses roles, sa structure BDD et son architecture front.

La V2 doit permettre a une organisation de :

- centraliser ses avis clients
- gerer ses contacts
- lancer des campagnes de collecte d'avis
- suivre des indicateurs simples
- gerer son organisation, ses membres et ses permissions
- preparer l'ouverture vers la facturation, l'IA et les integrations externes

---

## Vision Produit

`Review Flow` est un SaaS de gestion de reputation pour PME, agences et reseaux multi-sites.

Promesse produit :

- collecter plus d'avis
- mieux comprendre les retours clients
- activer des campagnes de demande d'avis
- donner une vision claire a l'equipe

Positionnement V2 :

- MVP robuste
- design propre
- architecture lisible
- securite et roles clairs
- base prete pour scaler

---

## Objectifs V2

### Objectifs fonctionnels

- fiabiliser l'auth et les roles
- relier toutes les pages coeur a Supabase
- clarifier les droits `owner`, `admin`, `member`
- passer d'un projet "demo" a un socle de vrai produit

### Objectifs techniques

- migration vers `Next.js` App Router
- deploiement simple sur `Vercel`
- schema BDD coherent
- RLS propre
- composants reutilisables
- pages plus lisibles
- logique front factorisee
- documentation exploitable pour suite du projet

### Hors scope V2

- IA avancee temps reel
- multi-tenant complexe a grande echelle
- marketplace d'integrations
- synchronisation bidirectionnelle Google ultra complete
- billing Stripe complet production-ready

---

## Roles Et Permissions

Principes V2 :

- un utilisateur appartient a une seule organisation active
- le premier utilisateur qui cree une organisation devient `owner`
- les utilisateurs `admin` et `member` rejoignent une organisation via invitation
- le role `owner` n'est jamais choisi librement dans le formulaire public
- le front masque les actions interdites, mais la vraie securite repose sur les policies RLS

### member

Peut :

- consulter le dashboard
- consulter les avis
- consulter les contacts
- consulter les campagnes
- consulter ses parametres et les informations de l'organisation

Ne peut pas :

- creer, modifier ou supprimer des contacts
- creer, modifier ou supprimer des campagnes
- envoyer une campagne
- inviter ou supprimer un membre
- modifier l'organisation
- acceder a la facturation
- utiliser la danger zone

### admin

Peut :

- voir toutes les donnees de son organisation
- gerer les contacts
- gerer les campagnes et lancer un envoi
- voir et moderer les avis si cette feature est activee
- inviter des `member`
- annuler une invitation `member` en attente
- retirer un `member`

Ne peut pas :

- inviter un `owner`
- promouvoir quelqu'un en `owner`
- modifier le nom, le slug ou le plan de l'organisation
- acceder a la facturation
- supprimer l'organisation
- modifier ou supprimer un autre `admin` ou le `owner`

### owner

Role le plus eleve dans une organisation.

Peut :

- gerer l'organisation
- modifier le nom et le slug
- inviter des `admin` et des `member`
- changer les roles entre `admin` et `member`
- retirer des membres et revoquer des invitations
- gerer contacts, avis et campagnes
- acceder a la facturation
- utiliser la danger zone

Regles complementaires :

- un `owner` ne peut pas supprimer sa propre organisation sans confirmation forte
- si un owner doit quitter l'organisation, il doit d'abord transferer la propriete a un autre membre

---

## Architecture Produit

### Parcours principal

1. utilisateur arrive sur la landing
2. il se connecte ou s'inscrit
3. un profil Supabase est cree / synchronise
4. il entre dans une organisation
5. il accede au dashboard
6. il utilise les modules `contacts`, `avis`, `campagnes`, `parametres`

### Pages principales

- `/` : landing page
- `/login` : connexion
- `/register` : inscription
- `/dashboard` : vue globale
- `/contacts` : base contacts
- `/avis` : gestion des avis
- `/campagnes` : campagnes emails
- `/parametres` : organisation, equipe, securite
- `/facturation` : abonnement et paiements
- `/tarifs` : page publique pricing

### Cible technique V2

La V2 cible explicitement :

- `Next.js` App Router
- deploiement sur `Vercel`
- `Supabase` pour Auth, Postgres, RLS et Edge Functions

Principes d'architecture :

- pages marketing et auth en routes publiques
- espace produit en routes privees
- layouts App Router pour partager sidebar, topbar et guards
- composants serveur par defaut pour les pages simples
- composants client uniquement pour les formulaires, tables interactives et modales

---

## Pages V2

## 1. Landing Page

### Objectif

Convertir en inscription / connexion.

### Contenu

- hero
- proposition de valeur
- fonctionnalites
- preview dashboard
- pricing resumee
- CTA final

### Eléments

- navbar
- hero section
- social proof
- blocs benefices
- CTA primaire `Se connecter`
- CTA secondaire `Voir tarifs`

### Logique

- si utilisateur non connecte : CTA vers login
- si utilisateur deja connecte : CTA vers dashboard

---

## 2. Login / Register

### Objectif

Authentifier l'utilisateur et construire son contexte d'organisation.

### Login

- email
- mot de passe
- Google OAuth
- erreurs explicites
- redirection dashboard

### Register

- email
- mot de passe
- confirmation mot de passe
- nom d'organisation si creation initiale
- Google OAuth si utile
- creation ou liaison org selon le contexte

### Logique Supabase

- `auth.signUp`
- `auth.signInWithPassword`
- `auth.signInWithOAuth`
- sync `profiles`
- chargement session globale via `AuthProvider`

### Regles d'inscription V2

- inscription publique standard :
  - cree une nouvelle organisation
  - cree le profil
  - assigne le role `owner`
- inscription depuis invitation :
  - verifie un token d'invitation
  - rattache l'utilisateur a l'organisation existante
  - applique le role de l'invitation (`admin` ou `member`)
- le formulaire public ne propose pas de selecteur de role libre

---

## 3. Dashboard

### Objectif

Donner une vue d'ensemble rapide.

### Widgets

- nombre total d'avis
- nombre total de contacts
- nombre de campagnes
- taux moyen de note
- progression recente

### Eléments

- cartes KPI
- mini graphes
- bloc activite recente
- raccourcis vers `avis`, `contacts`, `campagnes`

### Logique

- agregations simples par `org_id`
- filtrage selon periode
- data chargee depuis Supabase ou vue SQL si besoin

---

## 4. Contacts

### Objectif

Gerer la base de destinataires.

### Fonctionnalites

- liste
- recherche
- ajout manuel
- modification
- suppression
- import CSV
- export CSV

### Champs de base

- email
- nom complet
- telephone optionnel
- entreprise optionnelle
- tags optionnels en V2+

### Logique

- lecture `contacts` par org
- CRUD owner/admin
- lecture seule member
- unicite `org_id + email`

---

## 5. Avis

### Objectif

Centraliser les avis clients.

### Fonctionnalites

- liste des avis
- filtre par source
- filtre par note
- recherche textuelle
- detail avis
- statut de traitement

### V2 simple

- avis internes
- avis Google importes ou synchronises plus tard

### Colonnes utiles

- auteur
- note
- contenu
- source
- date
- statut

### Evolutions V2+

- IA sentiment
- themes detectes
- resume automatique
- suggestions de reponse

---

## 6. Campagnes

### Objectif

Permettre d'envoyer des demandes d'avis a des contacts.

### Fonctionnalites

- creer campagne
- modifier campagne
- supprimer campagne
- definir sujet
- definir template
- associer des destinataires
- importer CSV
- envoyer campagne
- suivre statuts

### Statuts campagne

- `draft`
- `scheduled`
- `sending`
- `sent`
- `failed`

### Statuts destinataire

- `draft`
- `queued`
- `sent`
- `failed`
- `opened` plus tard
- `clicked` plus tard

### Logique metier

- une campagne appartient a une org
- un destinataire appartient a une campagne
- l'envoi est gere par Edge Function Supabase
- le template remplace les variables comme `{{name}}`

### Envoi email

- front appelle `supabase.functions.invoke(...)`
- Edge Function prepare la charge
- Resend envoie les emails
- mise a jour des statuts en base

---

## 7. Parametres

### Objectif

Permettre de gerer l'organisation et les acces.

### Blocs

- mon compte
- organisation
- equipe
- invitations
- notifications
- danger zone

### Vues selon role

#### member

- lecture seule
- voit son compte
- voit les infos org
- voit equipe sans actions

#### admin

- peut inviter des `member`
- peut annuler des invitations `member`
- peut retirer des `member`
- ne peut pas faire actions critiques owner-only

#### owner

- controle complet org
- modifie nom / slug
- change roles
- gere toutes les invitations
- danger zone

---

## 8. Tarifs

### Objectif

Page marketing publique pour les plans.

### Plans

- gratuit
- pro

### Contenu

- prix
- features
- limites
- comparateur
- CTA connexion / essai

### V2

- page statique
- plus tard liaison Stripe

---

## Architecture Front

### Structure recommandee

```txt
src/
  app/
    (marketing)/
      page.tsx
      tarifs/
        page.tsx
    (auth)/
      login/
        page.tsx
      register/
        page.tsx
    (app)/
      layout.tsx
      dashboard/
        page.tsx
      contacts/
        page.tsx
      avis/
        page.tsx
      campagnes/
        page.tsx
      parametres/
        page.tsx
      facturation/
        page.tsx
    api/
      health/
        route.ts
  components/
    app/
    auth/
    landing/
    contacts/
    reviews/
    campaigns/
    settings/
    dashboard/
    ui/
  features/
    auth/
    contacts/
    reviews/
    campaigns/
    settings/
    dashboard/
  lib/
    auth/
    supabase/
      browser.ts
      server.ts
      middleware.ts
    utils/
  actions/
  hooks/
  types/
  services/
  middleware.ts
```

### Principe

- `components/ui` : primitives de design system
- `components/<feature>` : blocs UI metier
- `features/<feature>` : logique metier front
- `lib/auth` : auth helpers, guards et mapping du profil courant
- `lib/supabase` : clients browser/server et helpers SSR
- `app/` : unique source de routing
- pas de dossier `pages/` pour eviter toute ambiguite
- `middleware.ts` : protection des routes privees et redirections auth de base

---

## Composants V2

## Composants transverses

- `AppShell`
- `Sidebar`
- `Topbar`
- `AuthLayout`
- `ProtectedRoute`
- `RoleGate`
- `EmptyState`
- `StatCard`
- `TableToolbar`
- `ConfirmDialog`
- `StatusBadge`
- `SearchInput`

## Composants Landing

- `Navbar`
- `Hero`
- `Features`
- `SocialProof`
- `DashboardPreview`
- `Pricing`
- `FinalCTA`
- `Footer`

## Composants Contacts

- `ContactsTable`
- `ContactFormDialog`
- `ContactsImportDialog`
- `ContactsStats`

## Composants Avis

- `ReviewsTable`
- `ReviewFilters`
- `ReviewDetailsPanel`
- `ReviewStatusBadge`

## Composants Campagnes

- `CampaignList`
- `CampaignFormDialog`
- `CampaignRecipientsTable`
- `CampaignPreview`
- `CampaignStats`
- `SendCampaignButton`

## Composants Parametres

- `SettingsRoleBanner`
- `OrganizationCard`
- `MembersTable`
- `InviteForm`
- `DangerZoneCard`

## Composants Dashboard

- `DashboardHeader`
- `KpiGrid`
- `ActivityFeed`
- `QuickActions`
- `SimpleChart`

---

## Architecture Supabase

### Services utilises

- Supabase Auth
- Supabase Postgres
- Supabase RLS
- Supabase Edge Functions
- Supabase Storage plus tard
- Supabase SSR helpers pour Next.js

### Logique auth

- session lue cote serveur via cookies Supabase
- hydration minimale cote client pour les composants interactifs
- user auth converti en `AuthUser`
- sync profil si necessaire
- redirections auth gerees par `middleware.ts` et layouts proteges

### RLS

Chaque table metier doit etre filtree par `org_id`.

Principes :

- un user ne voit que les donnees de son organisation
- `member` lit
- `admin` ecrit sur perimetre operationnel
- `owner` a acces complet sur son org

---

## Schema BDD V2

## 1. organizations

Table canonique pour l'identite de l'organisation.

```sql
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  notifications_enabled boolean not null default true,
  language text not null default 'fr',
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Notes :

- `organizations.id` est la vraie cle interne
- `slug` est l'identifiant public
- `name` et `slug` vivent ici, pas dans `profiles`

## 2. profiles

Table coeur utilisateur / organisation.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete set null,
  email text not null,
  full_name text,
  role text not null check (role in ('owner', 'admin', 'member')),
  avatar_url text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Notes :

- le premier inscrit d'une org devient `owner`
- `org_id` est obligatoire en pratique apres onboarding
- si un jour on gere plusieurs org par user, on migrera vers une table `organization_memberships`

## 3. organization_invites

Table d'invitations securisee pour rejoindre une organisation existante.

```sql
create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Contraintes :

- un seul invite en attente par `(org_id, email)` via un index partiel
- le token brut n'est jamais stocke, seul un hash l'est

## 4. contacts

```sql
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  company text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Contraintes :

- unique `(org_id, email)`

## 5. reviews

```sql
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  source text not null check (source in ('internal', 'google')),
  external_id text,
  author_name text,
  rating int not null check (rating >= 1 and rating <= 5),
  content text,
  sentiment text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 6. review_analysis

Table preparee pour IA.

```sql
create table public.review_analysis (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  sentiment_label text,
  sentiment_score numeric,
  themes text[] not null default '{}'::text[],
  summary text,
  generated_at timestamptz not null default now()
);
```

## 7. campaigns

```sql
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  subject text not null,
  template text not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 8. campaign_recipients

```sql
create table public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  email text not null,
  full_name text,
  provider_message_id text,
  status text not null default 'draft' check (status in ('draft', 'queued', 'sent', 'failed', 'opened', 'clicked')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now()
);
```

Contraintes :

- unique `(campaign_id, email)`

## 9. billing_customers

Preparation facturation.

```sql
create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  created_at timestamptz not null default now()
);
```

## 10. subscriptions

```sql
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  provider text not null default 'stripe',
  provider_subscription_id text,
  plan text not null default 'free',
  status text not null default 'inactive',
  renews_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 11. invoices

```sql
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  provider_invoice_id text,
  amount_cents integer not null,
  currency text not null default 'eur',
  status text not null,
  invoice_url text,
  issued_at timestamptz,
  created_at timestamptz not null default now()
);
```

## 12. audit_logs

```sql
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

## Contraintes structurantes

- toutes les tables metier utilisent `org_id uuid`
- toutes les relations critiques ont une vraie foreign key
- `organizations` est la seule source de verite pour le nom, le slug et le plan
- `profiles` stocke l'appartenance et le role, pas les metadonnees d'organisation

## Index minimums recommandes

- `profiles(org_id)`
- `contacts(org_id, email)`
- `reviews(org_id, published_at desc)`
- `campaigns(org_id, created_at desc)`
- `campaign_recipients(campaign_id, email)`
- `organization_invites(org_id, email, status)`

---

## Vue SQL Et Requetes Utiles

### Dashboard summary

Vue recommandee :

```sql
create view public.dashboard_summary as
select
  o.id as org_id,
  o.name as org_name,
  coalesce((
    select count(*)
    from public.contacts c
    where c.org_id = o.id
  ), 0) as contacts_count,
  coalesce((
    select count(*)
    from public.reviews r
    where r.org_id = o.id
  ), 0) as reviews_count,
  coalesce((
    select count(*)
    from public.campaigns cp
    where cp.org_id = o.id
  ), 0) as campaigns_count,
  coalesce((
    select avg(r.rating)::numeric(4,2)
    from public.reviews r
    where r.org_id = o.id
  ), 0) as average_rating
from public.organizations o;
```

Si le dashboard devient tres frequemment consulte, une materialized view ou une table d'agregats pourra remplacer cette vue.

---

## Logiques Metier

## Auth

- si session absente : acces prive bloque
- si login reussi : redirection dashboard
- si register reussi : creation profil + org si necessaire
- si OAuth : retour dashboard + sync profil

## Organisation

- une org = un espace de travail
- toutes les donnees metier appartiennent a une org
- un user appartient a une org principale

## Contacts

- email unique dans une org
- import CSV fait un `upsert`
- export base sur la liste filtree

## Avis

- les avis peuvent etre saisis, importes, ou sync plus tard
- un avis peut etre annote ou marque traite

## Campagnes

- un template sert de base au message
- les recipients peuvent venir de `contacts`
- envoi en lot via Edge Function
- retour de statuts en BDD

## Parametres

- owner decide structure org
- admin aide a gerer
- member consomme

## Facturation

- plan stocke au niveau organisation
- acces facturation visible surtout owner

---

## Edge Functions V2

## 1. send-campaign-emails

Responsabilites :

- charger campagne
- charger recipients
- remplacer variables
- envoyer via Resend
- mettre a jour statuts
- logger resultat

## 2. sync-google-reviews

Responsabilites :

- recuperer avis Google
- dedoublonner
- inserer / mettre a jour `reviews`

## 3. generate-review-analysis

Responsabilites :

- lire un avis
- appeler modele IA
- enregistrer `review_analysis`

## 4. billing-webhook

Responsabilites :

- recevoir webhooks Stripe
- mettre a jour `subscriptions`
- inserer `invoices`

---

## Deploiement Vercel

### Stack cible

- `Next.js` deploye sur `Vercel`
- `Supabase` pour la base, l'auth, le RLS et les Edge Functions
- `Resend` pour l'envoi email

### Variables d'environnement

Frontend / Next public :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Backend / server-side :

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

### Notes de deploiement

- configurer les variables sur `Vercel` pour `Preview` et `Production`
- configurer les redirect URLs Supabase Auth pour les domaines Vercel
- utiliser `middleware.ts` pour proteger les routes privees
- conserver l'envoi email dans les Edge Functions Supabase pour ne pas exposer `RESEND_API_KEY` au front

---

## Policies RLS

### Regle globale

Toutes les policies doivent verifier :

- `auth.uid()` existe
- le profil de l'utilisateur a le meme `org_id`
- le role courant est compatible avec l'action demandee

### Helpers recommandes

Pour simplifier les policies, prevoir des fonctions SQL du type :

- `public.current_org_id()`
- `public.current_role()`
- `public.is_org_member(target_org_id uuid)`
- `public.is_org_admin(target_org_id uuid)` pour `admin` ou `owner`
- `public.is_org_owner(target_org_id uuid)`

### RLS par role

#### member

- `select` sur `organizations`
- `select` sur `profiles` de son organisation
- `select` sur `contacts`
- `select` sur `reviews`
- `select` sur `campaigns`
- `select` sur `campaign_recipients`
- `select` sur `review_analysis`
- aucun `insert/update/delete` sur les tables metier

#### admin

- `insert/update/delete` sur `contacts`
- `insert/update/delete` sur `campaigns`
- `insert/update/delete` sur `campaign_recipients`
- `insert/update/delete` sur `organization_invites` uniquement pour inviter ou revoquer des `member`
- `update` sur `reviews.status` si la moderation est active
- aucun droit sur `organizations`
- aucun droit sur `subscriptions`, `billing_customers`, `invoices`
- aucun droit pour modifier un `admin` ou un `owner`

#### owner

- tous les droits `admin`
- plus droits `insert/update` sur `organizations`
- plus droits sur `subscriptions`, `billing_customers`, `invoices`
- plus droits sur la danger zone
- peut promouvoir ou retrograder `admin` et `member`
- ne peut pas se retirer lui-meme sans transfert explicite de propriete

### Matrice de gestion equipe

- `member`
  - lecture seule sur membres et invitations
- `admin`
  - peut creer une invitation `member`
  - peut annuler une invitation `member`
  - peut retirer un `member`
  - ne peut pas changer les roles existants
- `owner`
  - peut creer une invitation `admin` ou `member`
  - peut annuler toute invitation
  - peut changer les roles `admin` <-> `member`
  - peut retirer `admin` et `member`
  - reste seul a pouvoir toucher aux parametres critiques de l'organisation

---

## Contenu Par Page

## Landing

- headline
- sous-titre
- CTA principal
- preuve sociale
- preview produit
- pricing simple

## Dashboard

- titre
- salut utilisateur
- 4 KPI
- activite recente
- quick actions

## Contacts

- titre
- toolbar recherche / import / export / ajout
- stats
- table
- dialog contact

## Avis

- toolbar filtres
- stats note moyenne
- table avis
- drawer detail
- badge source

## Campagnes

- liste campagnes
- detail campagne
- stats recipients
- preview template
- bouton envoyer

## Parametres

- banner role courant
- tabs `Mon compte`, `Organisation`, `Equipe`
- card org
- members table
- invites table
- bloc droits selon role

## Tarifs

- hero pricing
- cards plans
- comparateur
- CTA final

---

## Etat Et Data Fetching

### Recommandations

- `Next.js` App Router comme base de chargement
- Server Components pour les pages de lecture simples
- Client Components pour les formulaires, modales, tableaux riches et actions temps reel
- `useAuth` ou helpers SSR pour exposer session, profil et role courant
- `react-hook-form` pour les formulaires un peu denses
- `@tanstack/react-query` seulement pour les ecrans tres interactifs si le besoin existe
- toasts pour retours actions
- Server Actions ou Route Handlers pour les ecritures critiques si on veut garder la logique cote serveur

### Query keys recommandees

- `["profile", userId]`
- `["organization", orgId]`
- `["members", orgId]`
- `["org_invites", orgId]`
- `["contacts", orgId]`
- `["reviews", orgId, filters]`
- `["campaigns", orgId]`
- `["campaign_recipients", campaignId]`
- `["dashboard_summary", orgId]`

---

## Design System

### Principes

- interface claire
- sidebar forte
- cards lisibles
- tables propres
- contrastes nets
- animations legeres et utiles

### Tokens visuels

- primaire
- neutres
- success
- warning
- danger

### Eléments a standardiser

- boutons
- champs
- badges de statut
- dialogs
- empty states
- tableaux
- bloc erreurs

---

## Plan De Livraison

## Phase 1

- scaffold `Next.js` + `Vercel`
- App Router + middleware auth
- auth stable
- profiles
- organizations
- shell prive
- landing
- login/register

## Phase 2

- contacts full Supabase
- campagnes full Supabase
- parametres owner/admin/member

## Phase 3

- avis en base
- dashboard branche a vraies donnees
- vues dashboard par role

## Phase 4

- pricing / billing
- webhooks Stripe
- abonnement par org

## Phase 5

- IA avis
- sync Google
- audit logs

---

## Checklist Technique V2

- projet `Next.js` initialise
- deploiement `Vercel` configure
- variables d'environnement `Preview` et `Production` configurees
- schema SQL complet
- RLS complete
- auth stable
- routes privees
- role gates front
- pages coeur branchees
- toasts d'erreur
- tests minimaux
- README mis a jour

---

## Checklist Produit V2

- onboarding clair
- 1ere connexion simple
- navigation lisible
- roles comprenables
- actions critiques protegees
- campagne envoyable
- dashboard utile
- settings credibles

---

## Risques A Anticiper

- policies RLS trop strictes ou trop ouvertes
- confusion entre logique serveur et logique client sous App Router
- duplication de logique auth
- roles geres seulement en UI
- statut email non fiable sans webhook
- org_id modifie sans migration associee

---

## Recommandations De Refactor

- garder `app/` comme seule convention de routing front
- centraliser les pages role-based via wrappers simples
- factoriser la logique Supabase dans `services/`
- separer UI, logique et fetch
- ajouter types BDD stricts
- ajouter tests sur auth, roles et policies

---

## Definition Of Done V2

La V2 est consideree terminee quand :

- un utilisateur peut s'inscrire et se connecter
- son profil et son org sont coherents en base
- un owner peut gerer son organisation
- un admin peut gerer les operations courantes
- un member peut consulter les donnees
- contacts, avis, campagnes et parametres fonctionnent avec Supabase
- les droits sont respectes cote front et cote RLS
- la doc est a jour
