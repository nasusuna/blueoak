"use client";

import { istToday, nextPmdDueDate } from "@service-app/core";
import { useActionState, useState } from "react";
import type { FormState } from "@/actions/customers";
import { recordVisit } from "@/actions/visits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type VisitUnit = {
  id: string;
  label: string;
  intervalMonths: 3 | 6;
  openDue: string | null;
};

const initialState: FormState = { error: null };
const fieldClass = "h-11 rounded-md border border-input bg-background px-3 text-base";

export const VisitForm = ({ units }: { units: VisitUnit[] }) => {
  const [state, formAction, pending] = useActionState(recordVisit, initialState);
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [visitType, setVisitType] = useState<"breakdown" | "preventive">("preventive");
  const selected = units.find((unit) => unit.id === unitId);
  const nextDue =
    selected?.openDue && (selected.intervalMonths === 3 || selected.intervalMonths === 6)
      ? nextPmdDueDate(selected.openDue, selected.intervalMonths)
      : "";
  const blocked = visitType === "preventive" && !selected?.openDue;

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="unit_id">Machine</Label>
        <select
          id="unit_id"
          name="unit_id"
          required
          className={fieldClass}
          value={unitId}
          onChange={(event) => setUnitId(event.target.value)}
        >
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Visit type</Label>
        <select
          id="type"
          name="type"
          className={fieldClass}
          value={visitType}
          onChange={(event) => setVisitType(event.target.value === "breakdown" ? "breakdown" : "preventive")}
        >
          <option value="preventive">Preventive maintenance</option>
          <option value="breakdown">Breakdown</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="event_date">Visit date</Label>
        <Input id="event_date" name="event_date" type="date" required defaultValue={istToday()} />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="complaint">Complaint</Label>
        <Input id="complaint" name="complaint" />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="work_done">Work done</Label>
        <Input id="work_done" name="work_done" />
      </div>
      {visitType === "preventive" && selected?.openDue ? (
        <p className="text-base sm:col-span-2">
          This closes the due date {selected.openDue}. The next due date is {nextDue}, counted from that due date.
        </p>
      ) : null}
      {visitType === "breakdown" && selected?.openDue ? (
        <p className="text-base sm:col-span-2">The preventive due date stays {selected.openDue}.</p>
      ) : null}
      {blocked ? (
        <p className="text-base sm:col-span-2">This machine has no open preventive-maintenance date.</p>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-base text-destructive sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending || blocked} aria-busy={pending}>
          {pending ? "Saving…" : "Save visit"}
        </Button>
      </div>
    </form>
  );
};
