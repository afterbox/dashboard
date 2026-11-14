"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { recordingRules } from "@/lib/schemas";
import { clock } from "@/lib/words";
import { AgainIcon, MicIcon, PauseIcon, PlayIcon, StopIcon } from "./icons";
import { IconButton, Notice } from "./ui";

export type Recording = { blob: Blob; seconds: number };

type Props = {
  value: Recording | null;
  onChange: (recording: Recording | null) => void;
  /** What sits under the record button before anything is recorded: the quiet ways out ("Write instead"). */
  resting?: ReactNode;
  /** An idea they picked, kept in sight while they speak. */
  prompt?: string | null;
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
 * One thing at a time. Before: one big round button, and nothing else of its
 * own. While recording: the same button, now stop, with the bars following
 * their voice and the time under it. After: a small row to play it back or
 * record it again.
 *
 * The microphone is only asked for when they tap record. If they say no,
 * nothing breaks: we say how to turn it on, and writing is one tap away.
 */
export function Recorder({ value, onChange, resting, prompt }: Props) {
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
  const played = useRef<HTMLDivElement>(null);

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

  /** How far through it is, drawn as a line that fills. (A fresh recording doesn't know its own length; we do.) */
  const showPlayed = (fraction: number) => {
    if (played.current) played.current.style.transform = `scaleX(${Math.min(1, Math.max(0, fraction)).toFixed(3)})`;
  };

  // Recorded: a small row. Play it back, or record it again.
  if (value && status !== "recording") {
    return (
      <div className="reveal flex items-center gap-1 rounded-pill border border-line bg-paper p-1">
        <audio
          ref={player}
          src={url ?? undefined}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(event) => showPlayed(event.currentTarget.currentTime / value.seconds)}
          onEnded={() => {
            setPlaying(false);
            showPlayed(0);
          }}
        />
        <IconButton label={playing ? "Pause your voice note" : "Play your voice note"} ringed onClick={togglePlay}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <div aria-hidden className="mx-2 h-1 min-w-0 flex-1 overflow-hidden rounded-pill bg-line">
          <div ref={played} className="h-full origin-left scale-x-0 bg-heartwood transition-transform duration-200 ease-linear" />
        </div>
        <p className="text-small text-ink-muted tabular-nums">
          <span className="sr-only">Your voice note, </span>
          {clock(value.seconds)}
        </p>
        <IconButton label="Record again" onClick={recordAgain}>
          <AgainIcon />
        </IconButton>
      </div>
    );
  }

  const recording = status === "recording";

  return (
    <div className="flex flex-col items-center">
      {/* The one big button, with the growing rings round it. Record, then stop, in the same place. */}
      <div
        data-recording={recording ? "" : undefined}
        className="relative grid size-34 place-items-center short:size-28"
      >
        <span aria-hidden className="record-ring absolute size-28 rounded-pill border-[1.5px] border-heartwood/40" />
        <span aria-hidden className="record-ring absolute size-34 rounded-pill border-[1.5px] border-lantern/70 short:hidden" />
        {recording ? (
          <IconButton hero label="Stop recording" onClick={stop}>
            <StopIcon className="size-8" />
          </IconButton>
        ) : (
          <IconButton hero label="Record a voice note" onClick={start} disabled={status === "asking"}>
            <MicIcon className="size-8" />
          </IconButton>
        )}
      </div>

      {recording ? (
        <div className="mt-3 flex w-full flex-col items-center short:mt-1">
          <div ref={levels} aria-hidden className="flex h-10 items-center justify-center gap-1 short:h-8">
            {Array.from({ length: bars }, (_, i) => (
              <span
                key={i}
                className="level-bar h-full w-1 rounded-pill bg-heartwood"
                style={{ "--level": 0.08 } as CSSProperties}
              />
            ))}
          </div>
          <p className="mt-2 text-label text-ink tabular-nums" role="timer" aria-label="Recording time">
            {clock(elapsed)} <span className="font-normal text-ink-muted">of {clock(maxSeconds)}</span>
          </p>
          {/* The last 15 seconds, counted out; until then, the idea they picked, if they picked one. */}
          <p className="mt-1 min-h-5.5 text-center text-small text-pretty text-ink-muted">
            {left <= countdownFrom
              ? `${left} ${left === 1 ? "second" : "seconds"} left. Take your time finishing.`
              : prompt}
          </p>
          {/* Read aloud only at 15, 10 and 5, so it doesn't talk over them. */}
          <p role="status" className="sr-only">
            {left <= countdownFrom && left > 0 && left % 5 === 0 ? `${left} seconds left` : ""}
          </p>
        </div>
      ) : (
        <div className="mt-2 w-full short:mt-0">
          {status === "asking" && (
            <p role="status" className="text-center text-small text-ink-muted">
              Allow your microphone, and begin.
            </p>
          )}
          {status === "denied" && (
            <div className="text-center">
              <Notice>
                We couldn&apos;t use your microphone. That&apos;s fine: allow it in your browser&apos;s settings and
                try again, or write instead.
              </Notice>
            </div>
          )}
          {status === "unsupported" && (
            <div className="text-center">
              <Notice>This browser can&apos;t record sound. You can write instead.</Notice>
            </div>
          )}
          {resting}
        </div>
      )}
    </div>
  );
}
