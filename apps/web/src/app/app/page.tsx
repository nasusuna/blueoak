import Link from "next/link";
import { istToday, pmdStatus, tenantSettingsSchema } from "@service-app/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isStaff, loadWorkspace } from "@/lib/session";

const roleLabel = {
  platform_admin: "Platform admin",
  owner: "Owner",
  technician: "Technician",
  customer: "Customer",
} as const;

const HomePage = async () => {
  const { supabase, profile } = await loadWorkspace();

  if (!profile) {
    return null;
  }

  const { data: tenant } = await supabase.from("tenants").select("name, plan, settings").eq("id", profile.tenant_id).maybeSingle();
  const tenantsResult = profile.role === "platform_admin" ? await supabase.from("tenants").select("id, name, plan").order("name") : null;
  const customerCount = isStaff(profile.role)
    ? await supabase.from("customers").select("id", { count: "exact", head: true })
    : null;
  const unitCount = isStaff(profile.role) ? await supabase.from("units").select("id", { count: "exact", head: true }) : null;
  const openSchedules = isStaff(profile.role)
    ? await supabase.from("pmd_schedule").select("due_date").is("completed_on", null)
    : null;
  const labCount = customerCount?.count ?? 0;
  const machineCount = unitCount?.count ?? 0;
  const settings = tenantSettingsSchema.safeParse(tenant?.settings ?? {});
  const reminderDays = settings.success ? settings.data.reminder_days : 7;
  const today = istToday();
  const attentionCount = (openSchedules?.data ?? []).filter((row) => {
    const status = pmdStatus({ dueDate: row.due_date, completedOn: null, today, reminderDays });
    return status === "due" || status === "overdue";
  }).length;

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-primary">{tenant?.name ?? "Blue Oak"}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{profile.full_name}</h1>
        <p className="text-base text-muted-foreground">{roleLabel[profile.role]}</p>
      </div>

      {profile.role === "customer" ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold tracking-tight">Customer portal</h2>
          </CardHeader>
          <CardContent>
            <p className="text-base text-muted-foreground">
              The customer portal is not part of this phase. Service requests will use the public form.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {isStaff(profile.role) ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="h-full">
            <CardContent className="flex h-full flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">Customers</h2>
              <p className="text-4xl font-semibold tracking-tight">{labCount}</p>
              <p className="text-base text-muted-foreground">{labCount === 1 ? "Lab or hospital" : "Labs and hospitals"}</p>
              <Link href="/app/customers" className="mt-auto text-base font-medium text-primary underline-offset-4 hover:underline">
                Open customers
              </Link>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardContent className="flex h-full flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">Installed units</h2>
              <p className="text-4xl font-semibold tracking-tight">{machineCount}</p>
              <p className="text-base text-muted-foreground">{machineCount === 1 ? "Machine in the field" : "Machines in the field"}</p>
              <Link href="/app/units" className="mt-auto text-base font-medium text-primary underline-offset-4 hover:underline">
                Install a unit
              </Link>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardContent className="flex h-full flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">Needs attention</h2>
              <p className="text-4xl font-semibold tracking-tight">{attentionCount}</p>
              <p className="text-base text-muted-foreground">{attentionCount === 0 ? "None due soon" : "Due or overdue"}</p>
              <Link href="/app/visits" className="mt-auto text-base font-medium text-primary underline-offset-4 hover:underline">
                Open visits
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {profile.role === "platform_admin" ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold tracking-tight">Businesses</h2>
          </CardHeader>
          <CardContent>
            {tenantsResult?.error ? (
              <p className="text-base text-muted-foreground">The business list could not be loaded.</p>
            ) : tenantsResult?.data && tenantsResult.data.length > 0 ? (
              <table className="data-table w-full text-left text-base">
                <caption className="sr-only">Businesses you can support</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-3 pr-4 font-medium">Name</th>
                    <th scope="col" className="py-3 font-medium">Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantsResult.data.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4">{item.name}</td>
                      <td className="py-3">{item.plan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-base text-muted-foreground">No businesses yet.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
};

export default HomePage;
