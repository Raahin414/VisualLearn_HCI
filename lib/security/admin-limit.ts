import "server-only";
import { getPool } from "@/lib/db/client";
/** Global per-operation limiter for researcher sign-in and MFA attempts. */
export async function adminRateLimited(bucket: string, perMinute = 10) {
  const count = await getPool().query<{ request_count: number }>(
    "insert into visuallearn.request_limits(bucket,window_at,request_count) values($1,now(),1) on conflict(bucket) do update set request_count=case when visuallearn.request_limits.window_at<now()-interval '1 minute' then 1 else visuallearn.request_limits.request_count+1 end,window_at=case when visuallearn.request_limits.window_at<now()-interval '1 minute' then now() else visuallearn.request_limits.window_at end returning request_count",
    [bucket],
  );
  return count.rows[0].request_count > perMinute;
}
