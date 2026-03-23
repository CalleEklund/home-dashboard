export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export type Recurrence = "once" | "weekly" | "biweekly" | "triweekly" | "monthly";

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  once: "One-time only",
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  triweekly: "Every 3 weeks",
  monthly: "Monthly",
};

export type PlannerTask = {
  id: string;
  text: string;
  days: Weekday[];
  color: string;
  recurrence: Recurrence;
  /** ISO date string of the week this task was created (Monday) */
  createdWeek: string;
};
