-- Week 1: tenants, staff profiles, JWT claims, and row-level security.
-- Custom claims are tenant_id and user_role. The JWT role claim stays "authenticated".

create type public.user_role as enum ('platform_admin', 'owner', 'technician', 'customer');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gstin text,
  logo_path text,
  plan text not null default 'pilot',
  settings jsonb not null default jsonb_build_object(
    'reminder_days', 7,
    'default_pmd_months', 6,
    'report_template', 'generic'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  constraint tenants_name_not_blank check (length(btrim(name)) > 0),
  constraint tenants_settings_object check (jsonb_typeof(settings) = 'object'),
  constraint tenants_reminder_days check (
    (settings ->> 'reminder_days') ~ '^[0-9]+$'
    and (settings ->> 'reminder_days')::integer between 0 and 90
  ),
  constraint tenants_pmd_interval check ((settings ->> 'default_pmd_months') in ('3', '6'))
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  role public.user_role not null,
  full_name text not null,
  mobile text,
  customer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint profiles_name_not_blank check (length(btrim(full_name)) > 0)
);

comment on column public.profiles.customer_id is
  'Set for customer logins. The customers table and foreign key arrive with the customer master.';

create index profiles_tenant_id_idx on public.profiles (tenant_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_set_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
set search_path = ''
as $$
  select auth.jwt() ->> 'user_role';
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_user_role() = 'platform_admin';
$$;

create or replace function public.protect_tenant_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'Cannot change tenant id' using errcode = '42501';
  end if;

  if new.plan is distinct from old.plan and public.current_user_role() is distinct from 'platform_admin' then
    raise exception 'Only a platform admin can change the plan' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger tenants_protect_plan
before update on public.tenants
for each row execute function public.protect_tenant_plan();

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if old.user_id = auth.uid() and (
    new.role is distinct from old.role
    or new.tenant_id is distinct from old.tenant_id
    or new.user_id is distinct from old.user_id
    or new.customer_id is distinct from old.customer_id
  ) then
    raise exception 'Cannot change your own role or tenant' using errcode = '42501';
  end if;

  if new.user_id is distinct from old.user_id
    or new.tenant_id is distinct from old.tenant_id
    or new.customer_id is distinct from old.customer_id then
    raise exception 'Cannot change user, tenant, or customer on a profile' using errcode = '42501';
  end if;

  if new.role is distinct from old.role then
    if public.current_user_role() = 'platform_admin' then
      return new;
    end if;

    if public.current_user_role() = 'owner'
      and old.tenant_id = public.current_tenant_id()
      and new.role::text in ('owner', 'technician', 'customer') then
      return new;
    end if;

    raise exception 'Cannot change this role' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();

-- Runs when Supabase Auth issues a token. Returns the claims object Auth expects.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb;
  profile_role public.user_role;
  profile_tenant uuid;
  profile_customer uuid;
begin
  select role, tenant_id, customer_id
  into profile_role, profile_tenant, profile_customer
  from public.profiles
  where user_id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if profile_role is null then
    return jsonb_build_object('claims', claims);
  end if;

  claims := jsonb_set(claims, '{user_role}', to_jsonb(profile_role));
  claims := jsonb_set(claims, '{tenant_id}', to_jsonb(profile_tenant));

  if profile_customer is not null then
    claims := jsonb_set(claims, '{customer_id}', to_jsonb(profile_customer));
  else
    claims := claims - 'customer_id';
  end if;

  return jsonb_build_object('claims', claims);
end;
$$;

revoke all on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;

create policy tenants_select
on public.tenants
for select
to authenticated
using (
  public.is_platform_admin()
  or id = (select public.current_tenant_id())
);

create policy tenants_insert
on public.tenants
for insert
to authenticated
with check (public.is_platform_admin());

create policy tenants_update
on public.tenants
for update
to authenticated
using (
  public.is_platform_admin()
  or (id = (select public.current_tenant_id()) and public.current_user_role() = 'owner')
)
with check (
  public.is_platform_admin()
  or (id = (select public.current_tenant_id()) and public.current_user_role() = 'owner')
);

create policy profiles_select
on public.profiles
for select
to authenticated
using (
  public.is_platform_admin()
  or user_id = (select auth.uid())
  or (
    tenant_id = (select public.current_tenant_id())
    and public.current_user_role() in ('owner', 'technician')
  )
);

create policy profiles_insert
on public.profiles
for insert
to authenticated
with check (
  public.is_platform_admin()
  or (
    public.current_user_role() = 'owner'
    and tenant_id = (select public.current_tenant_id())
    and role::text in ('owner', 'technician', 'customer')
  )
);

create policy profiles_update
on public.profiles
for update
to authenticated
using (
  public.is_platform_admin()
  or user_id = (select auth.uid())
  or (
    tenant_id = (select public.current_tenant_id())
    and public.current_user_role() = 'owner'
  )
)
with check (
  public.is_platform_admin()
  or user_id = (select auth.uid())
  or (
    tenant_id = (select public.current_tenant_id())
    and public.current_user_role() = 'owner'
    and role::text <> 'platform_admin'
  )
);

revoke all on table public.tenants from public, anon, authenticated;
revoke all on table public.profiles from public, anon, authenticated;

grant select on table public.tenants to anon;
grant select on table public.profiles to anon;
grant select, insert, update on table public.tenants to authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant all on table public.tenants to service_role;
grant all on table public.profiles to service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    execute 'grant usage on schema public to supabase_auth_admin';
    execute 'grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin';
    execute 'grant select on table public.profiles to supabase_auth_admin';
    execute $policy$
      create policy profiles_auth_admin_select
      on public.profiles
      for select
      to supabase_auth_admin
      using (true)
    $policy$;
  end if;
end $$;
