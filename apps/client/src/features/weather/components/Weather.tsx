import { useState, useEffect } from "react"

const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Dense drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "🌨️" },
  80: { label: "Light showers", icon: "🌦️" },
  81: { label: "Showers", icon: "🌧️" },
  82: { label: "Heavy showers", icon: "🌧️" },
  85: { label: "Snow showers", icon: "🌨️" },
  86: { label: "Heavy snow showers", icon: "🌨️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm w/ hail", icon: "⛈️" },
  99: { label: "Thunderstorm w/ heavy hail", icon: "⛈️" },
}

type WeatherData = {
  temp: number
  code: number
}

export default function Weather() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=59.33&longitude=18.07&current=temperature_2m,weather_code&timezone=auto"
    )
      .then((r) => r.json())
      .then((json) => {
        setData({
          temp: json.current.temperature_2m,
          code: json.current.weather_code,
        })
      })
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-[#f38ba8]">
        Failed to load weather
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-[#6c7086]">
        Loading...
      </div>
    )
  }

  const weather = WMO_CODES[data.code] ?? { label: "Unknown", icon: "❓" }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1">
      <div className="text-sm text-[#6c7086]">Stockholm</div>
      <div className="text-4xl">{weather.icon}</div>
      <div className="text-3xl font-bold text-[#cdd6f4]">{Math.round(data.temp)}°C</div>
      <div className="text-sm text-[#a6adc8]">{weather.label}</div>
    </div>
  )
}
