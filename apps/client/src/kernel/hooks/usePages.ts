import { useState, useEffect, useCallback } from "react";
import type { WidgetLayout, WidgetId } from "../types";
import { DEFAULT_LAYOUT } from "../grid/constants";
import { WIDGETS } from "../registry";
import { hasCollision, findFreeCell } from "../grid/grid";

export type DashboardPage = {
  id: string;
  name: string;
  layout: WidgetLayout[];
};

const STORAGE_KEY = "fridge_pages";

function loadPages(): DashboardPage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) return parsed;
    }
    // Migrate from old single-layout format
    const oldLayout = localStorage.getItem("fridge_layout");
    if (oldLayout) {
      const layout = JSON.parse(oldLayout);
      return [{ id: "default", name: "Home", layout }];
    }
  } catch { /* ignore */ }
  return [{ id: "default", name: "Home", layout: DEFAULT_LAYOUT }];
}

export function usePages() {
  const [pages, setPages] = useState<DashboardPage[]>(loadPages);
  const [activePageIndex, setActivePageIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  }, [pages]);

  // Clamp index if pages are deleted
  const safeIndex = Math.min(activePageIndex, pages.length - 1);
  const activePage = pages[safeIndex];

  const setActiveLayout = useCallback(
    (updater: (prev: WidgetLayout[]) => WidgetLayout[]) => {
      setPages((prev) =>
        prev.map((p, i) => (i === safeIndex ? { ...p, layout: updater(p.layout) } : p)),
      );
    },
    [safeIndex],
  );

  const moveWidget = (id: WidgetId, colStart: number, rowStart: number) => {
    setActiveLayout((prev) => {
      const widget = prev.find((w) => w.id === id);
      if (!widget) return prev;
      if (hasCollision(prev, id, colStart, rowStart, widget.colSpan, widget.rowSpan)) return prev;
      return prev.map((w) => (w.id === id ? { ...w, colStart, rowStart } : w));
    });
  };

  const resizeWidget = (id: WidgetId, colSpan: number, rowSpan: number) => {
    setActiveLayout((prev) => {
      const widget = prev.find((w) => w.id === id);
      if (!widget) return prev;
      if (hasCollision(prev, id, widget.colStart, widget.rowStart, colSpan, rowSpan)) return prev;
      return prev.map((w) => (w.id === id ? { ...w, colSpan, rowSpan } : w));
    });
  };

  const addWidget = (id: WidgetId) => {
    setActiveLayout((prev) => {
      if (prev.find((w) => w.id === id)) return prev;
      const def = WIDGETS[id];
      const pos = findFreeCell(prev, def.defaultSpan.colSpan, def.defaultSpan.rowSpan);
      if (!pos) return prev;
      return [
        ...prev,
        { id, ...pos, colSpan: def.defaultSpan.colSpan, rowSpan: def.defaultSpan.rowSpan, lockScreen: false },
      ];
    });
  };

  const removeWidget = (id: WidgetId) => {
    setActiveLayout((prev) => prev.filter((w) => w.id !== id));
  };

  const resetLayout = () => {
    setActiveLayout(() => DEFAULT_LAYOUT);
  };

  // Page management
  const addPage = (name: string) => {
    const newPage: DashboardPage = {
      id: Date.now().toString(),
      name,
      layout: [],
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageIndex(pages.length); // switch to new page
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) return; // can't delete last page
    setPages((prev) => prev.filter((_, i) => i !== index));
    if (activePageIndex >= index && activePageIndex > 0) {
      setActivePageIndex((i) => i - 1);
    }
  };

  const renamePage = (index: number, name: string) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, name } : p)),
    );
  };

  return {
    pages,
    activePage,
    activePageIndex,
    setActivePageIndex,
    layout: activePage.layout,
    moveWidget,
    resizeWidget,
    addWidget,
    removeWidget,
    resetLayout,
    addPage,
    deletePage,
    renamePage,
  };
}
