export type {
  CalendarEvent,
  CalendarFeed,
} from "@home-dashboard/api-schema";

import type { CalendarEvent } from "@home-dashboard/api-schema";

export type ViewMode = "day" | "week" | "month";
export type DisplayStyle = "list" | "timeline";

export type DayGroup = { date: Date; label: string; events: CalendarEvent[] };
export type LayoutSlot = {
  event: CalendarEvent;
  column: number;
  totalColumns: number;
};
