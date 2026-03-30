import { useState, useEffect, useRef } from "react";
import type { WidgetLayout, WidgetId } from "../types";
import { WIDGETS } from "../registry";
import { hasCollision, findFreeCell } from "../grid/grid";
import * as settingsApi from "../api/settings";

const DEFAULT_LOCK_LAYOUT: WidgetLayout[] = [
  { id: "clock", colStart: 7, rowStart: 4, colSpan: 6, rowSpan: 3, lockScreen: true },
  { id: "weather", colStart: 7, rowStart: 7, colSpan: 6, rowSpan: 3, lockScreen: true },
];

export function useLockLayout() {
  const [layout, setLayout] = useState<WidgetLayout[]>(DEFAULT_LOCK_LAYOUT);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load from server
  useEffect(() => {
    settingsApi.getLockLayout().then((data) => {
      if (data.layout && (data.layout as WidgetLayout[]).length > 0) {
        setLayout(data.layout as WidgetLayout[]);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // Debounced save to server
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      settingsApi.setLockLayout(layout).catch(() => {});
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [layout, loaded]);

  const moveWidget = (id: WidgetId, colStart: number, rowStart: number) => {
    setLayout((prev) => {
      const widget = prev.find((w) => w.id === id);
      if (!widget) return prev;
      if (hasCollision(prev, id, colStart, rowStart, widget.colSpan, widget.rowSpan)) return prev;
      return prev.map((w) => (w.id === id ? { ...w, colStart, rowStart } : w));
    });
  };

  const resizeWidget = (id: WidgetId, colSpan: number, rowSpan: number) => {
    setLayout((prev) => {
      const widget = prev.find((w) => w.id === id);
      if (!widget) return prev;
      if (hasCollision(prev, id, widget.colStart, widget.rowStart, colSpan, rowSpan)) return prev;
      return prev.map((w) => (w.id === id ? { ...w, colSpan, rowSpan } : w));
    });
  };

  const addWidget = (id: WidgetId) => {
    setLayout((prev) => {
      if (prev.find((w) => w.id === id)) return prev;
      const def = WIDGETS[id];
      const pos = findFreeCell(prev, def.defaultSpan.colSpan, def.defaultSpan.rowSpan);
      if (!pos) return prev;
      return [
        ...prev,
        { id, ...pos, colSpan: def.defaultSpan.colSpan, rowSpan: def.defaultSpan.rowSpan, lockScreen: true },
      ];
    });
  };

  const removeWidget = (id: WidgetId) => {
    setLayout((prev) => prev.filter((w) => w.id !== id));
  };

  const resetLayout = () => setLayout(DEFAULT_LOCK_LAYOUT);

  return { layout, moveWidget, resizeWidget, addWidget, removeWidget, resetLayout };
}
