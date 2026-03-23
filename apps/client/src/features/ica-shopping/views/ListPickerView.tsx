import { useState } from "react";
import type { IcaList } from "../types";

export function ListPickerView({
  lists,
  error,
  onSelect,
  onDelete,
  onCreate,
  onLogout,
}: {
  lists: IcaList[];
  error: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
  onLogout: () => void;
}) {
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const name = newListName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await onCreate(name);
      setNewListName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-[#a6adc8]">Select a list</div>
        <button
          className="rounded px-2 py-0.5 text-xs text-[#f38ba8] transition-transform active:scale-95"
          onClick={onLogout}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Log out
        </button>
      </div>

      {error && <div className="text-xs text-[#f38ba8]">{error}</div>}

      <div className="flex-1 space-y-1 overflow-y-auto">
        {lists.map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between rounded-lg bg-[#313244] px-3 py-2"
          >
            <button
              className="flex-1 text-left text-sm text-[#cdd6f4] transition-colors hover:text-[#89b4fa]"
              onClick={() => onSelect(l.id)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {l.name}
              <span className="ml-2 text-xs text-[#6c7086]">({l.rows.length})</span>
            </button>
            <button
              className="ml-2 text-lg leading-none text-[#f38ba8] transition-transform active:scale-95"
              onClick={() => onDelete(l.id)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              &times;
            </button>
          </div>
        ))}
        {lists.length === 0 && (
          <div className="py-4 text-center text-sm text-[#6c7086]">No lists yet</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none"
          placeholder="New list name..."
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <button
          className="rounded-lg bg-[#89b4fa] px-3 py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95 disabled:opacity-50"
          onClick={handleCreate}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={creating || !newListName.trim()}
        >
          +
        </button>
      </div>
    </div>
  );
}
