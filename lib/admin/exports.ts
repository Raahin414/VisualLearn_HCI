import "server-only";
import type { SQL } from "@/lib/study/service";
import { hashToken } from "@/lib/security/tokens";
import {
  questionBanks,
  type Question,
} from "@/lib/assessments/questions.server";
const live =
  "join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null";
// Every dataset excludes withdrawn participants. No public codes, tokens,
// consent free text, enrollment keys or researcher identities are selected.
export const exportQueries = {
  participants_deidentified:
    "select p.id participant_id,p.experiment_id,p.age_band,p.language,(p.f0->>'languageComfort')::int language_comfort,(p.f0->>'familiarity')::int prior_familiarity,p.consent_version,p.consent_at,p.created_at from visuallearn.participants p where p.withdrawn_at is null",
  assignments:
    "select a.participant_id,a.experiment_id,a.arm_key,a.randomization_version,a.assigned_at from visuallearn.assignments a join visuallearn.participants p on p.id=a.participant_id where p.withdrawn_at is null",
  sessions:
    "select s.id session_id,s.participant_id,s.experiment_id,s.presentation_version,s.lesson_opened_at,s.state,s.content_version,s.content_sha256,s.protocol_version,s.stimulus_version,s.media_manifest_sha256,s.question_bank_sha256,s.stimulus_sha256,s.followup_window_minutes,s.accommodations,s.started_at,s.lesson_completed_at from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
  assessment_attempts: `select t.id attempt_id,t.session_id,t.timepoint,t.form_key,t.form_version,t.opened_at,t.submitted_at,round(extract(epoch from (t.submitted_at-t.opened_at))*1000)::bigint duration_ms,t.correct,t.max_score,t.scoring_version,t.rubric_version from visuallearn.assessment_attempts t ${live}`,
  item_responses: `select t.id attempt_id,t.session_id,t.timepoint,t.form_key,t.form_version,a.key item_id,a.value response,(t.item_scores->>a.key)::int auto_score,t.submitted_at from visuallearn.assessment_attempts t cross join lateral jsonb_each(t.answers_json) a ${live} and t.submitted_at is not null order by t.id,a.key`,
  written_responses: `select t.id attempt_id,t.session_id,t.timepoint,w.kind response_kind,t.rubric_version,w.text response_text,length(w.text) char_count from visuallearn.assessment_attempts t cross join lateral (values ('free_recall',t.free_recall),('scenario',t.scenario_response)) w(kind,text) ${live} and w.text is not null`,
  free_recall_ratings: `select r.attempt_id,r.response_kind,r.rater_code,r.rubric_version,r.sub_scores,r.total_score,r.rated_at from visuallearn.free_recall_ratings r join visuallearn.assessment_attempts t on t.id=r.attempt_id ${live}`,
  rating_adjudications: `select d.attempt_id,d.response_kind,d.rubric_version,d.adjudicator_code,d.sub_scores,d.total_score,d.resolved_at from visuallearn.rating_adjudications d join visuallearn.assessment_attempts t on t.id=d.attempt_id ${live}`,
  surveys:
    "select q.session_id,q.form_key,q.form_version,q.answers_json,q.submitted_at from visuallearn.survey_submissions q join visuallearn.sessions s on s.id=q.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
  followup_status:
    "select f.session_id,f.timepoint,f.due_at,f.deadline_at,case when f.status='not_started' and now()>f.deadline_at then 'expired' else f.status end status,f.completed_at from visuallearn.scheduled_followups f join visuallearn.sessions s on s.id=f.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
  events:
    "select e.session_id,e.event_type,e.segment_id,e.elapsed_ms,e.client_time,e.server_received_at,e.payload from visuallearn.events e join visuallearn.sessions s on s.id=e.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
} as const;
export type ExportName = keyof typeof exportQueries;
const items = new Map<string, Question>(
  (["A", "B", "C"] as const).flatMap((f) =>
    questionBanks[f].map((q): [string, Question] => [q.id, q]),
  ),
);
/** Adds item metadata from the frozen bank; never reads it from the browser. */
export function enrichRow(name: ExportName, row: Record<string, unknown>) {
  if (name !== "item_responses") return row;
  const q = items.get(String(row.item_id));
  const { submitted_at, ...rest } = row;
  return {
    ...rest,
    item_type: q?.type ?? "",
    skill: q?.skill ?? "",
    objective_id: q?.objectiveId ?? "",
    item_version: q?.version ?? "",
    submitted_at,
  };
}
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
export async function exportRows(db: SQL, name: ExportName) {
  const { rows } = await db.query<Record<string, unknown>>(exportQueries[name]);
  const out = rows.map((r) => deidentify(enrichRow(name, r)));
  return { rows: out, columns: out[0] ? Object.keys(out[0]) : [] };
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
const n = (sql: string) => `(${sql})`;
export async function studyStats(
  source: SQL,
  experimentId: "E1" | "E2" = "E1",
) {
  // Every aggregate is scoped, including attrition and unassigned sessions.
  const db: SQL = { query: (sql) => source.query(sql, [experimentId]) };
  const live =
    "join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and p.experiment_id=$1";

  const balance = await db.query<{
    age_band: string;
    arm_key: string;
    n: number;
  }>(
    "select p.age_band,a.arm_key,count(*)::int n from visuallearn.participants p join visuallearn.assignments a on a.participant_id=p.id where p.withdrawn_at is null and p.experiment_id=$1 group by p.age_band,a.arm_key order by p.age_band,a.arm_key",
  );
  // Cumulative funnel: how many non-withdrawn sessions reached each checkpoint.
  const funnel = await db.query<{ step: string; n: number }>(
    `select step,n from (values
      (1,'enrolled',${n("select count(*)::int from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and p.experiment_id=$1")}),
      (2,'pretest',${n(`select count(*)::int from visuallearn.assessment_attempts t ${live} and t.timepoint='pre' and t.submitted_at is not null`)}),
      (3,'lesson complete',${n("select count(*)::int from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and p.experiment_id=$1 and s.lesson_completed_at is not null")}),
      (4,'immediate quiz',${n(`select count(*)::int from visuallearn.assessment_attempts t ${live} and t.timepoint='immediate' and t.submitted_at is not null`)}),
      (5,'immediate survey',${n("select count(*)::int from visuallearn.survey_submissions q join visuallearn.sessions s on s.id=q.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and p.experiment_id=$1 and q.form_key='F3'")}),
      (6,'60-min quiz',${n(`select count(*)::int from visuallearn.assessment_attempts t ${live} and t.timepoint='plus_60m' and t.submitted_at is not null`)}),
      (7,'60-min survey',${n("select count(*)::int from visuallearn.survey_submissions q join visuallearn.sessions s on s.id=q.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and p.experiment_id=$1 and q.form_key='F5'")})
     ) f(i,step,n) order by i`,
  );
  const performance = await db.query<{
    timepoint: string;
    arm_key: string;
    n: number;
    mean_percent: string;
  }>(
    `select t.timepoint,a.arm_key,count(*)::int n,round(avg(t.correct::numeric/nullif(t.max_score,0)*100),1) mean_percent from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.assignments a on a.id=s.assignment_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and p.experiment_id=$1 and t.submitted_at is not null group by t.timepoint,a.arm_key order by t.timepoint,a.arm_key`,
  );
  // Paired immediate vs one-hour objective scores, descriptive only.
  const retention = await db.query<{
    arm_key: string;
    paired: number;
    immediate: string;
    plus_60m: string;
    change: string;
  }>(
    `select a.arm_key,count(*)::int paired,round(avg(i.correct::numeric/i.max_score*100),1) immediate,round(avg(d.correct::numeric/d.max_score*100),1) plus_60m,round(avg((d.correct::numeric/d.max_score-i.correct::numeric/i.max_score)*100),1) change
     from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id join visuallearn.assignments a on a.id=s.assignment_id
     join visuallearn.assessment_attempts i on i.session_id=s.id and i.timepoint='immediate' and i.submitted_at is not null
     join visuallearn.assessment_attempts d on d.session_id=s.id and d.timepoint='plus_60m' and d.submitted_at is not null
     where p.withdrawn_at is null and p.experiment_id=$1 group by a.arm_key order by a.arm_key`,
  );
  const followups = await db.query<{
    arm_key: string;
    status: string;
    n: number;
  }>(
    `select coalesce(a.arm_key,'unassigned') arm_key,case when f.status='not_started' and now()>f.deadline_at then 'expired' when f.status='not_started' and now()<f.due_at then 'waiting' when f.status='not_started' then 'open_now' else f.status end status,count(*)::int n
     from visuallearn.scheduled_followups f join visuallearn.sessions s on s.id=f.session_id join visuallearn.participants p on p.id=s.participant_id left join visuallearn.assignments a on a.id=s.assignment_id
     where p.withdrawn_at is null and p.experiment_id=$1 group by 1,2 order by 1,2`,
  );
  const quality = await db.query<Record<string, number>>(
    `select
      ${n(`select count(*)::int from visuallearn.assessment_attempts t ${live} and t.submitted_at is null`)} opened_not_submitted,
      ${n("select count(*)::int from visuallearn.scheduled_followups f join visuallearn.sessions s on s.id=f.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and p.experiment_id=$1 and f.status='not_started' and f.deadline_at<now()")} expired_followups,
      ${n(`select count(*)::int from visuallearn.assessment_attempts t join visuallearn.scheduled_followups f on f.session_id=t.session_id and f.timepoint=t.timepoint ${live} and t.submitted_at>f.deadline_at`)} submitted_after_deadline,
      ${n("select count(*)::int from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and p.experiment_id=$1 and s.state='lesson_active' and s.started_at<now()-interval '3 hours'")} stalled_lessons,
      ${n("select count(*)::int from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and p.experiment_id=$1 and s.state='immediate_test_complete' and s.lesson_completed_at<now()-interval '30 minutes'")} missing_immediate_survey,
      ${n("select count(distinct s.id)::int from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and p.experiment_id=$1 and s.lesson_completed_at is not null and not exists(select 1 from visuallearn.events e where e.session_id=s.id)")} completed_without_events,
      ${n("select count(*)::int from visuallearn.participants where withdrawn_at is not null and experiment_id=$1")} withdrawn_excluded`,
  );
  const versions = await db.query<{
    protocol_version: string;
    stimulus_version: string;
    question_bank_sha256: string;
    n: number;
  }>(
    "select s.protocol_version,s.stimulus_version,left(s.question_bank_sha256,12) question_bank_sha256,count(*)::int n from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and p.experiment_id=$1 group by 1,2,3 order by 4 desc",
  );
  const ratings = await db.query<{
    response_kind: string;
    responses: number;
    rated_twice: number;
    needs_adjudication: number;
    adjudicated: number;
  }>(
    `with w as (select t.id,k.kind from visuallearn.assessment_attempts t cross join lateral (values ('free_recall',t.free_recall),('scenario',t.scenario_response)) k(kind,text) ${live} and k.text is not null),
     r as (select w.kind,w.id,count(x.*)::int raters,count(distinct x.sub_scores)::int distinct_scores from w left join visuallearn.free_recall_ratings x on x.attempt_id=w.id and x.response_kind=w.kind group by 1,2)
     select r.kind response_kind,count(*)::int responses,count(*) filter (where raters>=2)::int rated_twice,
      count(*) filter (where raters>=2 and distinct_scores>1 and not exists(select 1 from visuallearn.rating_adjudications d where d.attempt_id=r.id and d.response_kind=r.kind))::int needs_adjudication,
      count(*) filter (where exists(select 1 from visuallearn.rating_adjudications d where d.attempt_id=r.id and d.response_kind=r.kind))::int adjudicated
     from r group by 1 order by 1`,
  );
  return {
    experimentId,
    balance: balance.rows,
    funnel: funnel.rows,
    performance: performance.rows,
    retention: retention.rows,
    followups: followups.rows,
    quality: quality.rows[0],
    versions: versions.rows,
    ratings: ratings.rows,
  };
}
export type StudyStats = Awaited<ReturnType<typeof studyStats>>;
