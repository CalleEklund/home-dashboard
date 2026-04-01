import { useState, useEffect, useRef } from "react"
import * as settingsApi from "../../../kernel/api/settings"

type Note = { id: string; text: string }
type NoteList = { id: string; name: string; notes: Note[] }

const DEFAULT_ID = crypto.randomUUID()
const DEFAULT_LISTS: NoteList[] = [{ id: DEFAULT_ID, name: "Notes", notes: [] }]

export default function Notes() {
  const [lists, setLists] = useState<NoteList[]>(DEFAULT_LISTS)
  const [activeListId, setActiveListId] = useState<string>(DEFAULT_ID)
  const [input, setInput] = useState("")
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Load from server
  useEffect(() => {
    settingsApi.getNoteLists().then((data) => {
      if (data.length > 0) {
        setLists(data)
        setActiveListId(data[0].id)
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  // Debounced save to server
  useEffect(() => {
    if (!loaded) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      settingsApi.setNoteLists(lists).catch(() => {})
    }, 500)
    return () => clearTimeout(saveTimer.current)
  }, [lists, loaded])

  const activeList = lists.find((l) => l.id === activeListId)

  const addNote = () => {
    const text = input.trim()
    if (!text || !activeList) return
    setLists((prev) =>
      prev.map((l) =>
        l.id === activeListId
          ? { ...l, notes: [...l.notes, { id: Date.now().toString(), text }] }
          : l
      )
    )
    setInput("")
  }

  const removeNote = (noteId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === activeListId
          ? { ...l, notes: l.notes.filter((n) => n.id !== noteId) }
          : l
      )
    )
  }

  const addList = () => {
    const newList: NoteList = {
      id: Date.now().toString(),
      name: `List ${lists.length + 1}`,
      notes: [],
    }
    setLists((prev) => [...prev, newList])
    setActiveListId(newList.id)
  }

  const removeList = (listId: string) => {
    setLists((prev) => {
      const next = prev.filter((l) => l.id !== listId)
      if (next.length === 0) {
        const fallback: NoteList = { id: Date.now().toString(), name: "Notes", notes: [] }
        setActiveListId(fallback.id)
        return [fallback]
      }
      if (activeListId === listId) {
        setActiveListId(next[0].id)
      }
      return next
    })
  }

  const startRename = (listId: string, currentName: string) => {
    setRenaming(listId)
    setRenameValue(currentName)
  }

  const commitRename = () => {
    if (!renaming) return
    const name = renameValue.trim()
    if (name) {
      setLists((prev) =>
        prev.map((l) => (l.id === renaming ? { ...l, name } : l))
      )
    }
    setRenaming(null)
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      {/* Tab bar */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {lists.map((l) => (
          <div key={l.id} className="group flex shrink-0 items-center">
            {renaming === l.id ? (
              <input
                className="w-20 rounded bg-[#313244] px-2 py-0.5 text-xs text-[#cdd6f4] outline-none"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename()
                  if (e.key === "Escape") setRenaming(null)
                }}
                onBlur={commitRename}
                onPointerDown={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <button
                className={`rounded-t-lg px-2.5 py-1 text-xs transition-colors ${
                  l.id === activeListId
                    ? "bg-[#313244] text-[#cdd6f4]"
                    : "text-[#6c7086] hover:text-[#a6adc8]"
                }`}
                onClick={() => setActiveListId(l.id)}
                onDoubleClick={() => startRename(l.id, l.name)}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {l.name}
              </button>
            )}
            {l.id === activeListId && lists.length > 1 && (
              <button
                className="ml-0.5 text-xs text-[#f38ba8] transition-transform active:scale-90"
                onClick={() => removeList(l.id)}
                onPointerDown={(e) => e.stopPropagation()}
              >
                &times;
              </button>
            )}
          </div>
        ))}
        <button
          className="shrink-0 rounded-lg px-2 py-0.5 text-xs text-[#89b4fa] transition-transform active:scale-90"
          onClick={addList}
          onPointerDown={(e) => e.stopPropagation()}
        >
          +
        </button>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none"
          placeholder="Add a note..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <button
          className="rounded-lg bg-[#89b4fa] px-3 py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={addNote}
        >
          +
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {activeList?.notes.map((n) => (
          <div
            key={n.id}
            className="flex items-center justify-between rounded-lg bg-[#313244] px-3 py-2 text-sm"
          >
            <span className="text-[#cdd6f4]">{n.text}</span>
            <button
              className="ml-2 text-lg leading-none text-[#f38ba8] transition-transform active:scale-95"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => removeNote(n.id)}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
