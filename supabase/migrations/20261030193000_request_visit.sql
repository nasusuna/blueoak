-- A lab login can ask for a visit. Recording a completed visit closes that request.

create or replace function public.request_visit(p_unit_id uuid, p_note text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  tenant uuid;
  lab uuid;
  lab_name text;
  serial text;
  found_status public.unit_status;
  note text;
  event_id uuid;
begin
  if public.current_user_role() is distinct from 'customer' then
    raise exception 'Only a lab login can request a visit' using errcode = '42501';
  end if;

  tenant := public.current_tenant_id();
  lab := public.current_customer_id();

  if tenant is null or lab is null then
    raise exception 'This login is not linked to a lab' using errcode = '42501';
  end if;

  note := nullif(btrim(coalesce(p_note, '')), '');

  if note is null then
    raise exception 'Describe the visit you need' using errcode = '22023';
  end if;

  if length(note) > 1000 then
    raise exception 'Keep the request under 1000 characters' using errcode = '22023';
  end if;

  select units.serial_no, units.status
  into serial, found_status
  from public.units
  where units.id = p_unit_id
    and units.tenant_id = tenant
    and units.customer_id = lab;

  if serial is null then
    raise exception 'Choose a machine at your lab' using errcode = '42501';
  end if;

  if found_status is distinct from 'active' then
    raise exception 'This machine is inactive' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.service_events
    where unit_id = p_unit_id
      and tenant_id = tenant
      and status = 'open'
  ) then
    raise exception 'A visit is already requested for this machine' using errcode = '23505';
  end if;

  insert into public.service_events (
    tenant_id,
    unit_id,
    type,
    event_date,
    complaint,
    status,
    billable,
    created_by
  ) values (
    tenant,
    p_unit_id,
    'breakdown',
    (timezone('Asia/Kolkata', now()))::date,
    note,
    'open',
    false,
    auth.uid()
  )
  returning id into event_id;

  select name into lab_name
  from public.customers
  where id = lab;

  insert into public.activity (tenant_id, kind, summary, created_by)
  values (
    tenant,
    'visit_requested',
    coalesce(lab_name, 'A lab') || ' requested a visit for ' || serial,
    auth.uid()
  );

  return event_id;
end;
$$;

revoke all on function public.request_visit(uuid, text) from public, anon;
grant execute on function public.request_visit(uuid, text) to authenticated;

create or replace function public.close_open_visit_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and new.technician_id is not null then
    update public.service_events
    set status = 'completed'
    where unit_id = new.unit_id
      and tenant_id = new.tenant_id
      and status = 'open'
      and id <> new.id;
  end if;

  return new;
end;
$$;

create trigger service_events_close_requests
after insert on public.service_events
for each row execute function public.close_open_visit_requests();
