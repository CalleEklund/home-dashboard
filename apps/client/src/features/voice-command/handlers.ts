import type { Intent } from "./intents"

const ICA_API = "http://localhost:3001/api/ica"

const WMO_LABELS: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "foggy",
  51: "light drizzle",
  53: "drizzle",
  55: "dense drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  77: "snow grains",
  80: "light showers",
  81: "showers",
  82: "heavy showers",
  85: "snow showers",
  86: "heavy snow showers",
  95: "thunderstorm",
  96: "thunderstorm with hail",
  99: "thunderstorm with heavy hail",
}

async function handleWeather(): Promise<string> {
  const res = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=59.33&longitude=18.07&current=temperature_2m,weather_code&timezone=auto"
  )
  const json = await res.json()
  const temp = Math.round(json.current.temperature_2m)
  const label = WMO_LABELS[json.current.weather_code] ?? "unknown conditions"
  return `It's ${temp}°C with ${label}.`
}

async function handleDepartures(): Promise<string> {
  const settingsRes = await fetch("http://localhost:3001/api/settings")
  if (!settingsRes.ok) return "Could not fetch settings."
  const settings = await settingsRes.json()
  if (!settings.departuresSiteId) return "No departure stop configured."

  const res = await fetch(
    `https://transport.integration.sl.se/v1/sites/${settings.departuresSiteId}/departures`
  )
  const data = await res.json()
  const deps = (data.departures ?? [])
    .filter((d: { state: string }) => d.state !== "CANCELLED")
    .slice(0, 3)
    .map(
      (d: { line: { designation: string }; destination: string; display: string }) =>
        `${d.line.designation} to ${d.destination} in ${d.display}`
    )

  if (deps.length === 0) return `No upcoming departures from ${settings.departuresSiteName}.`
  return `Next from ${settings.departuresSiteName}: ${deps.join(", ")}.`
}

async function handleCalendar(): Promise<string> {
  const res = await fetch("http://localhost:3001/api/calendar/events")
  if (!res.ok) return "Could not fetch calendar events."
  const events: { summary: string; start: string; allDay: boolean; personName: string }[] =
    await res.json()

  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const today = events.filter((e) => {
    const start = new Date(e.start)
    return start >= now && start <= endOfDay
  })

  if (today.length === 0) return "No more events today."
  const list = today
    .slice(0, 3)
    .map((e) => {
      if (e.allDay) return `${e.summary} (all day)`
      const time = new Date(e.start).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
      })
      return `${e.summary} at ${time}`
    })
  return `Today: ${list.join(", ")}.`
}

async function handleShoppingAdd(item: string): Promise<string> {
  const settingsRes = await fetch("http://localhost:3001/api/settings")
  if (!settingsRes.ok) return "Could not fetch settings."
  const settings = await settingsRes.json()
  const listId = settings.icaListId
  if (!listId) return "No shopping list selected."

  const res = await fetch(`${ICA_API}/lists/${listId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: item }),
  })
  if (!res.ok) return `Failed to add "${item}" to the list.`
  return `Added "${item}" to the shopping list.`
}

export async function handleIntent(intent: Intent): Promise<string> {
  switch (intent.type) {
    case "weather-query":
      return handleWeather()
    case "departures-query":
      return handleDepartures()
    case "calendar-query":
      return handleCalendar()
    case "shopping-add":
      return handleShoppingAdd(intent.item)
    case "unknown":
      return `I didn't understand: "${intent.transcript}"`
  }
}
