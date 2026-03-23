import { useState, useCallback, useEffect, useRef } from "react"

export function useLockScreen(timeoutMins: number) {
  const [locked, setLocked] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setLocked(true)
    }, timeoutMins * 60 * 1000)
  }, [timeoutMins])

  useEffect(() => {
    const events = ["pointermove", "pointerdown", "keydown"] as const
    const handler = () => resetTimer()
    events.forEach((e) => window.addEventListener(e, handler))
    resetTimer()
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resetTimer])

  const lock = () => setLocked(true)
  const unlock = () => {
    setLocked(false)
    resetTimer()
  }

  return { locked, lock, unlock }
}
