import { istToday, pmdStatus, tenantSettingsSchema } from "@service-app/core";
import { UpdatesMenu } from "@/components/updates-menu";
import { isStaff, loadWorkspace } from "@/lib/session";

const statusLabel = {
  overdue: "Overdue",
  due: "Due soon",
  scheduled: "Scheduled",
  completed: "Completed",
} as const;

export const WorkspaceNotices = async () => {
  const { supabase, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return null;
  }

  const today = istToday();
  const [{ data: tenant }, { data: activity }, { data: schedules }, { data: units }, { data: customers }] = await Promise.all([
    supabase.from("tenants").select("settings").eq("id", profile.tenant_id).maybeSingle(),
    supabase.from("activity").select("id, summary, created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("pmd_schedule").select("unit_id, due_date, completed_on").is("completed_on", null),
    supabase.from("units").select("id, serial_no, customer_id"),
    supabase.from("customers").select("id, name"),
  ]);
  const settings = tenantSettingsSchema.safeParse(tenant?.settings ?? {});
  const reminderDays = settings.success ? settings.data.reminder_days : 7;
  const serialByUnit = new Map((units ?? []).map((unit) => [unit.id, unit.serial_no]));
  const customerByUnit = new Map((units ?? []).map((unit) => [unit.id, unit.customer_id]));
  const customerName = new Map((customers ?? []).map((customer) => [customer.id, customer.name]));
  const upcoming = (schedules ?? [])
    .map((row) => {
      const status = pmdStatus({ dueDate: row.due_date, completedOn: null, today, reminderDays });
      const customerId = customerByUnit.get(row.unit_id);

      return {
        id: `due-${row.unit_id}-${row.due_date}`,
        dueDate: row.due_date,
        tone: status === "overdue" ? "warning" : "default",
        text: `${statusLabel[status]}: ${serialByUnit.get(row.unit_id) ?? "Machine"} at ${customerName.get(customerId ?? "") ?? "a customer"} on ${row.due_date}`,
      };
    })
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 3);
  const recent = (activity ?? []).map((row) => ({
    id: row.id,
    tone: "default" as const,
    text: row.summary,
  }));
  const notices = [...upcoming.map(({ id, tone, text }) => ({ id, tone, text })), ...recent];

  return <UpdatesMenu notices={notices} />;
};
