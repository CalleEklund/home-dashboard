import type { CalendarEvent } from "../types";
import { formatTime } from "../helpers";

function formatDateRange(event: CalendarEvent): string {
  if (event.allDay) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const startStr = start.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
    // Multi-day: show range
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) {
      const endStr = end.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
      return `${startStr} – ${endStr}`;
    }
    return startStr;
  }
  const start = new Date(event.start);
  const end = new Date(event.end);
  const date = start.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
  return `${date}, ${formatTime(start)} – ${formatTime(end)}`;
}

function formatDuration(event: CalendarEvent): string | null {
  if (event.allDay) return null;
  const ms = new Date(event.end).getTime() - new Date(event.start).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function EventPopup({
  event,
  onClose,
}: {
  event: CalendarEvent;
  onClose: () => void;
}) {
  const duration = formatDuration(event);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-[#1e1e2e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color bar */}
        <div className="h-1.5" style={{ backgroundColor: event.color }} />

        <div className="space-y-3 p-4">
          {/* Title */}
          <div className="text-lg font-medium text-[#cdd6f4]">{event.summary}</div>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-[#a6adc8]">
            <span className="text-base">{event.allDay ? "\u{1F4C5}" : "\u{1F552}"}</span>
            <div>
              <div>{formatDateRange(event)}</div>
              {duration && <div className="text-xs text-[#6c7086]">{duration}</div>}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-[#a6adc8]">
              <span className="text-base">{"\u{1F4CD}"}</span>
              <span>{event.location}</span>
            </div>
          )}

          {/* Person */}
          <div className="flex items-center gap-2 text-sm">
            <div className="size-3 rounded-full" style={{ backgroundColor: event.color }} />
            <span style={{ color: event.color }}>{event.personName}</span>
          </div>
        </div>

        {/* Close */}
        <div className="border-t border-[#313244] p-3">
          <button
            className="w-full rounded-lg bg-[#313244] py-2 text-sm text-[#cdd6f4] transition-transform active:scale-95"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
