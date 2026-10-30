"use client";

import { istToday, nextPmdDueDate } from "@service-app/core";
import { useActionState, useState } from "react";
import type { FormState } from "@/actions/customers";
import { skipPmd } from "@/actions/visits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDisplayDate } from "@/lib/format";
import type { VisitUnit } from "./visit-form";

const initialState: FormState = { error: null };

export const SkipForm = ({ units }: { units: VisitUnit[] }) => {
  const [state, formAction, pending] = useActionState(skipPmd, initialState);
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const selected = units.find((unit) => unit.id === unitId);
  const nextDue = selected?.openDue ? nextPmdDueDate(selected.openDue, selected.intervalMonths) : "";

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="skip_unit_id">Machine</Label>
        <Select
          id="skip_unit_id"
          name="unit_id"
          required
          value={unitId}
          onChange={(event) => setUnitId(event.target.value)}
        >
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="skipped_on">Skipped on</Label>
        <Input id="skipped_on" name="skipped_on" type="date" required defaultValue={istToday()} />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="reason">Reason</Label>
        <Input id="reason" name="reason" required />
      </div>
      {selected?.openDue ? (
        <p className="text-base sm:col-span-2">
          This closes {formatDisplayDate(selected.openDue)} without a visit. The next due date is {formatDisplayDate(nextDue)}.
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-base text-destructive sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : "Skip due date"}
        </Button>
      </div>
    </form>
  );
};
