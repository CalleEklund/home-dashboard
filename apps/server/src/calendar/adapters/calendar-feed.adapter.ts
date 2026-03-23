import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as ical from 'node-ical';
import { CalendarFeedPort } from '../ports/calendar-feed.port';
import { CalendarFeed } from '../entities/calendar-feed.entity';
import { CalendarEvent } from '../entities/calendar-event.entity';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const FEEDS_FILE = path.join(DATA_DIR, 'calendar-feeds.json');
const EVENT_WINDOW_DAYS = 14;

type FeedJson = { id: string; personName: string; color: string; icsUrl: string };

@Injectable()
export class CalendarFeedAdapter extends CalendarFeedPort {
  private readonly logger = new Logger(CalendarFeedAdapter.name);

  getFeeds(): CalendarFeed[] {
    return this.readFeeds().map(
      (f) => new CalendarFeed(f.id, f.personName, f.color, f.icsUrl),
    );
  }

  addFeed(personName: string, color: string, icsUrl: string): CalendarFeed {
    const feeds = this.readFeeds();
    const feed: FeedJson = {
      id: crypto.randomUUID(),
      personName,
      color,
      icsUrl,
    };
    feeds.push(feed);
    this.writeFeeds(feeds);
    this.logger.log(`Added feed: ${personName}`);
    return new CalendarFeed(feed.id, feed.personName, feed.color, feed.icsUrl);
  }

  removeFeed(id: string): void {
    const feeds = this.readFeeds().filter((f) => f.id !== id);
    this.writeFeeds(feeds);
    this.logger.log(`Removed feed: ${id}`);
  }

  async fetchEvents(feed: CalendarFeed): Promise<CalendarEvent[]> {
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date(windowStart.getTime() + EVENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    try {
      const data = await ical.async.fromURL(feed.icsUrl);
      const events: CalendarEvent[] = [];

      for (const [, comp] of Object.entries(data)) {
        if (!comp || comp.type !== 'VEVENT') continue;

        const vevent = comp as ical.VEvent;
        const start = vevent.start ? new Date(vevent.start) : null;
        if (!start) continue;

        const end = vevent.end ? new Date(vevent.end) : start;
        const duration = end.getTime() - start.getTime();

        const allDay =
          vevent.datetype === 'date' ||
          (vevent.start &&
            typeof vevent.start === 'object' &&
            'dateOnly' in vevent.start &&
            (vevent.start as { dateOnly?: boolean }).dateOnly === true);

        const summary = typeof vevent.summary === 'string'
          ? vevent.summary
          : vevent.summary?.val ?? '(No title)';

        const location = typeof vevent.location === 'string'
          ? vevent.location
          : vevent.location?.val ?? null;

        // Recurring event — expand occurrences within window
        if (vevent.rrule) {
          const occurrences = vevent.rrule.between(windowStart, windowEnd, true);
          for (const occ of occurrences) {
            const occStart = new Date(occ);
            const occEnd = new Date(occStart.getTime() + duration);

            // Skip if excluded by EXDATE
            if (vevent.exdate) {
              const occDay = occStart.toISOString().slice(0, 10);
              const excluded = Object.values(vevent.exdate).some(
                (ex) => new Date(ex as unknown as string).toISOString().slice(0, 10) === occDay,
              );
              if (excluded) continue;
            }

            events.push(
              new CalendarEvent(
                `${vevent.uid ?? crypto.randomUUID()}_${occStart.toISOString()}`,
                summary,
                occStart,
                occEnd,
                !!allDay,
                location,
                feed.personName,
                feed.color,
              ),
            );
          }
          continue;
        }

        // Single event — check if within window
        if (end < windowStart || start > windowEnd) continue;

        events.push(
          new CalendarEvent(
            vevent.uid ?? crypto.randomUUID(),
            summary,
            start,
            end,
            !!allDay,
            location,
            feed.personName,
            feed.color,
          ),
        );
      }

      this.logger.log(`Fetched ${events.length} events for ${feed.personName}`);
      return events;
    } catch (err) {
      this.logger.error(`Failed to fetch ICS for ${feed.personName}`, err);
      return [];
    }
  }

  private readFeeds(): FeedJson[] {
    try {
      const raw = fs.readFileSync(FEEDS_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private writeFeeds(feeds: FeedJson[]): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FEEDS_FILE, JSON.stringify(feeds, null, 2));
  }
}
