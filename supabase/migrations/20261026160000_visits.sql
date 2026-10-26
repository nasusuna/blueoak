-- Visits. Closing preventive maintenance books the next due date from the previous due date.

create or replace function public.record_visit(
  p_unit_id uuid,
  p_type text,
  p_event_date date,
  p_complaint text,
  p_work_done text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  tenant uuid;
  actor uuid;
  interval_months integer;
  found_status public.unit_status;
  schedule_id uuid;
  current_due date;
  next_due date;
  event_id uuid;
begin
  if public.current_user_role() not in ('owner', 'technician') then
    raise exception 'Only an owner or technician can record a visit' using errcode = '42501';
  end if;

  tenant := public.current_tenant_id();

  if tenant is null or p_event_date is null then
    raise exception 'Missing tenant or visit date' using errcode = '42501';
  end if;

  if p_type not in ('breakdown', 'preventive') then
    raise exception 'Visit type must be breakdown or preventive' using errcode = '22023';
  end if;

  select id into actor
  from public.profiles
  where user_id = auth.uid() and tenant_id = tenant;

  if actor is null then
    raise exception 'Staff profile was not found' using errcode = '42501';
  end if;

  select pmd_interval_months, status
  into interval_months, found_status
  from public.units
  where id = p_unit_id and tenant_id = tenant;

  if interval_months is null then
    raise exception 'Unit does not belong to this business' using errcode = '42501';
  end if;

  if found_status <> 'active' then
    raise exception 'This machine is inactive' using errcode = '22023';
  end if;

  if interval_months not in (3, 6) then
    raise exception 'PMD interval must be 3 or 6 months' using errcode = '22023';
  end if;

  if p_type = 'preventive' then
    select id, due_date
    into schedule_id, current_due
    from public.pmd_schedule
    where unit_id = p_unit_id
      and tenant_id = tenant
      and completed_on is null
    order by due_date
    limit 1
    for update;

    if schedule_id is null then
      raise exception 'This machine has no open preventive-maintenance date' using errcode = 'P0002';
    end if;

    next_due := (current_due + make_interval(months => interval_months))::date;
  end if;

  insert into public.service_events (
    tenant_id,
    unit_id,
    type,
    event_date,
    technician_id,
    complaint,
    work_done,
    status,
    billable,
    created_by
  ) values (
    tenant,
    p_unit_id,
    p_type::public.service_event_type,
    p_event_date,
    actor,
    nullif(btrim(coalesce(p_complaint, '')), ''),
    nullif(btrim(coalesce(p_work_done, '')), ''),
    'completed',
    false,
    auth.uid()
  )
  returning id into event_id;

  if p_type = 'breakdown' then
    return event_id;
  end if;

  update public.pmd_schedule
  set completed_on = p_event_date,
      completed_event_id = event_id
  where id = schedule_id;

  insert into public.pmd_schedule (
    tenant_id,
    unit_id,
    due_date,
    created_by
  ) values (
    tenant,
    p_unit_id,
    next_due,
    auth.uid()
  );

  return event_id;
end;
$$;

create or replace function public.skip_pmd(
  p_unit_id uuid,
  p_skipped_on date,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  tenant uuid;
  interval_months integer;
  found_status public.unit_status;
  schedule_id uuid;
  current_due date;
  next_due date;
  next_id uuid;
begin
  if public.current_user_role() not in ('owner', 'technician') then
    raise exception 'Only an owner or technician can skip a visit' using errcode = '42501';
  end if;

  tenant := public.current_tenant_id();

  if tenant is null or p_skipped_on is null then
    raise exception 'Missing tenant or skip date' using errcode = '42501';
  end if;

  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Enter why this visit was skipped' using errcode = '22023';
  end if;

  select pmd_interval_months, status
  into interval_months, found_status
  from public.units
  where id = p_unit_id and tenant_id = tenant;

  if interval_months is null then
    raise exception 'Unit does not belong to this business' using errcode = '42501';
  end if;

  if found_status <> 'active' then
    raise exception 'This machine is inactive' using errcode = '22023';
  end if;

  select id, due_date
  into schedule_id, current_due
  from public.pmd_schedule
  where unit_id = p_unit_id
    and tenant_id = tenant
    and completed_on is null
  order by due_date
  limit 1
  for update;

  if schedule_id is null then
    raise exception 'This machine has no open preventive-maintenance date' using errcode = 'P0002';
  end if;

  next_due := (current_due + make_interval(months => interval_months))::date;

  update public.pmd_schedule
  set completed_on = p_skipped_on,
      skip_reason = btrim(p_reason)
  where id = schedule_id;

  insert into public.pmd_schedule (
    tenant_id,
    unit_id,
    due_date,
    created_by
  ) values (
    tenant,
    p_unit_id,
    next_due,
    auth.uid()
  )
  returning id into next_id;

  return next_id;
end;
$$;

revoke all on function public.record_visit(uuid, text, date, text, text) from public, anon;
revoke all on function public.skip_pmd(uuid, date, text) from public, anon;
grant execute on function public.record_visit(uuid, text, date, text, text) to authenticated;
grant execute on function public.skip_pmd(uuid, date, text) to authenticated;
