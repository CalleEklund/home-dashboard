import { useState } from "react"
import type { WidgetLayout, WidgetId } from "../../kernel/types"
import { WIDGETS } from "../../kernel/registry"

type Props = {
  layout: WidgetLayout[]
  onAdd: (id: WidgetId) => void
  onRemove: (id: WidgetId) => void
}

export default function WidgetPicker({ layout, onAdd, onRemove }: Props) {
  const [open, setOpen] = useState(false)
  const ids = Object.keys(WIDGETS) as WidgetId[]

  return (
    <div className="relative">
      <button
        className="rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#cdd6f4] transition-transform active:scale-95"
        onClick={() => setOpen((o) => !o)}
      >
        {"\u229E"} Widgets
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-2xl border border-[#313244] bg-[#1e1e2e] p-2 shadow-xl">
          {ids.map((id) => {
            const def = WIDGETS[id]
            const active = layout.find((w) => w.id === id)
            return (
              <div
                key={id}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-[#313244]"
              >
                <span className="text-sm">
                  {def.icon} {def.label}
                </span>
                {active ? (
                  <button
                    className="rounded bg-[#f38ba8] px-2 py-0.5 text-xs font-bold text-[#181825] transition-transform active:scale-95"
                    onClick={() => onRemove(id)}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    className="rounded bg-[#89b4fa] px-2 py-0.5 text-xs font-bold text-[#181825] transition-transform active:scale-95"
                    onClick={() => onAdd(id)}
                  >
                    Add
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
