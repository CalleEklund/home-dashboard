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
    <div className="flex h-full items-start justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-lg font-semibold text-[#cdd6f4]">Settings</h2>

        {/* Pages section */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-[#a6adc8]">Pages</div>
          <div className="space-y-1">
            {pages.map((page, i) => (
              <div
                key={page.id}
                className="flex items-center gap-2 rounded-lg bg-[#1e1e2e] px-3 py-2"
              >
                {renaming === i ? (
                  <input
                    className="min-w-0 flex-1 rounded bg-[#313244] px-2 py-1 text-sm text-[#cdd6f4] outline-none"
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
                    className="min-w-0 flex-1 truncate text-sm text-[#cdd6f4] cursor-pointer"
                    onDoubleClick={() => startRename(i)}
                  >
                    {page.name}
                  </span>
                )}
                <button
                  className="shrink-0 rounded bg-[#89b4fa] px-2.5 py-1 text-xs font-bold text-[#181825] transition-transform active:scale-95"
                  onClick={() => onEditPage(i)}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  Edit
                </button>
                {pages.length > 1 && (
                  <button
                    className="shrink-0 text-sm text-[#f38ba8] transition-transform active:scale-90"
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
            className="rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#89b4fa] transition-transform active:scale-95"
            onClick={() => onAddPage(`Page ${pages.length + 1}`)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            + Add Page
          </button>
        </div>

        {/* Lock screen section */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-[#a6adc8]">Lock Screen</div>
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg bg-[#1e1e2e] px-3 py-2 text-sm text-[#cdd6f4] transition-transform active:scale-95"
              onClick={onEditLockScreen}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Edit Lock Screen Layout
            </button>
            <button
              className="rounded-lg bg-[#1e1e2e] px-3 py-2 text-sm text-[#cdd6f4] transition-transform active:scale-95"
              onClick={onLock}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Lock Now
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#a6adc8]">Inactivity timeout</span>
            <select
              className="rounded-lg bg-[#1e1e2e] px-2 py-1.5 text-sm text-[#cdd6f4] outline-none"
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
