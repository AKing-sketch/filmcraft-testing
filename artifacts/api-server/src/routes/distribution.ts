import { Router } from "express";
import { db } from "@workspace/db";
import { distributionEntriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const entries = await db
      .select()
      .from(distributionEntriesTable)
      .where(eq(distributionEntriesTable.projectId, projectId));
    res.json(entries.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list distribution entries" });
  }
});

router.post("/", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const body = req.body;
    const [entry] = await db
      .insert(distributionEntriesTable)
      .values({ ...body, projectId })
      .returning();
    res.status(201).json(serialize(entry));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid distribution entry data" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const id = Number(req.params.id);
    const body = req.body;
    const [updated] = await db
      .update(distributionEntriesTable)
      .set({ ...body, updatedAt: new Date() })
      .where(
        and(
          eq(distributionEntriesTable.id, id),
          eq(distributionEntriesTable.projectId, projectId)
        )
      )
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(serialize(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const id = Number(req.params.id);
    await db
      .delete(distributionEntriesTable)
      .where(
        and(
          eq(distributionEntriesTable.id, id),
          eq(distributionEntriesTable.projectId, projectId)
        )
      );
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(e: typeof distributionEntriesTable.$inferSelect) {
  return {
    ...e,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export default router;
