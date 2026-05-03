import { Router } from "express";
import { db } from "@workspace/db";
import { lightingDiagramsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListLightingDiagramsParams,
  CreateLightingDiagramParams,
  CreateLightingDiagramBody,
  GetLightingDiagramParams,
  UpdateLightingDiagramParams,
  UpdateLightingDiagramBody,
  DeleteLightingDiagramParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { projectId } = ListLightingDiagramsParams.parse({ projectId: Number(req.params.projectId) });
    const diagrams = await db.select().from(lightingDiagramsTable).where(eq(lightingDiagramsTable.projectId, projectId));
    res.json(diagrams.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list diagrams" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectId } = CreateLightingDiagramParams.parse({ projectId: Number(req.params.projectId) });
    const body = CreateLightingDiagramBody.parse(req.body);
    const [diagram] = await db.insert(lightingDiagramsTable).values({ ...body, projectId }).returning();
    res.status(201).json(serialize(diagram));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid diagram data" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { projectId, id } = GetLightingDiagramParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const [diagram] = await db
      .select()
      .from(lightingDiagramsTable)
      .where(and(eq(lightingDiagramsTable.id, id), eq(lightingDiagramsTable.projectId, projectId)));
    if (!diagram) return res.status(404).json({ error: "Not found" });
    res.json(serialize(diagram));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get diagram" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { projectId, id } = UpdateLightingDiagramParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const body = UpdateLightingDiagramBody.parse(req.body);
    const [updated] = await db
      .update(lightingDiagramsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(lightingDiagramsTable.id, id), eq(lightingDiagramsTable.projectId, projectId)))
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
    const { projectId, id } = DeleteLightingDiagramParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    await db.delete(lightingDiagramsTable).where(and(eq(lightingDiagramsTable.id, id), eq(lightingDiagramsTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(d: typeof lightingDiagramsTable.$inferSelect) {
  return {
    ...d,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export default router;
