import "server-only";
import type { SQL } from "@/lib/study/service";
/** Restricted researcher view. Never add this query to public exports. */
export async function studentRecords(db: SQL) {
  const { rows } = await db.query<{
    student_name: string; erp: string; course: string; density: string | null;
    state: string; score: number | null; total: number | null; started_at: Date;
  }>(`
    select i.student_name,i.erp,a.course_slug course,a.density,
           case when a.submitted_at is null then 'In progress' else 'Completed' end state,
           a.score,4 total,a.started_at
    from visuallearn.course_attempts a
    join visuallearn.course_student_identity i on i.id=a.identity_id
    where a.withdrawn_at is null
    union all
    select i.student_name,i.erp,'water-cycle' course,a.arm_key density,
           s.state, t.correct score,t.max_score total,s.started_at
    from visuallearn.sessions s
    join visuallearn.participants p on p.id=s.participant_id
    join visuallearn.participant_identity i on i.participant_id=p.id
    left join visuallearn.assignments a on a.id=s.assignment_id
    left join visuallearn.assessment_attempts t on t.session_id=s.id and t.timepoint='immediate'
    where p.withdrawn_at is null and p.experiment_id='E1'
    order by started_at desc limit 500`);
  return rows;
}
