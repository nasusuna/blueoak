"use client";

import { useActionState } from "react";
import { createEquipmentType } from "@/actions/catalog";
import type { FormState } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categories = [
  { value: "biochemistry", label: "Biochemistry" },
  { value: "hematology", label: "Hematology" },
  { value: "electrolyte", label: "Electrolyte" },
  { value: "immunoassay", label: "Immunoassay" },
  { value: "coagulation", label: "Coagulation" },
  { value: "poct", label: "POCT" },
  { value: "lab equipment", label: "Lab equipment" },
];

const initialState: FormState = { error: null };

export const EquipmentForm = () => {
  const [state, formAction, pending] = useActionState(createEquipmentType, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="equipment-category">Category</Label>
        <select
          id="equipment-category"
          name="category"
          required
          defaultValue="biochemistry"
          className="h-11 rounded-md border border-input bg-background px-3 text-base"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="equipment-name">Name</Label>
        <Input id="equipment-name" name="name" required />
      </div>
      {state.error ? (
        <p role="alert" className="text-base text-destructive sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : "Save equipment type"}
        </Button>
      </div>
    </form>
  );
};
