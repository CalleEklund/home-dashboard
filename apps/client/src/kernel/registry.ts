import type { Registry } from "./types"
import Clock from "../features/clock"
import Weather from "../features/weather"
import Notes from "../features/notes"
import Departures from "../features/departures"
import IcaShopping from "../features/ica-shopping"
import Calendar from "../features/calendar"
import Timer from "../features/timer"
import WeeklyPlanner from "../features/weekly-planner"

export const WIDGETS: Registry = {
  clock: { label: "Clock", icon: "\u{1F550}", component: Clock, defaultSpan: { colSpan: 4, rowSpan: 2 } },
  weather: { label: "Weather", icon: "\u{1F324}\uFE0F", component: Weather, defaultSpan: { colSpan: 2, rowSpan: 2 } },
  notes: { label: "Notes", icon: "\u{1F4DD}", component: Notes, defaultSpan: { colSpan: 3, rowSpan: 4 } },
  departures: { label: "Departures", icon: "\u{1F68C}", component: Departures, defaultSpan: { colSpan: 3, rowSpan: 4 } },
  ica: { label: "ICA Shopping", icon: "\u{1F6D2}", component: IcaShopping, defaultSpan: { colSpan: 3, rowSpan: 5 } },
  calendar: { label: "Calendar", icon: "\u{1F4C5}", component: Calendar, defaultSpan: { colSpan: 4, rowSpan: 5 } },
  timer: { label: "Timer", icon: "\u23F2\uFE0F", component: Timer, defaultSpan: { colSpan: 2, rowSpan: 3 } },
  "weekly-planner": { label: "Weekly Planner", icon: "\u{1F4CB}", component: WeeklyPlanner, defaultSpan: { colSpan: 5, rowSpan: 3 } },
}
