import { COLS, ROWS } from "../../kernel/grid/constants"

type Props = {
  colSpan: number
  rowSpan: number
  colStart: number
  rowStart: number
  onChange: (changes: { colSpan: number; rowSpan: number }) => void
}

export default function ResizeControls({ colSpan, rowSpan, colStart, rowStart, onChange }: Props) {
  const stop = (e: React.PointerEvent) => e.stopPropagation()

  const maxW = COLS - colStart + 1
  const maxH = ROWS - rowStart + 1

  return (
    <div
      className="absolute bottom-1 right-1 z-10 flex gap-1"
      onPointerDown={stop}
    >
      <div className="flex items-center gap-0.5 rounded-lg bg-[#313244] px-1.5 py-0.5 text-xs">
        <span className="mr-0.5 text-[#6c7086]">W</span>
        <button
          className="px-1 text-[#89b4fa] transition-transform active:scale-90"
          onClick={() => colSpan > 1 && onChange({ colSpan: colSpan - 1, rowSpan })}
        >
          −
        </button>
        <button
          className="px-1 text-[#89b4fa] transition-transform active:scale-90"
          onClick={() => colSpan < maxW && onChange({ colSpan: colSpan + 1, rowSpan })}
        >
          +
        </button>
      </div>
      <div className="flex items-center gap-0.5 rounded-lg bg-[#313244] px-1.5 py-0.5 text-xs">
        <span className="mr-0.5 text-[#6c7086]">H</span>
        <button
          className="px-1 text-[#89b4fa] transition-transform active:scale-90"
          onClick={() => rowSpan > 1 && onChange({ colSpan, rowSpan: rowSpan - 1 })}
        >
          −
        </button>
        <button
          className="px-1 text-[#89b4fa] transition-transform active:scale-90"
          onClick={() => rowSpan < maxH && onChange({ colSpan, rowSpan: rowSpan + 1 })}
        >
          +
        </button>
      </div>
    </div>
  )
}
