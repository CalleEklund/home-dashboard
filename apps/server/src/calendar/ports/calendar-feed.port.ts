import { CalendarFeed } from '../entities/calendar-feed.entity';
import { CalendarEvent } from '../entities/calendar-event.entity';

export abstract class CalendarFeedPort {
  abstract getFeeds(): Promise<CalendarFeed[]>;
  abstract addFeed(personName: string, color: string, icsUrl: string): Promise<CalendarFeed>;
  abstract removeFeed(id: string): Promise<void>;
  abstract fetchEvents(feed: CalendarFeed): Promise<CalendarEvent[]>;
}
