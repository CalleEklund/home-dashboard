import type { WidgetLayout } from "../types";

export const COLS = 20;
export const ROWS = 21;
export const ROW_H = 50;
export const GAP = 12;

export const INACTIVITY_OPTIONS = [1, 2, 5, 10, 15, 30];

export const DEFAULT_LAYOUT: WidgetLayout[] = [
  {
    id: "clock",
    colStart: 1,
    rowStart: 1,
    colSpan: 4,
    rowSpan: 2,
    lockScreen: true,
  },
  {
    id: "weather",
    colStart: 5,
    rowStart: 1,
    colSpan: 2,
    rowSpan: 2,
    lockScreen: true,
  },
  {
    id: "notes",
    colStart: 1,
    rowStart: 3,
    colSpan: 3,
    rowSpan: 4,
    lockScreen: false,
  },
];
