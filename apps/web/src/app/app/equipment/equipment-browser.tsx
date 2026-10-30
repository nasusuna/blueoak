"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";

const categoryLabel: Record<string, string> = {
  biochemistry: "Biochemistry",
  hematology: "Hematology",
  electrolyte: "Electrolyte",
  immunoassay: "Immunoassay",
  coagulation: "Coagulation",
  poct: "POCT",
  "lab equipment": "Lab equipment",
};

const selectClassName = "h-11 rounded-md border border-input bg-background px-3 text-base";

const labelFor = (category: string) => categoryLabel[category] ?? category;

type Equipment = {
  id: string;
  name: string;
  category: string | null;
};

export const EquipmentBrowser = ({ equipment }: { equipment: Equipment[] }) => {
  const categories = [...new Set(equipment.map((item) => item.category).filter((category): category is string => Boolean(category)))].sort(
    (left, right) => labelFor(left).localeCompare(labelFor(right)),
  );
  const [category, setCategory] = useState(categories[0] ?? "");
  const names = equipment.filter((item) => item.category === category);
  const [nameId, setNameId] = useState(names[0]?.id ?? "");

  const handleCategoryChange = (value: string) => {
    const nextNames = equipment.filter((item) => item.category === value);
    setCategory(value);
    setNameId(nextNames[0]?.id ?? "");
  };

  if (categories.length === 0) {
    return <p className="text-base text-muted-foreground">No equipment types yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="equipment-list-category">Category</Label>
        <select
          id="equipment-list-category"
          className={selectClassName}
          value={category}
          onChange={(event) => handleCategoryChange(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {labelFor(item)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="equipment-list-name">Name</Label>
        <select
          id="equipment-list-name"
          className={selectClassName}
          value={names.length === 0 ? "" : nameId}
          disabled={names.length === 0}
          onChange={(event) => setNameId(event.target.value)}
        >
          {names.length === 0 ? (
            <option value="">No equipment in this category</option>
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
