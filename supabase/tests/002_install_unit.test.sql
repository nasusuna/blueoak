begin;

select plan(25);

insert into auth.users (id, email)
values
  ('c1000000-0000-4000-8000-000000000001', 'owner-a@install.test'),
  ('c1000000-0000-4000-8000-000000000002', 'tech-a@install.test'),
  ('c1000000-0000-4000-8000-000000000003', 'customer-a@install.test'),
  ('c1000000-0000-4000-8000-000000000004', 'owner-b@install.test');

insert into public.tenants (id, name)
values
  ('c2000000-0000-4000-8000-000000000001', 'Install Tenant A'),
  ('c2000000-0000-4000-8000-000000000002', 'Install Tenant B');

insert into public.profiles (user_id, tenant_id, role, full_name)
values
  ('c1000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 'owner', 'Owner A'),
  ('c1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 'technician', 'Tech A'),
  ('c1000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000001', 'customer', 'Customer A'),
  ('c1000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000002', 'owner', 'Owner B');

select ok((select relrowsecurity from pg_class where oid = 'public.customers'::regclass), 'customers has row level security');
select ok((select relrowsecurity from pg_class where oid = 'public.equipment_types'::regclass), 'equipment types has row level security');
select ok((select relrowsecurity from pg_class where oid = 'public.chemicals'::regclass), 'chemicals has row level security');
select ok((select relrowsecurity from pg_class where oid = 'public.units'::regclass), 'units has row level security');
select ok((select relrowsecurity from pg_class where oid = 'public.service_events'::regclass), 'service events has row level security');
select ok((select relrowsecurity from pg_class where oid = 'public.pmd_schedule'::regclass), 'pmd schedule has row level security');

select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'c1000000-0000-4000-8000-000000000001',
    'role', 'authenticated',
    'tenant_id', 'c2000000-0000-4000-8000-000000000001',
    'user_role', 'owner'
  )::text,
  true
);
set local role authenticated;

select lives_ok(
  $$insert into public.customers (id, tenant_id, name)
    values ('c3000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 'City Lab')$$,
  'owner can add a customer'
);

select lives_ok(
  $$insert into public.equipment_types (id, tenant_id, name)
    values ('c3000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 'Biochemistry analyzer')$$,
  'owner can add an equipment type'
);

reset role;

update public.profiles
set customer_id = 'c3000000-0000-4000-8000-000000000001'
where user_id = 'c1000000-0000-4000-8000-000000000003';

set local role authenticated;

select lives_ok(
  $$select public.install_unit(
    'c3000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000002',
    'Mindray',
    'BS-240',
    'SN-100',
    '2026-01-15',
    6,
    '2026-01-15'
  )$$,
  'owner can install a unit'
);

select is(
  (select due_date::text from public.pmd_schedule where unit_id = (select id from public.units where serial_no = 'SN-100')),
  '2026-07-15',
  'first due date is the start date plus six months'
);

select is(
  (
    select count(*)::integer
    from public.service_events
    where unit_id = (select id from public.units where serial_no = 'SN-100')
      and type = 'installation'
      and status = 'completed'
  ),
  1,
  'installation writes one completed visit'
);

select throws_ok(
  $$select public.install_unit(
    'c3000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000002',
    '',
    '',
    'SN-EARLY',
    '2026-03-01',
    6,
    '2026-02-01'
  )$$,
  '22023',
  NULL,
  'start date before installation is rejected'
);

select throws_ok(
  $$select public.install_unit(
    'c3000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000002',
    '',
    '',
    'SN-BAD',
    '2026-01-15',
    4,
    '2026-01-15'
  )$$,
  '22023',
  NULL,
  'an interval other than 3 or 6 is rejected'
);

select lives_ok(
  $$select public.install_unit(
    'c3000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000002',
    '',
    '',
    'SN-END-6',
    '2026-08-31',
    6,
    '2026-08-31'
  )$$,
  'a month-end six month installation is saved'
);

select is(
  (select due_date::text from public.pmd_schedule where unit_id = (select id from public.units where serial_no = 'SN-END-6')),
  '2027-02-28',
  '31 August plus six months is 28 February'
);

select lives_ok(
  $$select public.install_unit(
    'c3000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000002',
    '',
    '',
    'SN-END-3',
    '2026-01-31',
    3,
    '2026-01-31'
  )$$,
  'a month-end three month installation is saved'
);

select is(
  (select due_date::text from public.pmd_schedule where unit_id = (select id from public.units where serial_no = 'SN-END-3')),
  '2026-04-30',
  '31 January plus three months is 30 April'
);

select throws_ok(
  $$insert into public.units (
    tenant_id, customer_id, equipment_type_id, serial_no, installed_on, pmd_start_date
  ) values (
    'c2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000002',
    'SN-DIRECT',
    '2026-01-15',
    '2026-01-15'
  )$$,
  '42501',
  NULL,
  'staff cannot insert a unit directly'
);

reset role;
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000004', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'c1000000-0000-4000-8000-000000000004',
    'role', 'authenticated',
    'tenant_id', 'c2000000-0000-4000-8000-000000000002',
    'user_role', 'owner'
  )::text,
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.units where serial_no = 'SN-100'),
  0,
  'owner B cannot see tenant A units'
);

reset role;
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'c1000000-0000-4000-8000-000000000002',
    'role', 'authenticated',
    'tenant_id', 'c2000000-0000-4000-8000-000000000001',
    'user_role', 'technician'
  )::text,
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.units where serial_no = 'SN-100'),
  1,
  'technician sees the installed unit'
);

reset role;

insert into public.equipment_types (tenant_id, name)
values ('c2000000-0000-4000-8000-000000000001', 'Unused analyzer');

select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000003', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'c1000000-0000-4000-8000-000000000003',
    'role', 'authenticated',
    'tenant_id', 'c2000000-0000-4000-8000-000000000001',
    'user_role', 'customer',
    'customer_id', 'c3000000-0000-4000-8000-000000000001'
  )::text,
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.customers where id = 'c3000000-0000-4000-8000-000000000001'),
  1,
  'customer sees their own lab'
);

select is(
  (select count(*)::integer from public.units where serial_no = 'SN-100'),
  1,
  'customer sees their installed unit'
);

select is(
  (select count(*)::integer from public.equipment_types where name = 'Biochemistry analyzer'),
  1,
  'customer sees the equipment on their machine'
);

select is(
  (select count(*)::integer from public.equipment_types where name = 'Unused analyzer'),
  0,
  'customer does not see other equipment types'
);

reset role;
set local role anon;

select throws_ok(
  $$select count(*) from public.customers$$,
  '42501',
  NULL,
  'anonymous cannot read customers'
);

select * from finish();

rollback;
