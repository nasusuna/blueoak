import { istToday, pmdStatus, tenantSettingsSchema } from "@service-app/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge, VisitTypeBadge } from "@/components/ui/status-badge";
import { formatDisplayDate } from "@/lib/format";
import type { createClient } from "@/lib/supabase/server";
import type { WorkspaceProfile } from "@/lib/session";
import { RequestVisitForm } from "./request-visit-form";

type Client = Awaited<ReturnType<typeof createClient>>;

export const CustomerHome = async ({ profile, supabase }: { profile: WorkspaceProfile; supabase: Client }) => {

  if (!profile.customer_id) {
    return (
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-semibold tracking-tight">Your lab</h1>
        </CardHeader>
        <CardContent>
          <p className="text-base text-muted-foreground">This login is not linked to a lab yet. Ask the business owner to connect it.</p>
        </CardContent>
      </Card>
    );
  }

  const [{ data: lab }, { data: units }, { data: equipmentTypes }, { data: schedules }, { data: requests }, { data: events }, { data: tenant }] =
    await Promise.all([
      supabase.from("customers").select("id, name, contact_person, city").eq("id", profile.customer_id).maybeSingle(),
      supabase.from("units").select("id, serial_no, make, model, installed_on, equipment_type_id, status").eq("customer_id", profile.customer_id).order("serial_no"),
      supabase.from("equipment_types").select("id, name"),
      supabase.from("pmd_schedule").select("unit_id, due_date, completed_on").is("completed_on", null),
      supabase.from("service_events").select("id, unit_id, event_date, complaint").eq("status", "open").order("event_date", { ascending: false }),
      supabase
        .from("service_events")
        .select("id, unit_id, type, event_date, work_done, complaint")
        .eq("status", "completed")
        .order("event_date", { ascending: false })
        .limit(12),
      supabase.from("tenants").select("settings").eq("id", profile.tenant_id).maybeSingle(),
    ]);

  if (!lab) {
    return (
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-semibold tracking-tight">Your lab</h1>
        </CardHeader>
        <CardContent>
          <p className="text-base text-muted-foreground">Sign out and sign in again so this lab login can load.</p>
        </CardContent>
      </Card>
    );
  }

  const settings = tenantSettingsSchema.safeParse(tenant?.settings ?? {});
  const reminderDays = settings.success ? settings.data.reminder_days : 7;
  const today = istToday();
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
  const serialByUnit = new Map(machines.map((unit) => [unit.id, unit.serial_no]));
  const requestedUnitIds = new Set((requests ?? []).map((request) => request.unit_id));
  const requestMachines = (units ?? [])
    .filter((unit) => unit.status === "active" && !requestedUnitIds.has(unit.id))
    .map((unit) => ({
      id: unit.id,
      label: [unit.serial_no, equipmentName.get(unit.equipment_type_id)].filter(Boolean).join(" · "),
    }));

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">{lab.name}</h1>
        <p className="text-base text-muted-foreground">{[lab.contact_person, lab.city, profile.full_name].filter(Boolean).join(" · ")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-amber-300 bg-amber-100">
          <CardContent className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-amber-950">Your machines</h2>
            <p className="text-4xl font-bold tracking-tight text-amber-950">{machines.length}</p>
          </CardContent>
        </Card>
        <Card className="border-rose-300 bg-rose-100">
          <CardContent className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-rose-950">Needs attention</h2>
            <p className="text-4xl font-bold tracking-tight text-rose-950">{attentionCount}</p>
            <p className="text-base text-rose-900">{attentionCount === 0 ? "None due soon" : "Due or overdue"}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Machines</h2>
        </CardHeader>
        <CardContent>
          {machines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[40rem] text-left text-base">
                <caption className="sr-only">Machines at your lab</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-3 pr-4 font-medium">Serial</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Equipment</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Installed</th>
                    <th scope="col" className="py-3 font-medium">Next service</th>
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
                        {equipmentName.get(unit.equipment_type_id) ?? "Machine"}
                        {unit.make || unit.model ? ` · ${[unit.make, unit.model].filter(Boolean).join(" ")}` : ""}
                      </td>
                      <td className="py-3 pr-4">{formatDisplayDate(unit.installed_on)}</td>
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
            <p className="text-base text-muted-foreground">No machines are installed for your lab yet.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Request a visit</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {requests && requests.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {requests.map((request) => (
                <li key={request.id} className="rounded-lg bg-amber-50 px-3 py-2 text-base text-amber-950">
                  {serialByUnit.get(request.unit_id) ?? "Machine"} · requested {formatDisplayDate(request.event_date)}
                  {request.complaint ? ` · ${request.complaint}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {(units ?? []).some((unit) => unit.status === "active") ? (
            <RequestVisitForm machines={requestMachines} />
          ) : (
            <p className="text-base text-muted-foreground">No machines are installed for your lab yet.</p>
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
              <table className="data-table w-full min-w-[36rem] text-left text-base">
                <caption className="sr-only">Recent visits for your lab</caption>
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
            <p className="text-base text-muted-foreground">No visits yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};
