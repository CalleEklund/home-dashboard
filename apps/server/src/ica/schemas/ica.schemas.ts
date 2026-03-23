import { z } from 'zod';

export const IcaStatusSchema = z.object({
  authenticated: z.boolean(),
});

export const LoginStartSchema = z.object({
  qrCode: z.string(),
});

export const LoginPollSchema = z.object({
  status: z.enum(['pending', 'complete', 'failed']),
  qrCode: z.string().optional(),
  message: z.string().optional(),
});

export const ShoppingListItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  isStriked: z.boolean(),
});

export const ShoppingListSchema = z.object({
  id: z.string(),
  name: z.string(),
  rows: z.array(ShoppingListItemSchema),
});

export const CreateListBodySchema = z.object({
  name: z.string(),
});

export const AddItemBodySchema = z.object({
  text: z.string(),
});
