import { useState, useEffect, useRef, useCallback } from "react";

type TimerState = "idle" | "running" | "paused" | "done";

const PRESETS = [
  { label: "1m", seconds: 60 },
  { label: "3m", seconds: 180 },
  { label: "5m", seconds: 300 },
  { label: "10m", seconds: 600 },
  { label: "15m", seconds: 900 },
  { label: "30m", seconds: 1800 },
];

function formatDisplay(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function playAlarm() {
  const ctx = new AudioContext();
  const times = [0, 0.2, 0.4, 0.7, 0.9, 1.1];
  for (const t of times) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = t < 0.6 ? 880 : 1200;
    gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
    osc.start(ctx.currentTime + t);
    osc.stop(ctx.currentTime + t + 0.15);
  }
}

export default function Timer() {
  const [state, setState] = useState<TimerState>("idle");
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [customMin, setCustomMin] = useState("");
  const [customSec, setCustomSec] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const left = Math.max(
      0,
      Math.round((endTimeRef.current - Date.now()) / 1000),
    );
    setRemaining(left);
    if (left <= 0) {
      clearTimer();
      setState("done");
      playAlarm();
    }
  }, [clearTimer]);

  const start = useCallback(
    (seconds: number) => {
      clearTimer();
      setTotal(seconds);
      setRemaining(seconds);
      endTimeRef.current = Date.now() + seconds * 1000;
      setState("running");
      intervalRef.current = setInterval(tick, 250);
    },
    [clearTimer, tick],
  );

  const pause = useCallback(() => {
    clearTimer();
    setState("paused");
  }, [clearTimer]);

  const resume = useCallback(() => {
    endTimeRef.current = Date.now() + remaining * 1000;
    setState("running");
    intervalRef.current = setInterval(tick, 250);
  }, [remaining, tick]);

  const stop = useCallback(() => {
    clearTimer();
    setState("idle");
    setRemaining(0);
    setTotal(0);
  }, [clearTimer]);

  const dismiss = useCallback(() => {
    setState("idle");
    setRemaining(0);
    setTotal(0);
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const startCustom = () => {
    const m = parseInt(customMin || "0", 10);
    const s = parseInt(customSec || "0", 10);
    const totalSec = m * 60 + s;
    if (totalSec > 0) {
      setCustomMin("");
      setCustomSec("");
      start(totalSec);
    }
  };

  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;

  // Done state — alarm ringing
  if (state === "done") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <div className="animate-pulse text-4xl font-bold text-[#f38ba8]">
          00:00
        </div>
        <div className="text-sm text-[#a6adc8]">Time&apos;s up!</div>
        <button
          className="w-full rounded-lg bg-[#89b4fa] px-4 py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95"
          onClick={dismiss}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Running or paused
  if (state === "running" || state === "paused") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#313244]">
          <div
            className="h-full rounded-full bg-[#89b4fa] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          className={`text-4xl font-bold tabular-nums ${state === "paused" ? "text-[#fab387]" : "text-[#cdd6f4]"}`}
        >
          {formatDisplay(remaining)}
        </div>

        {state === "paused" && (
          <div className="text-xs text-[#fab387]">Paused</div>
        )}

        <div className="flex w-full gap-2">
          {state === "running" ? (
            <button
              className="flex-1 rounded-lg bg-[#fab387] px-3 py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95"
              onClick={pause}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Pause
            </button>
          ) : (
            <button
              className="flex-1 rounded-lg bg-[#a6e3a1] px-3 py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95"
              onClick={resume}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Resume
            </button>
          )}
          <button
            className="flex-1 rounded-lg bg-[#313244] px-3 py-2 text-sm font-bold text-[#f38ba8] transition-transform active:scale-95"
            onClick={stop}
            onPointerDown={(e) => e.stopPropagation()}
          >
            Stop
          </button>
        </div>
      </div>
    );
  }

  // Idle — picker
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="text-sm font-medium text-[#a6adc8]">Timer</div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.seconds}
            className="rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#cdd6f4] transition-transform active:scale-95"
            onClick={() => start(p.seconds)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex items-center gap-2">
        <input
          className="w-16 rounded-lg bg-[#313244] p-2 text-center text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none"
          inputMode="numeric"
          placeholder="min"
          value={customMin}
          onChange={(e) => setCustomMin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && startCustom()}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <span className="text-sm text-[#6c7086]">:</span>
        <input
          className="w-16 rounded-lg bg-[#313244] p-2 text-center text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none"
          inputMode="numeric"
          placeholder="sec"
          value={customSec}
          onChange={(e) => setCustomSec(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && startCustom()}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <button
          className="rounded-lg bg-[#89b4fa] px-3 py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95"
          onClick={startCustom}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Start
        </button>
      </div>
    </div>
  );
}
