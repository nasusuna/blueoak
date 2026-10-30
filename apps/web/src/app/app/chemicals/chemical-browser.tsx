"use client";

import { useState } from "react";
import type { ChemicalCategory } from "@service-app/db";
import { Label } from "@/components/ui/label";

const categories: { value: ChemicalCategory; label: string }[] = [
  { value: "reagents", label: "Reagents" },
  { value: "biochemistry", label: "Biochemistry" },
  { value: "hematology", label: "Hematology" },
  { value: "rapid_cards", label: "Rapid cards" },
  { value: "consumables", label: "Consumables" },
];

const selectClassName = "h-11 rounded-md border border-input bg-background px-3 text-base";

type Chemical = {
  id: string;
  name: string;
  category: ChemicalCategory;
};

export const ChemicalBrowser = ({ chemicals }: { chemicals: Chemical[] }) => {
  const [category, setCategory] = useState<ChemicalCategory>("reagents");
  const names = chemicals.filter((item) => item.category === category);
  const [nameId, setNameId] = useState(names[0]?.id ?? "");

  const handleCategoryChange = (value: ChemicalCategory) => {
    const nextNames = chemicals.filter((item) => item.category === value);
    setCategory(value);
    setNameId(nextNames[0]?.id ?? "");
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="chemical-list-category">Category</Label>
        <select
          id="chemical-list-category"
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
        <Label htmlFor="chemical-list-name">Name</Label>
        <select
          id="chemical-list-name"
          className={selectClassName}
          value={names.length === 0 ? "" : nameId}
          disabled={names.length === 0}
          onChange={(event) => setNameId(event.target.value)}
        >
          {names.length === 0 ? (
            <option value="">No chemicals in this category</option>
          ) : (
            names.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
};
