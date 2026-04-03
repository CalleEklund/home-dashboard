import { useState, useEffect } from "react"

export type Breakpoint = "phone" | "tablet" | "desktop"

function getBreakpoint(): Breakpoint {
  const w = window.innerWidth
  if (w < 768) return "phone"
  if (w < 1400) return "tablet"
  return "desktop"
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState(getBreakpoint)

  useEffect(() => {
    const handler = () => setBp(getBreakpoint())
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  return bp
}
