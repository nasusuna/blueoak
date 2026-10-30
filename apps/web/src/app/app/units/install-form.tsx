"use client";

import { firstPmdDueDate, istToday } from "@service-app/core";
import { useActionState, useState } from "react";
import { type FormState } from "@/actions/customers";
import { installUnit } from "@/actions/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDisplayDate } from "@/lib/format";

type Option = { id: string; name: string };

const initialState: FormState = { error: null };

export const InstallForm = ({
  customers = [],
  equipmentTypes,
  customerId,
}: {
  customers?: Option[];
  equipmentTypes: Option[];
  customerId?: string;
}) => {
  const [state, formAction, pending] = useActionState(installUnit, initialState);
  const today = istToday();
  const [installedOn, setInstalledOn] = useState(today);
  const [startDate, setStartDate] = useState(today);
  const [interval, setInterval] = useState<"3" | "6">("6");
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? firstPmdDueDate(startDate, interval === "3" ? 3 : 6) : "";

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {customerId ? (
        <>
          <input type="hidden" name="customer_id" value={customerId} />
          <input type="hidden" name="redirect_to" value={`/app/customers/${customerId}`} />
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="customer_id">Customer</Label>
          <Select id="customer_id" name="customer_id" required defaultValue="">
            <option value="" disabled>
              Choose a customer
            </option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="equipment_type_id">Equipment type</Label>
        <Select id="equipment_type_id" name="equipment_type_id" required defaultValue="">
          <option value="" disabled>
            Choose a type
          </option>
          {equipmentTypes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
            ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="make">Make</Label>
        <Input id="make" name="make" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="model">Model</Label>
        <Input id="model" name="model" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="serial_no">Serial number</Label>
        <Input id="serial_no" name="serial_no" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="installed_on">Installed on</Label>
        <Input
          id="installed_on"
          name="installed_on"
          type="date"
          required
          value={installedOn}
          onChange={(event) => {
            setInstalledOn(event.target.value);
            setStartDate(event.target.value);
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pmd_interval_months">PMD interval</Label>
        <Select
          id="pmd_interval_months"
          name="pmd_interval_months"
          value={interval}
          onChange={(event) => setInterval(event.target.value === "3" ? "3" : "6")}
        >
          <option value="6">6 months</option>
          <option value="3">3 months</option>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pmd_start_date">PMD start date</Label>
        <Input
          id="pmd_start_date"
          name="pmd_start_date"
          type="date"
          required
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </div>
      <p className="text-base text-muted-foreground sm:col-span-2">First preventive maintenance is due on {dueDate ? formatDisplayDate(dueDate) : "—"}.</p>
      {state.error ? (
        <p role="alert" className="text-base text-destructive sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : "Save installation"}
        </Button>
      </div>
    </form>
  );
};
