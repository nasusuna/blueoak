-- Customers, equipment, chemicals, and the installation that books the first PMD.

create type public.chemical_category as enum (
  'reagents',
  'biochemistry',
  'hematology',
  'rapid_cards',
  'consumables'
);

create type public.unit_status as enum ('active', 'inactive');

create type public.service_event_type as enum ('installation', 'breakdown', 'preventive');

create type public.service_event_status as enum ('open', 'completed');

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  name text not null,
  contact_person text,
  mobile text,
  whatsapp text,
  email text,
  address text,
  city text,
  pin text,
  gstin text,
  tally_ledger_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint customers_name_not_blank check (length(btrim(name)) > 0)
);

create table public.equipment_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  name text not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint equipment_types_name_not_blank check (length(btrim(name)) > 0),
  constraint equipment_types_tenant_name_key unique (tenant_id, name)
);

create table public.chemicals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  name text not null,
  category public.chemical_category not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint chemicals_name_not_blank check (length(btrim(name)) > 0),
  constraint chemicals_tenant_name_key unique (tenant_id, name)
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  equipment_type_id uuid not null references public.equipment_types (id) on delete restrict,
  make text,
  model text,
  serial_no text not null,
  installed_on date not null,
  pmd_interval_months integer not null default 6,
  pmd_start_date date not null,
  status public.unit_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint units_serial_not_blank check (length(btrim(serial_no)) > 0),
  constraint units_interval_check check (pmd_interval_months in (3, 6)),
  constraint units_start_after_install check (pmd_start_date >= installed_on),
  constraint units_tenant_serial_key unique (tenant_id, serial_no)
);

create table public.service_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  unit_id uuid not null references public.units (id) on delete restrict,
  type public.service_event_type not null,
  event_date date not null,
  technician_id uuid references public.profiles (id) on delete set null,
  complaint text,
  work_done text,
  status public.service_event_status not null default 'open',
  billable boolean not null default false,
  amount numeric(12, 2),
  invoice_ref text,
  request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create table public.pmd_schedule (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  unit_id uuid not null references public.units (id) on delete restrict,
  due_date date not null,
  completed_on date,
  completed_event_id uuid references public.service_events (id) on delete set null,
  skip_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

alter table public.profiles
  add constraint profiles_customer_id_fkey
  foreign key (customer_id) references public.customers (id) on delete restrict;

create index customers_tenant_id_idx on public.customers (tenant_id);
create index equipment_types_tenant_id_idx on public.equipment_types (tenant_id);
create index chemicals_tenant_id_idx on public.chemicals (tenant_id);
create index units_tenant_id_idx on public.units (tenant_id);
create index units_customer_id_idx on public.units (customer_id);
create index service_events_tenant_id_idx on public.service_events (tenant_id);
create index service_events_unit_id_idx on public.service_events (unit_id);
create index pmd_schedule_tenant_due_idx on public.pmd_schedule (tenant_id, due_date);

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger equipment_types_set_updated_at
before update on public.equipment_types
for each row execute function public.set_updated_at();

create trigger chemicals_set_updated_at
before update on public.chemicals
for each row execute function public.set_updated_at();

create trigger units_set_updated_at
before update on public.units
for each row execute function public.set_updated_at();

create trigger service_events_set_updated_at
before update on public.service_events
for each row execute function public.set_updated_at();

create trigger pmd_schedule_set_updated_at
before update on public.pmd_schedule
for each row execute function public.set_updated_at();

create or replace function public.protect_tenant_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.tenant_id is distinct from old.tenant_id then
    raise exception 'Cannot change tenant' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger customers_protect_tenant
before update on public.customers
for each row execute function public.protect_tenant_id();

create trigger equipment_types_protect_tenant
before update on public.equipment_types
for each row execute function public.protect_tenant_id();

create trigger chemicals_protect_tenant
before update on public.chemicals
for each row execute function public.protect_tenant_id();

create trigger units_protect_tenant
before update on public.units
for each row execute function public.protect_tenant_id();

create trigger service_events_protect_tenant
before update on public.service_events
for each row execute function public.protect_tenant_id();

create trigger pmd_schedule_protect_tenant
before update on public.pmd_schedule
for each row execute function public.protect_tenant_id();

create or replace function public.units_same_tenant()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.customers
    where id = new.customer_id and tenant_id = new.tenant_id
  ) then
    raise exception 'Customer does not belong to this business' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.equipment_types
    where id = new.equipment_type_id and tenant_id = new.tenant_id
  ) then
    raise exception 'Equipment type does not belong to this business' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger units_same_tenant
before insert or update on public.units
for each row execute function public.units_same_tenant();

create or replace function public.service_events_same_tenant()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.units
    where id = new.unit_id and tenant_id = new.tenant_id
  ) then
    raise exception 'Unit does not belong to this business' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger service_events_same_tenant
before insert or update on public.service_events
for each row execute function public.service_events_same_tenant();

create or replace function public.pmd_schedule_same_tenant()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.units
    where id = new.unit_id and tenant_id = new.tenant_id
  ) then
    raise exception 'Unit does not belong to this business' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger pmd_schedule_same_tenant
before insert or update on public.pmd_schedule
for each row execute function public.pmd_schedule_same_tenant();

create or replace function public.current_customer_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'customer_id', '')::uuid;
$$;

create or replace function public.is_tenant_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_user_role() in ('owner', 'technician');
$$;

-- One transaction: unit, installation visit, and the first due date.
create or replace function public.install_unit(
  p_customer_id uuid,
  p_equipment_type_id uuid,
  p_make text,
  p_model text,
  p_serial_no text,
  p_installed_on date,
  p_pmd_interval_months integer,
  p_pmd_start_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  tenant uuid;
  actor uuid;
  new_unit_id uuid;
  due_date date;
begin
  if public.current_user_role() not in ('owner', 'technician') then
    raise exception 'Only an owner or technician can install a unit' using errcode = '42501';
  end if;

  tenant := public.current_tenant_id();

  if tenant is null then
    raise exception 'Missing tenant' using errcode = '42501';
  end if;

  if p_pmd_interval_months not in (3, 6) then
    raise exception 'PMD interval must be 3 or 6 months' using errcode = '22023';
  end if;

  if p_pmd_start_date < p_installed_on then
    raise exception 'PMD start date cannot be before the installation date' using errcode = '22023';
  end if;

  if length(btrim(coalesce(p_serial_no, ''))) = 0 then
    raise exception 'Enter a serial number' using errcode = '22023';
  end if;

  select id into actor
  from public.profiles
  where user_id = auth.uid() and tenant_id = tenant;

  if actor is null then
    raise exception 'Staff profile was not found' using errcode = '42501';
  end if;

  due_date := (p_pmd_start_date + make_interval(months => p_pmd_interval_months))::date;

  insert into public.units (
    tenant_id,
    customer_id,
    equipment_type_id,
    make,
    model,
    serial_no,
    installed_on,
    pmd_interval_months,
    pmd_start_date,
    status,
    created_by
  ) values (
    tenant,
    p_customer_id,
    p_equipment_type_id,
    nullif(btrim(coalesce(p_make, '')), ''),
    nullif(btrim(coalesce(p_model, '')), ''),
    btrim(p_serial_no),
    p_installed_on,
    p_pmd_interval_months,
    p_pmd_start_date,
    'active',
    auth.uid()
  )
  returning id into new_unit_id;

  insert into public.service_events (
    tenant_id,
    unit_id,
    type,
    event_date,
    technician_id,
    status,
    billable,
    created_by
  ) values (
    tenant,
    new_unit_id,
    'installation',
    p_installed_on,
    actor,
    'completed',
    false,
    auth.uid()
  );

  insert into public.pmd_schedule (
    tenant_id,
    unit_id,
    due_date,
    created_by
  ) values (
    tenant,
    new_unit_id,
    due_date,
    auth.uid()
  );

  return new_unit_id;
end;
$$;

revoke all on function public.install_unit(uuid, uuid, text, text, text, date, integer, date) from public, anon;
grant execute on function public.install_unit(uuid, uuid, text, text, text, date, integer, date) to authenticated;

alter table public.customers enable row level security;
alter table public.equipment_types enable row level security;
alter table public.chemicals enable row level security;
alter table public.units enable row level security;
alter table public.service_events enable row level security;
alter table public.pmd_schedule enable row level security;

create policy customers_select on public.customers
for select to authenticated
using (
  public.is_platform_admin()
  or (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff())
  or (public.current_user_role() = 'customer' and id = (select public.current_customer_id()))
);

create policy customers_insert on public.customers
for insert to authenticated
with check (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff());

create policy customers_update on public.customers
for update to authenticated
using (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff())
with check (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff());

create policy equipment_types_select on public.equipment_types
for select to authenticated
using (
  public.is_platform_admin()
  or (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff())
);

create policy equipment_types_insert on public.equipment_types
for insert to authenticated
with check (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff());

create policy equipment_types_update on public.equipment_types
for update to authenticated
using (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff())
with check (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff());

create policy chemicals_select on public.chemicals
for select to authenticated
using (
  public.is_platform_admin()
  or (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff())
);

create policy chemicals_insert on public.chemicals
for insert to authenticated
with check (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff());

create policy chemicals_update on public.chemicals
for update to authenticated
using (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff())
with check (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff());

create policy units_select on public.units
for select to authenticated
using (
  public.is_platform_admin()
  or (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff())
  or (public.current_user_role() = 'customer' and customer_id = (select public.current_customer_id()))
);

create policy units_update on public.units
for update to authenticated
using (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff())
with check (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff());

create policy service_events_select on public.service_events
for select to authenticated
using (
  public.is_platform_admin()
  or (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff())
  or (
    public.current_user_role() = 'customer'
    and exists (
      select 1 from public.units
      where units.id = service_events.unit_id
        and units.customer_id = (select public.current_customer_id())
    )
  )
);

create policy pmd_schedule_select on public.pmd_schedule
for select to authenticated
using (
  public.is_platform_admin()
  or (tenant_id = (select public.current_tenant_id()) and public.is_tenant_staff())
  or (
    public.current_user_role() = 'customer'
    and exists (
      select 1 from public.units
      where units.id = pmd_schedule.unit_id
        and units.customer_id = (select public.current_customer_id())
    )
  )
);

revoke all on table public.customers from public, anon, authenticated;
revoke all on table public.equipment_types from public, anon, authenticated;
revoke all on table public.chemicals from public, anon, authenticated;
revoke all on table public.units from public, anon, authenticated;
revoke all on table public.service_events from public, anon, authenticated;
revoke all on table public.pmd_schedule from public, anon, authenticated;

grant select, insert, update on table public.customers to authenticated;
grant select, insert, update on table public.equipment_types to authenticated;
grant select, insert, update on table public.chemicals to authenticated;
grant select, update on table public.units to authenticated;
grant select on table public.service_events to authenticated;
grant select on table public.pmd_schedule to authenticated;

grant all on table public.customers to service_role;
grant all on table public.equipment_types to service_role;
grant all on table public.chemicals to service_role;
grant all on table public.units to service_role;
grant all on table public.service_events to service_role;
grant all on table public.pmd_schedule to service_role;
