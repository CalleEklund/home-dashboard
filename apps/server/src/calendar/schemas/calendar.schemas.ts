import { z } from 'zod';

export const CalendarFeedSchema = z.object({
  id: z.string(),
  personName: z.string(),
  color: z.string(),
  icsUrl: z.string(),
});

export const CalendarEventSchema = z.object({
  uid: z.string(),
  summary: z.string(),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean(),
  location: z.string().nullable(),
  personName: z.string(),
  color: z.string(),
});

export const AddFeedBodySchema = z.object({
  personName: z.string(),
  color: z.string(),
  icsUrl: z.string(),
});
