"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import { lesson, type Condition, conditions } from "@/lib/content/lesson";
import { readDemoProgress } from "@/lib/content/demo-progress";
import { NarrationPlayer } from "./narration-player";
import { DensityVisuals } from "./density-visuals";
import { Button } from "@/components/ui/button";
const STORAGE_KEY = "visuallearn-demo-v1";
export function LessonPlayer() {
  const [progress, setProgress] = useState<ReturnType<typeof readDemoProgress>>(
    {
      segment: 0,
      condition: "medium",
      visited: [0],
    },
  );
  const [ready, setReady] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {}
    const saved = readDemoProgress(raw);
    queueMicrotask(() => {
      setProgress(saved);
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch {}
  }, [progress, ready]);
  const segment = lesson.segments[progress.segment];
  function navigate(index: number) {
    setProgress((p) => ({
      ...p,
      segment: index,
      visited: [...new Set([...p.visited, index])],
    }));
    requestAnimationFrame(() => heading.current?.focus());
  }
  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setProgress({ segment: 0, condition: "medium", visited: [0] });
  }
  return (
    <>
      <div className="demo-strip">
        <strong>PUBLIC DEMO</strong> Explore freely. No research data is
        collected. Narration and content await review.
      </div>
      <main id="main" className="container lesson-layout">
        <aside className="lesson-sidebar" aria-label="Lesson chapters">
          <Link href="/courses/water-cycle" className="breadcrumb">
            ← Lesson overview
          </Link>
          <h2>The Water Cycle</h2>
          <p>Earth science · 5 chapters</p>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Chapters visited"
            aria-valuenow={progress.visited.length}
            aria-valuemin={0}
            aria-valuemax={5}
          >
            <span
              style={{ width: `${(progress.visited.length / 5) * 100}%` }}
            />
          </div>
          <p>{progress.visited.length} of 5 chapters visited</p>
          <nav className="chapter-list">
            {lesson.segments.map((s, i) => (
              <Button
                key={s.id}
                variant="ghost"
                disabled={!ready}
                className={`chapter-button ${i === progress.segment ? "active" : ""}`}
                onClick={() => navigate(i)}
                aria-current={i === progress.segment ? "step" : undefined}
                aria-label={`Chapter ${i + 1}: ${s.shortTitle}`}
              >
                <span>
                  {progress.visited.includes(i) && i !== progress.segment ? (
                    <Check size={13} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <span>{s.shortTitle}</span>
              </Button>
            ))}
          </nav>
          <div className="density-picker">
            <label htmlFor="density">Demo visual density</label>
            <select
              id="density"
              disabled={!ready}
              value={progress.condition}
              onChange={(e) =>
                setProgress((p) => ({
                  ...p,
                  condition: e.target.value as Condition,
                }))
              }
            >
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            <p>
              Same words. Same audio. Different visual layers. This selector is
              for the demo only.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw size={13} /> Reset demo
          </Button>
        </aside>
        <article className="lesson-main">
          <div className="lesson-kicker">
            <span>
              THE WATER CYCLE / CHAPTER{" "}
              {String(progress.segment + 1).padStart(2, "0")}
            </span>
            <span>NARRATION AND FULL TRANSCRIPT</span>
          </div>
          <div className="eyebrow">{segment.eyebrow.toUpperCase()}</div>
          <h1 ref={heading} tabIndex={-1}>
            {segment.heading}
          </h1>
          <NarrationPlayer
            key={segment.id}
            src={segment.audioSrc}
            title={segment.shortTitle}
          />
          <DensityVisuals
            condition={progress.condition}
            active={segment.id}
            description={segment.diagramDescription}
          />
          <p className="lesson-feedback" role="status">
            {progress.condition[0].toUpperCase() + progress.condition.slice(1)}{" "}
            visual density · same explanation and narration in every version.
          </p>
          <details className="transcript" open>
            <summary>
              <BookOpen size={16} /> Read the full explanation
            </summary>
            <div className="transcript-content">
              {segment.body.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </details>
          <div className="key-idea">
            <Lightbulb size={21} />
            <div>
              <span>TAKE THIS IDEA WITH YOU</span>
              <p>{segment.keyIdea}</p>
            </div>
          </div>
          <div className="lesson-nav">
            <Button
              variant="outline"
              disabled={progress.segment === 0}
              onClick={() => navigate(progress.segment - 1)}
            >
              <ArrowLeft size={16} /> Previous
            </Button>
            <span>Chapter {progress.segment + 1} of 5</span>
            {progress.segment < lesson.segments.length - 1 ? (
              <Button onClick={() => navigate(progress.segment + 1)}>
                Next chapter <ArrowRight size={16} />
              </Button>
            ) : (
              <Button asChild>
                <Link href="/demo/water-cycle/practice">
                  Try the practice quiz <ArrowRight size={16} />
                </Link>
              </Button>
            )}
          </div>
          {progress.segment < lesson.segments.length - 1 && (
            <p className="next-preview">
              Up next: {lesson.segments[progress.segment + 1].shortTitle}
            </p>
          )}
        </article>
      </main>
    </>
  );
}
