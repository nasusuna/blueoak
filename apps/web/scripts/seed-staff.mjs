import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = "Local-demo-pass-1";

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tenants = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Service App Operator", plan: "internal" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Bindushree Biomedicals", plan: "pilot" },
  { id: "33333333-3333-4333-8333-333333333333", name: "Second Lab", plan: "pilot" },
];

const staff = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    email: "admin@serviceapp.test",
    full_name: "Platform Admin",
    role: "platform_admin",
    tenant_id: "11111111-1111-4111-8111-111111111111",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    email: "owner@bindushree.test",
    full_name: "Muttu",
    role: "owner",
    tenant_id: "22222222-2222-4222-8222-222222222222",
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    email: "technician@bindushree.test",
    full_name: "Field Technician",
    role: "technician",
    tenant_id: "22222222-2222-4222-8222-222222222222",
  },
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    email: "customer@bindushree.test",
    full_name: "Lab Contact",
    role: "customer",
    tenant_id: "22222222-2222-4222-8222-222222222222",
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    email: "owner@secondlab.test",
    full_name: "Second Lab Owner",
    role: "owner",
    tenant_id: "33333333-3333-4333-8333-333333333333",
  },
];

const { error: tenantError } = await supabase.from("tenants").upsert(tenants, { onConflict: "id" });

if (tenantError) {
  console.error(tenantError.message);
  process.exit(1);
}

for (const person of staff) {
  const { error: createError } = await supabase.auth.admin.createUser({
    id: person.id,
    email: person.email,
    password,
    email_confirm: true,
  });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    console.error(`${person.email}: ${createError.message}`);
    process.exit(1);
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: person.id,
      tenant_id: person.tenant_id,
      role: person.role,
      full_name: person.full_name,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    console.error(`${person.email}: ${profileError.message}`);
    process.exit(1);
  }

  console.log(`Ready: ${person.email} (${person.role})`);
}
