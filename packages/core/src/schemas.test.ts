import { describe, expect, it } from "vitest";
import {
  customerSchema,
  installUnitSchema,
  loginSchema,
  recordVisitSchema,
  requestVisitSchema,
  skipPmdSchema,
  tenantSettingsSchema,
  userRoleSchema,
} from "./schemas";

describe("loginSchema", () => {
  it("accepts a staff email and an 8-character password", () => {
    expect(loginSchema.safeParse({ email: "owner@bindushree.test", password: "Local-demo-pass-1" }).success).toBe(
      true,
    );
  });

  it("rejects a short password and a bad email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "short" }).success).toBe(false);
  });
});

describe("tenantSettingsSchema", () => {
  it("defaults the reminder window, interval, and template", () => {
    expect(tenantSettingsSchema.parse({})).toEqual({
      reminder_days: 7,
      default_pmd_months: 6,
      report_template: "generic",
    });
  });

  it("rejects an interval other than 3 or 6 months", () => {
    expect(tenantSettingsSchema.safeParse({ default_pmd_months: 4 }).success).toBe(false);
  });
});

describe("userRoleSchema", () => {
  it("accepts the four application roles", () => {
    expect(userRoleSchema.safeParse("technician").success).toBe(true);
    expect(userRoleSchema.safeParse("admin").success).toBe(false);
  });
});

describe("customerSchema", () => {
  it("accepts a lab with a blank email and PIN", () => {
    const parsed = customerSchema.safeParse({
      name: "City Lab",
      contact_person: "",
      mobile: "",
      whatsapp: "",
      email: "",
      address: "",
      city: "Mysuru",
      pin: "",
      gstin: "",
      tally_ledger_name: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects a short PIN and a bad email", () => {
    const parsed = customerSchema.safeParse({
      name: "City Lab",
      contact_person: "",
      mobile: "",
      whatsapp: "",
      email: "not-an-email",
      address: "",
      city: "",
      pin: "570",
      gstin: "",
      tally_ledger_name: "",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("installUnitSchema", () => {
  it("accepts a 6 month installation and keeps the interval as a number", () => {
    const parsed = installUnitSchema.safeParse({
      customer_id: "22222222-2222-4222-8222-222222222222",
      equipment_type_id: "33333333-3333-4333-8333-333333333333",
      make: "Mindray",
      model: "BS-240",
      serial_no: "SN-100",
      installed_on: "2026-01-15",
      pmd_interval_months: "6",
      pmd_start_date: "2026-01-15",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.pmd_interval_months).toBe(6);
    }
  });

  it("rejects a start date before installation", () => {
    const parsed = installUnitSchema.safeParse({
      customer_id: "22222222-2222-4222-8222-222222222222",
      equipment_type_id: "33333333-3333-4333-8333-333333333333",
      make: "",
      model: "",
      serial_no: "SN-100",
      installed_on: "2026-03-01",
      pmd_interval_months: 3,
      pmd_start_date: "2026-02-01",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("recordVisitSchema", () => {
  it("accepts a preventive visit with no complaint", () => {
    const parsed = recordVisitSchema.safeParse({
      unit_id: "22222222-2222-4222-8222-222222222222",
      type: "preventive",
      event_date: "2026-07-20",
      complaint: "",
      work_done: "Replaced the lamp",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects a visit that is not a breakdown or preventive", () => {
    expect(
      recordVisitSchema.safeParse({
        unit_id: "22222222-2222-4222-8222-222222222222",
        type: "installation",
        event_date: "2026-07-20",
        complaint: "",
        work_done: "",
      }).success,
    ).toBe(false);
  });
});

describe("requestVisitSchema", () => {
  it("requires a note", () => {
    expect(
      requestVisitSchema.safeParse({
        unit_id: "22222222-2222-4222-8222-222222222222",
        note: "   ",
      }).success,
    ).toBe(false);
  });
});

describe("skipPmdSchema", () => {
  it("requires a reason", () => {
    expect(
      skipPmdSchema.safeParse({
        unit_id: "22222222-2222-4222-8222-222222222222",
        skipped_on: "2026-07-01",
        reason: "   ",
      }).success,
    ).toBe(false);
  });
});
