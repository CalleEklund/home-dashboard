import { useState, useCallback, useRef } from "react"

type SpeechRecognitionEvent = {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}

type SpeechRecognitionInstance = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

export function useSpeechRecognition(lang = "sv-SE") {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const isSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) {
        reject(new Error("Speech recognition not supported"))
        return
      }

      const recognition = new SR()
      recognitionRef.current = recognition
      recognition.lang = lang
      recognition.interimResults = false
      recognition.continuous = false

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        resolve(transcript)
      }

      recognition.onerror = (e) => {
        setListening(false)
        reject(new Error(e.error))
      }

      recognition.onend = () => {
        setListening(false)
        recognitionRef.current = null
      }

      setListening(true)
      recognition.start()
    })
  }, [lang])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { listening, listen, stop, isSupported }
}
