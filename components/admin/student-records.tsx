"use client";
import { useEffect, useState } from "react";
type RecordRow = { student_name: string; erp: string; course: string; density: string | null; state: string; score: number | null; total: number | null; started_at: string };
export function StudentRecords() {
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { let live = true; fetch("/api/admin/course-records", { cache: "no-store" }).then(async (response) => {
    const result = await response.json(); if (!response.ok) throw new Error(result.error?.message || result.error || "Unable to load records.");
    if (live) setRows(result.rows);
  }).catch((cause) => { if (live) setError(cause instanceof Error ? cause.message : "Unable to load records."); });
  return () => { live = false; }; }, []);
  return <section><h2>Student course records</h2><p>Names and ERP IDs are restricted to this authenticated researcher view. Withdrawn E1 participants are excluded.</p>
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="table-scroll" tabIndex={0}><table><thead><tr><th>Name</th><th>ERP</th><th>Course</th><th>Density</th><th>Status</th><th>Score</th><th>Started</th></tr></thead>
      <tbody>{rows.map((row, index) => <tr key={`${row.erp}-${index}`}><td>{row.student_name}</td><td>{row.erp}</td><td>{row.course}</td><td>{row.density || "Pending"}</td><td>{row.state}</td><td>{row.score === null ? "—" : `${row.score}/${row.total}`}</td><td>{new Date(row.started_at).toLocaleString()}</td></tr>)}</tbody></table></div>
    {!error && rows.length === 0 && <p>No saved student records yet.</p>}
  </section>;
}
