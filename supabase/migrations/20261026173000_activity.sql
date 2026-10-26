-- Short notes for the staff updates list. Upcoming service dates are read from pmd_schedule.

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  kind text not null,
  summary text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint activity_summary_not_blank check (length(btrim(summary)) > 0)
);

create index activity_tenant_created_idx on public.activity (tenant_id, created_at desc);

alter table public.activity enable row level security;

create policy activity_select on public.activity
for select to authenticated
using (
  public.is_platform_admin()
  or (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff())
);

create policy activity_insert on public.activity
for insert to authenticated
with check (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff());

revoke all on table public.activity from public, anon, authenticated;
grant select, insert on table public.activity to authenticated;
grant all on table public.activity to service_role;

insert into public.activity (tenant_id, kind, summary, created_at, created_by)
select tenant_id, 'customer_added', name || ' added', created_at, created_by
from public.customers;

insert into public.activity (tenant_id, kind, summary, created_at, created_by)
select units.tenant_id, 'unit_installed', units.serial_no || ' installed for ' || customers.name, units.created_at, units.created_by
from public.units
join public.customers on customers.id = units.customer_id;
