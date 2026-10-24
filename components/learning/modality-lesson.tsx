"use client";
import { useState } from "react";
import type { Segment } from "@/lib/content/lesson";
import type { Presentation } from "@/lib/study/presentation";
import { WaterDiagram } from "./water-diagram";
import { NarrationPlayer } from "./narration-player";
import { Button } from "@/components/ui/button";
type AudioEvent =
  "audio_started" | "audio_paused" | "audio_completed" | "audio_replayed";
export function ModalityLesson({
  segment,
  presentation,
  busy,
  onAudio,
  onTranscript,
}: {
  segment: Segment;
  presentation: Extract<Presentation, { kind: "modality" }>;
  busy: boolean;
  onAudio: (event: AudioEvent, position: number) => void;
  onTranscript: () => void;
}) {
  const [transcript, setTranscript] = useState(false);
  return (
    <section
      className="modality-presentation"
      aria-label="Assigned lesson presentation"
    >
      {presentation.diagram ? (
        <div className="lesson-canvas">
          <WaterDiagram condition="low" active={segment.id} />
        </div>
      ) : (
        <div className="presentation-canvas" aria-label="Lesson content area">
          <p>
            {presentation.audio
              ? "Listen to the narration using the controls below."
              : "Read the explanation below."}
          </p>
        </div>
      )}
      {presentation.audio ? (
        <NarrationPlayer
          fixedRate
          src={segment.audioSrc}
          title={segment.shortTitle}
          pauseWhen={busy}
          onEvent={onAudio}
        />
      ) : (
        <div className="audio-bar">
          <p>Narration is not included in this presentation.</p>
        </div>
      )}
      {!presentation.text && (
        <div className="transcript-access">
          <Button
            variant="outline"
            aria-expanded={transcript}
            aria-controls={`transcript-${segment.id}`}
            onClick={() => {
              if (!transcript) onTranscript();
              setTranscript(!transcript);
            }}
          >
            {transcript
              ? "Hide transcript"
              : "Show transcript (accessibility accommodation)"}
          </Button>
          <p className="fine-print">
            The complete transcript is available when needed. Opening it is
            recorded as an accommodation.
          </p>
        </div>
      )}
      {(presentation.text || transcript) && (
        <div
          id={`transcript-${segment.id}`}
          className="transcript-content instruction-script"
        >
          {segment.body.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
    </section>
  );
}
