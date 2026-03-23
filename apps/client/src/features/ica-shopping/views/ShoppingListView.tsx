import { useState } from "react";
import type { IcaList } from "../types";

export function ShoppingListView({
  activeList,
  lastFetched,
  error,
  onAddItem,
  onRemoveItem,
  onShowPicker,
}: {
  activeList: IcaList;
  lastFetched: Date | null;
  error: string | null;
  onAddItem: (text: string) => Promise<void>;
  onRemoveItem: (rowId: string) => Promise<void>;
  onShowPicker: () => void;
}) {
  const [input, setInput] = useState("");

  const handleAdd = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    try {
      await onAddItem(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <button
            className="text-sm font-medium text-[#a6adc8] transition-colors hover:text-[#89b4fa]"
            onClick={onShowPicker}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {activeList.name}
          </button>
          {lastFetched && (
            <span className="text-xs text-[#6c7086]">
              {lastFetched.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <button
          className="rounded px-1.5 py-0.5 text-xs text-[#6c7086] transition-colors hover:text-[#a6adc8]"
          onClick={onShowPicker}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {"\u2699\uFE0F"}
        </button>
      </div>

      {error && <div className="mb-2 text-xs text-[#f38ba8]">{error}</div>}

      <div className="mb-2 flex gap-2">
        <input
          className="flex-1 rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none"
          placeholder="Add item..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <button
          className="rounded-lg bg-[#89b4fa] px-3 py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleAdd}
        >
          +
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto">
        {activeList.rows
          .filter((r) => !r.isStriked)
          .map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg bg-[#313244] px-3 py-2 text-sm"
            >
              <span className="text-[#cdd6f4]">{r.text}</span>
              <button
                className="ml-2 text-lg leading-none text-[#f38ba8] transition-transform active:scale-95"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRemoveItem(r.id)}
              >
                &times;
              </button>
            </div>
          ))}
        {activeList.rows.filter((r) => !r.isStriked).length === 0 && (
          <div className="py-4 text-center text-sm text-[#6c7086]">List is empty</div>
        )}
      </div>
    </div>
  );
}
