import type { CalendarEvent, ViewMode, DayGroup, LayoutSlot } from "./types";

export const HOUR_HEIGHT = 48;
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 23;

export const COLORS = [
  { name: "Blue", hex: "#89b4fa" },
  { name: "Green", hex: "#a6e3a1" },
  { name: "Peach", hex: "#fab387" },
  { name: "Mauve", hex: "#cba6f7" },
  { name: "Red", hex: "#f38ba8" },
  { name: "Yellow", hex: "#f9e2af" },
];

// --- Date helpers ---

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  const day = r.getDay();
  r.setDate(r.getDate() - ((day + 6) % 7));
  return r;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric" });
}

// --- Navigation helpers ---

export function getNavigationLabel(mode: ViewMode, anchor: Date): string {
  const today = startOfDay(new Date());
  if (mode === "day") {
    if (isSameDay(anchor, today)) return "Today";
    if (isSameDay(anchor, addDays(today, 1))) return "Tomorrow";
    if (isSameDay(anchor, addDays(today, -1))) return "Yesterday";
    return anchor.toLocaleDateString("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  }
  if (mode === "week") {
    const end = addDays(anchor, 6);
    const s = anchor.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
    const e = end.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
    return `${s} – ${e}`;
  }
  return anchor.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });
}

export function navigate(mode: ViewMode, anchor: Date, direction: number): Date {
  if (mode === "day") return addDays(anchor, direction);
  if (mode === "week") return addDays(anchor, direction * 7);
  return addMonths(anchor, direction);
}

export function getViewRange(mode: ViewMode, anchor: Date): { start: Date; end: Date } {
  if (mode === "day") return { start: anchor, end: addDays(anchor, 1) };
  if (mode === "week") return { start: anchor, end: addDays(anchor, 7) };
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: anchor, end: monthEnd };
}

export function getAnchor(mode: ViewMode, date: Date): Date {
  if (mode === "day") return startOfDay(date);
  if (mode === "week") return startOfWeek(date);
  return startOfMonth(date);
}

// --- Event filtering & grouping ---

export function filterEvents(events: CalendarEvent[], start: Date, end: Date): CalendarEvent[] {
  return events.filter((e) => {
    const eStart = new Date(e.start);
    const eEnd = new Date(e.end);
    return eEnd > start && eStart < end;
  });
}

export function groupByDay(events: CalendarEvent[], rangeStart: Date, rangeEnd: Date): DayGroup[] {
  const days: DayGroup[] = [];
  const today = startOfDay(new Date());
  let d = new Date(rangeStart);

  while (d < rangeEnd) {
    const dayStart = startOfDay(d);
    const dayEnd = addDays(dayStart, 1);
    const dayEvents = events.filter((e) => {
      const eStart = new Date(e.start);
      const eEnd = new Date(e.end);
      return eEnd > dayStart && eStart < dayEnd;
    });

    let label: string;
    if (isSameDay(dayStart, today)) label = "Today";
    else if (isSameDay(dayStart, addDays(today, 1))) label = "Tomorrow";
    else label = formatShortDate(dayStart);

    days.push({ date: dayStart, label, events: dayEvents });
    d = dayEnd;
  }

  return days;
}

// --- Timeline layout ---

export function layoutOverlaps(events: CalendarEvent[]): LayoutSlot[] {
  const timed = events
    .filter((e) => !e.allDay)
    .map((e) => ({ event: e, start: new Date(e.start).getTime(), end: new Date(e.end).getTime() }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const slots: LayoutSlot[] = [];
  const columns: { end: number; event: CalendarEvent }[][] = [];

  for (const item of timed) {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const last = columns[col][columns[col].length - 1];
      if (item.start >= last.end) {
        columns[col].push({ end: item.end, event: item.event });
        slots.push({ event: item.event, column: col, totalColumns: 0 });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([{ end: item.end, event: item.event }]);
      slots.push({ event: item.event, column: columns.length - 1, totalColumns: 0 });
    }
  }

  for (const slot of slots) {
    slot.totalColumns = columns.length;
  }

  return slots;
}

export function timeToOffset(date: Date): number {
  const hours = date.getHours() + date.getMinutes() / 60;
  return (Math.max(hours, DAY_START_HOUR) - DAY_START_HOUR) * HOUR_HEIGHT;
}

export function durationToHeight(start: Date, end: Date): number {
  const startH = Math.max(start.getHours() + start.getMinutes() / 60, DAY_START_HOUR);
  const endH = Math.min(end.getHours() + end.getMinutes() / 60, DAY_END_HOUR);
  return Math.max((endH - startH) * HOUR_HEIGHT, 18);
}

export function getMonthWeeks(anchor: Date): Date[][] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const weekStartDate = startOfWeek(firstDay);

  const weeks: Date[][] = [];
  let current = new Date(weekStartDate);
  while (current.getMonth() <= month || (current.getMonth() > month && weeks.length < 6)) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current = addDays(current, 1);
    }
    weeks.push(week);
    if (current.getMonth() !== month && weeks.length >= 4) break;
  }
  return weeks;
}

export function getSpanningAllDayEvents(
  days: DayGroup[],
): { event: CalendarEvent; colStart: number; colSpan: number }[] {
  const seen = new Set<string>();
  const spans: { event: CalendarEvent; colStart: number; colSpan: number }[] = [];

  for (let i = 0; i < days.length; i++) {
    for (const event of days[i].events) {
      if (!event.allDay) continue;
      const baseUid = event.uid.replace(/_\d{4}-\d{2}.*$/, "");
      if (seen.has(baseUid)) continue;
      seen.add(baseUid);

      const eventEnd = new Date(event.end);
      let colSpan = 1;
      for (let j = i + 1; j < days.length; j++) {
        if (days[j].date < eventEnd) colSpan++;
        else break;
      }

      spans.push({ event, colStart: i, colSpan });
    }
  }
  return spans;
}
