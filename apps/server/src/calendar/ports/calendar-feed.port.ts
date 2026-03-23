import { CalendarFeed } from '../entities/calendar-feed.entity';
import { CalendarEvent } from '../entities/calendar-event.entity';

export abstract class CalendarFeedPort {
  abstract getFeeds(): CalendarFeed[];
  abstract addFeed(personName: string, color: string, icsUrl: string): CalendarFeed;
  abstract removeFeed(id: string): void;
  abstract fetchEvents(feed: CalendarFeed): Promise<CalendarEvent[]>;
}
