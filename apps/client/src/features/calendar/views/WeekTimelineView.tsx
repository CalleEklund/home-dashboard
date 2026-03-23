import { useEffect, useRef } from "react";
import type { CalendarEvent, DayGroup } from "../types";
import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  HOUR_HEIGHT,
  isSameDay,
  startOfDay,
  formatTime,
  timeToOffset,
  durationToHeight,
  layoutOverlaps,
  getSpanningAllDayEvents,
} from "../helpers";

export function WeekTimelineView({
  days,
  onEventTap,
}: {
  days: DayGroup[];
  onEventTap: (event: CalendarEvent) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT;
  const today = startOfDay(new Date());
  const dayCount = days.length;
  const spanningAllDay = getSpanningAllDayEvents(days);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = Math.max(0, timeToOffset(new Date()) - 60);
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="mb-1 flex pl-7">
        {days.map((day) => (
          <div
            key={day.date.toISOString()}
            className={`flex-1 text-center text-[10px] font-medium ${
              isSameDay(day.date, today) ? "text-[#89b4fa]" : "text-[#6c7086]"
            }`}
          >
            {day.label}
          </div>
        ))}
      </div>

      {spanningAllDay.length > 0 && (
        <div
          className="mb-1 pl-7"
          style={{ display: "grid", gridTemplateColumns: `repeat(${dayCount}, 1fr)`, gap: "2px 4px" }}
        >
          {spanningAllDay.map(({ event, colStart, colSpan }) => (
            <div
              key={event.uid}
              className="cursor-pointer truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-[#181825] transition-opacity active:opacity-80"
              style={{ backgroundColor: event.color, gridColumn: `${colStart + 1} / span ${colSpan}` }}
              onClick={() => onEventTap(event)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {event.summary}
            </div>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto" onPointerDown={(e) => e.stopPropagation()}>
        <div className="relative flex" style={{ height: totalHeight }}>
          <div className="relative w-7 shrink-0">
            {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i).map((h) => (
              <div key={h} className="absolute left-0" style={{ top: (h - DAY_START_HOUR) * HOUR_HEIGHT - 6 }}>
                <span className="text-[10px] text-[#6c7086]">{h.toString().padStart(2, "0")}</span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const slots = layoutOverlaps(day.events);
            return (
              <div key={day.date.toISOString()} className="relative flex-1 border-l border-[#313244]">
                {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i).map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-[#313244]/50"
                    style={{ top: (h - DAY_START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {isSameDay(day.date, today) && (() => {
                  const top = timeToOffset(new Date());
                  return (
                    <div className="absolute inset-x-0 z-20" style={{ top }}>
                      <div className="h-px w-full bg-[#f38ba8]" />
                    </div>
                  );
                })()}

                {slots.map(({ event, column, totalColumns }) => {
                  const start = new Date(event.start);
                  const end = new Date(event.end);
                  const top = timeToOffset(start);
                  const height = durationToHeight(start, end);
                  return (
                    <div
                      key={event.uid}
                      className="absolute z-10 cursor-pointer overflow-hidden rounded-sm px-0.5 transition-opacity active:opacity-80"
                      style={{
                        top,
                        height,
                        width: `${100 / totalColumns}%`,
                        left: `${(column / totalColumns) * 100}%`,
                        backgroundColor: event.color + "33",
                        borderLeft: `2px solid ${event.color}`,
                      }}
                      onClick={() => onEventTap(event)}
                    >
                      <div className="truncate text-[10px] font-medium leading-tight text-[#cdd6f4]">
                        {event.summary}
                      </div>
                      {height > 24 && (
                        <div className="truncate text-[9px] text-[#a6adc8]">{formatTime(start)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
