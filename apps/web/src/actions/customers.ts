"use server";

import { customerSchema, type CustomerInput } from "@service-app/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivity } from "@/lib/activity";
import { isStaff, loadWorkspace } from "@/lib/session";

export type FormState = { error: string | null };

const emptyToNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const readCustomer = (formData: FormData) =>
  customerSchema.safeParse({
    name: formData.get("name"),
    contact_person: formData.get("contact_person"),
    mobile: formData.get("mobile"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    address: formData.get("address"),
    city: formData.get("city"),
    pin: formData.get("pin"),
    gstin: formData.get("gstin"),
    tally_ledger_name: formData.get("tally_ledger_name"),
  });

const toCustomerRow = (data: CustomerInput) => ({
  name: data.name,
  contact_person: emptyToNull(data.contact_person),
  mobile: emptyToNull(data.mobile),
  whatsapp: emptyToNull(data.whatsapp),
  email: emptyToNull(data.email),
  address: emptyToNull(data.address),
  city: emptyToNull(data.city),
  pin: emptyToNull(data.pin),
  gstin: emptyToNull(data.gstin),
  tally_ledger_name: emptyToNull(data.tally_ledger_name),
});

export const createCustomer = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const parsed = readCustomer(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the customer and try again." };
  }

  const { supabase, userId, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return { error: "You cannot add customers." };
  }

  const { error } = await supabase.from("customers").insert({
    tenant_id: profile.tenant_id,
    ...toCustomerRow(parsed.data),
    created_by: userId,
  });

  if (error) {
    return { error: "The customer could not be saved. Try again." };
  }

  await recordActivity(supabase, {
    tenantId: profile.tenant_id,
    userId,
    kind: "customer_added",
    summary: `${parsed.data.name} added`,
  });

  revalidatePath("/app", "layout");
  redirect("/app/customers");
};

export const updateCustomer = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const id = formData.get("id");
  const parsed = readCustomer(formData);

  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "This customer was not found." };
  }

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the customer and try again." };
  }

  const { supabase, userId, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return { error: "You cannot edit customers." };
  }

  const next = toCustomerRow(parsed.data);
  const { data: existing } = await supabase.from("customers").select("email").eq("id", id).maybeSingle();
  const { data, error } = await supabase.from("customers").update(next).eq("id", id).select("id").maybeSingle();

  if (error || !data) {
    return { error: "The customer could not be saved. Try again." };
  }

  const previousEmail = existing?.email ?? null;
  const emailChanged = previousEmail !== next.email;
  const summary = emailChanged
    ? next.email
      ? `Email for ${next.name} updated to ${next.email}`
      : `Email for ${next.name} removed`
    : `${next.name} updated`;

  await recordActivity(supabase, {
    tenantId: profile.tenant_id,
    userId,
    kind: emailChanged ? "email_updated" : "customer_updated",
    summary,
  });

  revalidatePath("/app", "layout");
  redirect(`/app/customers/${id}`);
};
