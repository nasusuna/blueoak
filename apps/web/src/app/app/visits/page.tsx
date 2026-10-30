import { istToday, pmdStatus, tenantSettingsSchema } from "@service-app/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, VisitTypeBadge } from "@/components/ui/status-badge";
import { formatDisplayDate } from "@/lib/format";
import { isStaff, loadWorkspace, redirectUnlessStaff } from "@/lib/session";
import { SkipForm } from "./skip-form";
import { VisitForm, type VisitUnit } from "./visit-form";

const VisitsPage = async () => {
  const { supabase, profile } = await loadWorkspace();

  if (profile?.role === "customer") {
    redirectUnlessStaff(profile.role);
  }

  if (!profile || !isStaff(profile.role)) {
    return <p className="text-base text-muted-foreground">Visits are recorded by the business owner and technicians.</p>;
  }

  const today = istToday();
  const [{ data: tenant }, { data: units }, { data: customers }, { data: equipmentTypes }, { data: schedules }, { data: requests }, { data: events }] =
    await Promise.all([
      supabase.from("tenants").select("settings").eq("id", profile.tenant_id).maybeSingle(),
      supabase.from("units").select("id, serial_no, make, model, customer_id, equipment_type_id, pmd_interval_months, status").eq("status", "active").order("serial_no"),
      supabase.from("customers").select("id, name"),
      supabase.from("equipment_types").select("id, name"),
      supabase.from("pmd_schedule").select("unit_id, due_date, completed_on").is("completed_on", null),
      supabase.from("service_events").select("id, unit_id, event_date, complaint").eq("status", "open").order("event_date"),
      supabase.from("service_events").select("id, unit_id, type, event_date, complaint, work_done").eq("status", "completed").order("event_date", { ascending: false }).limit(20),
    ]);

  const settings = tenantSettingsSchema.safeParse(tenant?.settings ?? {});
  const reminderDays = settings.success ? settings.data.reminder_days : 7;
  const customerName = new Map((customers ?? []).map((customer) => [customer.id, customer.name]));
  const equipmentName = new Map((equipmentTypes ?? []).map((item) => [item.id, item.name]));
  const openDue = new Map<string, string>();

  for (const row of schedules ?? []) {
    const current = openDue.get(row.unit_id);
    if (!current || row.due_date < current) {
      openDue.set(row.unit_id, row.due_date);
    }
  }

  const visitUnits: VisitUnit[] = (units ?? []).map((unit) => ({
    id: unit.id,
    label: [unit.serial_no, customerName.get(unit.customer_id), equipmentName.get(unit.equipment_type_id)]
      .filter(Boolean)
      .join(" · "),
    intervalMonths: unit.pmd_interval_months === 3 ? 3 : 6,
    openDue: openDue.get(unit.id) ?? null,
  }));
  const dueRows = visitUnits
    .flatMap((unit) => (unit.openDue ? [{ ...unit, dueDate: unit.openDue }] : []))
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  const skipUnits = visitUnits.filter((unit) => unit.openDue);
  const unitLabel = new Map(visitUnits.map((unit) => [unit.id, unit.label]));

  return (
    <>
      <PageHeader title="Visits" description="Due maintenance, visit requests, recorded visits, and skipped dates." />
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Visit requests</h2>
        </CardHeader>
        <CardContent>
          {requests && requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[36rem] text-left text-base">
                <caption className="sr-only">Visits requested by labs</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-3 pr-4 font-medium">Requested</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Machine</th>
                    <th scope="col" className="py-3 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-border bg-amber-50 last:border-0">
                      <td className="py-3 pr-4">{formatDisplayDate(request.event_date)}</td>
                      <td className="py-3 pr-4 font-medium">{unitLabel.get(request.unit_id) ?? "—"}</td>
                      <td className="py-3">{request.complaint ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-base text-muted-foreground">No labs have requested a visit.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Due maintenance</h2>
        </CardHeader>
        <CardContent>
          {dueRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[36rem] text-left text-base">
                <caption className="sr-only">Open preventive-maintenance dates</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-3 pr-4 font-medium">Machine</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Due</th>
                    <th scope="col" className="py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dueRows.map((row) => {
                    const status = pmdStatus({ dueDate: row.dueDate, completedOn: null, today, reminderDays });

                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-border last:border-0 ${status === "overdue" ? "bg-rose-50" : status === "due" ? "bg-amber-50" : ""}`}
                      >
                        <td className="py-3 pr-4 font-medium">{row.label}</td>
                        <td className="py-3 pr-4">{formatDisplayDate(row.dueDate)}</td>
                        <td className="py-3">
                          <StatusBadge status={status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-base text-muted-foreground">No open preventive-maintenance dates.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Record a visit</h2>
        </CardHeader>
        <CardContent>
          {visitUnits.length > 0 ? (
            <VisitForm units={visitUnits} />
          ) : (
            <p className="text-base text-muted-foreground">Install a machine before recording a visit.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Skip a due date</h2>
        </CardHeader>
        <CardContent>
          {skipUnits.length > 0 ? (
            <SkipForm units={skipUnits} />
          ) : (
            <p className="text-base text-muted-foreground">There is no open due date to skip.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Recent visits</h2>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[40rem] text-left text-base">
                <caption className="sr-only">Recent service visits</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-3 pr-4 font-medium">Date</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Type</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Machine</th>
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
                      <td className="py-3 pr-4">{unitLabel.get(event.unit_id) ?? "—"}</td>
                      <td className="py-3">{event.work_done ?? event.complaint ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-base text-muted-foreground">No visits yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default VisitsPage;
