import { Module } from '@nestjs/common';
import { CalendarService } from './services/calendar.service';
import { CalendarFeedPort } from './ports/calendar-feed.port';
import { CalendarFeedAdapter } from './adapters/calendar-feed.adapter';
import { CalendarController } from './http/calendar.controller';

@Module({
  controllers: [CalendarController],
  providers: [
    CalendarService,
    { provide: CalendarFeedPort, useClass: CalendarFeedAdapter },
  ],
})
export class CalendarModule {}
