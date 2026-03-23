import { useState, useRef, useEffect, useCallback } from "react"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import type { WidgetLayout, WidgetId } from "../../kernel/types"
import type { DashboardPage } from "../../kernel/hooks/usePages"
import { WIDGETS } from "../../kernel/registry"
import { COLS, ROWS, ROW_H, GAP } from "../../kernel/grid/constants"
import { hasCollision, getCells } from "../../kernel/grid/grid"
import ResizeControls from "./ResizeControls"

type Props = {
  pages: DashboardPage[]
  activePageIndex: number
  onPageChange: (index: number) => void
  editMode: boolean
  onMove: (id: WidgetId, colStart: number, rowStart: number) => void
  onResize: (id: WidgetId, colSpan: number, rowSpan: number) => void
}

function GridCell({ col, row, highlight }: { col: number; row: number; highlight?: "valid" | "invalid" | null }) {
  const { setNodeRef } = useDroppable({ id: `cell-${col}-${row}` })
  let bg = "border border-dashed border-[#313244]"
  if (highlight === "valid") bg = "bg-[#89b4fa]/20 border border-[#89b4fa]"
  if (highlight === "invalid") bg = "bg-[#f38ba8]/20 border border-[#f38ba8]"

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg ${bg}`}
      style={{
        gridColumn: col,
        gridRow: row,
      }}
    />
  )
}

function DraggableWidget({
  widget,
  editMode,
  onResize,
  children,
}: {
  widget: WidgetLayout
  editMode: boolean
  onResize: (id: WidgetId, colSpan: number, rowSpan: number) => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: widget.id,
    disabled: !editMode,
  })

  const style: React.CSSProperties = {
    gridColumn: `${widget.colStart} / span ${widget.colSpan}`,
    gridRow: `${widget.rowStart} / span ${widget.rowSpan}`,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative overflow-hidden rounded-2xl bg-[#1e1e2e]"
      {...(editMode ? { ...attributes, ...listeners } : {})}
    >
      {children}
      {editMode && (
        <ResizeControls
          colSpan={widget.colSpan}
          rowSpan={widget.rowSpan}
          colStart={widget.colStart}
          rowStart={widget.rowStart}
          onChange={({ colSpan, rowSpan }) => onResize(widget.id, colSpan, rowSpan)}
        />
      )}
    </div>
  )
}

function PageGrid({
  layout,
  editMode,
  onMove,
  onResize,
}: {
  layout: WidgetLayout[]
  editMode: boolean
  onMove: (id: WidgetId, colStart: number, rowStart: number) => void
  onResize: (id: WidgetId, colSpan: number, rowSpan: number) => void
}) {
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null)
  const [overCell, setOverCell] = useState<{ col: number; row: number } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(event.active.id as WidgetId)
  }

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over) { setOverCell(null); return }
    const overId = event.over.id as string
    if (overId.startsWith("cell-")) {
      const [, col, row] = overId.split("-").map(Number)
      setOverCell({ col, row })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const widgetId = event.active.id as WidgetId
    if (event.over) {
      const overId = event.over.id as string
      if (overId.startsWith("cell-")) {
        const [, col, row] = overId.split("-").map(Number)
        onMove(widgetId, col, row)
      }
    }
    setDraggingId(null)
    setOverCell(null)
  }

  const dragWidget = draggingId ? layout.find((w) => w.id === draggingId) : null
  const highlightedCells: Map<string, "valid" | "invalid"> = new Map()
  if (dragWidget && overCell) {
    const cells = getCells(overCell.col, overCell.row, dragWidget.colSpan, dragWidget.rowSpan)
    const collision = hasCollision(layout, draggingId, overCell.col, overCell.row, dragWidget.colSpan, dragWidget.rowSpan)
    const state = collision ? "invalid" : "valid"
    cells.forEach((c) => highlightedCells.set(`${c.col},${c.row}`, state))
  }

  const bgCells: { col: number; row: number }[] = []
  for (let r = 1; r <= ROWS; r++) {
    for (let c = 1; c <= COLS; c++) {
      bgCells.push({ col: c, row: r })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, ${ROW_H}px)`,
          gap: `${GAP}px`,
          padding: `${GAP}px`,
        }}
      >
        {editMode &&
          bgCells.map(({ col, row }) => (
            <GridCell
              key={`bg-${col}-${row}`}
              col={col}
              row={row}
              highlight={highlightedCells.get(`${col},${row}`) ?? null}
            />
          ))}

        {layout.map((w) => {
          const def = WIDGETS[w.id]
          const Comp = def.component
          return (
            <DraggableWidget key={w.id} widget={w} editMode={editMode} onResize={onResize}>
              <Comp />
            </DraggableWidget>
          )
        })}
      </div>
    </DndContext>
  )
}

export default function Dashboard({ pages, activePageIndex, onPageChange, editMode, onMove, onResize }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)

  // Scroll to active page when index changes programmatically
  useEffect(() => {
    if (!scrollRef.current || editMode) return
    const el = scrollRef.current
    const target = el.children[activePageIndex] as HTMLElement
    if (target) {
      isScrolling.current = true
      target.scrollIntoView({ behavior: "smooth", inline: "start" })
      setTimeout(() => { isScrolling.current = false }, 500)
    }
  }, [activePageIndex, editMode])

  // Detect swipe-based page changes via scroll-snap
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isScrolling.current || editMode) return
    const el = scrollRef.current
    const pageWidth = el.clientWidth
    if (pageWidth === 0) return
    const newIndex = Math.round(el.scrollLeft / pageWidth)
    if (newIndex !== activePageIndex && newIndex >= 0 && newIndex < pages.length) {
      onPageChange(newIndex)
    }
  }, [activePageIndex, pages.length, onPageChange, editMode])

  // In edit mode, show only the active page (no swiping — interferes with drag)
  if (editMode) {
    return (
      <div>
        <PageGrid
          layout={pages[activePageIndex].layout}
          editMode={editMode}
          onMove={onMove}
          onResize={onResize}
        />
        <div className="mt-1 text-center text-xs text-[#6c7086]">
          Drag widgets to rearrange. Use W/H controls to resize.
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Swipeable page container */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onScroll={handleScroll}
      >
        {pages.map((page) => (
          <div
            key={page.id}
            className="w-full shrink-0 snap-start"
          >
            <PageGrid
              layout={page.layout}
              editMode={false}
              onMove={onMove}
              onResize={onResize}
            />
          </div>
        ))}
      </div>

      {/* Page dots */}
      {pages.length > 1 && (
        <div className="flex justify-center gap-1.5 py-2">
          {pages.map((page, i) => (
            <button
              key={page.id}
              className={`rounded-full transition-all ${
                i === activePageIndex
                  ? "size-2.5 bg-[#89b4fa]"
                  : "size-2 bg-[#6c7086]/40"
              }`}
              onClick={() => onPageChange(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
