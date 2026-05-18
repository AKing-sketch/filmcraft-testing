import { Router } from "express";
import { db } from "@workspace/db";
import { podAssetsTable, insertPodAssetSchema } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { UpdatePodAssetBody } from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const assets = await db
      .select()
      .from(podAssetsTable)
      .where(eq(podAssetsTable.projectId, projectId))
      .orderBy(desc(podAssetsTable.createdAt));
    res.json(assets.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list assets" });
  }
});

router.post("/", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const body = insertPodAssetSchema.parse({ ...req.body, projectId });
    const [asset] = await db.insert(podAssetsTable).values(body).returning();
    res.status(201).json(serialize(asset));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid asset data" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const id = parseInt(req.params.id, 10);
    const body = UpdatePodAssetBody.parse(req.body);
    const [updated] = await db
      .update(podAssetsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(podAssetsTable.id, id), eq(podAssetsTable.projectId, projectId)))
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
      .delete(podAssetsTable)
      .where(and(eq(podAssetsTable.id, id), eq(podAssetsTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(a: typeof podAssetsTable.$inferSelect) {
  return {
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export default router;
