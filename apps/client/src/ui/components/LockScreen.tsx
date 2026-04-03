import type { WidgetLayout } from "../../kernel/types"
import { WIDGETS } from "../../kernel/registry"
import { COLS, ROWS, ROW_H, GAP } from "../../kernel/grid/constants"
import { useBreakpoint } from "../../kernel/hooks/useBreakpoint"
import { getGridConfig, scalePosition, getStackHeight } from "../../kernel/grid/responsive"

type Props = {
  layout: WidgetLayout[]
  onUnlock: () => void
}

export default function LockScreen({ layout, onUnlock }: Props) {
  const bp = useBreakpoint()

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#181825]"
      onClick={onUnlock}
    >
      {bp === "phone" ? (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          {layout.map((w) => {
            const def = WIDGETS[w.id]
            if (!def) return null
            const Comp = def.component
            return (
              <div
                key={w.id}
                className="overflow-hidden rounded-2xl bg-[#1e1e2e]"
                style={{ height: getStackHeight(w.id) }}
                onClick={(e) => e.stopPropagation()}
              >
                <Comp />
              </div>
            )
          })}
        </div>
      ) : bp === "tablet" ? (
        <div
          className="relative flex-1"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${getGridConfig("tablet").cols}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, ${getGridConfig("tablet").rowH}px)`,
            gap: getGridConfig("tablet").gap,
            padding: getGridConfig("tablet").gap,
          }}
        >
          {layout.map((w) => {
            const def = WIDGETS[w.id]
            if (!def) return null
            const Comp = def.component
            const config = getGridConfig("tablet")
            const { colStart, colSpan } = scalePosition(w.colStart, w.colSpan, COLS, config.cols)
            return (
              <div
                key={w.id}
                className="overflow-hidden rounded-2xl bg-[#1e1e2e]"
                style={{
                  gridColumn: `${colStart} / span ${colSpan}`,
                  gridRow: `${w.rowStart} / span ${w.rowSpan}`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Comp />
              </div>
            )
          })}
        </div>
      ) : (
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
      )}

      {/* Unlock hint */}
      <div className="pb-6 text-center">
        <span className="animate-pulse text-sm text-[#6c7086]">
          {"\u{1F512}"} TAP ANYWHERE TO UNLOCK
        </span>
      </div>
    </div>
  )
}
