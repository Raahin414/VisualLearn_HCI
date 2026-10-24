"use client";
import { useEffect, useRef, useState } from "react";
import { Headphones, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
type AudioEvent =
  "audio_started" | "audio_paused" | "audio_completed" | "audio_replayed";
export function NarrationPlayer({
  src,
  title,
  onEvent,
  pauseWhen = false,
  fixedRate = false,
}: {
  src: string;
  title: string;
  onEvent?: (event: AudioEvent, position: number) => void;
  pauseWhen?: boolean;
  fixedRate?: boolean;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState("Loading narration…");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = audio.current;
    let active = true;
    // Cached metadata/error events can fire before hydration attaches handlers.
    // Read the real media state once; do not start playback or emit telemetry.
    if (element?.error || (element && element.readyState >= 1))
      queueMicrotask(() => {
        if (!active) return;
        if (element.error) {
          setFailed(true);
          setStatus(
            "Audio could not load. The complete transcript is available below.",
          );
        } else {
          setStatus("Narration ready · press play to listen");
        }
      });
    return () => {
      active = false;
      element?.pause();
    };
  }, []);
  useEffect(() => {
    if (pauseWhen) audio.current?.pause();
  }, [pauseWhen]);
  return (
    <div className="narration-player">
      <div className="audio-bar">
        <span className="audio-label">
          <Headphones size={15} />
          Listen & learn
        </span>
        <audio
          ref={audio}
          src={src}
          controls
          controlsList={fixedRate ? "noplaybackrate" : undefined}
          onRateChange={() => {
            if (fixedRate && audio.current && audio.current.playbackRate !== 1)
              audio.current.playbackRate = 1;
          }}
          preload="metadata"
          aria-label={`Narration: ${title}`}
          onLoadedMetadata={() =>
            setStatus("Narration ready · press play to listen")
          }
          onWaiting={() => setStatus("Buffering narration…")}
          onPlaying={() => setStatus("Playing narration")}
          onPlay={() =>
            onEvent?.("audio_started", audio.current?.currentTime || 0)
          }
          onPause={() => {
            setStatus(
              audio.current?.ended ? "Narration finished" : "Narration paused",
            );
            onEvent?.("audio_paused", audio.current?.currentTime || 0);
          }}
          onEnded={() => {
            setStatus(
              "Narration finished · replay or continue when you’re ready",
            );
            onEvent?.("audio_completed", audio.current?.currentTime || 0);
          }}
          onError={() => {
            setFailed(true);
            setStatus(
              "Audio could not load. The complete transcript is available below.",
            );
          }}
        />
        <Button
          type="button"
          variant="ghost"
          className="audio-replay"
          disabled={failed}
          onClick={() => {
            const element = audio.current;
            if (!element) return;
            element.currentTime = 0;
            onEvent?.("audio_replayed", 0);
            void element
              .play()
              .catch(() =>
                setStatus(
                  "Playback could not start. Use the audio play control or read the transcript.",
                ),
              );
          }}
        >
          <RotateCcw size={14} />
          Replay
        </Button>
      </div>
      <p role="status" className={failed ? "form-error" : "media-status"}>
        {status}
      </p>
    </div>
  );
}
