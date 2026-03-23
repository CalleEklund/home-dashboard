import type { WidgetLayout } from "../../kernel/types"
import { WIDGETS } from "../../kernel/registry"
import { COLS, ROWS, ROW_H, GAP } from "../../kernel/grid/constants"

type Props = {
  layout: WidgetLayout[]
  onUnlock: () => void
}

export default function LockScreen({ layout, onUnlock }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#181825]"
      onClick={onUnlock}
    >
      {/* Widget grid */}
      <div
        className="relative flex-1"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, ${ROW_H}px)`,
          gap: GAP,
          padding: GAP,
        }}
      >
        {layout.map((w) => {
          const def = WIDGETS[w.id]
          if (!def) return null
          const Comp = def.component
          return (
            <div
              key={w.id}
              className="overflow-hidden rounded-2xl bg-[#1e1e2e]"
              style={{
                gridColumn: `${w.colStart} / span ${w.colSpan}`,
                gridRow: `${w.rowStart} / span ${w.rowSpan}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Comp />
            </div>
          )
        })}
      </div>

      {/* Unlock hint */}
      <div className="pb-6 text-center">
        <span className="animate-pulse text-sm text-[#6c7086]">
          {"\u{1F512}"} TAP ANYWHERE TO UNLOCK
        </span>
      </div>
    </div>
  )
}
