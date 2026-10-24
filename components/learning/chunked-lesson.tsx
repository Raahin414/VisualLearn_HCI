"use client";
import { useEffect, useRef } from "react";
import { lesson } from "@/lib/content/lesson";
import type { StudyEvent } from "@/lib/telemetry/schema";
import { NarrationPlayer } from "./narration-player";
import { WaterDiagram } from "./water-diagram";

type Emit = (
  event: StudyEvent["eventType"],
  segment?: StudyEvent["segmentId"],
  payload?: StudyEvent["payload"],
) => void;
export function ChunkedLesson({
  indices,
  groupIndex,
  busy,
  emit,
}: {
  indices: number[];
  groupIndex: number;
  busy: boolean;
  emit: Emit;
}) {
  const root = useRef<HTMLElement>(null);
  const reported = useRef("");
  useEffect(() => {
    const key = indices.join(",");
    const segment = lesson.segments[indices[0]].id as StudyEvent["segmentId"];
    if (reported.current !== key) {
      // Parent consented-session queue initializes in the same effect pass.
      queueMicrotask(() =>
        emit("presentation_exposed", segment, { groupIndex }),
      );
      reported.current = key;
    }
    let last = performance.now();
    let visible = !document.hidden;
    const flush = () => {
      const now = performance.now();
      const activeMs = Math.min(30000, Math.floor(now - last));
      if (visible && activeMs > 0)
        emit("active_time", segment, { groupIndex, activeMs });
      last = now;
    };
    const visibility = () => {
      flush();
      visible = !document.hidden;
    };
    const timer = setInterval(flush, 10000);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [indices, groupIndex, emit]);
  return (
    <section
      ref={root}
      className="chunk-presentation"
      aria-label="Assigned lesson presentation"
    >
      {indices.map((index) => {
        const segment = lesson.segments[index];
        return (
          <section
            key={segment.id}
            className="concept-block"
            aria-labelledby={`concept-${segment.id}`}
            data-concept={segment.id}
          >
            <h2 id={`concept-${segment.id}`}>{segment.heading}</h2>
            <div className="lesson-canvas">
              <WaterDiagram
                condition="low"
                active={segment.id}
                idPrefix={`chunk-${segment.id}-`}
              />
              <p className="diagram-caption">{segment.diagramDescription}</p>
            </div>
            <NarrationPlayer
              fixedRate
              src={segment.audioSrc}
              title={segment.shortTitle}
              pauseWhen={busy}
              onEvent={(event, position) => {
                if (event === "audio_started")
                  root.current?.querySelectorAll("audio").forEach((audio) => {
                    if (audio.getAttribute("src") !== segment.audioSrc)
                      audio.pause();
                  });
                emit(event, segment.id as StudyEvent["segmentId"], {
                  playbackPositionSeconds: position,
                });
              }}
            />
            <div className="chunk-script transcript-content">
              {segment.body.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="key-idea">
              <p>{segment.keyIdea}</p>
            </div>
          </section>
        );
      })}
    </section>
  );
}
