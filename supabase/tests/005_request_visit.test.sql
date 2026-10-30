begin;

select plan(10);

insert into auth.users (id, email)
values
  ('d1000000-0000-4000-8000-000000000001', 'owner-a@request.test'),
  ('d1000000-0000-4000-8000-000000000003', 'customer-a@request.test');

insert into public.tenants (id, name)
values ('d2000000-0000-4000-8000-000000000001', 'Request Tenant');

insert into public.profiles (user_id, tenant_id, role, full_name)
values
  ('d1000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'owner', 'Owner A'),
  ('d1000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000001', 'customer', 'Customer A');

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

insert into public.customers (id, tenant_id, name)
values
  ('d3000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'City Lab'),
  ('d3000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000001', 'Other Lab');

insert into public.equipment_types (id, tenant_id, name)
values ('d3000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000001', 'Analyzer');

select public.install_unit(
  'd3000000-0000-4000-8000-000000000001',
  'd3000000-0000-4000-8000-000000000002',
  'Mindray',
  'BS-240',
  'RQ-100',
  '2026-01-15',
  6,
  '2026-01-15'
);

select public.install_unit(
  'd3000000-0000-4000-8000-000000000003',
  'd3000000-0000-4000-8000-000000000002',
  'Mindray',
  'BS-240',
  'RQ-200',
  '2026-01-15',
  6,
  '2026-01-15'
);

reset role;

select set_config('test.own_unit', (select id::text from public.units where serial_no = 'RQ-100'), true);
select set_config('test.other_unit', (select id::text from public.units where serial_no = 'RQ-200'), true);

update public.profiles
set customer_id = 'd3000000-0000-4000-8000-000000000001'
where user_id = 'd1000000-0000-4000-8000-000000000003';

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

select lives_ok(
  $$select public.request_visit(current_setting('test.own_unit')::uuid, 'Results are drifting')$$,
  'customer can request a visit'
);

select is(
  (
    select status::text
    from public.service_events
    where unit_id = (select id from public.units where serial_no = 'RQ-100')
      and status = 'open'
  ),
  'open',
  'requested visit stays open'
);

select is(
  (
    select complaint
    from public.service_events
    where unit_id = (select id from public.units where serial_no = 'RQ-100')
      and status = 'open'
  ),
  'Results are drifting',
  'request keeps the lab note'
);

reset role;

select is(
  (select count(*)::integer from public.activity where kind = 'visit_requested'),
  1,
  'staff updates include the request'
);

set local role authenticated;

select throws_ok(
  $$select public.request_visit(current_setting('test.own_unit')::uuid, 'Still drifting')$$,
  '23505',
  NULL,
  'customer cannot request a second open visit'
);

select throws_ok(
  $$select public.request_visit(current_setting('test.other_unit')::uuid, 'Not our machine')$$,
  '42501',
  NULL,
  'customer cannot request a visit for another lab'
);

reset role;
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

select throws_ok(
  $$select public.request_visit(current_setting('test.own_unit')::uuid, 'Owner should not use this')$$,
  '42501',
  NULL,
  'staff cannot request a visit this way'
);

select lives_ok(
  $$select public.record_visit(
    (select id from public.units where serial_no = 'RQ-100'),
    'breakdown',
    '2026-10-30',
    'Results are drifting',
    'Recalibrated'
  )$$,
  'owner can record the requested visit'
);

select is(
  (
    select count(*)::integer
    from public.service_events
    where unit_id = (select id from public.units where serial_no = 'RQ-100')
      and status = 'open'
  ),
  0,
  'recording the visit closes the request'
);

reset role;
set local role anon;

select throws_ok(
  $$select public.request_visit(
    (select id from public.units where serial_no = 'RQ-100'),
    'Anonymous'
  )$$,
  '42501',
  NULL,
  'anonymous cannot request a visit'
);

select * from finish();

rollback;
