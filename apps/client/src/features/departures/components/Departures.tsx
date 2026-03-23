import { useState, useEffect, useCallback } from "react"

type Departure = {
  line: string
  destination: string
  display: string
  mode: string
  state: string
}

type SiteResult = {
  id: number
  name: string
  note: string | null
  lat: number
  lon: number
}

const STOCKHOLM_LAT = 59.33
const STOCKHOLM_LON = 18.07

function distanceAndDirection(lat: number, lon: number): string {
  const dLat = lat - STOCKHOLM_LAT
  const dLon = lon - STOCKHOLM_LON
  const km = Math.sqrt(dLat ** 2 + (dLon * Math.cos(STOCKHOLM_LAT * Math.PI / 180)) ** 2) * 111
  if (km < 1) return "central Stockholm"
  const angle = Math.atan2(dLon * Math.cos(STOCKHOLM_LAT * Math.PI / 180), dLat) * 180 / Math.PI
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const idx = Math.round(((angle + 360) % 360) / 45) % 8
  return `${Math.round(km)} km ${dirs[idx]} of Stockholm`
}

type Settings = {
  siteId: number | null
  siteName: string
  count: number
}

const STORAGE_KEY = "fridge_departures_settings"
const POLL_INTERVAL = 30_000

const MODE_ICONS: Record<string, string> = {
  BUS: "\u{1F68C}",
  METRO: "\u{1F687}",
  TRAM: "\u{1F68A}",
  TRAIN: "\u{1F686}",
  SHIP: "\u26F4\uFE0F",
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { siteId: null, siteName: "", count: 5 }
}

function StopSearch({ onSelect }: { onSelect: (site: SiteResult) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SiteResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch("https://transport.integration.sl.se/v1/sites")
      const sites: { id: number; name: string; note?: string; lat: number; lon: number }[] = await res.json()
      const lower = q.toLowerCase()
      setResults(
        sites
          .filter((s) =>
            s.name.toLowerCase().includes(lower) ||
            (s.note && s.note.toLowerCase().includes(lower))
          )
          .slice(0, 8)
          .map((s) => ({ id: s.id, name: s.name, note: s.note ?? null, lat: s.lat, lon: s.lon }))
      )
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="text-sm text-[#a6adc8]">Stop</div>
      <input
        className="w-full rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none"
        inputMode="search"
        placeholder="e.g. Slussen, T-Centralen..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
      />
      {loading && <div className="text-xs text-[#6c7086]">Searching...</div>}
      <div className="w-full space-y-1 overflow-y-auto">
        {results.map((s) => (
          <button
            key={s.id}
            className="w-full rounded-lg bg-[#313244] px-3 py-2 text-left text-sm transition-colors hover:bg-[#89b4fa]/20 active:scale-[0.98]"
            onClick={() => onSelect(s)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="text-[#cdd6f4]">{s.name}</span>
            <span className="ml-2 text-xs text-[#6c7086]">
              {s.note || distanceAndDirection(s.lat, s.lon)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Departures() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [departures, setDepartures] = useState<Departure[]>([])
  const [error, setError] = useState(false)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    if (!settings.siteId) return

    let cancelled = false

    const fetchDepartures = async () => {
      try {
        const res = await fetch(
          `https://transport.integration.sl.se/v1/sites/${settings.siteId}/departures`
        )
        const data = await res.json()
        if (cancelled) return
        const deps: Departure[] = (data.departures ?? [])
          .filter((d: { state: string }) => d.state !== "CANCELLED")
          .slice(0, settings.count)
          .map((d: {
            line: { designation: string; transport_mode: string }
            destination: string
            display: string
            state: string
          }) => ({
            line: d.line.designation,
            destination: d.destination,
            display: d.display,
            mode: d.line.transport_mode,
            state: d.state,
          }))
        setDepartures(deps)
        setLastFetched(new Date())
        setError(false)
      } catch {
        if (!cancelled) setError(true)
      }
    }

    fetchDepartures()
    const id = setInterval(fetchDepartures, POLL_INTERVAL)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [settings.siteId, settings.count])

  if (!settings.siteId || showSettings) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-[#a6adc8]">Settings</div>
          {settings.siteId && (
            <button
              className="rounded px-2 py-0.5 text-xs text-[#89b4fa] transition-transform active:scale-95"
              onClick={() => setShowSettings(false)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Done
            </button>
          )}
        </div>

        {/* Count setting */}
        <div className="flex items-center justify-between rounded-lg bg-[#313244] px-3 py-2">
          <span className="text-sm text-[#cdd6f4]">Departures to show</span>
          <select
            className="rounded bg-[#1e1e2e] px-2 py-1 text-sm text-[#cdd6f4] outline-none"
            value={settings.count}
            onChange={(e) => setSettings((s) => ({ ...s, count: Number(e.target.value) }))}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {[3, 5, 8, 10, 15].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Stop search */}
        <StopSearch
          onSelect={(site) => {
            setSettings((s) => ({ ...s, siteId: site.id, siteName: site.name }))
            setShowSettings(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-[#a6adc8]">{settings.siteName}</span>
          {lastFetched && (
            <span className="text-xs text-[#6c7086]">
              {lastFetched.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
        <button
          className="rounded px-1.5 py-0.5 text-xs text-[#6c7086] transition-colors hover:text-[#a6adc8]"
          onClick={() => setShowSettings(true)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {"\u2699\uFE0F"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-[#f38ba8]">Failed to load departures</div>
      )}

      <div className="flex-1 space-y-1 overflow-y-auto">
        {departures.map((d, i) => (
          <div
            key={`${d.line}-${d.destination}-${i}`}
            className="flex items-center gap-2 rounded-lg bg-[#313244] px-3 py-2 text-sm"
          >
            <span className="text-base">{MODE_ICONS[d.mode] ?? ""}</span>
            <span className="w-10 shrink-0 font-bold text-[#89b4fa]">{d.line}</span>
            <span className="min-w-0 flex-1 truncate text-[#cdd6f4]">{d.destination}</span>
            <span className="shrink-0 font-mono text-[#a6adc8]">{d.display}</span>
          </div>
        ))}
        {departures.length === 0 && !error && (
          <div className="py-4 text-center text-sm text-[#6c7086]">No departures</div>
        )}
      </div>
    </div>
  )
}
