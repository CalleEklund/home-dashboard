import { useState, useEffect, useCallback } from "react"
import * as settingsApi from "../../../kernel/api/settings"

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
  routes: string[] // "line→destination" pairs to show (empty = show all)
}

/** Unique key for a route */
function routeKey(line: string, destination: string): string {
  return `${line}→${destination}`
}

const POLL_INTERVAL = 30_000

const MODE_ICONS: Record<string, string> = {
  BUS: "\u{1F68C}",
  METRO: "\u{1F687}",
  TRAM: "\u{1F68A}",
  TRAIN: "\u{1F686}",
  SHIP: "\u26F4\uFE0F",
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

function RouteFilter({
  siteId,
  routes,
  onChange,
  collapsed,
}: {
  siteId: number
  routes: string[]
  onChange: (routes: string[]) => void
  collapsed?: boolean
}) {
  const [expanded, setExpanded] = useState(!collapsed || routes.length > 0)
  const [available, setAvailable] = useState<{ key: string; line: string; destination: string; mode: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`https://transport.integration.sl.se/v1/sites/${siteId}/departures`)
      .then((r) => r.json())
      .then((data) => {
        const seen = new Set<string>()
        const result: { key: string; line: string; destination: string; mode: string }[] = []
        for (const d of data.departures ?? []) {
          const key = routeKey(d.line.designation, d.destination)
          if (!seen.has(key)) {
            seen.add(key)
            result.push({
              key,
              line: d.line.designation,
              destination: d.destination,
              mode: d.line.transport_mode,
            })
          }
        }
        result.sort((a, b) => a.line.localeCompare(b.line, undefined, { numeric: true }) || a.destination.localeCompare(b.destination))
        setAvailable(result)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [siteId])

  const routeSet = new Set(routes)
  const allSelected = routes.length === 0

  const toggle = (key: string) => {
    if (allSelected) {
      // Switching from "show all" to specific: select everything except the toggled one
      onChange(available.filter((r) => r.key !== key).map((r) => r.key))
    } else if (routeSet.has(key)) {
      const next = routes.filter((r) => r !== key)
      // If nothing selected, revert to show all
      onChange(next.length === 0 ? [] : next)
    } else {
      const next = [...routes, key]
      // If all selected, revert to show all
      onChange(next.length === available.length ? [] : next)
    }
  }

  const filterLabel = allSelected
    ? "Showing all routes"
    : `Showing ${routes.length} of ${available.length} routes`

  if (!expanded) {
    return (
      <button
        className="flex items-center justify-between rounded-lg bg-[#313244] px-3 py-2 text-left"
        onClick={() => setExpanded(true)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="text-sm text-[#cdd6f4]">Filter routes</span>
        <span className="text-xs text-[#6c7086]">{loading ? "" : filterLabel}</span>
      </button>
    )
  }

  if (loading) {
    return <div className="text-xs text-[#6c7086]">Loading routes...</div>
  }

  if (available.length === 0) {
    return <div className="text-xs text-[#6c7086]">No departures found</div>
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-[#a6adc8]">Filter routes</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#6c7086]">{filterLabel}</span>
          <button
            className="text-xs text-[#89b4fa] transition-transform active:scale-95"
            onClick={() => onChange([])}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {allSelected ? "All" : "Reset"}
          </button>
        </div>
      </div>
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {available.map((r) => {
          const selected = allSelected || routeSet.has(r.key)
          return (
            <button
              key={r.key}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selected ? "bg-[#313244]" : "bg-[#313244]/30 opacity-50"
              }`}
              onClick={() => toggle(r.key)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <span className="text-base">{MODE_ICONS[r.mode] ?? ""}</span>
              <span className="w-10 shrink-0 font-bold text-[#89b4fa]">{r.line}</span>
              <span className="min-w-0 flex-1 truncate text-[#cdd6f4]">{r.destination}</span>
              <span className={`text-xs ${selected ? "text-[#a6e3a1]" : "text-[#6c7086]"}`}>
                {selected ? "✓" : "off"}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Departures() {
  const [settings, setSettings] = useState<Settings>({ siteId: null, siteName: "", count: 5, routes: [] })
  const [departures, setDepartures] = useState<Departure[]>([])
  const [error, setError] = useState(false)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Load from server
  useEffect(() => {
    settingsApi.getSettings().then((s) => {
      if (s.departuresSiteId) {
        setSettings({
          siteId: s.departuresSiteId,
          siteName: s.departuresSiteName,
          count: s.departuresCount,
          routes: s.departuresRoutes ?? [],
        })
      }
    }).catch(() => {})
  }, [])

  // Save to server on change
  useEffect(() => {
    if (!settings.siteId) return
    settingsApi.updateSettings({
      departuresSiteId: settings.siteId,
      departuresSiteName: settings.siteName,
      departuresCount: settings.count,
      departuresRoutes: settings.routes,
    }).catch(() => {})
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
        const routeSet = new Set(settings.routes)
        const hasFilter = settings.routes.length > 0
        const deps: Departure[] = (data.departures ?? [])
          .filter((d: { state: string; line: { designation: string }; destination: string }) => {
            if (d.state === "CANCELLED") return false
            if (hasFilter && !routeSet.has(routeKey(d.line.designation, d.destination))) return false
            return true
          })
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
  }, [settings.siteId, settings.count, settings.routes])

  if (!settings.siteId || showSettings) {
    return (
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
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

        {/* Route filter (collapsible, only when a stop is selected) */}
        {settings.siteId && (
          <RouteFilter
            siteId={settings.siteId}
            routes={settings.routes}
            onChange={(routes) => setSettings((s) => ({ ...s, routes }))}
            collapsed
          />
        )}

        {/* Stop search */}
        <StopSearch
          onSelect={(site) => {
            setSettings((s) => ({ ...s, siteId: site.id, siteName: site.name, routes: [] }))
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
