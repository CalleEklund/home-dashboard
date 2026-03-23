import { useState, useEffect, useMemo, useCallback } from "react";
import type { PlannerTask, Weekday, Recurrence } from "../types";

const STORAGE_KEY = "fridge_weekly_planner";

const COLORS = [
  "#89b4fa", "#a6e3a1", "#fab387", "#cba6f7", "#f38ba8", "#f9e2af",
];

export function getMonday(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  const day = r.getDay();
  r.setDate(r.getDate() - ((day + 6) % 7));
  return r;
}

export function addWeeks(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n * 7);
  return r;
}

function weeksBetween(a: Date, b: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerWeek);
}

function isVisibleForWeek(task: PlannerTask, targetMonday: Date): boolean {
  if (task.recurrence === "weekly") return true;

  const created = new Date(task.createdWeek);
  const weeks = weeksBetween(created, targetMonday);

  if (weeks < 0) return false;

  switch (task.recurrence) {
    case "once":
      return weeks === 0;
    case "biweekly":
      return weeks % 2 === 0;
    case "triweekly":
      return weeks % 3 === 0;
    case "monthly":
      return Math.ceil(targetMonday.getDate() / 7) === Math.ceil(created.getDate() / 7);
    default:
      return true;
  }
}

function loadTasks(): PlannerTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.map((t: PlannerTask & { recurring?: boolean }) => {
        if (!t.recurrence && "recurring" in t) {
          return { ...t, recurrence: t.recurring ? "weekly" : "once", createdWeek: t.createdWeek ?? getMonday(new Date()).toISOString() };
        }
        return { ...t, createdWeek: t.createdWeek ?? getMonday(new Date()).toISOString() };
      });
    }
  } catch { /* ignore */ }
  return [];
}

export function usePlannerTasks() {
  const [tasks, setTasks] = useState<PlannerTask[]>(loadTasks);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const currentMonday = useMemo(
    () => addWeeks(getMonday(new Date()), weekOffset),
    [weekOffset],
  );

  const visibleTasks = useMemo(
    () => tasks.filter((t) => isVisibleForWeek(t, currentMonday)),
    [tasks, currentMonday],
  );

  const addTask = (text: string, days: Weekday[], recurrence: Recurrence) => {
    const color = COLORS[tasks.length % COLORS.length];
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        days,
        color,
        recurrence,
        createdWeek: getMonday(new Date()).toISOString(),
      },
    ]);
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const goNext = useCallback(() => setWeekOffset((o) => o + 1), []);
  const goPrev = useCallback(() => setWeekOffset((o) => o - 1), []);
  const goToday = useCallback(() => setWeekOffset(0), []);

  return { tasks, visibleTasks, currentMonday, weekOffset, addTask, removeTask, goNext, goPrev, goToday };
}
