// Operator tool. Dry-run by default; no HTTP route or automatic scheduled job.
// Apply one approved request with --apply --participant UUID --policy VERSION.
// PHYSICAL_DELETION_ENABLED=true is additionally required. Never enable it
// until humans approve scope, delay, allocation aggregates and backup handling.
import pg from "pg";
const args = process.argv.slice(2);
const option = (key) => {
  const index = args.indexOf(key);
  return index < 0 ? undefined : args[index + 1];
};
const apply = args.includes("--apply");
if (!process.env.DATABASE_URL)
  throw new Error("An authorized operator database connection is required.");
if (
  apply &&
  (process.env.PHYSICAL_DELETION_ENABLED !== "true" ||
    !/^[0-9a-f-]{36}$/i.test(option("--participant") ?? "") ||
    !/^[\w.-]{1,80}$/.test(option("--policy") ?? ""))
)
  throw new Error(
    "Deletion disabled or missing an explicit participant and policy version.",
  );
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  await db.query(apply ? "begin" : "begin read only");
  let message;
  if (!apply) {
    const result = await db.query(
      "select count(*)::int n from visuallearn.participants p join visuallearn.experiments e on e.id=p.experiment_id where p.withdrawn_at is not null and e.retention_approved and e.withdrawal_retention_days is not null and p.withdrawn_at + e.withdrawal_retention_days * interval '1 day' <= now()",
    );
    message = `DRY RUN: ${result.rows[0].n} withdrawn records eligible under recorded policies. No data changed.`;
  } else {
    const result = await db.query(
      "select visuallearn.purge_withdrawn($1,$2,true) deleted",
      [option("--participant"), option("--policy")],
    );
    message = result.rows[0].deleted
      ? "Approved withdrawal deletion completed."
      : "No matching record remains; no deletion performed.";
  }
  await db.query("commit");
  console.log(message);
} catch {
  await db.query("rollback").catch(() => {});
  console.error(
    "Deletion did not complete. Check the approved policy, eligibility, permissions and transaction status. No identifiers or connection details logged.",
  );
  process.exitCode = 1;
} finally {
  await db.end();
}
