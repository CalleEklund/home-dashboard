import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as ical from 'node-ical';
import { z } from 'zod';
import { sql, InjectPostgresPool, type PostgresPool } from '../../kernel/postgres';
import { CalendarFeedPort } from '../ports/calendar-feed.port';
import { CalendarFeed } from '../entities/calendar-feed.entity';
import { CalendarEvent } from '../entities/calendar-event.entity';

const EVENT_WINDOW_DAYS = 14;

const CalendarFeedRowSchema = z.object({
  id: z.string().uuid(),
  person_name: z.string(),
  color: z.string(),
  ics_url: z.string(),
});

@Injectable()
export class CalendarFeedPgAdapter extends CalendarFeedPort {
  private readonly logger = new Logger(CalendarFeedPgAdapter.name);

  constructor(
    @InjectPostgresPool() private readonly pool: PostgresPool,
  ) {
    super();
  }

  async getFeeds(): Promise<CalendarFeed[]> {
    const result = await this.pool.query(
      sql.type(CalendarFeedRowSchema)`SELECT * FROM calendar_feeds`,
    );
    return [...result.rows].map(
      (r) => new CalendarFeed(r.id, r.person_name, r.color, r.ics_url),
    );
  }

  async addFeed(personName: string, color: string, icsUrl: string): Promise<CalendarFeed> {
    const result = await this.pool.one(
      sql.type(CalendarFeedRowSchema)`
        INSERT INTO calendar_feeds (person_name, color, ics_url)
        VALUES (${personName}, ${color}, ${icsUrl})
        RETURNING *
      `,
    );
    this.logger.log(`Added feed: ${personName}`);
    return new CalendarFeed(result.id, result.person_name, result.color, result.ics_url);
  }

  async removeFeed(id: string): Promise<void> {
    await this.pool.query(
      sql.unsafe`DELETE FROM calendar_feeds WHERE id = ${id}`,
    );
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

        if (vevent.rrule) {
          const occurrences = vevent.rrule.between(windowStart, windowEnd, true);
          for (const occ of occurrences) {
            const occStart = new Date(occ);
            const occEnd = new Date(occStart.getTime() + duration);

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
}
