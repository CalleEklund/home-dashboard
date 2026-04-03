import type { Intent } from "./intents"
import { fetchClient } from "../../kernel/api"

type L = "sv" | "en"

function t(lang: L, sv: string, en: string): string {
  return lang === "sv" ? sv : en
}

const YR_LABELS: Record<string, Record<L, string>> = {
  clearsky: { sv: "klart", en: "clear sky" },
  fair: { sv: "mestadels klart", en: "fair" },
  partlycloudy: { sv: "delvis molnigt", en: "partly cloudy" },
  cloudy: { sv: "molnigt", en: "cloudy" },
  fog: { sv: "dimma", en: "fog" },
  lightrainshowers: { sv: "lätta regnskurar", en: "light rain showers" },
  rainshowers: { sv: "regnskurar", en: "rain showers" },
  heavyrainshowers: { sv: "kraftiga regnskurar", en: "heavy rain showers" },
  lightrain: { sv: "lätt regn", en: "light rain" },
  rain: { sv: "regn", en: "rain" },
  heavyrain: { sv: "kraftigt regn", en: "heavy rain" },
  lightsleet: { sv: "lätt snöblandat regn", en: "light sleet" },
  sleet: { sv: "snöblandat regn", en: "sleet" },
  heavysleet: { sv: "kraftigt snöblandat regn", en: "heavy sleet" },
  lightsnowshowers: { sv: "lätta snöbyar", en: "light snow showers" },
  snowshowers: { sv: "snöbyar", en: "snow showers" },
  heavysnowshowers: { sv: "kraftiga snöbyar", en: "heavy snow showers" },
  lightsnow: { sv: "lätt snöfall", en: "light snow" },
  snow: { sv: "snö", en: "snow" },
  heavysnow: { sv: "kraftigt snöfall", en: "heavy snow" },
  lightrainandthunder: { sv: "lätt regn med åska", en: "light rain and thunder" },
  rainandthunder: { sv: "regn med åska", en: "rain and thunder" },
  heavyrainandthunder: { sv: "kraftigt regn med åska", en: "heavy rain and thunder" },
  snowandthunder: { sv: "snö med åska", en: "snow and thunder" },
}

function yrLabel(symbolCode: string, lang: L): string {
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, "")
  return YR_LABELS[base]?.[lang] ?? t(lang, "okänt väder", "unknown conditions")
}

async function handleWeather(lang: L, date?: string | null): Promise<string> {
  const res = await fetch(
    "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.33&lon=18.07"
  )
  const json = await res.json()
  const timeseries: {
    time: string
    data: {
      instant: { details: { air_temperature: number } }
      next_1_hours?: { summary: { symbol_code: string } }
      next_6_hours?: { summary: { symbol_code: string } }
      next_12_hours?: { summary: { symbol_code: string } }
    }
  }[] = json.properties.timeseries

  const targetDate = date ?? new Date().toISOString().split("T")[0]
  const isToday = targetDate === new Date().toISOString().split("T")[0]

  if (isToday) {
    const now = timeseries[0]
    const temp = Math.round(now.data.instant.details.air_temperature)
    const symbol =
      now.data.next_1_hours?.summary.symbol_code ??
      now.data.next_6_hours?.summary.symbol_code ??
      "cloudy"
    return t(lang,
      `Det är ${temp} grader och ${yrLabel(symbol, lang)}.`,
      `It's ${temp}°C with ${yrLabel(symbol, lang)}.`
    )
  }

  // Find entries for the target date
  const dayEntries = timeseries.filter((e) => e.time.startsWith(targetDate))
  if (dayEntries.length === 0) {
    return t(lang,
      `Ingen prognos tillgänglig för ${formatDate(targetDate, lang)}.`,
      `No forecast available for ${formatDate(targetDate, lang)}.`
    )
  }

  const temps = dayEntries.map((e) => e.data.instant.details.air_temperature)
  const minTemp = Math.round(Math.min(...temps))
  const maxTemp = Math.round(Math.max(...temps))
  // Pick midday symbol for representative weather
  const middayEntry = dayEntries.find((e) => e.time.includes("T12:")) ?? dayEntries[Math.floor(dayEntries.length / 2)]
  const symbol =
    middayEntry.data.next_6_hours?.summary.symbol_code ??
    middayEntry.data.next_1_hours?.summary.symbol_code ??
    "cloudy"

  const dateLabel = formatDate(targetDate, lang)
  return t(lang,
    `${dateLabel}: ${yrLabel(symbol, lang)}, ${minTemp} till ${maxTemp} grader.`,
    `${dateLabel}: ${yrLabel(symbol, lang)}, ${minTemp} to ${maxTemp}°C.`
  )
}

function formatDate(dateStr: string, lang: L): string {
  const d = new Date(dateStr + "T12:00:00")
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split("T")[0]

  if (dateStr === tomorrowStr) return t(lang, "Imorgon", "Tomorrow")

  return d.toLocaleDateString(lang === "sv" ? "sv-SE" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

async function handleDepartures(lang: L): Promise<string> {
  const { data: settings, error } = await fetchClient.GET("/api/settings")
  if (error || !settings) return t(lang, "Kunde inte hämta inställningar.", "Could not fetch settings.")
  if (!settings.departuresSiteId) return t(lang, "Ingen hållplats är vald.", "No departure stop configured.")

  const res = await fetch(
    `https://transport.integration.sl.se/v1/sites/${settings.departuresSiteId}/departures`
  )
  const data = await res.json()
  const deps = (data.departures ?? [])
    .filter((d: { state: string }) => d.state !== "CANCELLED")
    .slice(0, 3)
    .map(
      (d: { line: { designation: string }; destination: string; display: string }) =>
        t(lang,
          `${d.line.designation} mot ${d.destination} om ${d.display}`,
          `${d.line.designation} to ${d.destination} in ${d.display}`
        )
    )

  const name = settings.departuresSiteName
  if (deps.length === 0) return t(lang, `Inga avgångar från ${name} just nu.`, `No departures from ${name}.`)
  return t(lang, `Nästa från ${name}: ${deps.join(", ")}.`, `Next from ${name}: ${deps.join(", ")}.`)
}

async function handleCalendar(lang: L): Promise<string> {
  const { data: events, error } = await fetchClient.GET("/api/calendar/events")
  if (error || !events) return t(lang, "Kunde inte hämta kalenderhändelser.", "Could not fetch calendar events.")

  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const today = events.filter((e) => {
    const start = new Date(e.start)
    return start >= now && start <= endOfDay
  })

  if (today.length === 0) return t(lang, "Inga fler händelser idag.", "No more events today.")
  const list = today
    .slice(0, 3)
    .map((e) => {
      if (e.allDay) return t(lang, `${e.summary} (hela dagen)`, `${e.summary} (all day)`)
      const time = new Date(e.start).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
      })
      return t(lang, `${e.summary} klockan ${time}`, `${e.summary} at ${time}`)
    })
  return t(lang, `Idag: ${list.join(", ")}.`, `Today: ${list.join(", ")}.`)
}

async function handleShoppingAdd(item: string, lang: L): Promise<string> {
  const { data: settings, error: settingsError } = await fetchClient.GET("/api/settings")
  if (settingsError || !settings) return t(lang, "Kunde inte hämta inställningar.", "Could not fetch settings.")
  const listId = settings.icaListId
  if (!listId) return t(lang, "Ingen inköpslista vald.", "No shopping list selected.")

  const { error } = await fetchClient.POST("/api/ica/lists/{listId}/items", {
    params: { path: { listId } },
    body: { text: item },
  })
  if (error) return t(lang, `Kunde inte lägga till "${item}".`, `Failed to add "${item}".`)
  return t(lang, `Lade till "${item}" i inköpslistan.`, `Added "${item}" to the shopping list.`)
}

export async function handleIntent(intent: Intent): Promise<string> {
  const lang: L = intent.lang?.startsWith("sv") ? "sv" : "en"
  switch (intent.type) {
    case "weather-query":
      return handleWeather(lang, intent.date)
    case "departures-query":
      return handleDepartures(lang)
    case "calendar-query":
      return handleCalendar(lang)
    case "shopping-add":
      return handleShoppingAdd(intent.item, lang)
    case "general-query":
      return intent.answer
    case "unknown":
      return t(lang, `Jag förstod inte: "${intent.transcript}"`, `I didn't understand: "${intent.transcript}"`)
  }
}
