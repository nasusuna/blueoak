import { z } from "zod";

export const userRoleSchema = z.enum(["platform_admin", "owner", "technician", "customer"]);

export type UserRole = z.infer<typeof userRoleSchema>;

export const pmdIntervalSchema = z.union([z.literal(3), z.literal(6)]);

export const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.");

export const tenantSettingsSchema = z.object({
  reminder_days: z.number().int().min(0).max(90).default(7),
  default_pmd_months: pmdIntervalSchema.default(6),
  report_template: z.string().trim().min(1).default("generic"),
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const chemicalCategorySchema = z.enum([
  "reagents",
  "biochemistry",
  "hematology",
  "rapid_cards",
  "consumables",
]);

export type ChemicalCategory = z.infer<typeof chemicalCategorySchema>;

export const customerSchema = z
  .object({
    name: z.string().trim().min(1, "Enter the customer name.").max(200),
    contact_person: z.string().trim().max(200),
    mobile: z.string().trim().max(20),
    whatsapp: z.string().trim().max(20),
    email: z.string().trim().max(200),
    address: z.string().trim().max(300),
    city: z.string().trim().max(100),
    pin: z.string().trim().max(6),
    gstin: z.string().trim().max(15),
    tally_ledger_name: z.string().trim().max(200),
  })
  .superRefine((value, context) => {
    if (value.email.length > 0 && !z.email().safeParse(value.email).success) {
      context.addIssue({ code: "custom", path: ["email"], message: "Enter a valid email address." });
    }

    if (value.pin.length > 0 && !/^\d{6}$/.test(value.pin)) {
      context.addIssue({ code: "custom", path: ["pin"], message: "Use a 6-digit PIN." });
    }
  });

export type CustomerInput = z.infer<typeof customerSchema>;

export const equipmentTypeSchema = z.object({
  name: z.string().trim().min(1, "Enter the equipment name.").max(200),
  category: z.string().trim().max(100),
});

export type EquipmentTypeInput = z.infer<typeof equipmentTypeSchema>;

export const chemicalSchema = z.object({
  name: z.string().trim().min(1, "Enter the chemical name.").max(200),
  category: chemicalCategorySchema,
});

export type ChemicalInput = z.infer<typeof chemicalSchema>;

export const installUnitSchema = z
  .object({
    customer_id: z.uuid("Choose a customer."),
    equipment_type_id: z.uuid("Choose an equipment type."),
    make: z.string().trim().max(100),
    model: z.string().trim().max(100),
    serial_no: z.string().trim().min(1, "Enter the serial number.").max(100),
    installed_on: calendarDateSchema,
    pmd_interval_months: z.union([z.literal(3), z.literal(6), z.literal("3"), z.literal("6")]).transform((value) =>
      value === 3 || value === "3" ? 3 : 6,
    ),
    pmd_start_date: calendarDateSchema,
  })
  .refine((value) => value.pmd_start_date >= value.installed_on, {
    path: ["pmd_start_date"],
    message: "The preventive-maintenance start cannot be before installation.",
  });

export type InstallUnitInput = z.infer<typeof installUnitSchema>;

export const visitTypeSchema = z.enum(["breakdown", "preventive"]);

export const recordVisitSchema = z.object({
  unit_id: z.uuid("Choose a machine."),
  type: visitTypeSchema,
  event_date: calendarDateSchema,
  complaint: z.string().trim().max(1000),
  work_done: z.string().trim().max(2000),
});

export type RecordVisitInput = z.infer<typeof recordVisitSchema>;

export const requestVisitSchema = z.object({
  unit_id: z.uuid("Choose a machine."),
  note: z.string().trim().min(1, "Describe the visit you need.").max(1000),
});

export type RequestVisitInput = z.infer<typeof requestVisitSchema>;

export const skipPmdSchema = z.object({
  unit_id: z.uuid("Choose a machine."),
  skipped_on: calendarDateSchema,
  reason: z.string().trim().min(1, "Enter why this visit was skipped.").max(300),
});

export type SkipPmdInput = z.infer<typeof skipPmdSchema>;
