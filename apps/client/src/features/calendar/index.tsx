import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { CalendarEvent, ViewMode, DisplayStyle } from "./types";
import { getAnchor, getViewRange, getNavigationLabel, navigate, filterEvents, groupByDay } from "./helpers";
import { useFeeds, useEvents, useAddFeed, useRemoveFeed } from "./api";
import { FeedSettings } from "./views/FeedSettings";
import { DayListView, MultiDayListView } from "./views/ListView";
import { DayTimelineView } from "./views/DayTimelineView";
import { WeekTimelineView } from "./views/WeekTimelineView";
import { MonthTimelineView } from "./views/MonthTimelineView";
import { EventPopup } from "./views/EventPopup";

const POLL_INTERVAL = 60_000;

export default function Calendar() {
  const queryClient = useQueryClient();
  const { data: feeds = [] } = useFeeds();
  const { data: events = [], error, dataUpdatedAt } = useEvents(POLL_INTERVAL);
  const addFeedMutation = useAddFeed();
  const removeFeedMutation = useRemoveFeed();

  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>("timeline");
  const [anchor, setAnchor] = useState(() => getAnchor("week", new Date()));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const lastFetched = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const shouldShowSettings = feeds.length === 0 || showSettings;

  const changeView = (mode: ViewMode) => {
    setViewMode(mode);
    setAnchor(getAnchor(mode, new Date()));
  };

  const goToday = () => setAnchor(getAnchor(viewMode, new Date()));

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: [{ method: "get", url: "/api/calendar/feeds" }] });
    queryClient.invalidateQueries({ queryKey: [{ method: "get", url: "/api/calendar/events" }] });
  };

  const handleAddFeed = async (personName: string, color: string, icsUrl: string) => {
    await addFeedMutation.mutateAsync({ body: { personName, color, icsUrl } });
    invalidateAll();
  };

  const handleRemoveFeed = async (id: string) => {
    await removeFeedMutation.mutateAsync({ params: { path: { id } } });
    invalidateAll();
  };

  if (shouldShowSettings) {
    return (
      <FeedSettings
        feeds={feeds}
        onAdd={handleAddFeed}
        onRemove={handleRemoveFeed}
        onDone={() => setShowSettings(false)}
      />
    );
  }

  const { start, end } = getViewRange(viewMode, anchor);
  const visibleEvents = filterEvents(events, start, end);
  const days = groupByDay(visibleEvents, start, end);

  const onEventTap = (event: CalendarEvent) => setSelectedEvent(event);

  const renderContent = () => {
    if (displayStyle === "list") {
      if (viewMode === "day") return <DayListView events={visibleEvents} onEventTap={onEventTap} />;
      return <MultiDayListView days={days} onEventTap={onEventTap} />;
    }
    if (viewMode === "day") return <DayTimelineView events={visibleEvents} dayStart={anchor} onEventTap={onEventTap} />;
    if (viewMode === "week") return <WeekTimelineView days={days} onEventTap={onEventTap} />;
    return <MonthTimelineView events={visibleEvents} anchor={anchor} onEventTap={onEventTap} />;
  };

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            className="rounded px-1.5 py-0.5 text-sm text-[#a6adc8] transition-transform active:scale-95"
            onClick={() => setAnchor(navigate(viewMode, anchor, -1))}
            onPointerDown={(e) => e.stopPropagation()}
          >
            &lsaquo;
          </button>
          <span className="px-1 text-xs text-[#a6adc8]">{getNavigationLabel(viewMode, anchor)}</span>
          <button
            className="rounded px-1.5 py-0.5 text-sm text-[#a6adc8] transition-transform active:scale-95"
            onClick={() => setAnchor(navigate(viewMode, anchor, 1))}
            onPointerDown={(e) => e.stopPropagation()}
          >
            &rsaquo;
          </button>
          <button
            className="ml-1 rounded-lg bg-[#313244] px-2 py-0.5 text-xs text-[#89b4fa] transition-transform active:scale-95"
            onClick={goToday}
            onPointerDown={(e) => e.stopPropagation()}
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          {lastFetched && (
            <span className="text-xs text-[#6c7086]">
              {lastFetched.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            className="rounded px-1.5 py-0.5 text-xs text-[#6c7086] transition-colors hover:text-[#a6adc8]"
            onClick={() => setShowSettings(true)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {"\u2699\uFE0F"}
          </button>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          {(["day", "week", "month"] as const).map((mode) => (
            <button
              key={mode}
              className={`rounded-lg px-2.5 py-1 text-xs capitalize transition-colors ${
                viewMode === mode ? "bg-[#313244] text-[#cdd6f4]" : "text-[#6c7086] hover:text-[#a6adc8]"
              }`}
              onClick={() => changeView(mode)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["list", "timeline"] as const).map((style) => (
            <button
              key={style}
              className={`rounded-lg px-2 py-1 text-xs capitalize transition-colors ${
                displayStyle === style ? "bg-[#313244] text-[#cdd6f4]" : "text-[#6c7086]"
              }`}
              onClick={() => setDisplayStyle(style)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-2 text-xs text-[#f38ba8]">Failed to load events</div>}

      {renderContent()}

      {selectedEvent && (
        <EventPopup event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
