export class CalendarEvent {
  constructor(
    public readonly uid: string,
    public readonly summary: string,
    public readonly start: Date,
    public readonly end: Date,
    public readonly allDay: boolean,
    public readonly location: string | null,
    public readonly personName: string,
    public readonly color: string,
  ) {}
}
