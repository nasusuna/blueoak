"use server";

import { recordVisitSchema, skipPmdSchema } from "@service-app/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/actions/customers";
import { recordActivity } from "@/lib/activity";
import { isStaff, loadWorkspace } from "@/lib/session";

const visitError = (message: string, fallback: string) => {
  if (message.includes("no open preventive")) {
    return "This machine has no open preventive-maintenance date.";
  }

  if (message.includes("inactive")) {
    return "This machine is inactive.";
  }

  if (message.includes("does not belong")) {
    return "Choose a machine from this business.";
  }

  if (message.includes("skipped")) {
    return "Enter why this visit was skipped.";
  }

  return fallback;
};

export const recordVisit = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const parsed = recordVisitSchema.safeParse({
    unit_id: formData.get("unit_id"),
    type: formData.get("type"),
    event_date: formData.get("event_date"),
    complaint: formData.get("complaint"),
    work_done: formData.get("work_done"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the visit and try again." };
  }

  const { supabase, userId, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return { error: "You cannot record a visit." };
  }

  const { error } = await supabase.rpc("record_visit", {
    p_unit_id: parsed.data.unit_id,
    p_type: parsed.data.type,
    p_event_date: parsed.data.event_date,
    p_complaint: parsed.data.complaint,
    p_work_done: parsed.data.work_done,
  });

  if (error) {
    return { error: visitError(error.message, "The visit could not be saved. Try again.") };
  }

  const { data: unit } = await supabase.from("units").select("serial_no").eq("id", parsed.data.unit_id).maybeSingle();
  const visitName = parsed.data.type === "preventive" ? "Preventive visit" : "Breakdown";
  await recordActivity(supabase, {
    tenantId: profile.tenant_id,
    userId,
    kind: "visit_recorded",
    summary: `${visitName} recorded for ${unit?.serial_no ?? "a machine"}`,
  });

  revalidatePath("/app", "layout");
  redirect("/app/visits");
};

export const skipPmd = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const parsed = skipPmdSchema.safeParse({
    unit_id: formData.get("unit_id"),
    skipped_on: formData.get("skipped_on"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the skip and try again." };
  }

  const { supabase, userId, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return { error: "You cannot skip a visit." };
  }

  const { error } = await supabase.rpc("skip_pmd", {
    p_unit_id: parsed.data.unit_id,
    p_skipped_on: parsed.data.skipped_on,
    p_reason: parsed.data.reason,
  });

  if (error) {
    return { error: visitError(error.message, "The due date could not be skipped. Try again.") };
  }

  const { data: unit } = await supabase.from("units").select("serial_no").eq("id", parsed.data.unit_id).maybeSingle();
  await recordActivity(supabase, {
    tenantId: profile.tenant_id,
    userId,
    kind: "pmd_skipped",
    summary: `Service date skipped for ${unit?.serial_no ?? "a machine"}`,
  });

  revalidatePath("/app", "layout");
  redirect("/app/visits");
};
