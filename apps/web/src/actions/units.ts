"use server";

import { installUnitSchema } from "@service-app/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/actions/customers";
import { recordActivity } from "@/lib/activity";
import { isStaff, loadWorkspace } from "@/lib/session";

export const installUnit = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const parsed = installUnitSchema.safeParse({
    customer_id: formData.get("customer_id"),
    equipment_type_id: formData.get("equipment_type_id"),
    make: formData.get("make"),
    model: formData.get("model"),
    serial_no: formData.get("serial_no"),
    installed_on: formData.get("installed_on"),
    pmd_interval_months: formData.get("pmd_interval_months"),
    pmd_start_date: formData.get("pmd_start_date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the installation and try again." };
  }

  const { supabase, userId, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return { error: "You cannot install a unit." };
  }

  const { error } = await supabase.rpc("install_unit", {
    p_customer_id: parsed.data.customer_id,
    p_equipment_type_id: parsed.data.equipment_type_id,
    p_make: parsed.data.make,
    p_model: parsed.data.model,
    p_serial_no: parsed.data.serial_no,
    p_installed_on: parsed.data.installed_on,
    p_pmd_interval_months: parsed.data.pmd_interval_months,
    p_pmd_start_date: parsed.data.pmd_start_date,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That serial number is already installed for this business." };
    }

    if (error.message.includes("before the installation")) {
      return { error: "The preventive-maintenance start cannot be before installation." };
    }

    if (error.message.includes("does not belong")) {
      return { error: "Choose a customer and equipment type from this business." };
    }

    return { error: "The installation could not be saved. Try again." };
  }

  const { data: customer } = await supabase.from("customers").select("name").eq("id", parsed.data.customer_id).maybeSingle();
  await recordActivity(supabase, {
    tenantId: profile.tenant_id,
    userId,
    kind: "unit_installed",
    summary: `${parsed.data.serial_no} installed for ${customer?.name ?? "a customer"}`,
  });

  revalidatePath("/app", "layout");
  const requested = formData.get("redirect_to");
  const customerPath = `/app/customers/${parsed.data.customer_id}`;
  redirect(requested === customerPath ? customerPath : "/app/units");
};
