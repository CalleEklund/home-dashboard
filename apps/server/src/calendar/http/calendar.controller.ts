import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { HttpBorder, UseHttpBorder } from '@qte/nest-border-patrol';
import type { InferFromHttpBorder } from '@qte/nest-border-patrol';
import { z } from 'zod';
import { CalendarService } from '../services/calendar.service';
import { CalendarMapper } from '../mappers/calendar.mapper';
import { OkSchema } from '../../shared/schemas';
import {
  CalendarFeedSchema,
  CalendarEventSchema,
  AddFeedBodySchema,
} from '../schemas/calendar.schemas';

const feedsBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: z.array(CalendarFeedSchema) },
});

const addFeedBorder = new HttpBorder({
  requestBody: AddFeedBodySchema,
  responses: { [HttpStatus.OK]: CalendarFeedSchema },
});

const removeFeedBorder = new HttpBorder({
  parameters: { path: { id: z.string() } },
  responses: { [HttpStatus.OK]: OkSchema },
});

const eventsBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: z.array(CalendarEventSchema) },
});

@Controller('api/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('feeds')
  @UseHttpBorder(feedsBorder)
  getFeeds(): InferFromHttpBorder<typeof feedsBorder, 'response'> {
    const feeds = this.calendarService.getFeeds();
    return feedsBorder.createResponse(HttpStatus.OK, CalendarMapper.toFeedsHttp(feeds));
  }

  @Post('feeds')
  @UseHttpBorder(addFeedBorder)
  async addFeed(
    @Body() body: InferFromHttpBorder<typeof addFeedBorder, 'requestBody'>,
  ): Promise<InferFromHttpBorder<typeof addFeedBorder, 'response'>> {
    const feed = await this.calendarService.addFeed(body.personName, body.color, body.icsUrl);
    return addFeedBorder.createResponse(HttpStatus.OK, CalendarMapper.toFeedHttp(feed));
  }

  @Delete('feeds/:id')
  @UseHttpBorder(removeFeedBorder)
  removeFeed(
    @Param() params: InferFromHttpBorder<typeof removeFeedBorder, 'pathParameters'>,
  ): InferFromHttpBorder<typeof removeFeedBorder, 'response'> {
    this.calendarService.removeFeed(params.id);
    return removeFeedBorder.createResponse(HttpStatus.OK, { ok: true });
  }

  @Get('events')
  @UseHttpBorder(eventsBorder)
  async getEvents(): Promise<InferFromHttpBorder<typeof eventsBorder, 'response'>> {
    const events = await this.calendarService.getEvents();
    return eventsBorder.createResponse(HttpStatus.OK, CalendarMapper.toEventsHttp(events));
  }
}
