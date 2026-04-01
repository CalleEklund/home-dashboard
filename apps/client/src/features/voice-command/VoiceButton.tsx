import { useState, useCallback, useEffect } from "react"
import { useSpeechRecognition } from "./useSpeechRecognition"
import { classifyIntent } from "./intents";
import { handleIntent } from "./handlers"

function speak(text: string, lang = "en-US") {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  const voices = speechSynthesis.getVoices()
  const match =
    voices.find(v => v.lang === lang && !v.localService) ??
    voices.find(v => v.lang === lang) ??
    voices.find(v => v.lang.startsWith(lang.split("-")[0]))
  if (match) utterance.voice = match
  speechSynthesis.speak(utterance)
}

export default function VoiceButton() {
  const { listening, listen, stop, isSupported } = useSpeechRecognition("sv-SE")
  const [response, setResponse] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // Auto-hide response after 5 seconds
  useEffect(() => {
    if (!response) return
    const timer = setTimeout(() => setResponse(null), 5000)
    return () => clearTimeout(timer)
  }, [response])

  const handleTap = useCallback(async () => {
    if (listening) {
      stop()
      return
    }

    setResponse(null)
    try {
      const transcript = await listen()
      setProcessing(true)
      const intent = await classifyIntent(transcript);
      const result = await handleIntent(intent)
      setResponse(result)
      speak(result, intent.lang)
    } catch (err) {
      if (err instanceof Error && err.message === "no-speech") {
        setResponse("I didn't hear anything. Try again.")
      } else if (err instanceof Error && err.message === "not-allowed") {
        setResponse("Microphone access denied.")
      }
    } finally {
      setProcessing(false)
    }
  }, [listening, listen, stop])

  if (!isSupported) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Response bubble */}
      {(response || processing) && (
        <div className="max-w-xs rounded-xl bg-[#313244] px-4 py-3 text-sm text-[#cdd6f4] shadow-lg">
          {processing ? "Thinking..." : response}
        </div>
      )}

      {/* Mic button */}
      <button
        onClick={handleTap}
        className={`flex size-14 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
          listening
            ? "animate-pulse bg-[#f38ba8]"
            : "bg-[#89b4fa] hover:bg-[#89b4fa]/80"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-6 text-[#181825]"
        >
          <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
          <path d="M6 11a1 1 0 1 0-2 0 8 8 0 0 0 7 7.93V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07A8 8 0 0 0 20 11a1 1 0 1 0-2 0 6 6 0 0 1-12 0Z" />
        </svg>
      </button>
    </div>
  );
}
