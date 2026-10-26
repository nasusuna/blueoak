import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  addCalendarMonths,
  firstPmdDueDate,
  istToday,
  nextPmdDueDate,
  parseCalendarDate,
} from "./dates";

describe("calendar dates", () => {
  it("rejects dates that are not real calendar days", () => {
    expect(() => parseCalendarDate("2026-02-31")).toThrow(/Invalid calendar date/);
    expect(() => parseCalendarDate("15-01-2026")).toThrow(/Invalid calendar date/);
  });

  it("clamps month-end dates onto the last real day", () => {
    expect(addCalendarMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addCalendarMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addCalendarMonths("2026-03-31", 3)).toBe("2026-06-30");
    expect(addCalendarMonths("2026-08-31", 6)).toBe("2027-02-28");
  });

  it("adds days across a month boundary", () => {
    expect(addCalendarDays("2026-10-26", 7)).toBe("2026-11-02");
    expect(addCalendarDays("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("uses the India calendar date around midnight IST", () => {
    expect(istToday(new Date("2026-10-25T20:00:00.000Z"))).toBe("2026-10-26");
    expect(istToday(new Date("2026-10-26T18:00:00.000Z"))).toBe("2026-10-26");
    expect(istToday(new Date("2026-10-26T19:00:00.000Z"))).toBe("2026-10-27");
  });
});

describe("PMD due dates", () => {
  it("books the first visit one interval after installation", () => {
    expect(firstPmdDueDate("2026-01-15", 6)).toBe("2026-07-15");
    expect(firstPmdDueDate("2026-01-15", 3)).toBe("2026-04-15");
  });

  it("adds the interval to the previous due date", () => {
    expect(nextPmdDueDate("2026-01-15", 6)).toBe("2026-07-15");
    expect(nextPmdDueDate("2026-01-31", 3)).toBe("2026-04-30");
  });
});
