"use client";

import { useActionState, useState } from "react";
import type { ChemicalCategory } from "@service-app/core";
import { createChemical } from "@/actions/catalog";
import type { FormState } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const categories: { value: ChemicalCategory; label: string }[] = [
  { value: "reagents", label: "Reagents" },
  { value: "biochemistry", label: "Biochemistry" },
  { value: "hematology", label: "Hematology" },
  { value: "rapid_cards", label: "Rapid cards" },
  { value: "consumables", label: "Consumables" },
];

const selectClassName = "h-11 rounded-md border border-input bg-background px-3 text-base";

const initialState: FormState = { error: null };

type Chemical = {
  id: string;
  name: string;
  category: ChemicalCategory;
};

export const ChemicalForm = ({ chemicals }: { chemicals: Chemical[] }) => {
  const [state, formAction, pending] = useActionState(createChemical, initialState);
  const [category, setCategory] = useState<ChemicalCategory>("reagents");
  const names = chemicals.filter((item) => item.category === category);
  const [name, setName] = useState(names[0]?.name ?? "");

  const handleCategoryChange = (value: ChemicalCategory) => {
    const nextNames = chemicals.filter((item) => item.category === value);
    setCategory(value);
    setName(nextNames[0]?.name ?? "");
  };

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="chemical-category">Category</Label>
        <select
          id="chemical-category"
          name="category"
          required
          className={selectClassName}
          value={category}
          onChange={(event) => handleCategoryChange(event.target.value as ChemicalCategory)}
        >
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="chemical-name">Name</Label>
        <select
          id="chemical-name"
          name="name"
          required
          className={selectClassName}
          value={names.length === 0 ? "" : name}
          disabled={names.length === 0}
          onChange={(event) => setName(event.target.value)}
        >
          {names.length === 0 ? (
            <option value="">No chemicals in this category</option>
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
          {pending ? "Saving…" : "Save chemical"}
        </Button>
      </div>
    </form>
  );
};
