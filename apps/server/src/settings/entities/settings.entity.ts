export type WidgetLayoutItem = {
  id: string;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  lockScreen?: boolean;
  [key: string]: unknown;
};

export type NoteItem = {
  id: string;
  text: string;
};

export class Settings {
  constructor(
    public lockTimeoutMins: number,
    public departuresSiteId: number | null,
    public departuresSiteName: string,
    public departuresCount: number,
    public departuresRoutes: string[],
    public icaListId: string | null,
  ) {}
}

export class DashboardPage {
  constructor(
    public id: string,
    public name: string,
    public position: number,
    public layout: WidgetLayoutItem[],
  ) {}
}

export class LockLayout {
  constructor(public layout: WidgetLayoutItem[]) {}
}

export class NoteList {
  constructor(
    public id: string,
    public name: string,
    public notes: NoteItem[],
  ) {}
}

export class PlannerTask {
  constructor(
    public id: string,
    public text: string,
    public days: string[],
    public color: string,
    public recurrence: string,
    public createdWeek: string,
  ) {}
}
