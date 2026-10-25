import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { DensityVisuals } from "@/components/learning/density-visuals";
import { conditions, lesson } from "@/lib/content/lesson";
import {
  demoExperiments,
  presentationFor,
} from "@/lib/study/presentation.server";
import { enrollmentSchema } from "@/lib/study/lifecycle";
import { StudyService, type SQL } from "@/lib/study/service";
import { exportRows } from "@/lib/admin/exports";

describe("E1-only scope and controlled density", () => {
  it("offers just three density projections and rejects other studies at the service boundary", async () => {
    expect(demoExperiments().map((study) => study.id)).toEqual(["E1"]);
    expect(demoExperiments()[0].arms.map((arm) => arm.key)).toEqual(conditions);
    const db = {
      query: async () => {
        throw new Error("Database must not be reached");
      },
    };
    for (const study of ["E2", "E3", "E8"]) {
      expect(() => presentationFor(study, "low")).toThrow(/E1/);
      await expect(new StudyService(db).gate(study)).rejects.toMatchObject({
        code: "STUDY_UNSUPPORTED",
      });
    }
    expect(enrollmentSchema.shape.experimentId.safeParse("E2").success).toBe(
      false,
    );
  });

  it("adds supporting illustrations and decoration without changing the essential diagram", () => {
    const segment = lesson.segments[0];
    const output = conditions.map((condition) =>
      renderToStaticMarkup(
        <DensityVisuals
          condition={condition}
          active={segment.id}
          description={segment.diagramDescription}
        />,
      ),
    );
    expect(
      output.map(
        (html) => (html.match(/class="density-process"/g) ?? []).length,
      ),
    ).toEqual([0, 2, 4]);
    expect(output[0]).not.toContain("data-density-support");
    expect(output[1]).not.toContain("data-density-decoration");
    expect(output[2]).toContain("data-density-decoration");
    for (const html of output) {
      expect(html).toContain(segment.diagramDescription);
      expect(html).toContain('viewBox="0 0 800 470"');
      for (const process of [
        "Evaporation",
        "Condensation",
        "Precipitation",
        "Collection",
      ])
        expect(html).toContain(process);
    }
  });

  it("archives historical studies without losing answers and prevents reactivation", async () => {
    const db = new PGlite();
    try {
      for (const file of (await readdir("supabase/migrations"))
        .filter((name) => /^00[1-5]_/.test(name))
        .sort())
        await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
      await db.exec(await readFile("supabase/seed.sql", "utf8"));
      await db.exec(
        "insert into visuallearn.experiments(id,name,protocol_version,primary_outcome,arms) values('E2','Historical modality','legacy','legacy',array['text-only','audio-only','text-diagram','audio-diagram'])",
      );
      const person = (
        await db.query<{ id: string }>(
          "insert into visuallearn.participants(public_code,experiment_id,age_band,language,consent_version,f0) values('SYNTHETIC-E1-UPGRADE','E2','18-30','English','SYNTHETIC','{}') returning id",
        )
      ).rows[0].id;
      const session = (
        await db.query<{ id: string }>(
          "insert into visuallearn.sessions(participant_id,experiment_id,content_version,content_sha256,protocol_version,stimulus_version,media_manifest_sha256,question_bank_sha256,stimulus_sha256,followup_window_minutes) values($1,'E2','legacy','legacy','legacy','legacy','legacy','legacy','legacy',30) returning id",
          [person],
        )
      ).rows[0].id;
      await db.query(
        "insert into visuallearn.assessment_attempts(session_id,timepoint,form_key,form_version,free_recall,correct,max_score) values($1,'immediate','B','legacy','SYNTHETIC preserved answer',4,8)",
        [session],
      );
      const before = (await db.query("select * from visuallearn.sessions"))
        .rows;
      await db.exec(
        await readFile("supabase/migrations/006_e1_only.sql", "utf8"),
      );
      expect(
        (await db.query("select * from visuallearn.sessions")).rows,
      ).toEqual(before);
      expect(
        (
          await db.query(
            "select free_recall,correct from visuallearn.assessment_attempts",
          )
        ).rows,
      ).toEqual([{ free_recall: "SYNTHETIC preserved answer", correct: 4 }]);
      expect(
        (
          await db.query(
            "select enabled,status from visuallearn.experiments where id='E2'",
          )
        ).rows[0],
      ).toEqual({ enabled: false, status: "archived" });
      await expect(
        db.exec(
          "update visuallearn.experiments set enabled=true,pilot_reviewed=true,pilot_contract_version='modality-v1-draft' where id='E2'",
        ),
      ).rejects.toThrow(/check constraint/);
      await expect(
        db.exec(
          "update visuallearn.experiments set status='recruiting' where id='E2'",
        ),
      ).rejects.toThrow(/check constraint/);
      expect(
        (await exportRows(db as unknown as SQL, "assessment_attempts")).rows,
      ).toEqual([]);
    } finally {
      await db.close();
    }
  }, 30000);
});
