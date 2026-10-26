begin;

select plan(28);

insert into auth.users (id, email)
values
  ('b0000000-0000-4000-8000-000000000001', 'owner-a@isolation.test'),
  ('b0000000-0000-4000-8000-000000000002', 'tech-a@isolation.test'),
  ('b0000000-0000-4000-8000-000000000003', 'customer-a@isolation.test'),
  ('b0000000-0000-4000-8000-000000000004', 'owner-b@isolation.test'),
  ('b0000000-0000-4000-8000-000000000005', 'admin@isolation.test'),
  ('b0000000-0000-4000-8000-000000000006', 'noclaim@isolation.test');

insert into public.tenants (id, name)
values
  ('a0000000-0000-4000-8000-000000000001', 'Tenant A'),
  ('a0000000-0000-4000-8000-000000000002', 'Tenant B');

insert into public.profiles (user_id, tenant_id, role, full_name)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'owner', 'Owner A'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'technician', 'Tech A'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'customer', 'Customer A'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'owner', 'Owner B'),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'platform_admin', 'Admin');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.tenants'::regclass),
  'tenants has row level security'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has row level security'
);

set local role anon;

select is((select count(*)::integer from public.tenants), 0, 'anonymous sees no tenants');
select is((select count(*)::integer from public.profiles), 0, 'anonymous sees no profiles');

reset role;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'b0000000-0000-4000-8000-000000000001',
    'role', 'authenticated',
    'tenant_id', 'a0000000-0000-4000-8000-000000000001',
    'user_role', 'owner'
  )::text,
  true
);
set local role authenticated;

select is((select count(*)::integer from public.tenants), 1, 'owner A sees one tenant');
select is(
  (select count(*)::integer from public.tenants where id = 'a0000000-0000-4000-8000-000000000002'),
  0,
  'owner A cannot read tenant B'
);
select is((select count(*)::integer from public.profiles), 4, 'owner A sees every profile in tenant A');
select is(
  (select count(*)::integer from public.profiles where user_id = 'b0000000-0000-4000-8000-000000000004'),
  0,
  'owner A cannot read tenant B profiles'
);

select throws_ok(
  $$insert into public.tenants (name) values ('Nope')$$,
  '42501',
  NULL,
  'owner cannot create a tenant'
);

select lives_ok(
  $$update public.tenants set name = 'Tenant A Renamed' where id = 'a0000000-0000-4000-8000-000000000001'$$,
  'owner can rename their tenant'
);

select throws_ok(
  $$update public.tenants set plan = 'pro' where id = 'a0000000-0000-4000-8000-000000000001'$$,
  '42501',
  NULL,
  'owner cannot change the plan'
);

select lives_ok(
  $$update public.profiles set full_name = 'Owner A Updated' where user_id = 'b0000000-0000-4000-8000-000000000001'$$,
  'owner can update their own name'
);

select throws_ok(
  $$update public.profiles set role = 'platform_admin' where user_id = 'b0000000-0000-4000-8000-000000000001'$$,
  '42501',
  NULL,
  'owner cannot grant themselves platform admin'
);

select throws_ok(
  $$update public.profiles set tenant_id = 'a0000000-0000-4000-8000-000000000002' where user_id = 'b0000000-0000-4000-8000-000000000002'$$,
  '42501',
  NULL,
  'owner cannot move a profile to another tenant'
);

reset role;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000004', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'b0000000-0000-4000-8000-000000000004',
    'role', 'authenticated',
    'tenant_id', 'a0000000-0000-4000-8000-000000000002',
    'user_role', 'owner'
  )::text,
  true
);
set local role authenticated;

select is((select count(*)::integer from public.tenants), 1, 'owner B sees one tenant');

reset role;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'b0000000-0000-4000-8000-000000000002',
    'role', 'authenticated',
    'tenant_id', 'a0000000-0000-4000-8000-000000000001',
    'user_role', 'technician'
  )::text,
  true
);
set local role authenticated;

select is((select count(*)::integer from public.tenants), 1, 'technician A sees one tenant');
select is((select count(*)::integer from public.profiles), 4, 'technician A sees profiles in the tenant');

update public.tenants
set name = 'Hacked'
where id = 'a0000000-0000-4000-8000-000000000001';

update public.profiles
set role = 'customer'
where user_id = 'b0000000-0000-4000-8000-000000000001';

reset role;

select is(
  (select name from public.tenants where id = 'a0000000-0000-4000-8000-000000000001'),
  'Tenant A Renamed',
  'technician cannot rename the tenant'
);
select is(
  (select role::text from public.profiles where user_id = 'b0000000-0000-4000-8000-000000000001'),
  'owner',
  'technician cannot change the owner role'
);
select is(
  (select full_name from public.profiles where user_id = 'b0000000-0000-4000-8000-000000000001'),
  'Owner A Updated',
  'owner name update is stored'
);

select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000003', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'b0000000-0000-4000-8000-000000000003',
    'role', 'authenticated',
    'tenant_id', 'a0000000-0000-4000-8000-000000000001',
    'user_role', 'customer'
  )::text,
  true
);
set local role authenticated;

select is((select count(*)::integer from public.tenants), 1, 'customer A sees their tenant');
select is((select count(*)::integer from public.profiles), 1, 'customer A sees only their own profile');

reset role;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'b0000000-0000-4000-8000-000000000006',
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

select is((select count(*)::integer from public.tenants), 0, 'a session without a tenant claim sees no tenants');

reset role;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000005', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'b0000000-0000-4000-8000-000000000005',
    'role', 'authenticated',
    'tenant_id', 'a0000000-0000-4000-8000-000000000001',
    'user_role', 'platform_admin'
  )::text,
  true
);
set local role authenticated;

select is(
  (
    select count(*)::integer
    from public.tenants
    where id in (
      'a0000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000002'
    )
  ),
  2,
  'platform admin sees both fixture tenants'
);
select is(
  (
    select count(*)::integer
    from public.profiles
    where user_id in (
      'b0000000-0000-4000-8000-000000000001',
      'b0000000-0000-4000-8000-000000000002',
      'b0000000-0000-4000-8000-000000000003',
      'b0000000-0000-4000-8000-000000000004',
      'b0000000-0000-4000-8000-000000000005'
    )
  ),
  5,
  'platform admin sees profiles in every tenant'
);

select lives_ok(
  $$insert into public.tenants (id, name) values ('a0000000-0000-4000-8000-000000000099', 'Inserted By Admin')$$,
  'platform admin can create a tenant'
);

reset role;

select is(
  (select name from public.tenants where id = 'a0000000-0000-4000-8000-000000000099'),
  'Inserted By Admin',
  'platform admin insert is stored'
);

set local role service_role;

select is(
  (
    select count(*)::integer
    from public.tenants
    where id in (
      'a0000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000002'
    )
  ),
  2,
  'service role can read across tenants'
);

select * from finish();

rollback;
