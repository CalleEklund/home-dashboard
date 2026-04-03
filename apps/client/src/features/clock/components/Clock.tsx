import { useState, useEffect } from "react"

export default function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const date = now.toLocaleDateString("sv-SE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="text-3xl font-bold tracking-wide text-[#cdd6f4] sm:text-5xl">{time}</div>
      <div className="mt-1 text-sm capitalize text-[#a6adc8] sm:text-lg">{date}</div>
    </div>
  )
}
