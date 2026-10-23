import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { lesson } from "@/lib/content/lesson";
import manifest from "@/content/asset-manifest.json";
import {
  BANK_VERSION,
  questionBanks,
  publicQuestions,
  scoreAnswers,
} from "@/lib/assessments/questions.server";
import { RUBRIC_VERSION, rubrics } from "@/lib/assessments/rubrics.server";
import { writtenPrompts } from "@/lib/assessments/written-prompts";
import {
  enrollmentSchema,
  followupWindow,
  followupEligibility,
  type StudyState,
} from "./lifecycle";
import {
  f3Schema,
  f5Schema,
  SURVEY_VERSION,
} from "@/lib/assessments/surveys";
import { eventBatchSchema } from "@/lib/telemetry/schema";
import { hashToken, newReturnToken } from "@/lib/security/tokens";

export interface SQL {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
}
export class StudyError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
type Session = {
  id: string;
  participant_id: string;
  state: StudyState;
  progress: number;
  visited_segments: number[];
  lesson_completed_at: Date | null;
  content_sha256: string;
  media_manifest_sha256: string;
  question_bank_sha256: string;
  stimulus_sha256: string;
  followup_window_minutes: number;
  withdrawn_at: Date | null;
  public_code: string;
  arm_key: string | null;
};
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const mediaHash = digest(manifest.narration);
const stimulusHash = digest(manifest.stimulus);
const bankHash = digest({
  A: questionBanks.A,
  B: questionBanks.B,
  C: questionBanks.C,
  writtenPrompts,
  rubrics,
});
export const STIMULUS_VERSION = "density-v4-draft";
const stageForms = { pre: "A", immediate: "B", plus_60m: "C" } as const;
export type Timepoint = keyof typeof stageForms;
const submissionSchema = z
  .object({
    answers: z.unknown(),
    freeRecall: z.string().trim().min(20).max(6000).optional(),
    scenario: z.string().trim().min(20).max(3000).optional(),
  })
  .strict();

export class StudyService {
  constructor(
    private db: SQL,
    private now: () => Date = () => new Date(),
  ) {}
  async gate() {
    const { rows } = await this.db.query<{
      enabled: boolean;
      status: string;
      content_approved: boolean;
      ethics_approved: boolean;
      consent_version: string | null;
      consent_text: string | null;
      study_contact: string | null;
      followup_window_minutes: number;
      protocol_version: string;
    }>("select * from visuallearn.experiments where id='E1'");
    const e = rows[0];
    if (
      !e ||
      !e.enabled ||
      e.status !== "recruiting" ||
      !e.content_approved ||
      !e.ethics_approved ||
      !e.consent_version ||
      !e.consent_text ||
      !e.study_contact
    )
      throw new StudyError(
        "STUDY_CLOSED",
        "Research enrollment is not approved or open.",
        503,
      );
    return e;
  }
  async session(id: string, lock = false) {
    const { rows } = await this.db.query<Session>(
      `select s.*,p.withdrawn_at,p.public_code,a.arm_key from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id left join visuallearn.assignments a on a.id=s.assignment_id where s.id=$1 ${lock ? "for update of s" : ""}`,
      [id],
    );
    const s = rows[0];
    if (!s)
      throw new StudyError(
        "UNAUTHORIZED",
        "A valid study session is required.",
        401,
      );
    if (s.withdrawn_at || s.state === "withdrawn")
      throw new StudyError(
        "WITHDRAWN",
        "This study session has been withdrawn.",
        403,
      );
    if (
      s.content_sha256 !== manifest.contentSha256 ||
      s.media_manifest_sha256 !== mediaHash ||
      s.question_bank_sha256 !== bankHash ||
      s.stimulus_sha256 !== stimulusHash
    )
      throw new StudyError(
        "VERSION_MISMATCH",
        "The study content has changed. Contact the researcher; your session has been preserved.",
        409,
      );
    return s;
  }
  async enroll(input: unknown, idempotencyKey: string) {
    const e = await this.gate();
    const data = enrollmentSchema.parse(input);
    if (data.ageBand !== "18-30")
      throw new StudyError(
        "MINORS_BLOCKED",
        "Minor enrollment requires a separately approved verification process.",
        403,
      );
    if (data.consentVersion !== e.consent_version)
      throw new StudyError(
        "CONSENT_VERSION",
        "Please read the current consent materials.",
        409,
      );
    const key = hashToken(z.string().uuid().parse(idempotencyKey));
    await this.db.query("select pg_advisory_xact_lock(hashtext($1))", [key]);
    const existing = await this.db.query<{ id: string; state: StudyState }>(
      "select s.id,s.state from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.enrollment_key=$1",
      [key],
    );
    if (existing.rows[0]) return { sessionId: existing.rows[0].id };
    const code = `VL-${randomBytes(6).toString("hex").toUpperCase()}`;
    const p = await this.db.query<{ id: string }>(
      "insert into visuallearn.participants(public_code,experiment_id,age_band,language,consent_version,f0,enrollment_key) values($1,'E1',$2,$3,$4,$5,$6) returning id",
      [
        code,
        data.ageBand,
        data.language,
        data.consentVersion,
        JSON.stringify(data),
        key,
      ],
    );
    const s = await this.db.query<{ id: string }>(
      "insert into visuallearn.sessions(participant_id,content_version,content_sha256,protocol_version,stimulus_version,media_manifest_sha256,question_bank_sha256,stimulus_sha256,followup_window_minutes) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id",
      [
        p.rows[0].id,
        lesson.version,
        manifest.contentSha256,
        e.protocol_version,
        STIMULUS_VERSION,
        mediaHash,
        bankHash,
        stimulusHash,
        e.followup_window_minutes,
      ],
    );
    return { sessionId: s.rows[0].id };
  }
  async snapshot(id: string) {
    const s = await this.session(id);
    const followups = await this.db.query<{
      due_at: Date;
      deadline_at: Date;
      status: string;
    }>(
      "select due_at,deadline_at,status from visuallearn.scheduled_followups where session_id=$1 and timepoint='plus_60m'",
      [id],
    );
    return {
      publicCode: s.public_code,
      state: s.state,
      progress: s.progress,
      visited: s.visited_segments,
      followup: followups.rows[0] ?? null,
      serverTime: this.now().toISOString(),
    };
  }
  async assessment(id: string, timepoint: Timepoint) {
    const s = await this.session(id, true);
    const form = stageForms[timepoint];
    const existing = await this.db.query<{ submitted_at: Date | null }>(
      "select submitted_at from visuallearn.assessment_attempts where session_id=$1 and timepoint=$2",
      [id, timepoint],
    );
    if (existing.rows[0]?.submitted_at) return { submitted: true };
    const expected = {
      pre: "enrolled",
      immediate: "lesson_complete",
      plus_60m: "waiting_60m",
    };
    if (s.state !== expected[timepoint])
      throw new StudyError(
        "STAGE_LOCKED",
        "This assessment is not available at the current stage.",
        409,
      );
    if (timepoint === "plus_60m") await this.requireFollowup(id);
    await this.db.query(
      "insert into visuallearn.assessment_attempts(session_id,timepoint,form_key,form_version,opened_at) values($1,$2,$3,$4,$5) on conflict(session_id,timepoint) do nothing",
      [id, timepoint, form, BANK_VERSION, this.now()],
    );
    return {
      submitted: false,
      questions: publicQuestions(form),
      freeRecallPrompt: writtenPrompts[timepoint].freeRecall,
      scenarioPrompt: writtenPrompts[timepoint].scenario,
    };
  }
  async submitAssessment(id: string, timepoint: Timepoint, input: unknown) {
    const s = await this.session(id, true);
    const attempts = await this.db.query<{ submitted_at: Date | null }>(
      "select submitted_at from visuallearn.assessment_attempts where session_id=$1 and timepoint=$2",
      [id, timepoint],
    );
    if (attempts.rows[0]?.submitted_at)
      return { accepted: true, alreadySubmitted: true };
    await this.assessment(id, timepoint);
    const data = submissionSchema.parse(input);
    if (timepoint !== "pre" && (!data.freeRecall || !data.scenario))
      throw new StudyError(
        "WRITTEN_REQUIRED",
        "Please complete both written explanations.",
      );
    if (timepoint === "pre" && (data.freeRecall || data.scenario))
      throw new StudyError(
        "INVALID_ANSWERS",
        "The baseline form has no written questions.",
      );
    let result: ReturnType<typeof scoreAnswers>;
    try {
      result = scoreAnswers(stageForms[timepoint], data.answers);
    } catch {
      throw new StudyError(
        "INVALID_ANSWERS",
        "Please answer every question using the supplied form.",
      );
    }
    await this.db.query(
      "update visuallearn.assessment_attempts set answers_json=$3,free_recall=$4,correct=$5,max_score=$6,submitted_at=$7,rubric_version=$8,scenario_response=$9,item_scores=$10,scoring_version=$11 where session_id=$1 and timepoint=$2 and submitted_at is null",
      [
        id,
        timepoint,
        JSON.stringify(data.answers),
        data.freeRecall ?? null,
        result.correct,
        result.total,
        this.now(),
        timepoint === "pre" ? null : RUBRIC_VERSION,
        data.scenario ?? null,
        JSON.stringify(result.itemScores),
        `objective-${BANK_VERSION}`,
      ],
    );
    let next: StudyState;
    if (timepoint === "pre") {
      const assignment = await this.db.query<{ id: string }>(
        "select visuallearn.assign_once($1) id",
        [s.participant_id],
      );
      await this.db.query(
        "update visuallearn.sessions set assignment_id=$2 where id=$1",
        [id, assignment.rows[0].id],
      );
      next = "lesson_active";
    } else if (timepoint === "immediate") next = "immediate_test_complete";
    else {
      next = "60m_test_complete";
      await this.db.query(
        "update visuallearn.scheduled_followups set status='completed_in_window',completed_at=$2 where session_id=$1 and timepoint='plus_60m'",
        [id, this.now()],
      );
    }
    await this.db.query(
      "update visuallearn.sessions set state=$2 where id=$1",
      [id, next],
    );
    return { accepted: true, alreadySubmitted: false };
  }
  async requireFollowup(id: string) {
    const result = await this.db.query<{
      due_at: Date;
      deadline_at: Date;
      completed_at: Date | null;
    }>(
      "select due_at,deadline_at,completed_at from visuallearn.scheduled_followups where session_id=$1 and timepoint='plus_60m'",
      [id],
    );
    const f = result.rows[0];
    if (!f)
      throw new StudyError(
        "FOLLOWUP_MISSING",
        "No follow-up is scheduled.",
        409,
      );
    const status = followupEligibility(
      this.now(),
      new Date(f.due_at),
      new Date(f.deadline_at),
      !!f.completed_at,
    );
    if (status !== "eligible")
      throw new StudyError(
        status.toUpperCase(),
        status === "expired"
          ? "The follow-up window has expired. Your earlier work is preserved."
          : "The one-hour follow-up is not available yet.",
        409,
      );
    return f;
  }
  async getLesson(id: string) {
    const s = await this.session(id);
    if (s.state !== "lesson_active")
      throw new StudyError(
        "LESSON_LOCKED",
        "The study lesson is available only during its assigned stage.",
        409,
      );
    return {
      lesson,
      condition: s.arm_key,
      progress: s.progress,
      visited: s.visited_segments,
    };
  }
  async progress(id: string, input: unknown) {
    const data = z
      .object({ segment: z.number().int().min(0).max(4) })
      .strict()
      .parse(input);
    const s = await this.session(id, true);
    if (s.state !== "lesson_active")
      throw new StudyError("STAGE_LOCKED", "The lesson is not active.", 409);
    await this.db.query(
      "update visuallearn.sessions set progress=$2,visited_segments=array(select distinct unnest(visited_segments||array[$2::integer])) where id=$1",
      [id, data.segment],
    );
    return { saved: true };
  }
  async completeLesson(id: string) {
    const s = await this.session(id, true);
    if (s.lesson_completed_at) return { completed: true };
    if (s.state !== "lesson_active" || s.visited_segments.length !== 5)
      throw new StudyError(
        "LESSON_INCOMPLETE",
        "Visit every chapter before completing the lesson.",
        409,
      );
    // Closing recruitment must not interrupt an already-consented session.
    const now = this.now();
    const window = followupWindow(now, s.followup_window_minutes);
    await this.db.query(
      "update visuallearn.sessions set state='lesson_complete',lesson_completed_at=$2 where id=$1",
      [id, now],
    );
    await this.db.query(
      "insert into visuallearn.scheduled_followups(session_id,timepoint,due_at,deadline_at) values($1,'plus_60m',$2,$3) on conflict(session_id,timepoint) do nothing",
      [id, window.dueAt, window.deadlineAt],
    );
    return { completed: true };
  }
  async submitSurvey(id: string, form: "F3" | "F5", input: unknown) {
    const s = await this.session(id, true);
    const prior = await this.db.query(
      "select id from visuallearn.survey_submissions where session_id=$1 and form_key=$2",
      [id, form],
    );
    if (prior.rows.length) return { accepted: true, alreadySubmitted: true };
    if (
      s.state !==
      (form === "F3" ? "immediate_test_complete" : "60m_test_complete")
    )
      throw new StudyError(
        "STAGE_LOCKED",
        "Please complete the assessment first.",
        409,
      );
    const data = (form === "F3" ? f3Schema : f5Schema).parse(input);
    await this.db.query(
      "insert into visuallearn.survey_submissions(session_id,form_key,form_version,answers_json,submitted_at) values($1,$2,$3,$4,$5)",
      [id, form, SURVEY_VERSION, JSON.stringify(data), this.now()],
    );
    await this.db.query(
      "update visuallearn.sessions set state=$2 where id=$1",
      [id, form === "F3" ? "waiting_60m" : "finished"],
    );
    return { accepted: true };
  }
  async issueReturnToken(id: string) {
    await this.session(id, true);
    const { token, hash } = newReturnToken();
    await this.db.query(
      "insert into visuallearn.return_tokens(token_hash,session_id,expires_at) values($1,$2,$3)",
      [hash, id, new Date(this.now().getTime() + 8 * 24 * 60 * 60_000)],
    );
    return { token };
  }
  async recover(token: string) {
    z.string()
      .regex(/^[A-Za-z0-9_-]{43}$/)
      .parse(token);
    const result = await this.db.query<{ session_id: string }>(
      "select session_id from visuallearn.return_tokens where token_hash=$1 and expires_at>$2 and revoked_at is null",
      [hashToken(token), this.now()],
    );
    if (!result.rows[0])
      throw new StudyError(
        "INVALID_RETURN_LINK",
        "This return link is invalid or expired.",
        401,
      );
    await this.session(result.rows[0].session_id);
    return { sessionId: result.rows[0].session_id };
  }
  async ingestEvents(id: string, input: unknown) {
    await this.session(id, true);
    const events = eventBatchSchema.parse(input);
    for (const e of events)
      await this.db.query(
        "insert into visuallearn.events(session_id,client_event_id,event_type,segment_id,elapsed_ms,client_time,payload) values($1,$2,$3,$4,$5,$6,$7) on conflict(session_id,client_event_id) do nothing",
        [
          id,
          e.clientEventId,
          e.eventType,
          e.segmentId ?? null,
          e.elapsedMs,
          e.clientTime,
          JSON.stringify(e.payload),
        ],
      );
    return { accepted: true };
  }
  async withdraw(id: string) {
    const s = await this.session(id, true);
    const now = this.now();
    await this.db.query(
      "update visuallearn.participants set withdrawn_at=$2 where id=$1",
      [s.participant_id, now],
    );
    await this.db.query(
      "update visuallearn.sessions set state='withdrawn' where id=$1",
      [id],
    );
    await this.db.query(
      "update visuallearn.scheduled_followups set status='withdrawn' where session_id=$1",
      [id],
    );
    await this.db.query(
      "update visuallearn.return_tokens set revoked_at=$2 where session_id=$1",
      [id, now],
    );
    return { withdrawn: true };
  }
}
