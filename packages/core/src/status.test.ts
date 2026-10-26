import { describe, expect, it } from "vitest";
import { pmdStatus } from "./status";

const today = "2026-10-26";

describe("pmdStatus", () => {
  it("returns completed when the visit is closed, even if the due date has passed", () => {
    expect(
      pmdStatus({
        dueDate: "2026-10-01",
        completedOn: "2026-10-20",
        today,
        reminderDays: 7,
      }),
    ).toBe("completed");
  });

  it("returns overdue only before today", () => {
    expect(pmdStatus({ dueDate: "2026-10-25", completedOn: null, today, reminderDays: 7 })).toBe("overdue");
    expect(pmdStatus({ dueDate: "2026-10-26", completedOn: null, today, reminderDays: 7 })).toBe("due");
  });

  it("returns due through the last day of the reminder window", () => {
    expect(pmdStatus({ dueDate: "2026-11-02", completedOn: null, today, reminderDays: 7 })).toBe("due");
    expect(pmdStatus({ dueDate: "2026-11-03", completedOn: null, today, reminderDays: 7 })).toBe("scheduled");
  });

  it("treats a zero-day reminder as due only on the due date", () => {
    expect(pmdStatus({ dueDate: "2026-10-26", completedOn: null, today, reminderDays: 0 })).toBe("due");
    expect(pmdStatus({ dueDate: "2026-10-27", completedOn: null, today, reminderDays: 0 })).toBe("scheduled");
  });

  it("rejects a reminder window outside 0 to 90 days", () => {
    expect(() => pmdStatus({ dueDate: today, completedOn: null, today, reminderDays: -1 })).toThrow(/reminderDays/);
    expect(() => pmdStatus({ dueDate: today, completedOn: null, today, reminderDays: 91 })).toThrow(/reminderDays/);
  });
});
