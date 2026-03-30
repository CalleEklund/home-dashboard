export type Intent =
  | { type: "shopping-add"; item: string }
  | { type: "weather-query" }
  | { type: "departures-query" }
  | { type: "calendar-query" }
  | { type: "unknown"; transcript: string }

export function parseIntent(transcript: string): Intent {
  const t = transcript.normalize("NFC").toLowerCase().trim()

  // Shopping list: "add bread to my shopping list", "lägg till bröd", "add milk"
  const addPatterns = [
    /(?:add|put)\s+(.+?)(?:\s+(?:to|on)\s+(?:my\s+)?(?:shopping\s*list|list|grocery\s*list))?$/,
    /(?:l.gg\s+till|l.gg)\s+(.+?)(?:\s+(?:p.|i|till)\s+(?:min\s+)?(?:ink.pslista|lista|handlingslista))?$/,
  ]
  for (const pattern of addPatterns) {
    const match = t.match(pattern)
    if (match?.[1]) {
      return { type: "shopping-add", item: match[1].trim() }
    }
  }

  // Weather: "what's the weather", "hur är vädret", "temperature"
  if (
    /weather|temperature|temp\b|v.der|temperatur|how warm|hur varmt|how cold|hur kallt/.test(t)
  ) {
    return { type: "weather-query" }
  }

  // Departures: "next bus", "departures", "avgångar", "when does the bus leave"
  if (
    /departure|bus|train|metro|tram|avg.ng|buss|t.g|tunnelbana|sp.rvagn|next (?:bus|train|tram)|n.sta (?:buss|t.g)/.test(t)
  ) {
    return { type: "departures-query" }
  }

  // Calendar: "what's on my calendar", "any events today", "kalender"
  if (
    /calendar|event|meeting|schedule|kalender|h.ndelse|m.te|schema|what's on|what do i have/.test(t)
  ) {
    return { type: "calendar-query" }
  }

  return { type: "unknown", transcript }
}
