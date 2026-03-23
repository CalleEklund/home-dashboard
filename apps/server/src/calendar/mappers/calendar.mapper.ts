import { z } from 'zod';
import { CalendarEvent } from '../entities/calendar-event.entity';
import { CalendarFeed } from '../entities/calendar-feed.entity';
import { CalendarEventSchema, CalendarFeedSchema } from '../schemas/calendar.schemas';

export type CalendarEventHttp = z.infer<typeof CalendarEventSchema>;
export type CalendarFeedHttp = z.infer<typeof CalendarFeedSchema>;

export class CalendarMapper {
  static toEventHttp(event: CalendarEvent): CalendarEventHttp {
    return {
      uid: event.uid,
      summary: event.summary,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      allDay: event.allDay,
      location: event.location,
      personName: event.personName,
      color: event.color,
    };
  }

  static toEventsHttp(events: CalendarEvent[]): CalendarEventHttp[] {
    return events.map(CalendarMapper.toEventHttp);
  }

  static toFeedHttp(feed: CalendarFeed): CalendarFeedHttp {
    return {
      id: feed.id,
      personName: feed.personName,
      color: feed.color,
      icsUrl: feed.icsUrl,
    };
  }

  static toFeedsHttp(feeds: CalendarFeed[]): CalendarFeedHttp[] {
    return feeds.map(CalendarMapper.toFeedHttp);
  }
}
