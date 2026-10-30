"use server";

import { chemicalSchema, equipmentTypeSchema } from "@service-app/core";
import { redirect } from "next/navigation";
import type { FormState } from "@/actions/customers";
import { isStaff, loadWorkspace } from "@/lib/session";

const emptyToNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const createEquipmentType = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const parsed = equipmentTypeSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the equipment type and try again." };
  }

  const { supabase, userId, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return { error: "You cannot add equipment types." };
  }

  const { error } = await supabase.from("equipment_types").insert({
    tenant_id: profile.tenant_id,
    name: parsed.data.name,
    category: emptyToNull(parsed.data.category),
    created_by: userId,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "That equipment name is already in the list." : "The equipment type could not be saved.",
    };
  }

  redirect("/app/equipment");
};

export const createChemical = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const parsed = chemicalSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the chemical and try again." };
  }

  const { supabase, userId, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return { error: "You cannot add chemicals." };
  }

  const { error } = await supabase.from("chemicals").insert({
    tenant_id: profile.tenant_id,
    name: parsed.data.name,
    category: parsed.data.category,
    created_by: userId,
  });

  if (error && error.code !== "23505") {
    return { error: "The chemical could not be saved." };
  }

  redirect("/app/chemicals");
};
