import { addCalendarDays, parseCalendarDate, type CalendarDate } from "./dates";

export const PMD_STATUSES = ["completed", "overdue", "due", "scheduled"] as const;

export type PmdStatus = (typeof PMD_STATUSES)[number];

export type PmdStatusInput = {
  dueDate: CalendarDate;
  completedOn: CalendarDate | null;
  today: CalendarDate;
  reminderDays: number;
};

export const pmdStatus = ({ dueDate, completedOn, today, reminderDays }: PmdStatusInput): PmdStatus => {
  parseCalendarDate(dueDate);
  parseCalendarDate(today);

  if (completedOn) {
    parseCalendarDate(completedOn);
    return "completed";
  }

  if (!Number.isInteger(reminderDays) || reminderDays < 0 || reminderDays > 90) {
    throw new Error("reminderDays must be a whole number from 0 to 90.");
  }

  if (dueDate < today) {
    return "overdue";
  }

  if (dueDate <= addCalendarDays(today, reminderDays)) {
    return "due";
  }

  return "scheduled";
};
