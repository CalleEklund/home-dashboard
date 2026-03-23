import { z } from 'zod';

export const OkSchema = z.object({
  ok: z.boolean(),
});
