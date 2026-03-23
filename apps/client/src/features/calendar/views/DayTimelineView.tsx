import { useEffect, useRef } from "react";
import type { CalendarEvent } from "../types";
import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  HOUR_HEIGHT,
  isSameDay,
  formatTime,
  timeToOffset,
  durationToHeight,
  layoutOverlaps,
} from "../helpers";

function TimelineGrid() {
  const hours = [];
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) hours.push(h);
  return (
    <>
      {hours.map((h) => (
        <div
          key={h}
          className="absolute inset-x-0 border-t border-[#313244]"
          style={{ top: (h - DAY_START_HOUR) * HOUR_HEIGHT }}
        >
          <span className="absolute -top-2 left-0 text-[10px] text-[#6c7086]">
            {h.toString().padStart(2, "0")}
          </span>
        </div>
      ))}
    </>
  );
}

function NowIndicator({ dayStart }: { dayStart: Date }) {
  const now = new Date();
  if (!isSameDay(now, dayStart)) return null;
  const top = timeToOffset(now);
  return (
    <div className="absolute inset-x-0 z-20 flex items-center" style={{ top }}>
      <div className="-ml-1 size-2 rounded-full bg-[#f38ba8]" />
      <div className="h-px flex-1 bg-[#f38ba8]" />
    </div>
  );
}

export function DayTimelineView({
  events,
  dayStart,
  onEventTap,
}: {
  events: CalendarEvent[];
  dayStart: Date;
  onEventTap: (event: CalendarEvent) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const allDay = events.filter((e) => e.allDay);
  const timed = events.filter((e) => !e.allDay);
  const slots = layoutOverlaps(events);
  const totalHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT;

  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    if (isSameDay(now, dayStart)) {
      scrollRef.current.scrollTop = Math.max(0, timeToOffset(now) - 60);
    }
  }, [dayStart]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {allDay.length > 0 && (
        <div className="mb-1 space-y-1">
          {allDay.map((e) => (
            <div
              key={e.uid}
              className="cursor-pointer truncate rounded px-2 py-1 text-xs font-medium text-[#181825] transition-opacity active:opacity-80"
              style={{ backgroundColor: e.color }}
              onClick={() => onEventTap(e)}
              onPointerDown={(ev) => ev.stopPropagation()}
            >
              {e.summary}
            </div>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto" onPointerDown={(e) => e.stopPropagation()}>
        <div className="relative ml-7" style={{ height: totalHeight }}>
          <TimelineGrid />
          <NowIndicator dayStart={dayStart} />

          {slots.map(({ event, column, totalColumns }) => {
            const start = new Date(event.start);
            const end = new Date(event.end);
            const top = timeToOffset(start);
            const height = durationToHeight(start, end);

            return (
              <div
                key={event.uid}
                className="absolute z-10 cursor-pointer overflow-hidden rounded px-1.5 py-0.5 transition-opacity active:opacity-80"
                style={{
                  top,
                  height,
                  width: `${100 / totalColumns}%`,
                  left: `${(column / totalColumns) * 100}%`,
                  backgroundColor: event.color + "33",
                  borderLeft: `3px solid ${event.color}`,
                }}
                onClick={() => onEventTap(event)}
              >
                <div className="truncate text-xs font-medium text-[#cdd6f4]">{event.summary}</div>
                {height > 30 && (
                  <div className="truncate text-[10px] text-[#a6adc8]">
                    {formatTime(start)}–{formatTime(end)}
                  </div>
                )}
                {height > 46 && (
                  <div className="truncate text-[10px]" style={{ color: event.color }}>
                    {event.personName}
                  </div>
                )}
              </div>
            );
          })}

          {timed.length === 0 && allDay.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-[#6c7086]">
              No events
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
