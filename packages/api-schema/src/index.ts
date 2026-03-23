export type { paths, operations } from "./schema";

// Convenience type extracts
import type { operations } from "./schema";

type ResponseOf<T extends keyof operations> =
  operations[T] extends { responses: { 200: { content: { "application/json": infer R } } } } ? R : never;

export type IcaStatus = ResponseOf<"IcaController_status">;
export type LoginStart = ResponseOf<"IcaController_startLogin">;
export type LoginPoll = ResponseOf<"IcaController_pollLogin">;
export type ShoppingList = ResponseOf<"IcaController_getLists"> extends (infer T)[] ? T : never;
export type CalendarFeed = ResponseOf<"CalendarController_getFeeds"> extends (infer T)[] ? T : never;
export type CalendarEvent = ResponseOf<"CalendarController_getEvents"> extends (infer T)[] ? T : never;
