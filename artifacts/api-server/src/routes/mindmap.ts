import { Router } from "express";
import { db } from "@workspace/db";
import { mindMapNodesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GetMindMapParams,
  CreateMindMapNodeParams,
  CreateMindMapNodeBody,
  UpdateMindMapNodeParams,
  UpdateMindMapNodeBody,
  DeleteMindMapNodeParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { projectId } = GetMindMapParams.parse({ projectId: Number(req.params.projectId) });
    const nodes = await db
      .select()
      .from(mindMapNodesTable)
      .where(eq(mindMapNodesTable.projectId, projectId));
    res.json(nodes.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get mind map" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectId } = CreateMindMapNodeParams.parse({ projectId: Number(req.params.projectId) });
    const body = CreateMindMapNodeBody.parse(req.body);
    const [node] = await db
      .insert(mindMapNodesTable)
      .values({ ...body, projectId })
      .returning();
    res.status(201).json(serialize(node));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid node data" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { projectId, id } = UpdateMindMapNodeParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const body = UpdateMindMapNodeBody.parse(req.body);
    const [updated] = await db
      .update(mindMapNodesTable)
      .set(body)
      .where(and(eq(mindMapNodesTable.id, id), eq(mindMapNodesTable.projectId, projectId)))
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
    const { projectId, id } = DeleteMindMapNodeParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    await db.delete(mindMapNodesTable).where(and(eq(mindMapNodesTable.id, id), eq(mindMapNodesTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(n: typeof mindMapNodesTable.$inferSelect) {
  return { ...n, createdAt: n.createdAt.toISOString() };
}

export default router;
