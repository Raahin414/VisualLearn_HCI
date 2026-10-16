import { eventSchema, type StudyEvent } from "./schema";
// Only instantiated after an authenticated, consented study session is loaded.
export class EventQueue {
  private queue: StudyEvent[] = [];
  private busy = false;
  private started = performance.now();
  constructor(
    private storage: Storage,
    private send: (events: StudyEvent[]) => Promise<boolean>,
    private key = "visuallearn-research-events-v1",
  ) {
    try {
      const parsed = JSON.parse(storage.getItem(this.key) || "[]");
      if (Array.isArray(parsed))
        this.queue = parsed
          .slice(-200)
          .filter((e) => eventSchema.safeParse(e).success);
    } catch {}
  }
  private save() {
    try {
      this.storage.setItem(this.key, JSON.stringify(this.queue));
    } catch {}
  }
  add(
    eventType: StudyEvent["eventType"],
    segmentId?: StudyEvent["segmentId"],
    payload: StudyEvent["payload"] = {},
  ) {
    this.queue.push({
      clientEventId: crypto.randomUUID(),
      eventType,
      segmentId,
      elapsedMs: Math.round(performance.now() - this.started),
      clientTime: new Date().toISOString(),
      payload,
    });
    this.queue = this.queue.slice(-200);
    this.save();
  }
  async flush() {
    if (this.busy || !this.queue.length) return;
    this.busy = true;
    const batch = this.queue.slice(0, 50);
    try {
      if (await this.send(batch)) {
        const ids = new Set(batch.map((e) => e.clientEventId));
        this.queue = this.queue.filter((e) => !ids.has(e.clientEventId));
        this.save();
      }
    } finally {
      this.busy = false;
    }
  }
  clear() {
    this.queue = [];
    try {
      this.storage.removeItem(this.key);
    } catch {}
  }
  get size() {
    return this.queue.length;
  }
}
