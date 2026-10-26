begin;

select plan(29);

insert into auth.users (id, email)
values
  ('d1000000-0000-4000-8000-000000000001', 'owner-a@visits.test'),
  ('d1000000-0000-4000-8000-000000000002', 'tech-a@visits.test'),
  ('d1000000-0000-4000-8000-000000000003', 'customer-a@visits.test'),
  ('d1000000-0000-4000-8000-000000000004', 'owner-b@visits.test');

insert into public.tenants (id, name)
values
  ('d2000000-0000-4000-8000-000000000001', 'Visit Tenant A'),
  ('d2000000-0000-4000-8000-000000000002', 'Visit Tenant B');

insert into public.profiles (user_id, tenant_id, role, full_name)
values
  ('d1000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'owner', 'Owner A'),
  ('d1000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000001', 'technician', 'Tech A'),
  ('d1000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000001', 'customer', 'Customer A'),
  ('d1000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000002', 'owner', 'Owner B');

select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'd1000000-0000-4000-8000-000000000001',
    'role', 'authenticated',
    'tenant_id', 'd2000000-0000-4000-8000-000000000001',
    'user_role', 'owner'
  )::text,
  true
);
set local role authenticated;

select lives_ok(
  $$insert into public.customers (id, tenant_id, name)
    values ('d3000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'City Lab')$$,
  'owner can add a customer'
);

select lives_ok(
  $$insert into public.equipment_types (id, tenant_id, name)
    values ('d3000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000001', 'Analyzer')$$,
  'owner can add an equipment type'
);

reset role;

update public.profiles
set customer_id = 'd3000000-0000-4000-8000-000000000001'
where user_id = 'd1000000-0000-4000-8000-000000000003';

set local role authenticated;

select lives_ok(
  $$select public.install_unit(
    'd3000000-0000-4000-8000-000000000001',
    'd3000000-0000-4000-8000-000000000002',
    'Mindray',
    'BS-240',
    'SN-VIS',
    '2026-01-15',
    6,
    '2026-01-15'
  )$$,
  'installs a machine with a first due date'
);

select lives_ok(
  $$select public.record_visit(
    (select id from public.units where serial_no = 'SN-VIS'),
    'breakdown',
    '2026-02-01',
    'No display',
    'Checked the power supply'
  )$$,
  'owner can record a breakdown'
);

select is(
  (
    select due_date::text
    from public.pmd_schedule
    where unit_id = (select id from public.units where serial_no = 'SN-VIS')
      and completed_on is null
  ),
  '2026-07-15',
  'a breakdown leaves the open due date in place'
);

select lives_ok(
  $$select public.record_visit(
    (select id from public.units where serial_no = 'SN-VIS'),
    'preventive',
    '2026-07-20',
    '',
    'Replaced the lamp'
  )$$,
  'owner can close a preventive visit'
);

select is(
  (
    select completed_on::text
    from public.pmd_schedule
    where unit_id = (select id from public.units where serial_no = 'SN-VIS')
      and due_date = '2026-07-15'
  ),
  '2026-07-20',
  'the closed row records the visit date'
);

select is(
  (
    select due_date::text
    from public.pmd_schedule
    where unit_id = (select id from public.units where serial_no = 'SN-VIS')
      and completed_on is null
  ),
  '2027-01-15',
  'the next due date is the previous due date plus six months'
);

select lives_ok(
  $$select public.record_visit(
    (select id from public.units where serial_no = 'SN-VIS'),
    'preventive',
    '2027-01-10',
    '',
    'Early service'
  )$$,
  'a second preventive visit closes the new due date'
);

select is(
  (
    select due_date::text
    from public.pmd_schedule
    where unit_id = (select id from public.units where serial_no = 'SN-VIS')
      and completed_on is null
  ),
  '2027-07-15',
  'the following due date stays on the original calendar'
);

select lives_ok(
  $$select public.install_unit(
    'd3000000-0000-4000-8000-000000000001',
    'd3000000-0000-4000-8000-000000000002',
    '',
    '',
    'SN-END',
    '2026-08-31',
    6,
    '2026-08-31'
  )$$,
  'installs a month-end machine'
);

select lives_ok(
  $$select public.record_visit(
    (select id from public.units where serial_no = 'SN-END'),
    'preventive',
    '2027-03-01',
    '',
    'Month-end service'
  )$$,
  'closes a month-end due date'
);

select is(
  (
    select due_date::text
    from public.pmd_schedule
    where unit_id = (select id from public.units where serial_no = 'SN-END')
      and completed_on is null
  ),
  '2027-08-28',
  '28 February plus six months is 28 August'
);

select lives_ok(
  $$select public.install_unit(
    'd3000000-0000-4000-8000-000000000001',
    'd3000000-0000-4000-8000-000000000002',
    '',
    '',
    'SN-Q',
    '2026-01-31',
    3,
    '2026-01-31'
  )$$,
  'installs a three month machine'
);

select lives_ok(
  $$select public.record_visit(
    (select id from public.units where serial_no = 'SN-Q'),
    'preventive',
    '2026-05-01',
    '',
    'Quarterly service'
  )$$,
  'closes a three month due date'
);

select is(
  (
    select due_date::text
    from public.pmd_schedule
    where unit_id = (select id from public.units where serial_no = 'SN-Q')
      and completed_on is null
  ),
  '2026-07-30',
  '30 April plus three months is 30 July'
);

select lives_ok(
  $$select public.install_unit(
    'd3000000-0000-4000-8000-000000000001',
    'd3000000-0000-4000-8000-000000000002',
    '',
    '',
    'SN-SKIP',
    '2026-01-15',
    6,
    '2026-01-15'
  )$$,
  'installs a machine that will be skipped'
);

select lives_ok(
  $$select public.skip_pmd(
    (select id from public.units where serial_no = 'SN-SKIP'),
    '2026-07-01',
    'Lab closed'
  )$$,
  'owner can skip a due date'
);

select is(
  (
    select skip_reason
    from public.pmd_schedule
    where unit_id = (select id from public.units where serial_no = 'SN-SKIP')
      and completed_on is not null
  ),
  'Lab closed',
  'a skipped row keeps the reason'
);

select is(
  (
    select count(*)::integer
    from public.service_events
    where unit_id = (select id from public.units where serial_no = 'SN-SKIP')
      and type = 'preventive'
  ),
  0,
  'skipping does not write a preventive visit'
);

select is(
  (
    select due_date::text
    from public.pmd_schedule
    where unit_id = (select id from public.units where serial_no = 'SN-SKIP')
      and completed_on is null
  ),
  '2027-01-15',
  'a skip still books the next due date from the previous one'
);

select throws_ok(
  $$insert into public.service_events (tenant_id, unit_id, type, event_date, status)
    values (
      'd2000000-0000-4000-8000-000000000001',
      (select id from public.units where serial_no = 'SN-VIS'),
      'breakdown',
      '2026-02-02',
      'completed'
    )$$,
  '42501',
  NULL,
  'staff cannot insert a visit directly'
);

reset role;

delete from public.pmd_schedule
where unit_id = (select id from public.units where serial_no = 'SN-Q')
  and completed_on is null;

set local role authenticated;

select throws_ok(
  $$select public.record_visit(
    (select id from public.units where serial_no = 'SN-Q'),
    'preventive',
    '2026-08-01',
    '',
    'No open date'
  )$$,
  'P0002',
  NULL,
  'a preventive visit needs an open due date'
);

reset role;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000004', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'd1000000-0000-4000-8000-000000000004',
    'role', 'authenticated',
    'tenant_id', 'd2000000-0000-4000-8000-000000000002',
    'user_role', 'owner'
  )::text,
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.service_events),
  0,
  'owner B cannot see tenant A visits'
);

reset role;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'd1000000-0000-4000-8000-000000000002',
    'role', 'authenticated',
    'tenant_id', 'd2000000-0000-4000-8000-000000000001',
    'user_role', 'technician'
  )::text,
  true
);
set local role authenticated;

select lives_ok(
  $$select public.record_visit(
    (select id from public.units where serial_no = 'SN-VIS'),
    'breakdown',
    '2026-03-01',
    'Pump noise',
    'Tightened the fitting'
  )$$,
  'technician can record a breakdown'
);

select is(
  (
    select due_date::text
    from public.pmd_schedule
    where unit_id = (select id from public.units where serial_no = 'SN-VIS')
      and completed_on is null
  ),
  '2027-07-15',
  'the technician breakdown leaves the open due date in place'
);

reset role;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000003', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'd1000000-0000-4000-8000-000000000003',
    'role', 'authenticated',
    'tenant_id', 'd2000000-0000-4000-8000-000000000001',
    'user_role', 'customer',
    'customer_id', 'd3000000-0000-4000-8000-000000000001'
  )::text,
  true
);
set local role authenticated;

select is(
  (
    select count(*)::integer
    from public.service_events
    where unit_id = (select id from public.units where serial_no = 'SN-VIS')
      and type = 'preventive'
  ),
  2,
  'customer sees the preventive visits for their machine'
);

select throws_ok(
  $$select public.record_visit(
    (select id from public.units where serial_no = 'SN-VIS'),
    'breakdown',
    '2026-03-02',
    '',
    ''
  )$$,
  '42501',
  NULL,
  'a customer cannot record a visit'
);

reset role;
set local role anon;

select throws_ok(
  $$select count(*) from public.service_events$$,
  '42501',
  NULL,
  'anonymous cannot read visits'
);

select * from finish();

rollback;
