import { istToday, pmdStatus, tenantSettingsSchema } from "@service-app/core";
import { updateCustomer } from "@/actions/customers";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge, VisitTypeBadge } from "@/components/ui/status-badge";
import { TextLink } from "@/components/ui/text-link";
import { formatDisplayDate } from "@/lib/format";
import { isStaff, loadWorkspace } from "@/lib/session";
import { CustomerForm } from "../customer-form";
import { AddMachine } from "./add-machine";

const CustomerPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { supabase, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return <p className="text-base text-muted-foreground">Customer records are available to the business owner and technicians.</p>;
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, contact_person, mobile, whatsapp, email, address, city, pin, gstin, tally_ledger_name")
    .eq("id", id)
    .maybeSingle();

  if (!customer) {
    return (
      <>
        <h1 className="text-3xl font-semibold tracking-tight">Customer</h1>
        <p className="text-base text-muted-foreground">This customer was not found.</p>
        <TextLink href="/app/customers">Back to customers</TextLink>
      </>
    );
  }

  const today = istToday();
  const [{ data: tenant }, { data: units }, { data: equipmentTypes }] = await Promise.all([
    supabase.from("tenants").select("settings").eq("id", profile.tenant_id).maybeSingle(),
    supabase
      .from("units")
      .select("id, serial_no, make, model, installed_on, pmd_interval_months, status, equipment_type_id")
      .eq("customer_id", customer.id)
      .order("serial_no"),
    supabase.from("equipment_types").select("id, name").order("name"),
  ]);
  const unitIds = (units ?? []).map((unit) => unit.id);
  const [{ data: schedules }, { data: events }] = await Promise.all([
    unitIds.length === 0
      ? Promise.resolve({ data: [] })
      : supabase.from("pmd_schedule").select("id, unit_id, due_date, completed_on, skip_reason").in("unit_id", unitIds),
    unitIds.length === 0
      ? Promise.resolve({ data: [] })
      : supabase
          .from("service_events")
          .select("id, unit_id, type, event_date, complaint, work_done")
          .in("unit_id", unitIds)
          .order("event_date", { ascending: false }),
  ]);

  const settings = tenantSettingsSchema.safeParse(tenant?.settings ?? {});
  const reminderDays = settings.success ? settings.data.reminder_days : 7;
  const equipmentName = new Map((equipmentTypes ?? []).map((item) => [item.id, item.name]));
  const openDue = new Map<string, string>();

  for (const row of schedules ?? []) {
    if (row.completed_on !== null) {
      continue;
    }

    const current = openDue.get(row.unit_id);
    if (!current || row.due_date < current) {
      openDue.set(row.unit_id, row.due_date);
    }
  }

  const machines = (units ?? []).map((unit) => {
    const dueDate = openDue.get(unit.id) ?? null;
    const status = dueDate ? pmdStatus({ dueDate, completedOn: null, today, reminderDays }) : null;

    return { ...unit, dueDate, status };
  });
  const attentionCount = machines.filter((unit) => unit.status === "overdue" || unit.status === "due").length;
  const serialByUnit = new Map((units ?? []).map((unit) => [unit.id, unit.serial_no]));
  const skips = (schedules ?? []).filter((row) => row.skip_reason && row.completed_on);

  return (
    <>
      <div className="flex flex-col gap-2">
        <TextLink href="/app/customers" className="text-sm">
          Customers
        </TextLink>
        <h1 className="text-3xl font-semibold tracking-tight">{customer.name}</h1>
        <p className="text-base text-muted-foreground">
          {[
            customer.contact_person,
            customer.city,
            machines.length === 1 ? "1 machine" : `${machines.length} machines`,
            attentionCount === 0 ? null : attentionCount === 1 ? "1 due or overdue" : `${attentionCount} due or overdue`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Details</h2>
        </CardHeader>
        <CardContent>
          <CustomerForm
            action={updateCustomer}
            customerId={customer.id}
            submitLabel="Save changes"
            defaults={{
              name: customer.name,
              contact_person: customer.contact_person ?? "",
              mobile: customer.mobile ?? "",
              whatsapp: customer.whatsapp ?? "",
              email: customer.email ?? "",
              address: customer.address ?? "",
              city: customer.city ?? "",
              pin: customer.pin ?? "",
              gstin: customer.gstin ?? "",
              tally_ledger_name: customer.tally_ledger_name ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Machines</h2>
        </CardHeader>
        <CardContent>
          {machines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[40rem] text-left text-base">
                <caption className="sr-only">Machines at this customer</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-3 pr-4 font-medium">Serial</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Equipment</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Installed</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Interval</th>
                    <th scope="col" className="py-3 font-medium">Next PMD</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((unit) => (
                    <tr
                      key={unit.id}
                      className={`border-b border-border last:border-0 ${unit.status === "overdue" ? "bg-rose-50" : unit.status === "due" ? "bg-amber-50" : ""}`}
                    >
                      <td className="py-3 pr-4 font-semibold">{unit.serial_no}</td>
                      <td className="py-3 pr-4">
                        {equipmentName.get(unit.equipment_type_id) ?? "—"}
                        {unit.make || unit.model ? ` · ${[unit.make, unit.model].filter(Boolean).join(" ")}` : ""}
                      </td>
                      <td className="py-3 pr-4">{formatDisplayDate(unit.installed_on)}</td>
                      <td className="py-3 pr-4">{unit.pmd_interval_months} months</td>
                      <td className="py-3">
                        {unit.dueDate && unit.status ? (
                          <span className="inline-flex flex-wrap items-center gap-2">
                            {formatDisplayDate(unit.dueDate)}
                            <StatusBadge status={unit.status} />
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-base text-muted-foreground">No machines installed for this customer.</p>
          )}
          <AddMachine customerId={customer.id} equipmentTypes={equipmentTypes ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Visits</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {events && events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[36rem] text-left text-base">
                <caption className="sr-only">Visits for this customer</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-3 pr-4 font-medium">Date</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Type</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Serial</th>
                    <th scope="col" className="py-3 font-medium">Work</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4">{formatDisplayDate(event.event_date)}</td>
                      <td className="py-3 pr-4">
                        <VisitTypeBadge type={event.type} />
                      </td>
                      <td className="py-3 pr-4">{serialByUnit.get(event.unit_id) ?? "—"}</td>
                      <td className="py-3">{event.work_done ?? event.complaint ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-base text-muted-foreground">No visits for this customer yet.</p>
          )}
          {skips.length > 0 ? (
            <ul className="flex flex-col gap-2 text-base">
              {skips.map((row) => (
                <li key={row.id}>
                  {serialByUnit.get(row.unit_id) ?? "Machine"} due {formatDisplayDate(row.due_date)} was skipped on {row.completed_on ? formatDisplayDate(row.completed_on) : "—"}: {row.skip_reason}
                </li>
              ))}
            </ul>
          ) : null}
          <TextLink href="/app/visits">Record a visit</TextLink>
        </CardContent>
      </Card>
    </>
  );
};

export default CustomerPage;
