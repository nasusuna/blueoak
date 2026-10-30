import { istToday, pmdStatus, tenantSettingsSchema } from "@service-app/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextLink } from "@/components/ui/text-link";
import { formatDisplayDate } from "@/lib/format";
import { isStaff, loadWorkspace, redirectUnlessStaff } from "@/lib/session";
import { InstallForm } from "./install-form";

const UnitsPage = async () => {
  const { supabase, profile } = await loadWorkspace();

  if (profile?.role === "customer") {
    redirectUnlessStaff(profile.role);
  }

  if (!profile || !isStaff(profile.role)) {
    return <p className="text-base text-muted-foreground">Installed units are managed by the business owner and technicians.</p>;
  }

  const [{ data: tenant }, { data: units }, { data: customers }, { data: equipmentTypes }, { data: schedules }] = await Promise.all([
    supabase.from("tenants").select("settings").eq("id", profile.tenant_id).maybeSingle(),
    supabase.from("units").select("id, serial_no, make, model, installed_on, pmd_interval_months, customer_id, equipment_type_id").order("installed_on", { ascending: false }),
    supabase.from("customers").select("id, name").order("name"),
    supabase.from("equipment_types").select("id, name").order("name"),
    supabase.from("pmd_schedule").select("unit_id, due_date, completed_on"),
  ]);
  const settings = tenantSettingsSchema.safeParse(tenant?.settings ?? {});
  const reminderDays = settings.success ? settings.data.reminder_days : 7;
  const today = istToday();

  const customerName = new Map((customers ?? []).map((customer) => [customer.id, customer.name]));
  const equipmentName = new Map((equipmentTypes ?? []).map((item) => [item.id, item.name]));
  const nextDue = new Map<string, string>();
  for (const row of schedules ?? []) {
    if (row.completed_on !== null) {
      continue;
    }

    const current = nextDue.get(row.unit_id);
    if (!current || row.due_date < current) {
      nextDue.set(row.unit_id, row.due_date);
    }
  }
  const canInstall = (customers?.length ?? 0) > 0 && (equipmentTypes?.length ?? 0) > 0;

  return (
    <>
      <PageHeader title="Installed units" description="Machines in the field and the next preventive visit." />
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Machines</h2>
        </CardHeader>
        <CardContent>
          {units && units.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[40rem] text-left text-base">
                <caption className="sr-only">Installed units</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-3 pr-4 font-medium">Serial</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Customer</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Equipment</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Installed</th>
                    <th scope="col" className="py-3 font-medium">Next PMD</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => {
                    const dueDate = nextDue.get(unit.id);
                    const status = dueDate ? pmdStatus({ dueDate, completedOn: null, today, reminderDays }) : null;

                    return (
                      <tr
                        key={unit.id}
                        className={`border-b border-border last:border-0 ${status === "overdue" ? "bg-rose-50" : status === "due" ? "bg-amber-50" : ""}`}
                      >
                        <td className="py-3 pr-4 font-semibold">{unit.serial_no}</td>
                        <td className="py-3 pr-4">
                          <TextLink href={`/app/customers/${unit.customer_id}`}>{customerName.get(unit.customer_id) ?? "—"}</TextLink>
                        </td>
                        <td className="py-3 pr-4">
                          {equipmentName.get(unit.equipment_type_id) ?? "—"}
                          {unit.make || unit.model ? ` · ${[unit.make, unit.model].filter(Boolean).join(" ")}` : ""}
                        </td>
                        <td className="py-3 pr-4">{formatDisplayDate(unit.installed_on)}</td>
                        <td className="py-3">
                          {dueDate && status ? (
                            <span className="inline-flex flex-wrap items-center gap-2">
                              {formatDisplayDate(dueDate)}
                              <StatusBadge status={status} />
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-base text-muted-foreground">No units installed yet.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Install a machine</h2>
        </CardHeader>
        <CardContent>
          {canInstall ? (
            <InstallForm customers={customers ?? []} equipmentTypes={equipmentTypes ?? []} />
          ) : (
            <p className="text-base text-muted-foreground">
              Add a <TextLink href="/app/customers">customer</TextLink> and an <TextLink href="/app/equipment">equipment type</TextLink> before installing a unit.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default UnitsPage;
