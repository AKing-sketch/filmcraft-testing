import { Router } from "express";
import { db } from "@workspace/db";
import { beatsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import {
  ListBeatsParams,
  CreateBeatParams,
  CreateBeatBody,
  UpdateBeatParams,
  UpdateBeatBody,
  DeleteBeatParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { projectId } = ListBeatsParams.parse({ projectId: Number(req.params.projectId) });
    const beats = await db
      .select()
      .from(beatsTable)
      .where(eq(beatsTable.projectId, projectId))
      .orderBy(asc(beatsTable.orderIndex));
    res.json(beats.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list beats" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectId } = CreateBeatParams.parse({ projectId: Number(req.params.projectId) });
    const body = CreateBeatBody.parse(req.body);
    const [beat] = await db
      .insert(beatsTable)
      .values({ ...body, projectId })
      .returning();
    res.status(201).json(serialize(beat));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid beat data" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { projectId, id } = UpdateBeatParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const body = UpdateBeatBody.parse(req.body);
    const [updated] = await db
      .update(beatsTable)
      .set(body)
      .where(and(eq(beatsTable.id, id), eq(beatsTable.projectId, projectId)))
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
    const { projectId, id } = DeleteBeatParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    await db.delete(beatsTable).where(and(eq(beatsTable.id, id), eq(beatsTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(b: typeof beatsTable.$inferSelect) {
  return { ...b, createdAt: b.createdAt.toISOString() };
}

export default router;
