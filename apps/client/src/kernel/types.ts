export type WidgetId = "clock" | "weather" | "notes" | "departures" | "ica" | "calendar" | "timer" | "weekly-planner"

export type WidgetLayout = {
  id: WidgetId
  colStart: number
  rowStart: number
  colSpan: number
  rowSpan: number
  lockScreen: boolean
}

export type WidgetDefinition = {
  label: string
  icon: string
  component: React.ComponentType
  defaultSpan: { colSpan: number; rowSpan: number }
}

export type Registry = Record<WidgetId, WidgetDefinition>
