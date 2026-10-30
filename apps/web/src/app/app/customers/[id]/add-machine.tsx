"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InstallForm } from "@/app/app/units/install-form";

type EquipmentType = { id: string; name: string };

export const AddMachine = ({ customerId, equipmentTypes }: { customerId: string; equipmentTypes: EquipmentType[] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <Button type="button" className="self-start" variant={open ? "outline" : "default"} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        {open ? "Hide form" : "Add a machine"}
      </Button>
      {open && equipmentTypes.length > 0 ? <InstallForm customerId={customerId} equipmentTypes={equipmentTypes} /> : null}
      {open && equipmentTypes.length === 0 ? (
        <p className="text-base text-muted-foreground">
          Add an{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/app/equipment">
            equipment type
          </Link>{" "}
          before installing a machine.
        </p>
      ) : null}
    </div>
  );
};
