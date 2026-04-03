import { useState, useEffect } from "react"

const SYMBOL_ICONS: Record<string, string> = {
  clearsky: "☀️",
  fair: "🌤️",
  partlycloudy: "⛅",
  cloudy: "☁️",
  fog: "🌫️",
  lightrainshowers: "🌦️",
  rainshowers: "🌧️",
  heavyrainshowers: "🌧️",
  lightrainshowersandthunder: "⛈️",
  rainshowersandthunder: "⛈️",
  heavyrainshowersandthunder: "⛈️",
  lightsleetshowers: "🌧️",
  sleetshowers: "🌧️",
  heavysleetshowers: "🌧️",
  lightsnowshowers: "🌨️",
  snowshowers: "🌨️",
  heavysnowshowers: "🌨️",
  lightrain: "🌧️",
  rain: "🌧️",
  heavyrain: "🌧️",
  lightrainandthunder: "⛈️",
  rainandthunder: "⛈️",
  heavyrainandthunder: "⛈️",
  lightsleet: "🌧️",
  sleet: "🌧️",
  heavysleet: "🌧️",
  lightsnow: "🌨️",
  snow: "❄️",
  heavysnow: "❄️",
  lightsleetandthunder: "⛈️",
  sleetandthunder: "⛈️",
  heavysleetandthunder: "⛈️",
  lightsnowandthunder: "⛈️",
  snowandthunder: "⛈️",
  heavysnowandthunder: "⛈️",
};

function getIcon(symbolCode: string): string {
  // Strip _day/_night/_polartwilight suffix
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, "");
  return SYMBOL_ICONS[base] ?? "❓";
}

function getLabel(symbolCode: string): string {
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, "");
  // Convert camelCase to readable
  return base
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

type DayForecast = {
  date: string;
  dayLabel: string;
  minTemp: number;
  maxTemp: number;
  symbol: string;
};

type YrData = {
  temp: number;
  symbol: string;
  wind: number;
  humidity: number;
  forecast: DayForecast[];
};

function parseForecast(
  timeseries: {
    time: string;
    data: {
      instant: {
        details: {
          air_temperature: number;
          wind_speed: number;
          relative_humidity: number;
        };
      };
      next_1_hours?: { summary: { symbol_code: string } };
      next_6_hours?: { summary: { symbol_code: string } };
      next_12_hours?: { summary: { symbol_code: string } };
    };
  }[],
): YrData {
  const now = timeseries[0];
  const currentTemp = now.data.instant.details.air_temperature;
  const currentWind = now.data.instant.details.wind_speed;
  const currentHumidity = now.data.instant.details.relative_humidity;
  const currentSymbol =
    now.data.next_1_hours?.summary.symbol_code ??
    now.data.next_6_hours?.summary.symbol_code ??
    "cloudy";

  // Group by date for daily forecasts
  const byDate = new Map<string, { temps: number[]; symbols: string[] }>();
  for (const entry of timeseries) {
    const date = entry.time.split("T")[0];
    if (!byDate.has(date)) byDate.set(date, { temps: [], symbols: [] });
    const day = byDate.get(date)!;
    day.temps.push(entry.data.instant.details.air_temperature);
    const sym =
      entry.data.next_6_hours?.summary.symbol_code ??
      entry.data.next_12_hours?.summary.symbol_code ??
      entry.data.next_1_hours?.summary.symbol_code;
    if (sym) day.symbols.push(sym);
  }

  const today = new Date().toISOString().split("T")[0];
  const forecast: DayForecast[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (const [date, data] of byDate) {
    if (forecast.length >= 11) break; // today + 10 days
    const d = new Date(date + "T12:00:00");
    const dayLabel = date === today ? "Today" : dayNames[d.getDay()];
    // Pick the most common symbol, or midday one
    const midSymbol =
      data.symbols[Math.floor(data.symbols.length / 3)] ?? "cloudy";
    forecast.push({
      date,
      dayLabel,
      minTemp: Math.round(Math.min(...data.temps)),
      maxTemp: Math.round(Math.max(...data.temps)),
      symbol: midSymbol,
    });
  }

  return {
    temp: currentTemp,
    symbol: currentSymbol,
    wind: currentWind,
    humidity: currentHumidity,
    forecast,
  };
}

export default function Weather() {
  const [data, setData] = useState<YrData | null>(null);
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(
      "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.33&lon=18.07",
    )
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        setData(parseForecast(json.properties.timeseries));
      })
      .catch(() => setError(true));
  }, [])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#f38ba8]">
        Failed to load weather
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-[#6c7086]">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-3">
      {/* Current weather */}
      <div className="mb-2 flex items-center gap-3">
        <div className="text-3xl sm:text-4xl">{getIcon(data.symbol)}</div>
        <div>
          <div className="text-2xl font-bold text-[#cdd6f4] sm:text-3xl">
            {Math.round(data.temp)}°C
          </div>
          <div className="text-xs text-[#a6adc8]">{getLabel(data.symbol)}</div>
        </div>
        <div className="ml-auto text-right text-xs text-[#6c7086]">
          <div>Stockholm</div>
          <div>{Math.round(data.wind)} m/s</div>
          <div>{Math.round(data.humidity)}%</div>
        </div>
      </div>

      {/* 10-day forecast — horizontal scroll */}
      <div className="flex flex-1 gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {data.forecast.map((day) => (
          <div
            key={day.date}
            className="flex shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1.5"
          >
            <span className="text-[10px] font-medium text-[#a6adc8]">
              {day.dayLabel}
            </span>
            <span className="text-base">{getIcon(day.symbol)}</span>
            <span className="text-xs font-medium text-[#cdd6f4]">{day.maxTemp}°</span>
            <span className="text-[10px] text-[#6c7086]">{day.minTemp}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}
