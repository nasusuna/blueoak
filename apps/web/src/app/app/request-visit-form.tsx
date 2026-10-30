"use client";

import { useActionState } from "react";
import type { FormState } from "@/actions/customers";
import { requestVisit } from "@/actions/visits";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type RequestMachine = {
  id: string;
  label: string;
};

const initialState: FormState = { error: null };

export const RequestVisitForm = ({ machines }: { machines: RequestMachine[] }) => {
  const [state, formAction, pending] = useActionState(requestVisit, initialState);

  if (machines.length === 0) {
    return <p className="text-base text-muted-foreground">A visit is already requested for every machine.</p>;
  }

  return (
    <form action={formAction} className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="request_unit_id">Machine</Label>
        <Select id="request_unit_id" name="unit_id" required defaultValue={machines[0]?.id ?? ""}>
          {machines.map((machine) => (
            <option key={machine.id} value={machine.id}>
              {machine.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note">What should we look at?</Label>
        <textarea
          id="note"
          name="note"
          required
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-base text-destructive">
          {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Sending…" : "Request a visit"}
        </Button>
      </div>
    </form>
  );
};
