import { useState } from "react"
import type { WidgetLayout, WidgetId } from "../../kernel/types"
import type { DashboardPage } from "../../kernel/hooks/usePages"
import { INACTIVITY_OPTIONS } from "../../kernel/grid/constants"
import WidgetPicker from "./WidgetPicker"

type Props = {
  visible: boolean
  editMode: boolean
  editingLockScreen: boolean
  pages: DashboardPage[]
  activePageIndex: number
  onPageChange: (index: number) => void
  onAddPage: (name: string) => void
  onDeletePage: (index: number) => void
  onRenamePage: (index: number, name: string) => void
  onToggleEdit: () => void
  onToggleLockEdit: () => void
  onLock: () => void
  layout: WidgetLayout[]
  onAdd: (id: WidgetId) => void
  onRemove: (id: WidgetId) => void
  onReset: () => void
  timeoutMins: number
  onTimeoutChange: (mins: number) => void
}

export default function Toolbar({
  visible,
  editMode,
  editingLockScreen,
  pages,
  activePageIndex,
  onPageChange,
  onAddPage,
  onDeletePage,
  onRenamePage,
  onToggleEdit,
  onToggleLockEdit,
  onLock,
  layout,
  onAdd,
  onRemove,
  onReset,
  timeoutMins,
  onTimeoutChange,
}: Props) {
  const [renaming, setRenaming] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const startRename = (index: number) => {
    setRenaming(index)
    setRenameValue(pages[index].name)
  }

  const commitRename = () => {
    if (renaming !== null && renameValue.trim()) {
      onRenamePage(renaming, renameValue.trim())
    }
    setRenaming(null)
  }

  return (
    <div className="absolute right-0 top-0 z-30 flex flex-col gap-1 bg-[#181825]/90 px-4 py-2 backdrop-blur-sm"
      style={{ display: visible ? undefined : "none" }}
    >
      {/* Page tabs — shown in edit mode */}
      {editMode && !editingLockScreen && (
        <div className="flex items-center gap-1 overflow-x-auto">
          {pages.map((page, i) => (
            <div key={page.id} className="flex shrink-0 items-center">
              {renaming === i ? (
                <input
                  className="w-24 rounded bg-[#313244] px-2 py-1 text-xs text-[#cdd6f4] outline-none"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename()
                    if (e.key === "Escape") setRenaming(null)
                  }}
                  onBlur={commitRename}
                  autoFocus
                />
              ) : (
                <button
                  className={`rounded-lg px-3 py-1 text-xs transition-colors ${
                    i === activePageIndex
                      ? "bg-[#313244] text-[#cdd6f4]"
                      : "text-[#6c7086] hover:text-[#a6adc8]"
                  }`}
                  onClick={() => onPageChange(i)}
                  onDoubleClick={() => startRename(i)}
                >
                  {page.name}
                </button>
              )}
              {i === activePageIndex && pages.length > 1 && (
                <button
                  className="ml-0.5 text-xs text-[#f38ba8] transition-transform active:scale-90"
                  onClick={() => onDeletePage(i)}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            className="shrink-0 rounded-lg px-2 py-1 text-xs text-[#89b4fa] transition-transform active:scale-90"
            onClick={() => onAddPage(`Page ${pages.length + 1}`)}
          >
            + Page
          </button>
        </div>
      )}

      {/* Main toolbar row */}
      <div className="flex items-center justify-end gap-2">
        {editMode && (
          <>
            {editingLockScreen && (
              <span className="mr-auto rounded-lg bg-[#fab387]/20 px-3 py-2 text-sm font-medium text-[#fab387]">
                Editing Lock Screen
              </span>
            )}
            <WidgetPicker
              layout={layout}
              onAdd={onAdd}
              onRemove={onRemove}
            />
            <select
              className="rounded-lg bg-[#313244] p-2 text-sm text-[#cdd6f4] outline-none"
              value={timeoutMins}
              onChange={(e) => onTimeoutChange(Number(e.target.value))}
            >
              {INACTIVITY_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
            <button
              className="rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#fab387] transition-transform active:scale-95"
              onClick={onReset}
            >
              {"\u21BA"} Reset
            </button>
            <button
              className={`rounded-lg px-3 py-2 text-sm transition-transform active:scale-95 ${
                editingLockScreen
                  ? "bg-[#fab387] font-bold text-[#181825]"
                  : "bg-[#313244] text-[#cdd6f4]"
              }`}
              onClick={onToggleLockEdit}
            >
              {editingLockScreen ? "\u2713 Exit Lock Edit" : "\u{1F512} Edit Lock Screen"}
            </button>
          </>
        )}
        <button
          className={`rounded-lg px-3 py-2 text-sm transition-transform active:scale-95 ${
            editMode
              ? "bg-[#89b4fa] font-bold text-[#181825]"
              : "bg-[#313244] text-[#cdd6f4]"
          }`}
          onClick={onToggleEdit}
        >
          {editMode ? "\u2713 Done" : "\u270F\uFE0F Edit Layout"}
        </button>
        <button
          className="rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#cdd6f4] transition-transform active:scale-95"
          onClick={onLock}
        >
          {"\u{1F512}"}
        </button>
      </div>
    </div>
  )
}
