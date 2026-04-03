import type { Breakpoint } from "../hooks/useBreakpoint"

export type GridConfig = {
  cols: number
  rows: number
  rowH: number
  gap: number
  mode: "grid" | "stack"
}

export function getGridConfig(bp: Breakpoint): GridConfig {
  if (bp === "phone") {
    return { cols: 20, rows: 21, rowH: 50, gap: 12, mode: "stack" }
  }
  if (bp === "tablet") {
    return { cols: 10, rows: 21, rowH: 45, gap: 10, mode: "grid" }
  }
  return { cols: 20, rows: 21, rowH: 50, gap: 12, mode: "grid" }
}

/** Map a widget's grid position from the 20-col desktop grid to a smaller grid */
export function scalePosition(
  colStart: number,
  colSpan: number,
  fromCols: number,
  toCols: number
): { colStart: number; colSpan: number } {
  if (fromCols === toCols) return { colStart, colSpan }
  const ratio = toCols / fromCols
  const newColStart = Math.max(1, Math.round((colStart - 1) * ratio) + 1)
  const newColSpan = Math.max(1, Math.round(colSpan * ratio))
  // Clamp to grid bounds
  const clampedStart = Math.min(newColStart, toCols)
  const clampedSpan = Math.min(newColSpan, toCols - clampedStart + 1)
  return { colStart: clampedStart, colSpan: Math.max(1, clampedSpan) }
}

/** Pixel heights for stacked phone layout per widget type */
const STACK_HEIGHTS: Record<string, number> = {
  clock: 160,
  weather: 200,
  notes: 400,
  departures: 400,
  ica: 450,
  calendar: 500,
  timer: 320,
  "weekly-planner": 400,
}

export function getStackHeight(widgetId: string): number {
  return STACK_HEIGHTS[widgetId] ?? 300
}
