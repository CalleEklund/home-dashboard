import { useState } from "react";
import type { CalendarFeed } from "../types";
import { COLORS } from "../helpers";

export function FeedSettings({
  feeds,
  onAdd,
  onRemove,
  onDone,
}: {
  feeds: CalendarFeed[];
  onAdd: (name: string, color: string, url: string) => Promise<void>;
  onRemove: (id: string) => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0].hex);
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await onAdd(name.trim(), color, url.trim());
      setName("");
      setUrl("");
    } catch {
      setError("Failed to add calendar");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-[#a6adc8]">Calendars</div>
        {feeds.length > 0 && (
          <button
            className="rounded px-2 py-0.5 text-xs text-[#89b4fa] transition-transform active:scale-95"
            onClick={onDone}
            onPointerDown={(e) => e.stopPropagation()}
          >
            Done
          </button>
        )}
      </div>

      {error && <div className="text-xs text-[#f38ba8]">{error}</div>}

      <div className="space-y-1 overflow-y-auto">
        {feeds.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between rounded-lg bg-[#313244] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full" style={{ backgroundColor: f.color }} />
              <span className="text-sm text-[#cdd6f4]">{f.personName}</span>
            </div>
            <button
              className="ml-2 text-lg leading-none text-[#f38ba8] transition-transform active:scale-95"
              onClick={() => onRemove(f.id)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-2">
        <div className="text-xs text-[#6c7086]">Add calendar</div>
        <input
          className="w-full rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none"
          placeholder="Name (e.g. Alice)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              className="size-6 rounded-full transition-transform active:scale-90"
              style={{
                backgroundColor: c.hex,
                outline: color === c.hex ? "2px solid #cdd6f4" : "2px solid transparent",
                outlineOffset: "2px",
              }}
              onClick={() => setColor(c.hex)}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ))}
        </div>
        <input
          className="w-full rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none"
          inputMode="url"
          placeholder="ICS URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <button
          className="w-full rounded-lg bg-[#89b4fa] px-3 py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95 disabled:opacity-50"
          onClick={handleAdd}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={adding || !name.trim() || !url.trim()}
        >
          {adding ? "Adding..." : "Add calendar"}
        </button>
      </div>
    </div>
  );
}
