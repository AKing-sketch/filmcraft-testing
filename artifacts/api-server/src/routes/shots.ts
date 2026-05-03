import { Router } from "express";
import { db } from "@workspace/db";
import { shotsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import {
  ListShotsParams,
  CreateShotParams,
  CreateShotBody,
  UpdateShotParams,
  UpdateShotBody,
  DeleteShotParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { projectId } = ListShotsParams.parse({ projectId: Number(req.params.projectId) });
    const shots = await db
      .select()
      .from(shotsTable)
      .where(eq(shotsTable.projectId, projectId))
      .orderBy(asc(shotsTable.shotNumber));
    res.json(shots.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list shots" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectId } = CreateShotParams.parse({ projectId: Number(req.params.projectId) });
    const body = CreateShotBody.parse(req.body);
    const [shot] = await db.insert(shotsTable).values({ ...body, projectId }).returning();
    res.status(201).json(serialize(shot));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid shot data" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { projectId, id } = UpdateShotParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const body = UpdateShotBody.parse(req.body);
    const [updated] = await db
      .update(shotsTable)
      .set(body)
      .where(and(eq(shotsTable.id, id), eq(shotsTable.projectId, projectId)))
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
    const { projectId, id } = DeleteShotParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    await db.delete(shotsTable).where(and(eq(shotsTable.id, id), eq(shotsTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(s: typeof shotsTable.$inferSelect) {
  return { ...s, createdAt: s.createdAt.toISOString() };
}

export default router;
