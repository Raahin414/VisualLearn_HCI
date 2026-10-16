import "server-only";
import type { SQL } from "@/lib/study/service";
import { hashToken } from "@/lib/security/tokens";
export const exportQueries = {
  participants_deidentified:
    "select p.id participant_id,p.age_band,p.language,p.consent_version,p.consent_at,p.created_at from visuallearn.participants p where p.withdrawn_at is null",
  assignments:
    "select a.participant_id,a.experiment_id,a.arm_key,a.randomization_version,a.assigned_at from visuallearn.assignments a join visuallearn.participants p on p.id=a.participant_id where p.withdrawn_at is null",
  sessions:
    "select s.id session_id,s.participant_id,s.state,s.content_version,s.content_sha256,s.protocol_version,s.stimulus_version,s.media_manifest_sha256,s.question_bank_sha256,s.stimulus_sha256,s.followup_window_minutes,s.accommodations,s.started_at,s.lesson_completed_at from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
  assessment_attempts:
    "select t.id attempt_id,t.session_id,t.timepoint,t.form_key,t.form_version,t.opened_at,t.submitted_at,t.correct,t.max_score,t.scoring_version,t.rubric_version from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
  item_responses:
    "select t.id attempt_id,t.session_id,t.timepoint,t.answers_json,t.free_recall from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
  free_recall_ratings:
    "select r.attempt_id,r.rater_code,r.rubric_version,r.sub_scores,r.total_score,r.rated_at from visuallearn.free_recall_ratings r join visuallearn.assessment_attempts t on t.id=r.attempt_id join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
  surveys:
    "select q.session_id,q.form_key,q.form_version,q.answers_json,q.submitted_at from visuallearn.survey_submissions q join visuallearn.sessions s on s.id=q.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
  followup_status:
    "select f.session_id,f.timepoint,f.due_at,f.deadline_at,case when f.status='not_started' and now()>f.deadline_at then 'expired' else f.status end status,f.completed_at from visuallearn.scheduled_followups f join visuallearn.sessions s on s.id=f.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
  events:
    "select e.session_id,e.event_type,e.segment_id,e.elapsed_ms,e.client_time,e.server_received_at,e.payload from visuallearn.events e join visuallearn.sessions s on s.id=e.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
} as const;
export type ExportName = keyof typeof exportQueries;
const identifiers = ["participant_id", "session_id", "attempt_id"];
export function deidentify(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      identifiers.includes(key) && typeof value === "string"
        ? `VL_${hashToken(value).slice(0, 24)}`
        : value,
    ]),
  );
}
export function csvCell(input: unknown) {
  let text =
    input === null || input === undefined
      ? ""
      : input instanceof Date
        ? input.toISOString()
        : typeof input === "object"
          ? JSON.stringify(input)
          : String(input);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function toCsv(rows: Record<string, unknown>[], columns: string[]) {
  return (
    [
      columns.map(csvCell).join(","),
      ...rows.map((row) => columns.map((c) => csvCell(row[c])).join(",")),
    ].join("\r\n") + "\r\n"
  );
}
export async function studyStats(db: SQL) {
  const balance = await db.query<{
    age_band: string;
    arm_key: string;
    n: number;
  }>(
    "select p.age_band,a.arm_key,count(*)::int n from visuallearn.participants p join visuallearn.assignments a on a.participant_id=p.id where p.withdrawn_at is null group by p.age_band,a.arm_key order by p.age_band,a.arm_key",
  );
  const funnel = await db.query<{ state: string; n: number }>(
    "select s.state,count(*)::int n from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null group by s.state",
  );
  const performance = await db.query<{
    timepoint: string;
    arm_key: string;
    n: number;
    mean_percent: string;
  }>(
    "select t.timepoint,a.arm_key,count(*)::int n,round(avg(t.correct::numeric/nullif(t.max_score,0)*100),2) mean_percent from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.assignments a on a.id=s.assignment_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and t.submitted_at is not null group by t.timepoint,a.arm_key",
  );
  const quality = await db.query<{
    awaiting_submission: number;
    expired: number;
  }>(
    "select (select count(*)::int from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and t.submitted_at is null) awaiting_submission,(select count(*)::int from visuallearn.scheduled_followups f join visuallearn.sessions s on s.id=f.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and f.status='not_started' and f.deadline_at<now()) expired",
  );
  return {
    balance: balance.rows,
    funnel: funnel.rows,
    performance: performance.rows,
    quality: quality.rows[0],
  };
}
