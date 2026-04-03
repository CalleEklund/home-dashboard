import { useState } from "react"
import type { DashboardPage } from "../../kernel/hooks/usePages"
import { INACTIVITY_OPTIONS } from "../../kernel/grid/constants"

export type SettingsPageProps = {
  pages: DashboardPage[]
  onEditPage: (index: number) => void
  onEditLockScreen: () => void
  onLock: () => void
  timeoutMins: number
  onTimeoutChange: (mins: number) => void
  onAddPage: (name: string) => void
  onDeletePage: (index: number) => void
  onRenamePage: (index: number, name: string) => void
}

export default function SettingsPage({
  pages,
  onEditPage,
  onEditLockScreen,
  onLock,
  timeoutMins,
  onTimeoutChange,
  onAddPage,
  onDeletePage,
  onRenamePage,
}: SettingsPageProps) {
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
    <div className="flex h-full items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        <h2 className="text-base font-semibold text-[#cdd6f4] sm:text-lg">Settings</h2>

        {/* Pages section */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-[#a6adc8]">Pages</div>
          <div className="space-y-1.5">
            {pages.map((page, i) => (
              <div
                key={page.id}
                className="flex items-center gap-2 rounded-lg bg-[#1e1e2e] px-3 py-2.5 sm:py-2"
              >
                {renaming === i ? (
                  <input
                    className="min-w-0 flex-1 rounded bg-[#313244] px-2 py-1.5 text-sm text-[#cdd6f4] outline-none sm:py-1"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename()
                      if (e.key === "Escape") setRenaming(null)
                    }}
                    onBlur={commitRename}
                    onPointerDown={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span
                    className="min-w-0 flex-1 cursor-pointer truncate text-sm text-[#cdd6f4]"
                    onDoubleClick={() => startRename(i)}
                  >
                    {page.name}
                  </span>
                )}
                <button
                  className="shrink-0 rounded bg-[#313244] px-2 py-1.5 text-xs text-[#6c7086] transition-transform active:scale-95 sm:py-1"
                  onClick={() => startRename(i)}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  ✏️
                </button>
                <button
                  className="shrink-0 rounded bg-[#89b4fa] px-3 py-1.5 text-xs font-bold text-[#181825] transition-transform active:scale-95 sm:px-2.5 sm:py-1"
                  onClick={() => onEditPage(i)}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  Edit
                </button>
                {pages.length > 1 && (
                  <button
                    className="shrink-0 px-1 text-lg text-[#f38ba8] transition-transform active:scale-90 sm:px-0 sm:text-sm"
                    onClick={() => onDeletePage(i)}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            className="w-full rounded-lg bg-[#313244] px-3 py-2.5 text-sm text-[#89b4fa] transition-transform active:scale-95 sm:w-auto sm:py-2"
            onClick={() => onAddPage(`Page ${pages.length + 1}`)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            + Add Page
          </button>
        </div>

        {/* Lock screen section */}
        <div className="space-y-3 sm:space-y-2">
          <div className="text-sm font-medium text-[#a6adc8]">Lock Screen</div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              className="rounded-lg bg-[#1e1e2e] px-3 py-2.5 text-sm text-[#cdd6f4] transition-transform active:scale-95 sm:py-2"
              onClick={onEditLockScreen}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Edit Lock Screen Layout
            </button>
            <button
              className="rounded-lg bg-[#1e1e2e] px-3 py-2.5 text-sm text-[#cdd6f4] transition-transform active:scale-95 sm:py-2"
              onClick={onLock}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Lock Now
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#a6adc8]">Inactivity timeout</span>
            <select
              className="rounded-lg bg-[#1e1e2e] px-2 py-2 text-sm text-[#cdd6f4] outline-none sm:py-1.5"
              value={timeoutMins}
              onChange={(e) => onTimeoutChange(Number(e.target.value))}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {INACTIVITY_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
