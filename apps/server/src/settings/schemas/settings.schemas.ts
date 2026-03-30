import { z } from 'zod';

export const SettingsSchema = z.object({
  lockTimeoutMins: z.number(),
  departuresSiteId: z.number().nullable(),
  departuresSiteName: z.string(),
  departuresCount: z.number(),
  icaListId: z.string().nullable(),
});

export const UpdateSettingsBodySchema = z.object({
  lockTimeoutMins: z.number().optional(),
  departuresSiteId: z.number().nullable().optional(),
  departuresSiteName: z.string().optional(),
  departuresCount: z.number().optional(),
  icaListId: z.string().nullable().optional(),
});

const WidgetLayoutSchema = z.object({
  id: z.string(),
  colStart: z.number(),
  rowStart: z.number(),
  colSpan: z.number(),
  rowSpan: z.number(),
}).passthrough();

export const DashboardPageSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number(),
  layout: z.array(WidgetLayoutSchema),
});

export const SetPagesBodySchema = z.array(
  z.object({
    id: z.string().optional(),
    name: z.string(),
    position: z.number(),
    layout: z.array(WidgetLayoutSchema),
  }),
);

export const LockLayoutSchema = z.object({
  layout: z.array(WidgetLayoutSchema),
});

export const SetLockLayoutBodySchema = z.object({
  layout: z.array(WidgetLayoutSchema),
});

export const NoteListSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.array(z.object({ id: z.string(), text: z.string() })),
});

export const SetNoteListsBodySchema = z.array(
  z.object({
    id: z.string().optional(),
    name: z.string(),
    notes: z.array(z.object({ id: z.string(), text: z.string() })),
  }),
);

export const PlannerTaskSchema = z.object({
  id: z.string(),
  text: z.string(),
  days: z.array(z.string()),
  color: z.string(),
  recurrence: z.string(),
  createdWeek: z.string(),
});

export const AddPlannerTaskBodySchema = z.object({
  text: z.string(),
  days: z.array(z.string()),
  color: z.string(),
  recurrence: z.string(),
  createdWeek: z.string(),
});

export const UpdatePlannerTaskBodySchema = z.object({
  text: z.string().optional(),
  days: z.array(z.string()).optional(),
  color: z.string().optional(),
  recurrence: z.string().optional(),
  createdWeek: z.string().optional(),
});
