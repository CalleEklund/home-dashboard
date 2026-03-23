import type { CalendarEvent } from "../types";
import {
  isSameDay,
  startOfDay,
  addDays,
  getMonthWeeks,
} from "../helpers";

function getSpanningEvents(
  week: Date[],
  events: CalendarEvent[],
): { event: CalendarEvent; colStart: number; colSpan: number }[] {
  const weekStart = week[0];
  const weekEnd = addDays(week[6], 1);
  const seen = new Set<string>();
  const spans: { event: CalendarEvent; colStart: number; colSpan: number }[] = [];

  const weekEvents = events.filter((e) => {
    const eStart = new Date(e.start);
    const eEnd = new Date(e.end);
    return eEnd > weekStart && eStart < weekEnd && e.allDay;
  });

  for (const event of weekEvents) {
    const baseUid = event.uid.replace(/_\d{4}-\d{2}.*$/, "");
    if (seen.has(baseUid)) continue;
    seen.add(baseUid);

    const eStart = new Date(event.start);
    const eEnd = new Date(event.end);

    let colStart = 0;
    for (let i = 0; i < 7; i++) {
      if (week[i] >= startOfDay(eStart)) { colStart = i; break; }
    }
    let colEnd = 6;
    for (let i = 6; i >= 0; i--) {
      if (addDays(week[i], 1) <= eEnd) { colEnd = i; break; }
    }
    spans.push({ event, colStart, colSpan: Math.max(1, colEnd - colStart + 1) });
  }
  return spans;
}

export function MonthTimelineView({
  events,
  anchor,
  onEventTap,
}: {
  events: CalendarEvent[];
  anchor: Date;
  onEventTap: (event: CalendarEvent) => void;
}) {
  const today = startOfDay(new Date());
  const month = anchor.getMonth();
  const weeks = getMonthWeeks(anchor);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto" onPointerDown={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-7 border-b border-[#313244]">
        {dayNames.map((name) => (
          <div key={name} className="py-1 text-center text-[10px] font-medium text-[#6c7086]">{name}</div>
        ))}
      </div>

      <div className="flex flex-1 flex-col">
        {weeks.map((week, wi) => {
          const spanningEvents = getSpanningEvents(week, events);

          return (
            <div key={wi} className="flex flex-1 flex-col border-b border-[#313244] last:border-b-0">
              <div className="grid grid-cols-7">
                {week.map((day, di) => {
                  const isToday = isSameDay(day, today);
                  const isCurrentMonth = day.getMonth() === month;
                  const dayStart = startOfDay(day);
                  const dayEnd = addDays(dayStart, 1);
                  const dayEvents = events.filter((e) => {
                    if (e.allDay) return false;
                    const eStart = new Date(e.start);
                    const eEnd = new Date(e.end);
                    return eEnd > dayStart && eStart < dayEnd;
                  });

                  return (
                    <div
                      key={day.toISOString()}
                      className={`flex flex-col gap-px px-1 py-0.5 ${di < 6 ? "border-r border-[#313244]" : ""}`}
                    >
                      <div className="text-right">
                        <span
                          className={`inline-block text-[10px] leading-4 ${
                            isToday
                              ? "min-w-4 rounded-full bg-[#89b4fa] px-1 text-center font-bold text-[#181825]"
                              : isCurrentMonth
                                ? "text-[#cdd6f4]"
                                : "text-[#6c7086]/40"
                          }`}
                        >
                          {day.getDate()}
                        </span>
                      </div>
                      {dayEvents.slice(0, 2).map((e) => (
                        <div
                          key={e.uid}
                          className="flex cursor-pointer items-center gap-0.5 truncate rounded transition-colors active:bg-[#313244]"
                          onClick={() => onEventTap(e)}
                          onPointerDown={(ev) => ev.stopPropagation()}
                        >
                          <div className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                          <span className="truncate text-[9px] text-[#cdd6f4]">{e.summary}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-[#6c7086]">+{dayEvents.length - 2}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {spanningEvents.length > 0 && (
                <div
                  className="px-0.5 pb-0.5"
                  style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px 2px" }}
                >
                  {spanningEvents.map(({ event, colStart, colSpan }) => (
                    <div
                      key={event.uid}
                      className="cursor-pointer truncate rounded-sm px-1 text-[9px] font-medium text-[#181825] transition-opacity active:opacity-80"
                      style={{ backgroundColor: event.color, gridColumn: `${colStart + 1} / span ${colSpan}` }}
                      onClick={() => onEventTap(event)}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {event.summary}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
