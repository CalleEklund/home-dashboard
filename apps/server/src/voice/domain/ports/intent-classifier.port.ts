export type Intent = {
  lang?: string;
} & (
  | { type: 'shopping-add'; item: string }
  | { type: 'weather-query' }
  | { type: 'departures-query' }
  | { type: 'calendar-query' }
  | { type: 'general-query'; answer: string }
  | { type: 'unknown'; transcript: string }
);

export abstract class IntentClassifierPort {
  abstract classify(transcript: string): Promise<Intent>;
}
