import { useState } from "react";
import type { Weekday, Recurrence } from "../types";
import { WEEKDAYS, WEEKDAY_LABELS, RECURRENCE_LABELS } from "../types";

const RECURRENCE_OPTIONS: Recurrence[] = ["once", "weekly", "biweekly", "triweekly", "monthly"];

export function AddTaskForm({
  onAdd,
  onCancel,
}: {
  onAdd: (text: string, days: Weekday[], recurrence: Recurrence) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [selectedDays, setSelectedDays] = useState<Weekday[]>([]);
  const [recurrence, setRecurrence] = useState<Recurrence>("weekly");

  const toggleDay = (day: Weekday) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = () => {
    if (!text.trim() || selectedDays.length === 0) return;
    onAdd(text.trim(), selectedDays, recurrence);
    setText("");
    setSelectedDays([]);
  };

  return (
    <div className="space-y-2 rounded-xl bg-[#1e1e2e] p-3">
      <input
        className="w-full rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none"
        placeholder="Task name..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        onPointerDown={(e) => e.stopPropagation()}
        autoFocus
      />

      {/* Day selector */}
      <div className="flex gap-1">
        {WEEKDAYS.map((day) => (
          <button
            key={day}
            className={`flex-1 rounded-lg py-1 text-xs font-medium transition-colors ${
              selectedDays.includes(day)
                ? "bg-[#89b4fa] text-[#181825]"
                : "bg-[#313244] text-[#6c7086]"
            }`}
            onClick={() => toggleDay(day)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {WEEKDAY_LABELS[day]}
          </button>
        ))}
      </div>

      {/* Recurrence selector */}
      <div className="space-y-1">
        {RECURRENCE_OPTIONS.map((opt) => (
          <button
            key={opt}
            className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
              recurrence === opt
                ? "bg-[#89b4fa]/20 text-[#89b4fa]"
                : "bg-[#313244] text-[#6c7086]"
            }`}
            onClick={() => setRecurrence(opt)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {RECURRENCE_LABELS[opt]}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          className="flex-1 rounded-lg bg-[#313244] py-2 text-sm text-[#a6adc8] transition-transform active:scale-95"
          onClick={onCancel}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Cancel
        </button>
        <button
          className="flex-1 rounded-lg bg-[#89b4fa] py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95 disabled:opacity-50"
          onClick={handleSubmit}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={!text.trim() || selectedDays.length === 0}
        >
          Add
        </button>
      </div>
    </div>
  );
}
