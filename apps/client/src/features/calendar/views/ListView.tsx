import type { CalendarEvent, DayGroup } from "../types";
import { formatTime } from "../helpers";

function ListEventRow({
  event,
  showTime,
  onTap,
}: {
  event: CalendarEvent;
  showTime?: boolean;
  onTap: (event: CalendarEvent) => void;
}) {
  return (
    <div
      className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#313244] px-3 py-1.5 text-sm transition-colors active:bg-[#45475a]"
      style={{ borderLeft: `3px solid ${event.color}` }}
      onClick={() => onTap(event)}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span className="shrink-0 font-mono text-xs text-[#a6adc8]">
        {event.allDay
          ? "All day"
          : showTime === false
            ? formatTime(new Date(event.start))
            : `${formatTime(new Date(event.start))}–${formatTime(new Date(event.end))}`}
      </span>
      <span className="min-w-0 flex-1 truncate text-[#cdd6f4]">{event.summary}</span>
      <span className="shrink-0 text-xs" style={{ color: event.color }}>
        {event.personName}
      </span>
    </div>
  );
}

export function DayListView({
  events,
  onEventTap,
}: {
  events: CalendarEvent[];
  onEventTap: (event: CalendarEvent) => void;
}) {
  const allDay = events.filter((e) => e.allDay);
  const timed = events.filter((e) => !e.allDay);
  return (
    <div className="flex-1 space-y-1 overflow-y-auto">
      {allDay.map((e) => (
        <ListEventRow key={e.uid} event={e} onTap={onEventTap} />
      ))}
      {timed.map((e) => (
        <ListEventRow key={e.uid} event={e} onTap={onEventTap} />
      ))}
      {events.length === 0 && (
        <div className="py-4 text-center text-sm text-[#6c7086]">No events</div>
      )}
    </div>
  );
}

export function MultiDayListView({
  days,
  onEventTap,
}: {
  days: DayGroup[];
  onEventTap: (event: CalendarEvent) => void;
}) {
  return (
    <div className="flex-1 space-y-2 overflow-y-auto">
      {days.map((day) => {
        if (day.events.length === 0) return null;
        return (
          <div key={day.date.toISOString()}>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6c7086]">
              {day.label}
            </div>
            <div className="space-y-1">
              {day.events.filter((e) => e.allDay).map((e) => (
                <ListEventRow key={e.uid} event={e} onTap={onEventTap} />
              ))}
              {day.events.filter((e) => !e.allDay).map((e) => (
                <ListEventRow key={e.uid} event={e} showTime={false} onTap={onEventTap} />
              ))}
            </div>
          </div>
        );
      })}
      {days.every((d) => d.events.length === 0) && (
        <div className="py-4 text-center text-sm text-[#6c7086]">No events</div>
      )}
    </div>
  );
}
