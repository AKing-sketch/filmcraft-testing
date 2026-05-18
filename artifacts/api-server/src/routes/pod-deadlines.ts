import { Router } from "express";
import { db } from "@workspace/db";
import { podDeadlinesTable, insertPodDeadlineSchema } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { UpdatePodDeadlineBody } from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const deadlines = await db
      .select()
      .from(podDeadlinesTable)
      .where(eq(podDeadlinesTable.projectId, projectId))
      .orderBy(asc(podDeadlinesTable.dueDate), asc(podDeadlinesTable.createdAt));
    res.json(deadlines.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list deadlines" });
  }
});

router.post("/", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const body = insertPodDeadlineSchema.parse({ ...req.body, projectId });
    const [deadline] = await db.insert(podDeadlinesTable).values(body).returning();
    res.status(201).json(serialize(deadline));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid deadline data" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const id = parseInt(req.params.id, 10);
    const body = UpdatePodDeadlineBody.parse(req.body);
    const [updated] = await db
      .update(podDeadlinesTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(podDeadlinesTable.id, id), eq(podDeadlinesTable.projectId, projectId)))
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
    const projectId = parseInt(req.params.projectId, 10);
    const id = parseInt(req.params.id, 10);
    await db
      .delete(podDeadlinesTable)
      .where(and(eq(podDeadlinesTable.id, id), eq(podDeadlinesTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(d: typeof podDeadlinesTable.$inferSelect) {
  return {
    ...d,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export default router;
