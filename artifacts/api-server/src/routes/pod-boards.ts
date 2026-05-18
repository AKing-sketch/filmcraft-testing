import { Router } from "express";
import { db } from "@workspace/db";
import { podBoardsTable, insertPodBoardSchema } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { UpdatePodBoardBody } from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const boards = await db
      .select()
      .from(podBoardsTable)
      .where(eq(podBoardsTable.projectId, projectId))
      .orderBy(asc(podBoardsTable.position), asc(podBoardsTable.createdAt));
    res.json(boards.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list boards" });
  }
});

router.post("/", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const body = insertPodBoardSchema.parse({ ...req.body, projectId });
    const [board] = await db.insert(podBoardsTable).values(body).returning();
    res.status(201).json(serialize(board));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid board data" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const id = parseInt(req.params.id, 10);
    const body = UpdatePodBoardBody.parse(req.body);
    const [updated] = await db
      .update(podBoardsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(podBoardsTable.id, id), eq(podBoardsTable.projectId, projectId)))
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
      .delete(podBoardsTable)
      .where(and(eq(podBoardsTable.id, id), eq(podBoardsTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(b: typeof podBoardsTable.$inferSelect) {
  return {
    ...b,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

export default router;
