import { useCallback, useEffect, useRef, useState } from "react";

export interface RestTimerState {
  /** Milliseconds remaining, or null when no rest is running or pending. Never negative. */
  remainingMs: number | null;
  /** The timestamp the rest ends at, for the "ends 3:14 PM" label. */
  endAt: number | null;
  /** True once the countdown has reached zero; the bar stays visible reading "Rest over" until dismissed. */
  isOver: boolean;
  /** The superset partner's exercise name, when this rest is between two superset exercises. */
  supersetPartner: string | null;
  /** Starts (or restarts) the countdown for durationMs, from now. Creates the AudioContext on first call. */
  start: (durationMs: number, supersetPartner?: string | null) => void;
  addSeconds: (seconds: number) => void;
  skip: () => void;
}

type LegacyWindow = Window & { webkitAudioContext?: typeof AudioContext };

function playTone(ctx: AudioContext, startAt: number): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.frequency.value = 880;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.2, startAt);
  oscillator.start(startAt);
  oscillator.stop(startAt + 0.15);
}

function beep(ctx: AudioContext): void {
  const now = ctx.currentTime;
  playTone(ctx, now);
  playTone(ctx, now + 0.2);
}

/**
 * The rest timer's live state, kept correct in the background: remaining time is always computed
 * from an absolute end timestamp (not by counting ticks), so a backgrounded or throttled tab still
 * reads the right value once it repaints. Plays a two-tone beep via the Web Audio API when it reaches
 * zero; the AudioContext is created lazily on the first `start()` call (from a Complete tap) so iOS
 * allows audio to play without a fresh user gesture at beep time.
 */
export function useRestTimer(): RestTimerState {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [supersetPartner, setSupersetPartner] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (endAt == null) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [endAt]);

  useEffect(() => {
    if (endAt == null || firedRef.current || now < endAt) return;
    firedRef.current = true;
    const ctx = audioCtxRef.current;
    if (ctx) void ctx.resume().then(() => beep(ctx));
  }, [now, endAt]);

  const start = useCallback((durationMs: number, partner: string | null = null) => {
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext ?? (window as LegacyWindow).webkitAudioContext;
      if (Ctor) audioCtxRef.current = new Ctor();
    }
    firedRef.current = false;
    setSupersetPartner(partner);
    setNow(Date.now());
    setEndAt(Date.now() + durationMs);
  }, []);

  const addSeconds = useCallback((seconds: number) => {
    setEndAt((prev) => (prev == null ? prev : prev + seconds * 1000));
  }, []);

  const skip = useCallback(() => {
    setEndAt(null);
    setSupersetPartner(null);
  }, []);

  return {
    remainingMs: endAt == null ? null : Math.max(0, endAt - now),
    endAt,
    isOver: endAt != null && now >= endAt,
    supersetPartner,
    start,
    addSeconds,
    skip,
  };
}
