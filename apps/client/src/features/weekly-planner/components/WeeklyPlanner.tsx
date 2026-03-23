import { useState } from "react";
import type { PlannerTask, Weekday } from "../types";
import { WEEKDAYS, WEEKDAY_LABELS, RECURRENCE_LABELS } from "../types";
import { usePlannerTasks, addWeeks } from "../hooks/usePlannerTasks";
import { AddTaskForm } from "./AddTaskForm";

function getTodayWeekday(): Weekday {
  const idx = (new Date().getDay() + 6) % 7; // Monday=0
  return WEEKDAYS[idx];
}

function formatWeekLabel(monday: Date): string {
  const sunday = addWeeks(monday, 0);
  sunday.setDate(sunday.getDate() + 6);
  const s = monday.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  const e = sunday.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  return `${s} – ${e}`;
}

function TaskPill({
  task,
  onRemove,
}: {
  task: PlannerTask;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className="group flex items-center gap-1 rounded-md px-1.5 py-1"
      style={{
        backgroundColor: task.color + "25",
        borderLeft: `2px solid ${task.color}`,
      }}
    >
      <span className="min-w-0 flex-1 truncate  text-[#cdd6f4]">
        {task.text}
      </span>
      {task.recurrence !== "once" && (
        <span className="shrink-0 text-[#6c7086]">{"\u{1F501}"}</span>
      )}
      <button
        className="shrink-0  text-[#f38ba8] opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(task.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        &times;
      </button>
    </div>
  );
}

export default function WeeklyPlanner() {
  const { tasks, visibleTasks, currentMonday, weekOffset, addTask, removeTask, goNext, goPrev, goToday } = usePlannerTasks();
  const [showForm, setShowForm] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const todayDay = getTodayWeekday();
  const isCurrentWeek = weekOffset === 0;

  if (showManage) {
    return (
      <div className="flex h-full flex-col gap-2 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#a6adc8]">
            Manage Tasks
          </span>
          <button
            className="rounded px-2 py-0.5 text-xs text-[#89b4fa] transition-transform active:scale-95"
            onClick={() => setShowManage(false)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            Done
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg bg-[#313244] px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: task.color }}
                  />
                  <span className="truncate text-sm text-[#cdd6f4]">
                    {task.text}
                  </span>
                </div>
                <div className="ml-[18px] mt-0.5 flex items-center gap-2">
                  <span className="text-[10px] text-[#6c7086]">
                    {task.days.map((d) => WEEKDAY_LABELS[d]).join(", ")}
                  </span>
                  <span className="text-[10px] text-[#6c7086]">
                    · {RECURRENCE_LABELS[task.recurrence]}
                  </span>
                </div>
              </div>
              <button
                className="ml-2 text-lg leading-none text-[#f38ba8] transition-transform active:scale-95"
                onClick={() => removeTask(task.id)}
                onPointerDown={(e) => e.stopPropagation()}
              >
                &times;
              </button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="py-4 text-center text-sm text-[#6c7086]">
              No tasks yet
            </div>
          )}
        </div>

        <button
          className="w-full rounded-lg bg-[#89b4fa] py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95"
          onClick={() => {
            setShowManage(false);
            setShowForm(true);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          + Add Task
        </button>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex h-full flex-col gap-2 overflow-y-auto p-3">
        <div className="text-sm font-medium text-[#a6adc8]">New Task</div>
        <AddTaskForm
          onAdd={(text, days, recurrence) => {
            addTask(text, days, recurrence);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  // Main week grid view
  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            className="rounded px-1.5 py-0.5 text-sm text-[#a6adc8] transition-transform active:scale-95"
            onClick={goPrev}
            onPointerDown={(e) => e.stopPropagation()}
          >
            &lsaquo;
          </button>
          <span className="px-1 text-xs text-[#a6adc8]">
            {formatWeekLabel(currentMonday)}
          </span>
          <button
            className="rounded px-1.5 py-0.5 text-sm text-[#a6adc8] transition-transform active:scale-95"
            onClick={goNext}
            onPointerDown={(e) => e.stopPropagation()}
          >
            &rsaquo;
          </button>
          {!isCurrentWeek && (
            <button
              className="ml-1 rounded-lg bg-[#313244] px-2 py-0.5 text-xs text-[#89b4fa] transition-transform active:scale-95"
              onClick={goToday}
              onPointerDown={(e) => e.stopPropagation()}
            >
              This week
            </button>
          )}
        </div>
        <div className="flex gap-1">
          <button
            className="rounded px-1.5 py-0.5 text-xs text-[#6c7086] transition-colors hover:text-[#a6adc8]"
            onClick={() => setShowManage(true)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {"\u2699\uFE0F"}
          </button>
          <button
            className="rounded-lg bg-[#313244] px-2 py-0.5 text-xs text-[#89b4fa] transition-transform active:scale-95"
            onClick={() => setShowForm(true)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            +
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => {
          const isToday = isCurrentWeek && day === todayDay;
          const dayTasks = visibleTasks.filter((t) => t.days.includes(day));

          return (
            <div key={day} className="flex flex-col gap-0.5 overflow-hidden">
              <div
                className={`rounded-md py-0.5 text-center text-[10px] font-medium ${
                  isToday ? "bg-[#89b4fa] text-[#181825]" : "text-[#6c7086]"
                }`}
              >
                {WEEKDAY_LABELS[day]}
              </div>

              <div className="flex-1 space-y-0.5 overflow-y-auto">
                {dayTasks.map((task) => (
                  <TaskPill key={task.id} task={task} onRemove={removeTask} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
