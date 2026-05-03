import { Router } from "express";
import { db } from "@workspace/db";
import { postMilestonesTable, deliverablesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const milestonesRouter = Router({ mergeParams: true });
const deliverablesRouter = Router({ mergeParams: true });

// ── Milestones ────────────────────────────────────────────────────────────────

milestonesRouter.get("/", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const rows = await db
      .select()
      .from(postMilestonesTable)
      .where(eq(postMilestonesTable.projectId, projectId));
    res.json(rows.map(serializeMilestone));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list post milestones" });
  }
});

milestonesRouter.post("/", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const [row] = await db
      .insert(postMilestonesTable)
      .values({ ...req.body, projectId })
      .returning();
    res.status(201).json(serializeMilestone(row));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid milestone data" });
  }
});

milestonesRouter.patch("/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const id = Number(req.params.id);
    const [row] = await db
      .update(postMilestonesTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(postMilestonesTable.id, id), eq(postMilestonesTable.projectId, projectId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(serializeMilestone(row));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

milestonesRouter.delete("/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const id = Number(req.params.id);
    await db
      .delete(postMilestonesTable)
      .where(and(eq(postMilestonesTable.id, id), eq(postMilestonesTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serializeMilestone(r: typeof postMilestonesTable.$inferSelect) {
  return { ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
}

// ── Deliverables ──────────────────────────────────────────────────────────────

deliverablesRouter.get("/", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const rows = await db
      .select()
      .from(deliverablesTable)
      .where(eq(deliverablesTable.projectId, projectId));
    res.json(rows.map(serializeDeliverable));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list deliverables" });
  }
});

deliverablesRouter.post("/", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const [row] = await db
      .insert(deliverablesTable)
      .values({ ...req.body, projectId })
      .returning();
    res.status(201).json(serializeDeliverable(row));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid deliverable data" });
  }
});

deliverablesRouter.patch("/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const id = Number(req.params.id);
    const [row] = await db
      .update(deliverablesTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(deliverablesTable.id, id), eq(deliverablesTable.projectId, projectId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(serializeDeliverable(row));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

deliverablesRouter.delete("/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const id = Number(req.params.id);
    await db
      .delete(deliverablesTable)
      .where(and(eq(deliverablesTable.id, id), eq(deliverablesTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serializeDeliverable(r: typeof deliverablesTable.$inferSelect) {
  return { ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
}

export { milestonesRouter, deliverablesRouter };
