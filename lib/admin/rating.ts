import "server-only";
import { z } from "zod";
import type { SQL } from "@/lib/study/service";
import { hashToken } from "@/lib/security/tokens";
import {
  RUBRIC_VERSION,
  ratingSchema,
  rubricForRaters,
  type ResponseKind,
} from "@/lib/assessments/rubrics.server";
import { sevenDayPrompts } from "@/lib/assessments/seven-day";
import { writtenPrompts } from "@/lib/assessments/written-prompts";
// Blind rating: raters see only response text, its prompt and an opaque
// handle. Condition, age band, other raters' scores and identities stay hidden.
const kindSchema = z.enum(["free_recall", "scenario"]);
const column = {
  free_recall: "free_recall",
  scenario: "scenario_response",
} as const;
const promptKey = { free_recall: "freeRecall", scenario: "scenario" } as const;
const handle = (attemptId: string) =>
  `W-${hashToken(`rating:${attemptId}`).slice(0, 16)}`;
async function attemptForHandle(db: SQL, h: string) {
  const { rows } = await db.query<{ id: string }>(
    "select t.id from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and t.submitted_at is not null and t.timepoint<>'pre'",
  );
  return rows.find((r) => handle(r.id) === h)?.id ?? null;
}
export async function nextForRater(db: SQL, rater: string, kindInput: unknown) {
  const kind = kindSchema.parse(kindInput);
  const col = column[kind];
  const { rows } = await db.query<{
    id: string;
    timepoint: "immediate" | "plus_60m" | "plus_7d";
    text: string;
    remaining: number;
  }>(
    `select t.id,t.timepoint,t.${col} text,count(*) over()::int remaining
     from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id
     where p.withdrawn_at is null and t.submitted_at is not null and t.${col} is not null
       and not exists(select 1 from visuallearn.free_recall_ratings r where r.attempt_id=t.id and r.response_kind=$1 and r.rater_code=$2 and r.rubric_version=$3)
     order by md5(t.id::text||$2) limit 1`,
    [kind, rater, RUBRIC_VERSION],
  );
  const r = rows[0];
  return {
    rubric: rubricForRaters(kind),
    remaining: r?.remaining ?? 0,
    item: r
      ? {
          handle: handle(r.id),
          prompt: (r.timepoint === "plus_7d"
            ? sevenDayPrompts
            : writtenPrompts[r.timepoint])[promptKey[kind]],
          text: r.text,
        }
      : null,
  };
}
export async function submitRating(db: SQL, rater: string, input: unknown) {
  const {
    handle: h,
    kind,
    scores,
  } = z
    .object({
      handle: z.string().regex(/^W-[0-9a-f]{16}$/),
      kind: kindSchema,
      scores: z.unknown(),
    })
    .strict()
    .parse(input);
  const sub = ratingSchema(kind as ResponseKind).parse(scores) as Record<
    string,
    number
  >;
  const attempt = await attemptForHandle(db, h);
  if (!attempt) throw new Error("Unknown response.");
  const total = Object.values(sub).reduce((a, b) => a + b, 0);
  const result = await db.query(
    "insert into visuallearn.free_recall_ratings(attempt_id,response_kind,rater_code,rubric_version,sub_scores,total_score) values($1,$2,$3,$4,$5,$6) on conflict do nothing returning id",
    [attempt, kind, rater, RUBRIC_VERSION, JSON.stringify(sub), total],
  );
  return { saved: true, duplicate: result.rows.length === 0 };
}
/** Responses with two or more disagreeing ratings and no adjudication yet. */
export async function adjudicationQueue(db: SQL, kindInput: unknown) {
  const kind = kindSchema.parse(kindInput);
  const col = column[kind];
  const { rows } = await db.query<{
    id: string;
    timepoint: "immediate" | "plus_60m" | "plus_7d";
    text: string;
    ratings: {
      rater_code: string;
      sub_scores: Record<string, number>;
      total_score: number;
    }[];
  }>(
    `select t.id,t.timepoint,t.${col} text,json_agg(json_build_object('rater_code',r.rater_code,'sub_scores',r.sub_scores,'total_score',r.total_score) order by r.rated_at) ratings
     from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id
     join visuallearn.free_recall_ratings r on r.attempt_id=t.id and r.response_kind=$1 and r.rubric_version=$2
     where p.withdrawn_at is null and not exists(select 1 from visuallearn.rating_adjudications d where d.attempt_id=t.id and d.response_kind=$1 and d.rubric_version=$2)
     group by t.id having count(*)>=2 and count(distinct r.sub_scores)>1 order by md5(t.id::text) limit 20`,
    [kind, RUBRIC_VERSION],
  );
  return {
    rubric: rubricForRaters(kind),
    items: rows.map((r) => ({
      handle: handle(r.id),
      prompt: (r.timepoint === "plus_7d"
        ? sevenDayPrompts
        : writtenPrompts[r.timepoint])[promptKey[kind]],
      text: r.text,
      ratings: r.ratings,
    })),
  };
}
export async function submitAdjudication(
  db: SQL,
  adjudicator: string,
  input: unknown,
) {
  const {
    handle: h,
    kind,
    scores,
    note,
  } = z
    .object({
      handle: z.string().regex(/^W-[0-9a-f]{16}$/),
      kind: kindSchema,
      scores: z.unknown(),
      note: z.string().max(1000).optional(),
    })
    .strict()
    .parse(input);
  const sub = ratingSchema(kind as ResponseKind).parse(scores) as Record<
    string,
    number
  >;
  const attempt = await attemptForHandle(db, h);
  if (!attempt) throw new Error("Unknown response.");
  const result = await db.query(
    "insert into visuallearn.rating_adjudications(attempt_id,response_kind,rubric_version,adjudicator_code,sub_scores,total_score,note) values($1,$2,$3,$4,$5,$6,$7) on conflict do nothing returning id",
    [
      attempt,
      kind,
      RUBRIC_VERSION,
      adjudicator,
      JSON.stringify(sub),
      Object.values(sub).reduce((a, b) => a + b, 0),
      note ?? null,
    ],
  );
  return { saved: true, duplicate: result.rows.length === 0 };
}
