export const APP_TIMEZONE = "Asia/Kolkata";

export const PMD_INTERVALS = [3, 6] as const;

export type PmdInterval = (typeof PMD_INTERVALS)[number];

export type CalendarDate = string;

type CalendarParts = {
  year: number;
  month: number;
  day: number;
};

const pad = (value: number): string => String(value).padStart(2, "0");

export const formatCalendarDate = (year: number, month: number, day: number): CalendarDate =>
  `${year}-${pad(month)}-${pad(day)}`;

export const parseCalendarDate = (value: string): CalendarParts => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

  if (!isRealDate) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return { year, month, day };
};

export const addCalendarMonths = (value: CalendarDate, months: number): CalendarDate => {
  const { year, month, day } = parseCalendarDate(value);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();

  return formatCalendarDate(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(day, lastDay));
};

export const addCalendarDays = (value: CalendarDate, days: number): CalendarDate => {
  const { year, month, day } = parseCalendarDate(value);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return formatCalendarDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
};

export const istToday = (now: Date = new Date()): CalendarDate => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return formatCalendarDate(year, month, day);
};

export const isPmdInterval = (value: number): value is PmdInterval => value === 3 || value === 6;

export const firstPmdDueDate = (installedOn: CalendarDate, intervalMonths: PmdInterval): CalendarDate =>
  addCalendarMonths(installedOn, intervalMonths);

/** Next due date stays on the contract calendar: previous due date plus the interval. */
export const nextPmdDueDate = (dueDate: CalendarDate, intervalMonths: PmdInterval): CalendarDate =>
  addCalendarMonths(dueDate, intervalMonths);
