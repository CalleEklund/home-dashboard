export type {
  CalendarEvent,
  CalendarFeed,
} from "@smartfridge/api-schema";

import type { CalendarEvent } from "@smartfridge/api-schema";

export type ViewMode = "day" | "week" | "month";
export type DisplayStyle = "list" | "timeline";

export type DayGroup = { date: Date; label: string; events: CalendarEvent[] };
export type LayoutSlot = {
  event: CalendarEvent;
  column: number;
  totalColumns: number;
};
