export type Intent = {
  lang?: string
} & (
  | { type: "shopping-add"; item: string }
  | { type: "weather-query" }
  | { type: "departures-query" }
  | { type: "calendar-query" }
  | { type: "general-query"; answer: string }
  | { type: "unknown"; transcript: string }
)

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

export async function classifyIntent(transcript: string): Promise<Intent> {
  try {
    const res = await fetch(`${API_URL}/api/voice/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    })
    if (!res.ok) return { type: "unknown", transcript }
    return await res.json()
  } catch {
    return { type: "unknown", transcript }
  }
}
