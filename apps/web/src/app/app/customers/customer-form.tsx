"use client";

import { useActionState, useState } from "react";
import { createCustomer, type FormState } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { error: null };

const blankCustomer = {
  name: "",
  contact_person: "",
  mobile: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "",
  pin: "",
  gstin: "",
  tally_ledger_name: "",
};

export const CustomerForm = ({
  action = createCustomer,
  customerId,
  defaults = blankCustomer,
  submitLabel = "Save customer",
}: {
  action?: typeof createCustomer;
  customerId?: string;
  defaults?: typeof blankCustomer;
  submitLabel?: string;
}) => {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {customerId ? <input type="hidden" name="id" value={customerId} /> : null}
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor={customerId ? `name-${customerId}` : "name"}>Name</Label>
        <Input id={customerId ? `name-${customerId}` : "name"} name="name" required autoComplete="organization" defaultValue={defaults.name} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={customerId ? `contact-${customerId}` : "contact_person"}>Contact person</Label>
        <Input id={customerId ? `contact-${customerId}` : "contact_person"} name="contact_person" autoComplete="name" defaultValue={defaults.contact_person} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={customerId ? `mobile-${customerId}` : "mobile"}>Mobile</Label>
        <Input id={customerId ? `mobile-${customerId}` : "mobile"} name="mobile" autoComplete="tel" defaultValue={defaults.mobile} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={customerId ? `whatsapp-${customerId}` : "whatsapp"}>WhatsApp</Label>
        <Input id={customerId ? `whatsapp-${customerId}` : "whatsapp"} name="whatsapp" autoComplete="tel" defaultValue={defaults.whatsapp} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={customerId ? `email-${customerId}` : "email"}>Email</Label>
        <Input id={customerId ? `email-${customerId}` : "email"} name="email" type="email" autoComplete="email" defaultValue={defaults.email} />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor={customerId ? `address-${customerId}` : "address"}>Address</Label>
        <Input id={customerId ? `address-${customerId}` : "address"} name="address" autoComplete="street-address" defaultValue={defaults.address} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={customerId ? `city-${customerId}` : "city"}>City</Label>
        <Input id={customerId ? `city-${customerId}` : "city"} name="city" autoComplete="address-level2" defaultValue={defaults.city} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={customerId ? `pin-${customerId}` : "pin"}>PIN</Label>
        <Input id={customerId ? `pin-${customerId}` : "pin"} name="pin" inputMode="numeric" autoComplete="postal-code" maxLength={6} defaultValue={defaults.pin} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={customerId ? `gstin-${customerId}` : "gstin"}>GSTIN</Label>
        <Input id={customerId ? `gstin-${customerId}` : "gstin"} name="gstin" maxLength={15} defaultValue={defaults.gstin} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={customerId ? `tally-${customerId}` : "tally_ledger_name"}>Tally ledger name</Label>
        <Input id={customerId ? `tally-${customerId}` : "tally_ledger_name"} name="tally_ledger_name" defaultValue={defaults.tally_ledger_name} />
      </div>
      {state.error ? (
        <p role="alert" className="text-base text-destructive sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export const AddCustomer = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" variant={open ? "outline" : "default"} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        {open ? "Hide form" : "Add a customer"}
      </Button>
      {open ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Add a lab or hospital</h2>
          </CardHeader>
          <CardContent>
            <CustomerForm />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
