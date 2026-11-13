"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { recordingRules } from "@/lib/schemas";
import { clock } from "@/lib/words";
import { Button, Notice } from "./ui";

export type Recording = { blob: Blob; seconds: number };

type Props = {
  value: Recording | null;
  onChange: (recording: Recording | null) => void;
  /** The microphone can't be used (refused, or this browser has none): offer the letter instead. */
  onUnavailable: () => void;
};

type Status = "idle" | "asking" | "recording" | "denied" | "unsupported";

/** What MediaRecorder may produce here, best first. All are kinds the server keeps. */
const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
const bars = 28;
const { maxSeconds } = recordingRules;
/** The gentle countdown: the last seconds are counted out. */
const countdownFrom = 15;

const pickType = () =>
  typeof MediaRecorder === "undefined" ? undefined : preferred.find((type) => MediaRecorder.isTypeSupported(type));

/**
 * A voice note: record, stop, play back, record again. Up to 3 minutes.
 *
 * The microphone is only asked for when they tap record, after a line saying
 * so. If they say no, nothing breaks: we say how to turn it on, and offer the
 * letter. The bars follow their voice while it records.
 */
export function Recorder({ value, onChange, onUnavailable }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const frame = useRef(0);
  const ticker = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startedAt = useRef(0);
  const levels = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLAudioElement>(null);

  // A link the player can use, for as long as there is a recording.
  useEffect(() => {
    if (!value) return;
    const link = URL.createObjectURL(value.blob);
    // The link has to exist before it can be given to the player.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(link);
    return () => {
      URL.revokeObjectURL(link);
      setUrl(null);
    };
  }, [value]);

  const release = () => {
    cancelAnimationFrame(frame.current);
    clearInterval(ticker.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    audioContext.current?.close().catch(() => {});
    audioContext.current = null;
  };

  // Leaving the screen lets go of the microphone.
  useEffect(
    () => () => {
      if (recorder.current?.state === "recording") {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      release();
    },
    [],
  );

  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  /** The bars follow the microphone: newest on the right. */
  const follow = (source: MediaStream) => {
    try {
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      context.createMediaStreamSource(source).connect(analyser);
      audioContext.current = context;

      const samples = new Uint8Array(analyser.fftSize);
      const history = new Array<number>(bars).fill(0.08);
      let last = 0;
      const draw = (now: number) => {
        frame.current = requestAnimationFrame(draw);
        if (now - last < 70) return;
        last = now;
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
        const loudness = Math.min(1, Math.sqrt(sum / samples.length) * 4);
        history.push(Math.max(0.08, loudness));
        history.shift();
        levels.current?.childNodes.forEach((bar, i) => {
          (bar as HTMLElement).style.setProperty("--level", history[i].toFixed(2));
        });
      };
      frame.current = requestAnimationFrame(draw);
    } catch {
      // No level meter on this browser. The recording itself is unaffected.
    }
  };

  const start = async () => {
    const type = pickType();
    if (!type || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    setStatus("asking");
    let source: MediaStream;
    try {
      source = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("denied");
      return;
    }

    stream.current = source;
    // Speech doesn't need more: three minutes stays well under the 10 MB limit.
    const made = new MediaRecorder(source, { mimeType: type, audioBitsPerSecond: 64_000 });
    const chunks: Blob[] = [];
    made.ondataavailable = (event) => event.data.size > 0 && chunks.push(event.data);
    made.onstop = () => {
      const seconds = Math.min(maxSeconds, (performance.now() - startedAt.current) / 1000);
      release();
      setStatus("idle");
      const blob = new Blob(chunks, { type: made.mimeType || type });
      // Under a second is a slip of the thumb, not a message.
      onChange(seconds >= 1 && blob.size > 0 ? { blob, seconds } : null);
    };
    recorder.current = made;

    startedAt.current = performance.now();
    setElapsed(0);
    made.start(1000);
    setStatus("recording");
    follow(source);
    ticker.current = setInterval(() => {
      const seconds = (performance.now() - startedAt.current) / 1000;
      setElapsed(seconds);
      if (seconds >= maxSeconds) stop();
    }, 250);
  };

  const togglePlay = () => {
    const audio = player.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  const recordAgain = () => {
    player.current?.pause();
    onChange(null);
  };

  const left = Math.ceil(maxSeconds - elapsed);

  // Recorded: play it back, or record it again.
  if (value && status !== "recording") {
    return (
      <div className="rounded-lg border border-line bg-paper p-4">
        <audio
          ref={player}
          src={url ?? undefined}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause your voice note" : "Play your voice note"}
            className="inline-flex size-14 shrink-0 items-center justify-center rounded-pill border border-ink-muted text-ink transition-colors duration-200 ease-state hover:border-ink"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-current">
              {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l11-6.5z" />}
            </svg>
          </button>
          <div>
            <p className="text-label text-ink">Your voice note</p>
            <p className="text-small text-ink-muted">{clock(value.seconds)} long. Listen back if you&apos;d like.</p>
          </div>
        </div>
        <Button variant="quiet" onClick={recordAgain} className="mt-2 -ml-6">
          Record again
        </Button>
      </div>
    );
  }

  if (status === "recording") {
    return (
      <div className="rounded-lg border border-line bg-paper p-4">
        <div ref={levels} aria-hidden className="flex h-16 items-center justify-center gap-1">
          {Array.from({ length: bars }, (_, i) => (
            <span
              key={i}
              className="level-bar h-full w-1 rounded-pill bg-heartwood"
              style={{ "--level": 0.08 } as CSSProperties}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-label text-ink tabular-nums" role="timer" aria-label="Recording time">
            {clock(elapsed)} <span className="font-normal text-ink-muted">of {clock(maxSeconds)}</span>
          </p>
          <Button onClick={stop}>Stop</Button>
        </div>
        {/* The last 15 seconds, counted out. Read aloud only at 15, 10 and 5, so it doesn't talk over them. */}
        <p className="mt-2 min-h-5.5 text-small text-ink-muted">
          {left <= countdownFrom && `${left} ${left === 1 ? "second" : "seconds"} left. Take your time finishing.`}
        </p>
        <p role="status" className="sr-only">
          {left <= countdownFrom && left > 0 && left % 5 === 0 ? `${left} seconds left` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={start}
          disabled={status === "asking"}
          aria-label="Record a voice note"
          className="inline-flex size-14 shrink-0 items-center justify-center rounded-pill border border-ink-muted text-heartwood transition-colors duration-200 ease-state hover:border-ink disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-current">
            <circle cx="12" cy="12" r="7" />
          </svg>
        </button>
        <div>
          <p className="text-label text-ink">Record a voice note</p>
          <p className="text-small text-ink-muted">
            Up to 3 minutes. We&apos;ll ask to use your microphone when you tap record.
          </p>
        </div>
      </div>

      {status === "denied" && (
        <div className="mt-3 space-y-2">
          <Notice>
            We couldn&apos;t use your microphone. That&apos;s fine: you can allow it in your browser&apos;s settings
            and try again, or write it instead.
          </Notice>
          <Button variant="outline" onClick={onUnavailable}>
            Write it instead
          </Button>
        </div>
      )}
      {status === "unsupported" && (
        <div className="mt-3 space-y-2">
          <Notice>This browser can&apos;t record sound. You can write it instead.</Notice>
          <Button variant="outline" onClick={onUnavailable}>
            Write it instead
          </Button>
        </div>
      )}
    </div>
  );
}
