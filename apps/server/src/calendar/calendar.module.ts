import { Module } from '@nestjs/common';
import { CalendarService } from './services/calendar.service';
import { CalendarFeedPort } from './ports/calendar-feed.port';
import { CalendarFeedPgAdapter } from './adapters/calendar-feed-pg.adapter';
import { CalendarController } from './http/calendar.controller';

@Module({
  controllers: [CalendarController],
  providers: [
    CalendarService,
    { provide: CalendarFeedPort, useClass: CalendarFeedPgAdapter },
  ],
})
export class CalendarModule {}
