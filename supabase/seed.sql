-- Local demo businesses. Staff logins are created with pnpm seed:staff.
insert into public.tenants (id, name, plan)
values
  ('11111111-1111-4111-8111-111111111111', 'Service App Operator', 'internal'),
  ('22222222-2222-4222-8222-222222222222', 'Bindushree Biomedicals', 'pilot'),
  ('33333333-3333-4333-8333-333333333333', 'Second Lab', 'pilot')
on conflict (id) do nothing;
