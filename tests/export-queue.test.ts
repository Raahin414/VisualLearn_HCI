import { describe, it, expect, vi } from "vitest";
import { csvCell, toCsv, deidentify, exportQueries } from "@/lib/admin/exports";
import { EventQueue } from "@/lib/telemetry/client-queue";
describe("Privacy-preserving exports", () => {
  it("neutralizes spreadsheet formulas and escapes quotes/newlines", () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("  +SUM(1,2)")).toContain("'");
    expect(csvCell("hello,\nworld")).toBe('"hello,\nworld"');
    expect(toCsv([], ["id", "score"])).toBe('"id","score"\r\n');
  });
  it("maps join identifiers consistently and excludes withdrawn records in every dataset", () => {
    const row = {
      participant_id: "secret-uuid",
      session_id: "session-secret",
      age_band: "18-30",
    };
    expect(deidentify(row)).toEqual(deidentify(row));
    expect(JSON.stringify(deidentify(row))).not.toContain("secret-uuid");
    for (const sql of Object.values(exportQueries))
      expect(sql).toContain("p.withdrawn_at is null");
  });
});
describe("Bounded offline queue", () => {
  it("retains failed batches, caps storage, and removes only acknowledged events", async () => {
    const data = new Map<string, string>();
    const storage = {
      get length() {
        return data.size;
      },
      clear: () => {
        data.clear();
      },
      key: (index: number) => [...data.keys()][index] ?? null,
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
      removeItem: (key: string) => {
        data.delete(key);
      },
    } as Storage;
    const send = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    const queue = new EventQueue(storage, send);
    for (let i = 0; i < 220; i++) queue.add("document_visible");
    expect(queue.size).toBe(200);
    await queue.flush();
    expect(queue.size).toBe(200);
    await queue.flush();
    expect(queue.size).toBe(150);
    const revived = new EventQueue(storage, send);
    expect(revived.size).toBe(150);
    revived.clear();
    expect(revived.size).toBe(0);
  });
});
