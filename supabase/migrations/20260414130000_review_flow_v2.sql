create extension if not exists pgcrypto;

-- Cleanup legacy auth triggers/functions that may fail with the V2 profiles schema/RLS.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;
drop trigger if exists handle_new_user on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.handle_auth_user_created();
drop function if exists public.handle_auth_user_updated();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete set null,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  avatar_url text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe auth -> profile sync.
-- Important: this trigger must NEVER block signup, so it swallows any exception.
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, created_at, updated_at)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'member',
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();

  return new;
exception
  when others then
    return new;
end;
$$;

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    email = coalesce(new.email, public.profiles.email),
    full_name = coalesce(
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
      public.profiles.full_name
    ),
    updated_at = now()
  where id = new.id;

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_auth_user_updated();

create table if not exists public.organization_invites (
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

create table if not exists public.contacts (
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

create table if not exists public.reviews (
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

create table if not exists public.review_analysis (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  sentiment_label text,
  sentiment_score numeric,
  themes text[] not null default '{}'::text[],
  summary text,
  generated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
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

create table if not exists public.campaign_recipients (
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

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  provider text not null default 'stripe',
  provider_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'inactive',
  renews_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
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

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists contacts_org_email_unique on public.contacts(org_id, email);
create unique index if not exists campaign_recipients_campaign_email_unique on public.campaign_recipients(campaign_id, email);
create unique index if not exists reviews_org_external_unique
  on public.reviews(org_id, external_id)
  where external_id is not null;
create unique index if not exists organization_invites_org_email_pending_unique
  on public.organization_invites(org_id, lower(email))
  where status = 'pending';

create index if not exists profiles_org_idx on public.profiles(org_id);
create index if not exists contacts_org_email_idx on public.contacts(org_id, email);
create index if not exists reviews_org_published_idx on public.reviews(org_id, published_at desc);
create index if not exists campaigns_org_created_idx on public.campaigns(org_id, created_at desc);
create index if not exists organization_invites_org_email_status_idx on public.organization_invites(org_id, email, status);

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_organization_invites_updated_at on public.organization_invites;
create trigger set_organization_invites_updated_at
before update on public.organization_invites
for each row execute function public.set_updated_at();

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.org_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = target_org_id
  )
$$;

create or replace function public.is_org_admin(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = target_org_id
      and p.role in ('admin', 'owner')
  )
$$;

create or replace function public.is_org_owner(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = target_org_id
      and p.role = 'owner'
  )
$$;

grant execute on function public.current_org_id() to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.is_org_owner(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_invites enable row level security;
alter table public.contacts enable row level security;
alter table public.reviews enable row level security;
alter table public.review_analysis enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member
on public.organizations
for select
to authenticated
using (public.is_org_member(id));

drop policy if exists organizations_insert_authenticated on public.organizations;
create policy organizations_insert_authenticated
on public.organizations
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists organizations_owner_update on public.organizations;
create policy organizations_owner_update
on public.organizations
for update
to authenticated
using (public.is_org_owner(id))
with check (public.is_org_owner(id));

drop policy if exists organizations_owner_delete on public.organizations;
create policy organizations_owner_delete
on public.organizations
for delete
to authenticated
using (public.is_org_owner(id));

drop policy if exists profiles_select_org_members on public.profiles;
create policy profiles_select_org_members
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or (org_id is not null and public.is_org_member(org_id))
);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_self_or_owner on public.profiles;
create policy profiles_update_self_or_owner
on public.profiles
for update
to authenticated
using (id = auth.uid() or (org_id is not null and public.is_org_owner(org_id)))
with check (id = auth.uid() or (org_id is not null and public.is_org_owner(org_id)));

drop policy if exists profiles_owner_delete on public.profiles;
create policy profiles_owner_delete
on public.profiles
for delete
to authenticated
using (org_id is not null and public.is_org_owner(org_id) and id <> auth.uid());

drop policy if exists invites_select_org_members on public.organization_invites;
create policy invites_select_org_members
on public.organization_invites
for select
to authenticated
using (public.is_org_member(org_id));

drop policy if exists invites_insert_admin_owner on public.organization_invites;
create policy invites_insert_admin_owner
on public.organization_invites
for insert
to authenticated
with check (
  public.is_org_admin(org_id)
  and (
    (public.current_role() = 'owner' and role in ('admin', 'member'))
    or (public.current_role() = 'admin' and role = 'member')
  )
);

drop policy if exists invites_update_admin_owner on public.organization_invites;
create policy invites_update_admin_owner
on public.organization_invites
for update
to authenticated
using (
  public.is_org_admin(org_id)
  and (
    (public.current_role() = 'owner')
    or (public.current_role() = 'admin' and role = 'member')
  )
)
with check (
  public.is_org_admin(org_id)
  and (
    (public.current_role() = 'owner')
    or (public.current_role() = 'admin' and role = 'member')
  )
);

drop policy if exists invites_delete_admin_owner on public.organization_invites;
create policy invites_delete_admin_owner
on public.organization_invites
for delete
to authenticated
using (
  public.is_org_admin(org_id)
  and (
    (public.current_role() = 'owner')
    or (public.current_role() = 'admin' and role = 'member')
  )
);

drop policy if exists contacts_select_member on public.contacts;
create policy contacts_select_member
on public.contacts
for select
to authenticated
using (public.is_org_member(org_id));

drop policy if exists contacts_manage_admin on public.contacts;
create policy contacts_manage_admin
on public.contacts
for all
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists reviews_select_member on public.reviews;
create policy reviews_select_member
on public.reviews
for select
to authenticated
using (public.is_org_member(org_id));

drop policy if exists reviews_manage_admin on public.reviews;
create policy reviews_manage_admin
on public.reviews
for all
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists review_analysis_select_member on public.review_analysis;
create policy review_analysis_select_member
on public.review_analysis
for select
to authenticated
using (public.is_org_member(org_id));

drop policy if exists review_analysis_manage_admin on public.review_analysis;
create policy review_analysis_manage_admin
on public.review_analysis
for all
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists campaigns_select_member on public.campaigns;
create policy campaigns_select_member
on public.campaigns
for select
to authenticated
using (public.is_org_member(org_id));

drop policy if exists campaigns_manage_admin on public.campaigns;
create policy campaigns_manage_admin
on public.campaigns
for all
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists campaign_recipients_select_member on public.campaign_recipients;
create policy campaign_recipients_select_member
on public.campaign_recipients
for select
to authenticated
using (public.is_org_member(org_id));

drop policy if exists campaign_recipients_manage_admin on public.campaign_recipients;
create policy campaign_recipients_manage_admin
on public.campaign_recipients
for all
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists billing_customers_owner_all on public.billing_customers;
create policy billing_customers_owner_all
on public.billing_customers
for all
to authenticated
using (public.is_org_owner(org_id))
with check (public.is_org_owner(org_id));

drop policy if exists subscriptions_owner_all on public.subscriptions;
create policy subscriptions_owner_all
on public.subscriptions
for all
to authenticated
using (public.is_org_owner(org_id))
with check (public.is_org_owner(org_id));

drop policy if exists invoices_owner_all on public.invoices;
create policy invoices_owner_all
on public.invoices
for all
to authenticated
using (public.is_org_owner(org_id))
with check (public.is_org_owner(org_id));

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
on public.audit_logs
for select
to authenticated
using (public.is_org_admin(org_id));

drop policy if exists audit_logs_insert_admin on public.audit_logs;
create policy audit_logs_insert_admin
on public.audit_logs
for insert
to authenticated
with check (public.is_org_admin(org_id));

drop view if exists public.dashboard_summary;
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

grant select on public.dashboard_summary to authenticated;
