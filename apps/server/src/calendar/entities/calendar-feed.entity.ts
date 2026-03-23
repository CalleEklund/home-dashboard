export class CalendarFeed {
  constructor(
    public readonly id: string,
    public readonly personName: string,
    public readonly color: string,
    public readonly icsUrl: string,
  ) {}
}
