"use client";

import { useActionState } from "react";
import { createChemical } from "@/actions/catalog";
import type { FormState } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categories = [
  { value: "reagents", label: "Reagents" },
  { value: "biochemistry", label: "Biochemistry" },
  { value: "hematology", label: "Hematology" },
  { value: "rapid_cards", label: "Rapid cards" },
  { value: "consumables", label: "Consumables" },
];

const initialState: FormState = { error: null };

export const ChemicalForm = () => {
  const [state, formAction, pending] = useActionState(createChemical, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="chemical-name">Name</Label>
        <Input id="chemical-name" name="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="chemical-category">Category</Label>
        <select
          id="chemical-category"
          name="category"
          required
          className="h-11 rounded-md border border-input bg-background px-3 text-base"
          defaultValue="reagents"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p role="alert" className="text-base text-destructive sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : "Save chemical"}
        </Button>
      </div>
    </form>
  );
};
