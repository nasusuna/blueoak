"use client";

import { useActionState, useState } from "react";
import { createEquipmentType } from "@/actions/catalog";
import type { FormState } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const knownCategories = [
  { value: "biochemistry", label: "Biochemistry" },
  { value: "hematology", label: "Hematology" },
  { value: "electrolyte", label: "Electrolyte" },
  { value: "immunoassay", label: "Immunoassay" },
  { value: "coagulation", label: "Coagulation" },
  { value: "poct", label: "POCT" },
  { value: "lab equipment", label: "Lab equipment" },
];

const categoryLabel: Record<string, string> = Object.fromEntries(knownCategories.map((item) => [item.value, item.label]));

const selectClassName = "h-11 rounded-md border border-input bg-background px-3 text-base";

const labelFor = (category: string) => categoryLabel[category] ?? category;

const initialState: FormState = { error: null };

type Equipment = {
  id: string;
  name: string;
  category: string | null;
};

export const EquipmentForm = ({ equipment }: { equipment: Equipment[] }) => {
  const [state, formAction, pending] = useActionState(createEquipmentType, initialState);
  const extraCategories = [...new Set(equipment.map((item) => item.category).filter((category): category is string => Boolean(category)))].filter(
    (category) => !categoryLabel[category],
  );
  const categories = [...knownCategories, ...extraCategories.map((category) => ({ value: category, label: labelFor(category) }))];
  const [category, setCategory] = useState(categories[0]?.value ?? "");
  const names = equipment.filter((item) => item.category === category);
  const [name, setName] = useState(names[0]?.name ?? "");

  const handleCategoryChange = (value: string) => {
    const nextNames = equipment.filter((item) => item.category === value);
    setCategory(value);
    setName(nextNames[0]?.name ?? "");
  };

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="equipment-category">Category</Label>
        <select
          id="equipment-category"
          name="category"
          required
          className={selectClassName}
          value={category}
          onChange={(event) => handleCategoryChange(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="equipment-name">Name</Label>
        <select
          id="equipment-name"
          name="name"
          required
          className={selectClassName}
          value={names.length === 0 ? "" : name}
          disabled={names.length === 0}
          onChange={(event) => setName(event.target.value)}
        >
          {names.length === 0 ? (
            <option value="">No equipment in this category</option>
          ) : (
            names.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))
          )}
        </select>
      </div>
      {state.error ? (
        <p role="alert" className="text-base text-destructive sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending || names.length === 0} aria-busy={pending}>
          {pending ? "Saving…" : "Save equipment type"}
        </Button>
      </div>
    </form>
  );
};
