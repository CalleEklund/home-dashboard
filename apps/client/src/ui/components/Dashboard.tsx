import { useState, useRef, useEffect, useCallback } from "react"
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { WidgetLayout, WidgetId } from "../../kernel/types"
import type { DashboardPage } from "../../kernel/hooks/usePages"
import type { EditTarget } from "../../App"
import type { SettingsPageProps } from "./SettingsPage"
import SettingsPageComponent from "./SettingsPage"
import WidgetPicker from "./WidgetPicker"
import { WIDGETS } from "../../kernel/registry"
import { COLS, ROWS, ROW_H, GAP } from "../../kernel/grid/constants"
import { hasCollision, getCells } from "../../kernel/grid/grid"
import ResizeControls from "./ResizeControls"
import { useBreakpoint } from "../../kernel/hooks/useBreakpoint"
import { getStackHeight } from "../../kernel/grid/responsive"

type Props = {
  pages: DashboardPage[]
  activePageIndex: number
  onPageChange: (index: number) => void
  editMode: boolean
  editTarget: EditTarget
  onMove: (id: WidgetId, colStart: number, rowStart: number) => void
  onResize: (id: WidgetId, colSpan: number, rowSpan: number) => void
  onStopEditing: () => void
  layout: WidgetLayout[]
  onAdd: (id: WidgetId) => void
  onRemove: (id: WidgetId) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onReset: () => void
  settingsPageProps: SettingsPageProps
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

function SortableWidgetItem({
  widget,
  onRemove,
}: {
  widget: WidgetLayout
  onRemove: (id: WidgetId) => void
}) {
  const def = WIDGETS[widget.id]
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-2xl bg-[#1e1e2e] px-4 py-3"
    >
      {/* Drag handle */}
      <div
        className="flex shrink-0 cursor-grab touch-none flex-col items-center gap-0.5 text-[#6c7086] active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </div>

      {/* Widget info */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-lg">{def.icon}</span>
        <span className="truncate text-sm font-medium text-[#cdd6f4]">{def.label}</span>
      </div>

      {/* Remove button */}
      <button
        className="shrink-0 rounded-lg bg-[#f38ba8] px-2.5 py-1 text-xs font-bold text-[#181825] transition-transform active:scale-95"
        onClick={() => onRemove(widget.id)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        Remove
      </button>
    </div>
  )
}

function SortableEditList({
  layout,
  onRemove,
  onReorder,
  onAdd,
}: {
  layout: WidgetLayout[]
  onRemove: (id: WidgetId) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onAdd: (id: WidgetId) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = layout.findIndex((w) => w.id === active.id)
    const newIndex = layout.findIndex((w) => w.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex)
    }
  }

  // Available widgets not yet in layout
  const usedIds = new Set(layout.map((w) => w.id))
  const availableIds = (Object.keys(WIDGETS) as WidgetId[]).filter((id) => !usedIds.has(id))

  return (
    <div className="flex flex-col gap-3 p-4 pt-14">
      <div className="text-xs text-[#6c7086]">Drag to reorder, tap remove to delete</div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layout.map((w) => w.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {layout.map((w) => (
              <SortableWidgetItem key={w.id} widget={w} onRemove={onRemove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {availableIds.length > 0 && (
        <div className="mt-2">
          <div className="mb-2 text-xs text-[#6c7086]">Add widgets</div>
          <div className="flex flex-col gap-2">
            {availableIds.map((id) => {
              const def = WIDGETS[id]
              return (
                <button
                  key={id}
                  className="flex items-center gap-3 rounded-2xl bg-[#313244]/50 px-4 py-3 transition-transform active:scale-[0.98]"
                  onClick={() => onAdd(id)}
                >
                  <span className="text-lg">{def.icon}</span>
                  <span className="text-sm text-[#a6adc8]">{def.label}</span>
                  <span className="ml-auto text-xs font-bold text-[#89b4fa]">+ Add</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StackedLayout({ layout }: { layout: WidgetLayout[] }) {
  return (
    <div className="flex flex-col gap-3 p-3">
      {layout.map((w) => {
        const def = WIDGETS[w.id]
        if (!def) return null
        const Comp = def.component
        return (
          <div
            key={w.id}
            className="overflow-hidden rounded-2xl bg-[#1e1e2e]"
            style={{ height: getStackHeight(w.id) }}
          >
            <Comp />
          </div>
        )
      })}
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
  const bp = useBreakpoint()
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

  // Phone & Tablet: stacked layout (no drag/drop)
  if ((bp === "phone" || bp === "tablet") && !editMode) {
    return <StackedLayout layout={layout} />
  }

  // Desktop (or edit mode on any device): full grid with drag/drop
  // On smaller screens in edit mode, use a fixed min-width so the grid is scrollable
  const editMinWidth = bp === "phone" ? 1100 : bp === "tablet" ? 1100 : undefined
  const editRowH = bp === "phone" ? 40 : bp === "tablet" ? 45 : ROW_H
  const editGap = bp === "phone" ? 8 : bp === "tablet" ? 10 : GAP

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
          gridTemplateRows: `repeat(${ROWS}, ${editRowH}px)`,
          gap: `${editGap}px`,
          padding: `${editGap}px`,
          minWidth: editMinWidth,
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

function EditToolbar({
  editTarget,
  layout,
  onAdd,
  onRemove,
  onReset,
  onStopEditing,
  compact,
}: {
  editTarget: EditTarget
  layout: WidgetLayout[]
  onAdd: (id: WidgetId) => void
  onRemove: (id: WidgetId) => void
  onReset: () => void
  onStopEditing: () => void
  compact?: boolean
}) {
  const label = editTarget?.type === "lock" ? "Lock Screen" : "Page"

  return (
    <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 bg-[#181825]/90 px-3 py-2 backdrop-blur-sm sm:absolute sm:right-0 sm:left-auto sm:inset-x-auto">
      <span className="text-xs text-[#a6adc8] sm:mr-2 sm:text-sm">
        Editing: <span className="font-medium text-[#cdd6f4]">{label}</span>
      </span>
      <div className="flex items-center gap-2">
        {!compact && <WidgetPicker layout={layout} onAdd={onAdd} onRemove={onRemove} />}
        <button
          className="rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#fab387] transition-transform active:scale-95"
          onClick={onReset}
        >
          Reset
        </button>
        <button
          className="rounded-lg bg-[#89b4fa] px-3 py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95"
          onClick={onStopEditing}
        >
          Done
        </button>
      </div>
    </div>
  )
}

export default function Dashboard({
  pages,
  activePageIndex,
  onPageChange,
  editMode,
  editTarget,
  onMove,
  onResize,
  onStopEditing,
  layout,
  onAdd,
  onRemove,
  onReorder,
  onReset,
  settingsPageProps,
}: Props) {
  const bp = useBreakpoint()
  const scrollRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)

  // Total visible items: pages + settings page
  const totalItems = pages.length + 1
  const settingsIndex = pages.length
  const isOnSettings = activePageIndex === settingsIndex

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
    if (newIndex !== activePageIndex && newIndex >= 0 && newIndex < totalItems) {
      onPageChange(newIndex)
    }
  }, [activePageIndex, totalItems, onPageChange, editMode])

  // In edit mode
  if (editMode) {
    // Phone & tablet: sortable list view
    if (bp === "phone" || bp === "tablet") {
      return (
        <div>
          <EditToolbar
            editTarget={editTarget}
            layout={layout}
            onAdd={onAdd}
            onRemove={onRemove}
            onReset={onReset}
            onStopEditing={onStopEditing}
            compact
          />
          <SortableEditList
            layout={layout}
            onRemove={onRemove}
            onReorder={onReorder}
            onAdd={onAdd}
          />
        </div>
      )
    }

    // Desktop: full grid editor
    return (
      <div className="overflow-x-auto">
        <EditToolbar
          editTarget={editTarget}
          layout={layout}
          onAdd={onAdd}
          onRemove={onRemove}
          onReset={onReset}
          onStopEditing={onStopEditing}
        />
        <PageGrid
          layout={layout}
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

  // All breakpoints: horizontal swipe pages with dots
  // Phone pages use stacked layout per page, tablet/desktop use grid
  const gridMinHeight = bp === "tablet"
    ? `${ROWS * 45 + (ROWS + 1) * 10}px`
    : bp === "phone"
      ? undefined
      : `${ROWS * ROW_H + (ROWS + 1) * GAP}px`

  return (
    <div>
      {/* Swipeable page container */}
      <div
        ref={scrollRef}
        className="flex h-[100dvh] snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onScroll={handleScroll}
      >
        {pages.map((page) => (
          <div key={page.id} className="w-full shrink-0 snap-start overflow-y-auto">
            <PageGrid
              layout={page.layout}
              editMode={false}
              onMove={onMove}
              onResize={onResize}
            />
          </div>
        ))}
        {/* Settings page */}
        <div
          className="w-full shrink-0 snap-start overflow-y-auto"
          style={{ minHeight: gridMinHeight }}
        >
          <SettingsPageComponent {...settingsPageProps} />
        </div>
      </div>

      {/* Page dots + settings gear */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 pb-3 pt-2 sm:gap-1.5">
        {pages.map((page, i) => (
          <button
            key={page.id}
            className={`rounded-full transition-all ${
              i === activePageIndex
                ? "size-3 bg-[#89b4fa] sm:size-2.5"
                : "size-2.5 bg-[#6c7086]/40 sm:size-2"
            }`}
            onClick={() => onPageChange(i)}
          />
        ))}
        {/* Settings dot/gear */}
        <button
          className={`flex items-center justify-center transition-all ${
            isOnSettings
              ? "size-6 text-[#89b4fa] sm:size-5"
              : "size-5 text-[#6c7086]/60 sm:size-4"
          }`}
          onClick={() => onPageChange(settingsIndex)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-full">
            <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}
