import type { WidgetLayout, WidgetId } from "../types"
import { COLS, ROWS } from "./constants"

export function getCells(
  colStart: number,
  rowStart: number,
  colSpan: number,
  rowSpan: number
): { col: number; row: number }[] {
  const cells: { col: number; row: number }[] = []
  for (let r = rowStart; r < rowStart + rowSpan; r++) {
    for (let c = colStart; c < colStart + colSpan; c++) {
      cells.push({ col: c, row: r })
    }
  }
  return cells
}

export function hasCollision(
  layout: WidgetLayout[],
  draggingId: WidgetId | null,
  colStart: number,
  rowStart: number,
  colSpan: number,
  rowSpan: number
): boolean {
  if (colStart < 1 || rowStart < 1) return true
  if (colStart + colSpan - 1 > COLS) return true
  if (rowStart + rowSpan - 1 > ROWS) return true

  const targetCells = new Set(
    getCells(colStart, rowStart, colSpan, rowSpan).map(
      (c) => `${c.col},${c.row}`
    )
  )

  for (const w of layout) {
    if (w.id === draggingId) continue
    const wCells = getCells(w.colStart, w.rowStart, w.colSpan, w.rowSpan)
    for (const c of wCells) {
      if (targetCells.has(`${c.col},${c.row}`)) return true
    }
  }

  return false
}

export function findFreeCell(
  layout: WidgetLayout[],
  colSpan: number,
  rowSpan: number
): { colStart: number; rowStart: number } | null {
  for (let r = 1; r <= ROWS - rowSpan + 1; r++) {
    for (let c = 1; c <= COLS - colSpan + 1; c++) {
      if (!hasCollision(layout, null, c, r, colSpan, rowSpan)) {
        return { colStart: c, rowStart: r }
      }
    }
  }
  return null
}
