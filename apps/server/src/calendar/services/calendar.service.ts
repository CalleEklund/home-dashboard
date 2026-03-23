import { Injectable, Logger } from '@nestjs/common';
import { CalendarFeedPort } from '../ports/calendar-feed.port';
import { CalendarFeed } from '../entities/calendar-feed.entity';
import { CalendarEvent } from '../entities/calendar-event.entity';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private cache: CalendarEvent[] = [];
  private lastFetch = 0;

  constructor(private readonly feedPort: CalendarFeedPort) {}

  getFeeds(): CalendarFeed[] {
    return this.feedPort.getFeeds();
  }

  async addFeed(personName: string, color: string, icsUrl: string): Promise<CalendarFeed> {
    // Validate URL by attempting a fetch
    const feed = this.feedPort.addFeed(personName, color, icsUrl);
    // Invalidate cache so next getEvents picks up the new feed
    this.lastFetch = 0;
    return feed;
  }

  removeFeed(id: string): void {
    this.feedPort.removeFeed(id);
    this.cache = this.cache.filter((e) => {
      const feeds = this.feedPort.getFeeds();
      return feeds.some((f) => f.personName === e.personName);
    });
    this.lastFetch = 0;
  }

  async getEvents(): Promise<CalendarEvent[]> {
    if (Date.now() - this.lastFetch < CACHE_TTL) {
      return this.cache;
    }

    const feeds = this.feedPort.getFeeds();
    const allEvents: CalendarEvent[] = [];

    const results = await Promise.allSettled(
      feeds.map((feed) => this.feedPort.fetchEvents(feed)),
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value);
      }
    }

    // Sort by start time
    allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    this.cache = allEvents;
    this.lastFetch = Date.now();
    this.logger.log(`Cached ${allEvents.length} events from ${feeds.length} feeds`);

    return this.cache;
  }
}
