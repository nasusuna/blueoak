begin;

select plan(4);

insert into auth.users (id, email)
values
  ('e1000000-0000-4000-8000-000000000001', 'owner-a@activity.test'),
  ('e1000000-0000-4000-8000-000000000002', 'owner-b@activity.test');

insert into public.tenants (id, name)
values
  ('e2000000-0000-4000-8000-000000000001', 'Activity Tenant A'),
  ('e2000000-0000-4000-8000-000000000002', 'Activity Tenant B');

insert into public.profiles (user_id, tenant_id, role, full_name)
values
  ('e1000000-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001', 'owner', 'Owner A'),
  ('e1000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000002', 'owner', 'Owner B');

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'e1000000-0000-4000-8000-000000000001',
    'role', 'authenticated',
    'tenant_id', 'e2000000-0000-4000-8000-000000000001',
    'user_role', 'owner'
  )::text,
  true
);
set local role authenticated;

select lives_ok(
  $$insert into public.activity (tenant_id, kind, summary)
    values ('e2000000-0000-4000-8000-000000000001', 'customer_added', 'City Lab added')$$,
  'owner can record an update'
);

select is(
  (select count(*)::integer from public.activity where summary = 'City Lab added'),
  1,
  'owner sees their own update'
);

reset role;
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', 'e1000000-0000-4000-8000-000000000002',
    'role', 'authenticated',
    'tenant_id', 'e2000000-0000-4000-8000-000000000002',
    'user_role', 'owner'
  )::text,
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.activity where summary = 'City Lab added'),
  0,
  'another business cannot see the update'
);

reset role;
set local role anon;

select throws_ok(
  $$select count(*) from public.activity$$,
  '42501',
  NULL,
  'anonymous cannot read updates'
);

select * from finish();

rollback;
